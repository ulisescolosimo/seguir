import { NextResponse } from "next/server";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

const CRON_SECRET = process.env.CRON_REMINDERS_SECRET;

/** Inicio de semana (lunes 00:00:00) en la zona local del servidor. */
function getStartOfWeek(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export type ReminderEligibleUser = {
  id: string;
  email: string;
  first_name: string | null;
};

/**
 * POST /api/reminders/send
 *
 * Para uso desde n8n (cron): devuelve la lista de usuarios que deben recibir
 * un recordatorio de escritura hoy, según su opción reminders_per_week.
 * Protegido con CRON_REMINDERS_SECRET.
 *
 * Respuesta: { users: ReminderEligibleUser[] }
 * n8n puede hacer un loop sobre users y enviar un mail a cada email.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const apiKey = request.headers.get("x-api-key");
  const token = bearer ?? apiKey ?? null;

  if (!CRON_SECRET || token !== CRON_SECRET) {
    return NextResponse.json(
      { error: "No autorizado. Usá el header Authorization: Bearer <CRON_REMINDERS_SECRET> o x-api-key." },
      { status: 401 }
    );
  }

  if (!hasAdminEnv()) {
    return NextResponse.json(
      { error: "Falta configuración de servidor (SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, reminders_per_week")
    .gt("reminders_per_week", 0);

  if (profilesError) {
    console.error("[api/reminders/send] profiles", profilesError);
    return NextResponse.json(
      { error: "Error al leer perfiles." },
      { status: 500 }
    );
  }

  const eligible: ReminderEligibleUser[] = [];

  for (const profile of profiles ?? []) {
    const userId = profile.id;
    const remindersPerWeek = profile.reminders_per_week as number;

    // Evitar doble creación: si ya hay un reminder en los últimos 2 minutos, saltar
    const { count: countVeryRecent } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "reminder")
      .gte("created_at", twoMinutesAgo);
    if ((countVeryRecent ?? 0) > 0) continue;

    const { count: countRecent } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "reminder")
      .gte("created_at", oneDayAgo);
    if ((countRecent ?? 0) > 0) continue;

    const { count: countThisWeek } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "reminder")
      .gte("created_at", startOfWeek.toISOString());
    if ((countThisWeek ?? 0) >= remindersPerWeek) continue;

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authUser?.user?.email) continue;

    const { error: insertError } = await supabase.from("notifications").insert({
      user_id: userId,
      type: "reminder",
      payload: {},
    });
    if (insertError) {
      console.error("[api/reminders/send] insert notification", userId, insertError);
    }

    eligible.push({
      id: userId,
      email: authUser.user.email,
      first_name: profile.first_name?.trim() || null,
    });
  }

  return NextResponse.json({ users: eligible });
}
