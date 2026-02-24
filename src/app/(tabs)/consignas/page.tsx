"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchConsignas } from "@/lib/consignas";
import { fetchFormatos, groupFormatosByCategoria } from "@/lib/formatos";
import type { Consigna } from "@/types/consignas";
import type { Formato } from "@/types/formatos";
import { IconChevronLeft, IconSearch, IconChevronDown } from "@/components/ui/Icons";

const SUGERENCIAS_LIMIT = 6;
const LIMITE_IA_POR_DIA = 2;

type ConsignaIA = {
  titulo: string;
  descripcion: string;
  tipo: string;
  formato_nombre?: string;
};

export default function ConsignasPage() {
  const router = useRouter();
  const [consignas, setConsignas] = useState<Consigna[]>([]);
  const [formatos, setFormatos] = useState<Formato[]>([]);
  const [formatoId, setFormatoId] = useState<string>("");
  const [verTodo, setVerTodo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consignaIA, setConsignaIA] = useState<ConsignaIA | null>(null);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState<string | null>(null);
  const [usosRestantesIA, setUsosRestantesIA] = useState<number | null>(null);

  useEffect(() => {
    fetchFormatos()
      .then((list) => {
        setFormatos(list);
        if (list.length > 0 && !formatoId) setFormatoId(list[0].id);
      })
      .catch(() => setFormatos([]));
  }, []);

  useEffect(() => {
    fetchConsignas({ limit: verTodo ? 100 : SUGERENCIAS_LIMIT })
      .then(setConsignas)
      .catch(() => setConsignas([]))
      .finally(() => setLoading(false));
  }, [verTodo]);

  useEffect(() => {
    fetch("/api/consignas/generar", { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.usosRestantes === "number") setUsosRestantesIA(data.usosRestantes);
      })
      .catch(() => {});
  }, []);

  async function handleGenerarIA(regenerar = false) {
    setErrorIA(null);
    setGenerandoIA(true);
    if (!regenerar) setConsignaIA(null);
    try {
      const res = await fetch("/api/consignas/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formato_id: formatoId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al generar");
      setConsignaIA({
        titulo: data.titulo ?? "Consigna",
        descripcion: data.descripcion ?? "",
        tipo: data.tipo ?? "OTRO",
        formato_nombre: data.formato_nombre,
      });
      if (typeof data.usosRestantes === "number") setUsosRestantesIA(data.usosRestantes);
    } catch (e) {
      setErrorIA(e instanceof Error ? e.message : "Error al generar consigna");
    } finally {
      setGenerandoIA(false);
    }
  }

  function usarConsignaIA() {
    if (!consignaIA) return;
    const params = new URLSearchParams({
      titulo: consignaIA.titulo,
      descripcion: consignaIA.descripcion,
      tipo: consignaIA.formato_nombre ?? consignaIA.tipo,
    });
    router.push(`/consignas/escribir?${params.toString()}`);
  }

  const puedeGenerarIA = usosRestantesIA === null || usosRestantesIA > 0;
  const { ficcion, no_ficcion } = groupFormatosByCategoria(formatos);

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
        {/* Card grande: Elegí la temática + selector + Buscar */}
        <div className="mt-5 w-full rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] border border-orange-700 bg-red-50 p-5 flex flex-col">
          <h2 className="text-black text-lg font-bold font-['Inter'] leading-5">
            Elegí la temática de la consigna
          </h2>

          {/* Dropdown formato */}
          <div className="mt-4 relative">
            <select
              value={formatoId}
              onChange={(e) => setFormatoId(e.target.value)}
              className="w-full h-14 pl-4 pr-12 bg-white rounded-2xl shadow-[0px_2px_2px_0px_rgba(0,0,0,0.05)] text-black text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-orange-700/30"
            >
              {ficcion.length > 0 && (
                <optgroup label="Ficción">
                  {ficcion.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </optgroup>
              )}
              {no_ficcion.length > 0 && (
                <optgroup label="No ficción">
                  {no_ficcion.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black">
              <IconChevronDown className="size-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
            {usosRestantesIA !== null && (
              <span className="text-neutral-500 text-sm">
                {usosRestantesIA} de {LIMITE_IA_POR_DIA} hoy
              </span>
            )}
            <button
              type="button"
              onClick={() => handleGenerarIA(false)}
              disabled={generandoIA || !puedeGenerarIA}
              className="h-10 px-6 bg-orange-700 rounded-[47px] text-white text-sm font-bold leading-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generandoIA ? "Generando…" : "Buscar"}
            </button>
          </div>
          {errorIA && <p className="mt-2 text-red-600 text-sm">{errorIA}</p>}
          {!puedeGenerarIA && usosRestantesIA === 0 && (
            <p className="mt-2 text-neutral-500 text-sm">
              Llegaste al límite de 2 generaciones por día. Mañana podés generar de nuevo.
            </p>
          )}
        </div>

        {/* Card resultado generado con IA: Regenerar + Usar consigna */}
        {consignaIA && (
          <div className="mt-5 w-full min-h-[13rem] rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] bg-white p-5 flex flex-col">
            <span className="text-orange-700 text-sm font-normal font-['Inter'] leading-4">
              {(consignaIA.formato_nombre ?? consignaIA.tipo).toUpperCase()}
            </span>
            <h3 className="mt-2 text-black text-lg font-bold font-['Inter'] leading-5">
              {consignaIA.titulo}
            </h3>
            {consignaIA.descripcion ? (
              <p className="mt-1 text-black text-sm font-normal font-['Inter'] leading-5 line-clamp-3">
                {consignaIA.descripcion}
              </p>
            ) : null}
            <div className="mt-auto pt-4 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => handleGenerarIA(true)}
                disabled={generandoIA || !puedeGenerarIA}
                className="h-10 px-5 rounded-[47px] border border-orange-700 text-orange-700 text-sm font-bold leading-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Regenerar
              </button>
              <button
                type="button"
                onClick={usarConsignaIA}
                className="h-10 px-5 bg-orange-700 rounded-[47px] text-white text-sm font-bold leading-4"
              >
                Usar consigna
              </button>
            </div>
          </div>
        )}

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
