"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSearch,
  IconChevronDown,
  IconHeart,
} from "@/components/ui/Icons";
import { UnifiedTabHeader } from "@/components/layout/UnifiedTabHeader";
import { createClient } from "@/lib/supabase/client";
import {
  fetchRecursos,
  fetchFavoritosRecursos,
  addFavorito,
  removeFavorito,
  filterRecursosBySearch,
  solicitarRecurso,
} from "@/lib/recursos";
import type { Recurso } from "@/types/recursos";

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [solicitudEstado, setSolicitudEstado] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [solicitudFijaTexto, setSolicitudFijaTexto] = useState("");
  const [solicitudFijaEstado, setSolicitudFijaEstado] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
  const filteredFavoritos = filtered.filter((r) => favoritos.has(r.id));
  const filteredResto = filtered.filter((r) => !favoritos.has(r.id));

  useEffect(() => {
    setSolicitudEstado("idle");
  }, [search]);

  useEffect(() => {
    setSolicitudFijaEstado("idle");
  }, [solicitudFijaTexto]);

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

  const pedirRecurso = useCallback(async () => {
    const texto = search.trim();
    if (!userId || !texto) return;
    setSolicitudEstado("sending");
    try {
      await solicitarRecurso(userId, texto);
      setSolicitudEstado("sent");
    } catch (e) {
      console.error("Error al enviar solicitud:", e);
      setSolicitudEstado("error");
    }
  }, [userId, search]);

  const pedirRecursoFijo = useCallback(async () => {
    const texto = solicitudFijaTexto.trim();
    if (!userId || !texto) return;
    setSolicitudFijaEstado("sending");
    try {
      await solicitarRecurso(userId, texto);
      setSolicitudFijaEstado("sent");
    } catch (e) {
      console.error("Error al enviar solicitud:", e);
      setSolicitudFijaEstado("error");
    }
  }, [userId, solicitudFijaTexto]);

  if (loading) {
    return (
      <div className="min-h-full bg-neutral-100 flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando recursos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-100 overflow-hidden flex flex-col">
      <UnifiedTabHeader title="Recursos" backHref="/inicio" />
      <div
        className="w-full h-0 border-t border-zinc-300 shrink-0"
        aria-hidden
      />
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

      <div className="flex-1 px-4 pb-6 space-y-6 mb-6 overflow-auto">
        <section>
          {filtered.length === 0 ? (
            <div className="space-y-4">
              <p className="text-neutral-500 text-sm">
                {search
                  ? "No hay recursos que coincidan con la búsqueda."
                  : "No hay más recursos para mostrar."}
              </p>
              {search.trim() && userId && (
                <div className="bg-white rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] border border-orange-700/20 p-5">
                  <p className="text-black text-sm font-normal leading-5">
                    ¿Querés ver algo que no está? Pedilo y lo sumamos próximamente.
                  </p>
                  <p className="text-neutral-600 text-xs mt-1">
                    Ej.: &quot;{search.trim()}&quot;
                  </p>
                  {solicitudEstado === "idle" && (
                    <button
                      type="button"
                      onClick={pedirRecurso}
                      className="mt-4 h-10 px-4 flex items-center justify-center gap-2 rounded-[47px] text-sm font-bold leading-4 bg-orange-700 text-white hover:bg-orange-700/90"
                    >
                      Pedir que aparezca próximamente
                    </button>
                  )}
                  {solicitudEstado === "sending" && (
                    <p className="mt-4 text-neutral-500 text-sm">Enviando...</p>
                  )}
                  {solicitudEstado === "sent" && (
                    <p className="mt-4 text-orange-700 text-sm font-medium">
                      Gracias, lo tendremos en cuenta.
                    </p>
                  )}
                  {solicitudEstado === "error" && (
                    <p className="mt-4 text-red-600 text-sm">
                      No se pudo enviar. Probá de nuevo.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {filteredFavoritos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-black text-base font-bold leading-5 mb-3">
                    Recursos guardados
                  </h3>
                  <ul className="space-y-4">
                    {filteredFavoritos.map((recurso) => {
                      const isExpanded = expandedId === recurso.id;
                      return (
                        <li key={recurso.id}>
                          <article className="bg-white rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] overflow-hidden">
                            <div className="p-5">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-black text-lg font-bold leading-5 min-w-0 flex-1">
                                  {recurso.titulo}
                                </h3>
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
                              {isExpanded && (
                                <div className="mt-4 pt-3 border-t border-neutral-100">
                                  <button
                                    type="button"
                                    onClick={() => toggleFavorito(recurso.id)}
                                    className="h-10 px-4 flex items-center justify-center gap-2 rounded-[47px] text-sm font-bold leading-4 bg-orange-700/80 text-white"
                                  >
                                    <IconHeart className="size-4" />
                                    Guardado
                                  </button>
                                </div>
                              )}
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {filteredResto.length > 0 && (
                <div>
                  {filteredFavoritos.length > 0 && (
                    <h3 className="text-black text-base font-bold leading-5 mb-3">
                      Otros recursos
                    </h3>
                  )}
                  <ul className="space-y-4">
              {filteredResto.map((recurso) => {
                const isExpanded = expandedId === recurso.id;
                return (
                  <li key={recurso.id}>
                    <article className="bg-white rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-black text-lg font-bold leading-5 min-w-0 flex-1">
                            {recurso.titulo}
                          </h3>
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
                </div>
              )}
            </>
          )}
          {userId && !(search.trim() && filtered.length === 0) && (
            <div className="mt-6 bg-white rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] border border-orange-700/20 p-5">
              <p className="text-black text-sm font-normal leading-5">
                ¿Querés ver algo que no está? Pedilo y lo sumamos próximamente.
              </p>
              <input
                type="text"
                value={solicitudFijaTexto}
                onChange={(e) => setSolicitudFijaTexto(e.target.value)}
                placeholder="Ej.: diálogo, comedia..."
                className="mt-3 w-full h-11 px-4 bg-zinc-100 rounded-xl text-black text-sm placeholder:text-neutral-500 outline-none border border-transparent focus:border-orange-700/50"
                aria-label="Qué recurso te gustaría ver"
              />
              {solicitudFijaEstado === "idle" && (
                <button
                  type="button"
                  onClick={pedirRecursoFijo}
                  disabled={!solicitudFijaTexto.trim()}
                  className="mt-4 h-10 px-4 flex items-center justify-center gap-2 rounded-[47px] text-sm font-bold leading-4 bg-orange-700 text-white hover:bg-orange-700/90 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Pedir que aparezca próximamente
                </button>
              )}
              {solicitudFijaEstado === "sending" && (
                <p className="mt-4 text-neutral-500 text-sm">Enviando...</p>
              )}
              {solicitudFijaEstado === "sent" && (
                <p className="mt-4 text-orange-700 text-sm font-medium">
                  Gracias, lo tendremos en cuenta.
                </p>
              )}
              {solicitudFijaEstado === "error" && (
                <p className="mt-4 text-red-600 text-sm">
                  No se pudo enviar. Probá de nuevo.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
