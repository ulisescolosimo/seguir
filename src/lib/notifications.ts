import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType = "comment" | "saved_text" | "reminder";

export type NotificationPayload =
  | { text_id: string; comment_id: string; actor_name: string; actor_user_id: string; body_preview?: string }
  | { text_id: string; actor_user_id: string; text_title: string }
  | Record<string, never>;

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: NotificationPayload;
  read_at: string | null;
  created_at: string;
};

const PAGE_SIZE = 30;

/** Obtiene las notificaciones del usuario, más recientes primero. */
export async function fetchNotifications(
  supabase: SupabaseClient,
  options?: { limit?: number; since?: string }
): Promise<NotificationRow[]> {
  const limit = options?.limit ?? PAGE_SIZE;
  let query = supabase
    .from("notifications")
    .select("id, user_id, type, payload, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (options?.since) {
    query = query.gte("created_at", options.since);
  }
  const { data, error } = await query;
  if (error) return [];
  return (data as NotificationRow[]) ?? [];
}

/** Cuenta las notificaciones no leídas del usuario. */
export async function countUnreadNotifications(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

/** Marca una notificación como leída. */
export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  return !error;
}

/** Marca todas las notificaciones del usuario como leídas. */
export async function markAllNotificationsRead(supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  return !error;
}

/** Crea una notificación de tipo recordatorio para el usuario actual (según reminders_per_week). */
export async function maybeCreateReminderNotification(
  supabase: SupabaseClient,
  remindersPerWeek: 0 | 1 | 2 | 3
): Promise<void> {
  if (remindersPerWeek === 0) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);

  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recent } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "reminder")
    .gte("created_at", oneDayAgo);
  if (recent && recent.length > 0) return;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "reminder")
    .gte("created_at", startOfWeek.toISOString());
  const countThisWeek = count ?? 0;
  if (countThisWeek >= remindersPerWeek) return;

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "reminder",
    payload: {},
  });
}
