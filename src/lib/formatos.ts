import type { Formato, FormatosPorCategoria } from "@/types/formatos";

/** Devuelve todos los formatos ordenados por categoría y orden. */
export async function fetchFormatos(): Promise<Formato[]> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("formatos_texto")
    .select("id, nombre, categoria, orden, created_at, updated_at")
    .order("categoria", { ascending: true })
    .order("orden", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Formato[];
}

/** Agrupa formatos por categoría para el selector. */
export function groupFormatosByCategoria(formatos: Formato[]): FormatosPorCategoria {
  const ficcion = formatos.filter((f) => f.categoria === "ficcion");
  const no_ficcion = formatos.filter((f) => f.categoria === "no_ficcion");
  return { ficcion, no_ficcion };
}
