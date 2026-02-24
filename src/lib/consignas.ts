import { createClient } from "@/lib/supabase/client";
import type { Consigna } from "@/types/consignas";

export async function fetchConsignas(opts?: {
  tipo?: string;
  search?: string;
  limit?: number;
}): Promise<Consigna[]> {
  const supabase = createClient();
  let q = supabase
    .from("consignas")
    .select("*, formatos_texto(nombre)")
    .order("orden", { ascending: true });

  if (opts?.tipo) {
    q = q.eq("tipo", opts.tipo);
  }
  if (opts?.search && opts.search.trim()) {
    const term = opts.search.trim();
    q = q.or(`titulo.ilike.%${term}%,descripcion.ilike.%${term}%`);
  }
  if (opts?.limit) {
    q = q.limit(opts.limit);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Consigna[];
}

export async function fetchConsignaById(id: string): Promise<Consigna | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("consignas")
    .select("*, formatos_texto(nombre)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as Consigna;
}

/** Devuelve una consigna aleatoria del listado (para "Consigna random"). */
export async function getConsignaRandom(): Promise<Consigna | null> {
  const list = await fetchConsignas({ limit: 50 });
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}
