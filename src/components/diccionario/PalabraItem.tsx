"use client";

import Link from "next/link";
import type { PalabraConConteo } from "@/types/diccionario";

function resaltarCoincidencia(palabra: string, query: string): React.ReactNode {
  const q = query.trim().toLowerCase();
  if (!q || !palabra.toLowerCase().includes(q)) {
    return palabra;
  }
  const i = palabra.toLowerCase().indexOf(q);
  const antes = palabra.slice(0, i);
  const match = palabra.slice(i, i + q.length);
  const despues = palabra.slice(i + q.length);
  return (
    <>
      {antes}
      <mark className="bg-red/25 text-red rounded-sm px-0.5 font-diccionario font-bold">
        {match}
      </mark>
      {despues}
    </>
  );
}

export function PalabraItem({
  palabra,
  cantidad_significados,
  id,
  query,
}: PalabraConConteo & { query: string }) {
  return (
    <Link
      href={`/inicio/comunidad/significados/${id}`}
      className="flex items-baseline justify-between gap-4 w-full py-2.5 px-1 text-left border-b border-red/[0.06] last:border-b-0 hover:bg-red/[0.04] focus:bg-red/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-red/20 rounded-sm"
      style={{ letterSpacing: "0.01em" }}
    >
      <span className="font-diccionario text-[15px] font-bold text-neutral-900 leading-snug break-word">
        {resaltarCoincidencia(palabra, query)}
      </span>
      <span className="font-diccionario text-xs text-red/70 tabular-nums shrink-0">
        {cantidad_significados} {cantidad_significados !== 1 ? "acepciones" : "acepción"}
      </span>
    </Link>
  );
}
