"use client";

import { useRef, useEffect } from "react";
import type { PalabraConConteo } from "@/types/diccionario";
import { PalabraItem } from "./PalabraItem";
import { SECTION_PREFIX } from "./IndiceAlfabetico";

export function LetraSeccion({
  letra,
  palabras,
  searchQuery,
  registerRef,
}: {
  letra: string;
  palabras: PalabraConConteo[];
  searchQuery: string;
  registerRef: (letra: string, el: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const sectionId = `${SECTION_PREFIX}-${letra}`;

  useEffect(() => {
    registerRef(letra, ref.current);
    return () => registerRef(letra, null);
  }, [letra, registerRef]);

  return (
    <section
      ref={ref}
      id={sectionId}
      aria-labelledby={`titulo-${sectionId}`}
      className="mb-8"
    >
      <h2
        id={`titulo-${sectionId}`}
        className="font-diccionario text-3xl font-bold text-red tracking-tight py-4 border-b border-red/15 sticky z-[1] bg-[#f5f0e8]"
        style={{
          top: "var(--diccionario-sticky-top, 4rem)",
          letterSpacing: "0.02em",
        }}
      >
        {letra}
      </h2>
      <ul className="list-none p-0 m-0 mt-0">
        {palabras.map((p) => (
          <li key={p.id}>
            <PalabraItem {...p} query={searchQuery} />
          </li>
        ))}
      </ul>
    </section>
  );
}
