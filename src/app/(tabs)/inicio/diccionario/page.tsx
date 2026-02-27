"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchPalabrasConConteo } from "@/lib/diccionario";
import type { PalabraConConteo } from "@/types/diccionario";
import { IconChevronLeft, IconSearch } from "@/components/ui/Icons";
import { Header } from "@/components/layout/Header";

export default function DiccionarioPage() {
  const [palabrasConConteo, setPalabrasConConteo] = useState<
    PalabraConConteo[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const palabrasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return palabrasConConteo;
    return palabrasConConteo.filter((p) => p.palabra.toLowerCase().includes(q));
  }, [palabrasConConteo, busqueda]);

  useEffect(() => {
    fetchPalabrasConConteo()
      .then(setPalabrasConConteo)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 overflow-hidden">
      <Header
        title="Diccionario"
        leftSlot={
          <Link
            href="/inicio"
            className="p-2 -m-2 text-black"
            aria-label="Volver"
          >
            <IconChevronLeft className="size-7" />
          </Link>
        }
      />
      <div
        className="w-full h-0 border-t border-zinc-300 shrink-0"
        aria-hidden
      />

      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 pb-6 mx-auto mb-6">
          <h2 className="text-black text-base font-bold leading-tight mb-2">
            Diccionario de la comunidad
          </h2>
          <label className="sr-only" htmlFor="busqueda-diccionario">
            Buscar por palabra en el diccionario
          </label>
          <div className="w-full h-12 bg-zinc-100 rounded-[111px] mb-3 flex items-center gap-2 pl-4 pr-3 focus-within:ring-2 focus-within:ring-red/30 focus-within:ring-offset-2">
            <IconSearch
              className="size-4 shrink-0 text-neutral-400"
              aria-hidden
            />
            <input
              id="busqueda-diccionario"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por palabra..."
              className="flex-1 min-w-0 h-full bg-transparent text-black text-xs placeholder:text-neutral-400 focus:outline-none"
              aria-label="Buscar por palabra en la biblioteca de significados"
            />
          </div>

          {loading ? (
            <div className="bg-white rounded-xl p-4 flex items-center justify-center">
              <p className="text-neutral-400 text-xs">Cargando...</p>
            </div>
          ) : palabrasFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-neutral-500 text-xs">
                {busqueda.trim()
                  ? `Ninguna palabra coincide con "${busqueda.trim()}".`
                  : "Aún no hay palabras con significados."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.06)] overflow-hidden">
              {palabrasFiltradas.map((p) => (
                <Link
                  key={p.id}
                  href={`/inicio/comunidad/significados/${p.id}`}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-left border-b border-gray-200 last:border-b-0 hover:bg-neutral-50 active:bg-neutral-100"
                >
                  <span className="text-black text-sm font-bold leading-tight">
                    {p.palabra}
                  </span>
                  <span className="text-orange-700 text-xs font-normal leading-tight">
                    {p.cantidad_significados} significado
                    {p.cantidad_significados !== 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
