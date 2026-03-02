"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { fetchPalabrasConConteo } from "@/lib/diccionario";
import { agruparPorLetra, letrasEnOrden, getPrimeraLetra } from "@/lib/diccionario-utils";
import type { PalabraConConteo } from "@/types/diccionario";
import { Header } from "@/components/layout/Header";
import { IconChevronLeft } from "@/components/ui/Icons";
import { DiccionarioHeader } from "./DiccionarioHeader";
import { LetraSeccion } from "./LetraSeccion";
import { IndiceAlfabetico, SECTION_PREFIX } from "./IndiceAlfabetico";

export function DiccionarioClient({
  initialPalabras = [],
}: {
  initialPalabras?: PalabraConConteo[];
}) {
  const [palabras, setPalabras] = useState<PalabraConConteo[]>(initialPalabras);
  const [loading, setLoading] = useState(initialPalabras.length === 0);
  const [busqueda, setBusqueda] = useState("");
  const [filtroLetra, setFiltroLetra] = useState<string | null>(null);
  const [letraActiva, setLetraActiva] = useState<string | null>(null);
  const refsMap = useRef<Map<string, HTMLElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPalabras(initialPalabras);
    if (initialPalabras.length > 0) setLoading(false);
  }, [initialPalabras]);

  useEffect(() => {
    if (initialPalabras.length > 0) return;
    fetchPalabrasConConteo()
      .then(setPalabras)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [initialPalabras.length]);

  const palabrasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let list = palabras;
    if (q) list = list.filter((p) => p.palabra.toLowerCase().includes(q));
    if (filtroLetra) list = list.filter((p) => getPrimeraLetra(p.palabra) === filtroLetra);
    return list;
  }, [palabras, busqueda, filtroLetra]);

  const porLetra = useMemo(
    () => agruparPorLetra(palabrasFiltradas),
    [palabrasFiltradas]
  );
  const letrasOrden = letrasEnOrden(porLetra);

  const registerRef = useCallback((letra: string, el: HTMLElement | null) => {
    refsMap.current = new Map(refsMap.current);
    if (el) refsMap.current.set(letra, el);
    else refsMap.current.delete(letra);
  }, []);

  const scrollToLetra = useCallback((letra: string) => {
    const container = scrollContainerRef.current;
    const el = refsMap.current.get(letra);
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollTop =
        container.scrollTop + elRect.top - containerRect.top - 80;
      container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
    } else {
      const id = `${SECTION_PREFIX}-${letra}`;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleLetraClick = useCallback((letra: string) => {
    setFiltroLetra((prev) => (prev === letra ? null : letra));
  }, []);

  useEffect(() => {
    if (filtroLetra && letrasOrden.includes(filtroLetra)) {
      const t = requestAnimationFrame(() => scrollToLetra(filtroLetra));
      return () => cancelAnimationFrame(t);
    }
  }, [filtroLetra, letrasOrden, scrollToLetra]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || letrasOrden.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target.id.replace(`${SECTION_PREFIX}-`, ""))
          .filter((l) => letrasOrden.includes(l));
        if (intersecting.length === 0) return;
        // Quedarse con la primera en orden del diccionario (la más arriba visible)
        const primeraVisible = letrasOrden.find((l) => intersecting.includes(l));
        if (!primeraVisible) return;
        const scrollTop = container.scrollTop;
        const casiArriba = scrollTop < 30;
        const esPrimeraLetra = primeraVisible === letrasOrden[0];
        setLetraActiva(casiArriba && esPrimeraLetra ? null : primeraVisible);
      },
      {
        root: container,
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    letrasOrden.forEach((letra) => {
      const el = refsMap.current.get(letra);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [letrasOrden]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f0e8] overflow-hidden">
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
        className="w-full h-0 border-t border-red/10 shrink-0"
        aria-hidden
      />

      <main className="flex-1 min-h-0 flex relative">
        <div
          ref={scrollContainerRef}
          className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden ${!filtroLetra ? "pr-10 md:pr-12" : ""}`}
          role="region"
          aria-label="Listado de palabras del diccionario"
        >
          <div
            className="max-w-[70ch] mx-auto px-4 pb-12 font-diccionario"
            style={
              {
                "--diccionario-sticky-top": "4rem",
              } as React.CSSProperties
            }
          >
              <DiccionarioHeader value={busqueda} onChange={setBusqueda} />

            {filtroLetra && (
              <p className="text-red/80 text-sm mt-2 flex items-center gap-2">
                <span>Mostrando solo letra <strong>{filtroLetra}</strong></span>
                <button
                  type="button"
                  onClick={() => setFiltroLetra(null)}
                  className="text-red font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-red/30 rounded"
                >
                  Ver todas
                </button>
              </p>
            )}

            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <p className="text-red/70 text-[15px]">
                  Cargando…
                </p>
              </div>
            ) : palabrasFiltradas.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-red/80 text-[15px] leading-relaxed">
                  {filtroLetra
                    ? `Ninguna palabra comienza con la letra ${filtroLetra}.`
                    : busqueda.trim()
                      ? `Ninguna palabra coincide con «${busqueda.trim()}».`
                      : "Aún no hay palabras con significados."}
                </p>
                {filtroLetra && (
                  <button
                    type="button"
                    onClick={() => setFiltroLetra(null)}
                    className="mt-3 text-red font-medium hover:underline"
                  >
                    Ver todas las letras
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-6">
                {letrasOrden.map((letra) => (
                  <LetraSeccion
                    key={letra}
                    letra={letra}
                    palabras={porLetra.get(letra) ?? []}
                    searchQuery={busqueda}
                    registerRef={registerRef}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Índice alfabético lateral fijo (sticky a la vista, oculto si hay filtro por letra) */}
        {!filtroLetra && (
        <aside
          className="fixed top-14 right-0 bottom-16 w-10 md:w-12 flex flex-col pt-1 pb-1 border-l border-red/10 bg-[#f5f0e8] z-10"
          aria-label="Índice alfabético"
        >
          <div className="flex-1 min-h-0 flex flex-col">
          <IndiceAlfabetico
            letrasVisibles={letrasOrden}
            letraActiva={letraActiva}
            letraFiltro={filtroLetra}
            onLetraClick={handleLetraClick}
          />
          </div>
        </aside>
        )}
      </main>
    </div>
  );
}
