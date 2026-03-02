"use client";

import { useCallback } from "react";
import { LETRAS_ESPANOL } from "@/lib/diccionario-utils";

export const SECTION_PREFIX = "diccionario-letra";

export function IndiceAlfabetico({
  letrasVisibles,
  letraActiva,
  letraFiltro = null,
  onLetraClick,
  className = "",
}: {
  letrasVisibles: string[];
  letraActiva: string | null;
  letraFiltro?: string | null;
  onLetraClick: (letra: string) => void;
  className?: string;
}) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, letra: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onLetraClick(letra);
      }
    },
    [onLetraClick]
  );

  const letters = LETRAS_ESPANOL.filter(
    (l) => letrasVisibles.length === 0 || letrasVisibles.includes(l)
  );

  return (
    <nav
      className={`h-full flex flex-col ${className}`}
      aria-label="Índice alfabético del diccionario"
    >
      <ul
        className="flex flex-col flex-1 list-none p-0 m-0 min-h-0"
        role="list"
      >
        {letters.map((letra) => {
          const visible = letrasVisibles.length === 0 || letrasVisibles.includes(letra);
          const active = letraActiva === letra;
          const isFilter = letraFiltro === letra;
          const id = `${SECTION_PREFIX}-${letra}`;
          return (
            <li key={letra} className="flex-1 min-h-0 flex">
              <a
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onLetraClick(letra);
                }}
                onKeyDown={(e) => handleKeyDown(e, letra)}
                className={`
                  font-diccionario text-xs md:text-sm font-bold text-red/80
                  flex flex-1 items-center justify-center min-w-0 min-h-0
                  rounded-sm
                  hover:text-red hover:bg-red/10
                  focus:outline-none focus-visible:ring-1 focus-visible:ring-red/30
                  ${active ? "text-red bg-red/15" : ""}
                  ${isFilter ? "text-red bg-red/25 ring-1 ring-red/30" : ""}
                  ${!visible && !isFilter ? "opacity-40" : ""}
                `}
                aria-current={active || isFilter ? "true" : undefined}
                aria-label={isFilter ? `Filtro: letra ${letra}. Clic para quitar filtro` : `Filtrar por letra ${letra}`}
              >
                {letra}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
