import type { PalabraConConteo } from "@/types/diccionario";

/** Orden alfabético español: A–Z con Ñ después de N. */
export const LETRAS_ESPANOL = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "Ñ", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
] as const;

export type LetraEspanol = (typeof LETRAS_ESPANOL)[number];

/** Devuelve la letra inicial para agrupar (normalizada: á→A, ñ→Ñ). */
export function getPrimeraLetra(palabra: string): string {
  if (!palabra.trim()) return "";
  const c = palabra.trim().charAt(0).toUpperCase();
  if (c === "Ñ") return "Ñ";
  const normal = c.normalize("NFD").replace(/\u0300/g, "");
  return normal.charAt(0).toUpperCase();
}

/** Agrupa palabras por primera letra y ordena grupos e ítems en orden español. */
export function agruparPorLetra(
  palabras: PalabraConConteo[]
): Map<string, PalabraConConteo[]> {
  const map = new Map<string, PalabraConConteo[]>();
  for (const p of palabras) {
    const letra = getPrimeraLetra(p.palabra);
    if (!letra) continue;
    const list = map.get(letra) ?? [];
    list.push(p);
    map.set(letra, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.palabra.localeCompare(b.palabra, "es"));
  }
  return map;
}

/** Devuelve las letras presentes en el mapa en orden español. */
export function letrasEnOrden(
  porLetra: Map<string, PalabraConConteo[]>
): string[] {
  return LETRAS_ESPANOL.filter((l) => porLetra.has(l));
}
