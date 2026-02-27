import type {
  PalabraDiccionario,
  DefinicionDiccionario,
  PalabraConConteo,
  DefinicionPublica,
} from "@/types/diccionario";

/** Devuelve todas las palabras del diccionario ordenadas por orden. */
export async function fetchPalabrasDiccionario(): Promise<PalabraDiccionario[]> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("palabras_diccionario")
    .select("id, palabra, orden, created_at")
    .order("orden", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PalabraDiccionario[];
}

/** Devuelve las definiciones del usuario (palabra_id -> definicion). */
export async function fetchMisDefiniciones(
  userId: string
): Promise<Record<string, DefinicionDiccionario>> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("definiciones_diccionario")
    .select("user_id, palabra_id, definicion, created_at, updated_at")
    .eq("user_id", userId);
  if (error) throw error;
  const map: Record<string, DefinicionDiccionario> = {};
  for (const row of data ?? []) {
    map[row.palabra_id] = row as DefinicionDiccionario;
  }
  return map;
}

/** Guarda o actualiza la definición del usuario para una palabra. */
export async function saveDefinicion(
  userId: string,
  palabraId: string,
  definicion: string
): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("definiciones_diccionario").upsert(
    {
      user_id: userId,
      palabra_id: palabraId,
      definicion: definicion.trim() || "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,palabra_id" }
  );
  if (error) throw error;
}

/**
 * Elige una palabra para mostrar: prioriza las que el usuario aún no definió.
 * Si todas están definidas, devuelve una al azar.
 */
export function elegirSiguientePalabra(
  palabras: PalabraDiccionario[],
  definicionesByPalabraId: Record<string, DefinicionDiccionario>
): PalabraDiccionario | null {
  if (palabras.length === 0) return null;
  const sinDefinir = palabras.filter((p) => !definicionesByPalabraId[p.id]?.definicion?.trim());
  const candidatas = sinDefinir.length > 0 ? sinDefinir : palabras;
  return candidatas[Math.floor(Math.random() * candidatas.length)] ?? null;
}

/** Índice del día actual (mismo valor para todo el día en cualquier timezone de referencia). */
function getDiaOrdinal(): number {
  const d = new Date();
  return Math.floor(d.getTime() / 86400000);
}

/**
 * Devuelve la palabra del día: una por día, determinística (misma palabra para todos ese día).
 * Si el usuario ya la definió, igual es la "palabra del día"; la UI decidirá si mostrar o no el CTA.
 */
export function getPalabraDelDia(palabras: PalabraDiccionario[]): PalabraDiccionario | null {
  if (palabras.length === 0) return null;
  const index = getDiaOrdinal() % palabras.length;
  return palabras[index] ?? null;
}

/** Palabras con conteo de significados (solo palabras con al menos una definición no vacía). */
export async function fetchPalabrasConConteo(): Promise<PalabraConConteo[]> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const [palabrasRes, defsRes] = await Promise.all([
    supabase.from("palabras_diccionario").select("id, palabra, orden, created_at").order("orden", { ascending: true }),
    supabase.from("definiciones_diccionario").select("palabra_id").neq("definicion", ""),
  ]);
  if (palabrasRes.error) throw palabrasRes.error;
  if (defsRes.error) throw defsRes.error;
  const palabras = (palabrasRes.data ?? []) as PalabraDiccionario[];
  const counts: Record<string, number> = {};
  for (const row of defsRes.data ?? []) {
    const id = row.palabra_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return palabras.map((p) => ({
    ...p,
    cantidad_significados: counts[p.id] ?? 0,
  }));
}

/** Definiciones públicas de una palabra (con nombre del autor) para la página de significados. */
export async function fetchDefinicionesPublicas(palabraId: string): Promise<DefinicionPublica[]> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("definiciones_diccionario")
    .select("user_id, palabra_id, definicion, created_at, updated_at")
    .eq("palabra_id", palabraId)
    .neq("definicion", "")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const userIds = [...new Set(rows.map((r: { user_id: string }) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", userIds);
  const nameByUserId: Record<string, string> = {};
  for (const p of profiles ?? []) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Un miembro";
    nameByUserId[p.id] = name;
  }
  return rows.map((r: { user_id: string; palabra_id: string; definicion: string; created_at?: string; updated_at?: string }) => ({
    ...r,
    author_name: nameByUserId[r.user_id] ?? "Un miembro",
  })) as DefinicionPublica[];
}
