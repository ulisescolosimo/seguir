"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSearch,
  IconChevronDown,
  IconHeart,
  IconDiccionario,
} from "@/components/ui/Icons";
import { createClient } from "@/lib/supabase/client";
import {
  fetchRecursos,
  fetchFavoritosRecursos,
  addFavorito,
  removeFavorito,
  filterRecursosBySearch,
} from "@/lib/recursos";
import type { Recurso } from "@/types/recursos";

const DICCIONARIO = {
  titulo: "Diccionario de palabras",
  subtitulo: "Consulta rápida",
  placeholderBusqueda: "Escribí una palabra...",
  citaEjemplo:
    "'Tus textos se comparten fuera de la comunidad' — Stephen King (sinónimos)",
};

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);
    try {
      const [recursosData, favoritosData] = await Promise.all([
        fetchRecursos(),
        fetchFavoritosRecursos(user.id),
      ]);
      setRecursos(recursosData);
      setFavoritos(favoritosData);
    } catch (e) {
      console.error("Error cargando recursos:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filterRecursosBySearch(recursos, search);
  const destacado = filtered.find((r) => r.destacado) ?? null;
  const listados = filtered.filter((r) => r.id !== destacado?.id);

  const toggleFavorito = useCallback(
    async (recursoId: string) => {
      if (!userId) return;
      const isFav = favoritos.has(recursoId);
      try {
        if (isFav) {
          await removeFavorito(userId, recursoId);
          setFavoritos((prev) => {
            const next = new Set(prev);
            next.delete(recursoId);
            return next;
          });
        } else {
          await addFavorito(userId, recursoId);
          setFavoritos((prev) => new Set(prev).add(recursoId));
        }
      } catch (e) {
        console.error("Error al actualizar favorito:", e);
      }
    },
    [userId, favoritos]
  );

  if (loading) {
    return (
      <div className="min-h-full bg-neutral-100 flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando recursos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-100 overflow-hidden flex flex-col">
      {/* Barra de búsqueda */}
      <div className="px-4 pt-4 pb-2">
        <div className="h-14 flex items-center gap-3 px-4 bg-zinc-100 rounded-[111px]">
          <IconSearch className="size-8 shrink-0 text-[#CF3617]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar recursos..."
            className="flex-1 min-w-0 bg-transparent text-black text-sm font-normal leading-4 placeholder:text-neutral-500 outline-none"
            aria-label="Buscar recursos"
          />
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-6">
        {/* Recurso destacado (el que tenga destacado === true) */}
        {destacado && (
          <section>
            <h2 className="text-black text-lg font-bold leading-5 mb-4">
              Recurso destacado
            </h2>
            <div className="bg-white rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] overflow-hidden">
              <div className="p-6 space-y-4">
                <h3 className="text-black text-lg font-bold leading-5">
                  {destacado.titulo}
                </h3>
                <p className="text-black text-sm font-normal leading-5 whitespace-pre-line">
                  {destacado.descripcion}
                </p>
                {destacado.ejemplo_label && destacado.ejemplo_texto && (
                  <div className="bg-neutral-100 rounded-2xl border-l-2 border-orange-700 py-3 px-5">
                    <span className="text-orange-700 text-sm font-normal leading-4">
                      {destacado.ejemplo_label}
                    </span>
                    <p className="text-black text-xs font-normal leading-5 mt-1 whitespace-pre-line">
                      {destacado.ejemplo_texto}
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 pb-6">
                <button
                  type="button"
                  onClick={() => toggleFavorito(destacado.id)}
                  className={`w-full h-12 flex items-center justify-center gap-2 rounded-[47px] text-sm font-bold leading-4 transition-colors ${
                    favoritos.has(destacado.id)
                      ? "bg-orange-700/80 text-white"
                      : "bg-orange-700 text-white hover:bg-orange-700/90"
                  }`}
                >
                  <IconHeart className="size-[17px]" />
                  {favoritos.has(destacado.id)
                    ? "Guardado en favoritos"
                    : "Guardar en favoritos"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Resto de recursos (populares / listado) */}
        <section>
          <h2 className="text-black text-lg font-bold leading-5 mb-4">
            Recursos populares
          </h2>
          {listados.length === 0 ? (
            <p className="text-neutral-500 text-sm">
              {search
                ? "No hay recursos que coincidan con la búsqueda."
                : "No hay más recursos para mostrar."}
            </p>
          ) : (
            <ul className="space-y-4">
              {listados.map((recurso) => {
                const isExpanded = expandedId === recurso.id;
                return (
                  <li key={recurso.id}>
                    <article className="bg-white rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-black text-lg font-bold leading-5">
                              {recurso.titulo}
                            </h3>
                            <p
                              className={`text-black text-sm font-normal leading-5 mt-1 ${
                                isExpanded ? "" : "line-clamp-2"
                              }`}
                            >
                              {recurso.descripcion}
                            </p>
                            {isExpanded && recurso.ejemplo_label && recurso.ejemplo_texto && (
                              <div className="mt-3 bg-neutral-100 rounded-2xl border-l-2 border-orange-700 py-3 px-5">
                                <span className="text-orange-700 text-sm font-normal leading-4">
                                  {recurso.ejemplo_label}
                                </span>
                                <p className="text-black text-xs font-normal leading-5 mt-1 whitespace-pre-line">
                                  {recurso.ejemplo_texto}
                                </p>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : recurso.id)
                            }
                            className="shrink-0 p-1 text-black transition-transform"
                            aria-label={isExpanded ? "Contraer" : "Expandir"}
                          >
                            <IconChevronDown
                              className={`size-5 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="mt-4 pt-3 border-t border-neutral-100">
                            <button
                              type="button"
                              onClick={() => toggleFavorito(recurso.id)}
                              className={`h-10 px-4 flex items-center justify-center gap-2 rounded-[47px] text-sm font-bold leading-4 ${
                                favoritos.has(recurso.id)
                                  ? "bg-orange-700/80 text-white"
                                  : "bg-orange-700 text-white hover:bg-orange-700/90"
                              }`}
                            >
                              <IconHeart className="size-4" />
                              {favoritos.has(recurso.id)
                                ? "Guardado"
                                : "Guardar en favoritos"}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Diccionario de palabras */}
        <section>
          <div className="bg-red-50 rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] border border-orange-700 overflow-hidden mb-8">
            <div className="p-6 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#CF3617]/10 shrink-0">
                <IconDiccionario className="size-6 text-[#CF3617]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-black text-lg font-bold leading-5">
                  {DICCIONARIO.titulo}
                </h3>
                <p className="text-black text-sm font-normal leading-5 mt-0.5">
                  {DICCIONARIO.subtitulo}
                </p>
              </div>
              <div className="hidden sm:block w-12 h-12 rounded-full bg-[#CF3617]/10 shrink-0" />
            </div>
            <div className="px-4 pb-6">
              <div className="h-12 flex items-center gap-3 px-4 bg-white rounded-[45.5px] shadow-[0px_2px_2px_0px_rgba(0,0,0,0.05)]">
                <IconSearch className="size-6 text-[#CF3617] shrink-0" />
                <span className="text-black text-sm font-normal leading-4">
                  {DICCIONARIO.placeholderBusqueda}
                </span>
              </div>
              <p className="text-black text-xs font-normal leading-5 mt-4 pl-1">
                {DICCIONARIO.citaEjemplo}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
