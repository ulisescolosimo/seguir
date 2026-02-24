import type { Recurso } from "@/types/recursos";

/** Devuelve todos los recursos ordenados por `orden`. */
export async function fetchRecursos(): Promise<Recurso[]> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recursos")
    .select("id, titulo, descripcion, ejemplo_label, ejemplo_texto, destacado, orden, created_at, updated_at")
    .order("orden", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Recurso[];
}

/** Devuelve los IDs de recursos marcados como favoritos por el usuario. */
export async function fetchFavoritosRecursos(userId: string): Promise<Set<string>> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recursos_favoritos")
    .select("recurso_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: { recurso_id: string }) => r.recurso_id));
}

/** Añade un recurso a favoritos del usuario. */
export async function addFavorito(userId: string, recursoId: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("recursos_favoritos").insert({ user_id: userId, recurso_id: recursoId });
  if (error) throw error;
}

/** Quita un recurso de favoritos del usuario. */
export async function removeFavorito(userId: string, recursoId: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase
    .from("recursos_favoritos")
    .delete()
    .eq("user_id", userId)
    .eq("recurso_id", recursoId);
  if (error) throw error;
}

/** Filtra recursos por texto (titulo, descripcion, ejemplo_texto). */
export function filterRecursosBySearch(recursos: Recurso[], query: string): Recurso[] {
  const q = query.trim().toLowerCase();
  if (!q) return recursos;
  return recursos.filter(
    (r) =>
      r.titulo.toLowerCase().includes(q) ||
      r.descripcion.toLowerCase().includes(q) ||
      (r.ejemplo_texto?.toLowerCase().includes(q) ?? false)
  );
}
