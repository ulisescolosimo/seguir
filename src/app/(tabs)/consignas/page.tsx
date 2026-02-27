"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchConsignas } from "@/lib/consignas";
import type { Consigna } from "@/types/consignas";
import { IconChevronLeft, IconSearch } from "@/components/ui/Icons";

const SUGERENCIAS_LIMIT = 6;

export default function ConsignasPage() {
  const [consignas, setConsignas] = useState<Consigna[]>([]);
  const [verTodo, setVerTodo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsignas({ limit: verTodo ? 100 : SUGERENCIAS_LIMIT })
      .then(setConsignas)
      .catch(() => setConsignas([]))
      .finally(() => setLoading(false));
  }, [verTodo]);

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen bg-neutral-100 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="shrink-0 relative flex items-center justify-center h-14 px-4 outline outline-1 outline-offset-[-0.5px] outline-zinc-300">
        <Link
          href="/inicio"
          className="absolute left-4 top-0 bottom-0 w-10 flex items-center justify-center text-black"
          aria-label="Volver"
        >
          <IconChevronLeft className="size-7" />
        </Link>
        <h1 className="text-center text-black text-2xl font-bold font-['Inter'] leading-7">
          Consignas
        </h1>
        <Link
          href="/consignas/buscar"
          className="absolute right-4 top-0 bottom-0 w-10 flex items-center justify-center text-orange-700"
          aria-label="Buscar consignas"
        >
          <IconSearch className="size-8" />
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-12">
        {/* Sugerencias de hoy + Ver todo */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-black text-lg font-bold font-['Inter'] leading-5">
            Sugerencias de hoy
          </h2>
          <button
            type="button"
            onClick={() => setVerTodo(!verTodo)}
            className="text-orange-700 text-base font-normal font-['Inter'] leading-5"
          >
            {verTodo ? "Ver menos" : "Ver todo"}
          </button>
        </div>

        {/* Lista de consignas */}
        {loading ? (
          <p className="mt-4 text-neutral-500 text-sm">Cargando consignas...</p>
        ) : consignas.length === 0 ? (
          <p className="mt-4 text-neutral-500 text-sm">No hay consignas.</p>
        ) : (
          <ul className="mt-4 space-y-5">
            {consignas.map((c) => (
              <li key={c.id}>
                <div className="w-full min-h-[12rem] rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] bg-white p-5 flex flex-col">
                  <span className="text-orange-700 text-sm font-normal font-['Inter'] leading-4">
                    {c.formatos_texto?.nombre ?? c.tipo}
                  </span>
                  <h3 className="mt-2 text-black text-lg font-bold font-['Inter'] leading-5">
                    {c.titulo}
                  </h3>
                  <p className="mt-2 text-black text-sm font-normal font-['Inter'] leading-5 line-clamp-2">
                    {c.descripcion}
                  </p>
                  <div className="mt-auto pt-4 flex justify-end">
                    <Link
                      href={`/consignas/${c.id}`}
                      className="h-10 px-5 bg-orange-700 rounded-[47px] text-white text-sm font-bold leading-4 flex items-center justify-center"
                    >
                      Usar consigna
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
