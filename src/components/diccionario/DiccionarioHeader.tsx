"use client";

import { IconSearch } from "@/components/ui/Icons";

const ID_BUSQUEDA = "busqueda-diccionario";

export function DiccionarioHeader({
  value,
  onChange,
  placeholder = "Buscar por palabra...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div
      className="sticky top-0 z-10 bg-[#f5f0e8] border-b border-red/10 py-3"
      role="search"
      aria-label="Buscar en el diccionario"
    >
      <label htmlFor={ID_BUSQUEDA} className="sr-only">
        Buscar por palabra en el diccionario
      </label>
      <div className="flex items-center gap-2 h-10 px-3 bg-white/70 border border-red/15 rounded-sm max-w-[70ch] mx-auto focus-within:border-red/30 focus-within:bg-white/90">
            <IconSearch
              className="size-4 shrink-0 text-red/50"
          aria-hidden
        />
        <input
          id={ID_BUSQUEDA}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 h-full bg-transparent text-neutral-900 text-[15px] font-diccionario placeholder:text-red/40 focus:outline-none"
          aria-label="Buscar por palabra en el diccionario"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
