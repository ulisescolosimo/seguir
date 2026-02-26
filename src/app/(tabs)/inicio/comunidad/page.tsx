"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchPalabrasConConteo } from "@/lib/diccionario";
import { fetchFormatos, groupFormatosByCategoria } from "@/lib/formatos";
import type { PalabraConConteo } from "@/types/diccionario";
import type { Formato } from "@/types/formatos";
import {
  IconSearch,
  IconChevronLeft,
  IconFilter,
} from "@/components/ui/Icons";
import { Header } from "@/components/layout/Header";
import { CommunityTextCard } from "@/components/community/CommunityTextCard";

type CommunityText = {
  id: string;
  title: string;
  body: string;
  formato_id: string | null;
  tematica: string | null;
  formatos_texto: { nombre: string }[] | null;
  image_url: string | null;
  updated_at: string;
  user_id: string;
};

function authorDisplayName(firstName: string | null, lastName: string | null): string {
  const n = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  return n || "un miembro";
}

/** Encabezado de sección: título, icono de filtro y opcionalmente badge de filtro activo con cruz para quitar. */
function SectionHeader({
  title,
  onFilter,
  ariaLabelFilter,
  activeFilterName,
  onClearFilter,
}: {
  title: string;
  onFilter: () => void;
  ariaLabelFilter: string;
  activeFilterName?: string | null;
  onClearFilter?: () => void;
}) {
  const isActive = Boolean(activeFilterName?.trim());
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between w-full gap-3">
        <h2 className="text-black text-base font-bold leading-tight">
          {title}
        </h2>
        <button
          type="button"
          onClick={onFilter}
          className={`p-1.5 -m-1.5 ${isActive ? "text-red" : "text-black"}`}
          aria-label={isActive ? `Filtro activo: ${activeFilterName}. ${ariaLabelFilter}` : ariaLabelFilter}
          aria-pressed={isActive}
        >
          <IconFilter className="size-5" />
        </button>
      </div>
      {isActive && onClearFilter && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-red/15 pl-3 pr-1 py-1 text-xs font-medium text-black"
            role="status"
            aria-label={`Filtro activo: ${activeFilterName}`}
          >
            {activeFilterName}
            <button
              type="button"
              onClick={onClearFilter}
              className="rounded-full p-1 -m-0.5 text-neutral-600 hover:bg-red/25 hover:text-black focus:outline-none focus:ring-2 focus:ring-red/50"
              aria-label="Quitar filtro"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

export default function ComunidadPage() {
  const [texts, setTexts] = useState<CommunityText[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [authorAvatars, setAuthorAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [palabrasConConteo, setPalabrasConConteo] = useState<PalabraConConteo[]>([]);
  const [loadingBiblioteca, setLoadingBiblioteca] = useState(true);
  const [busquedaBiblioteca, setBusquedaBiblioteca] = useState("");

  const [formatos, setFormatos] = useState<Formato[]>([]);
  const [showFiltroComunidad, setShowFiltroComunidad] = useState(false);
  const [showFiltroSeguidos, setShowFiltroSeguidos] = useState(false);
  const [formatoIdFiltroComunidad, setFormatoIdFiltroComunidad] = useState<string | null>(null);
  const [formatoIdFiltroSeguidos, setFormatoIdFiltroSeguidos] = useState<string | null>(null);

  const [showBusquedaComunidad, setShowBusquedaComunidad] = useState(false);
  const [busquedaComunidad, setBusquedaComunidad] = useState("");
  const inputBusquedaComunidadRef = useRef<HTMLInputElement>(null);

  const [textsSeguidos, setTextsSeguidos] = useState<CommunityText[]>([]);
  const [authorNamesSeguidos, setAuthorNamesSeguidos] = useState<Record<string, string>>({});
  const [authorAvatarsSeguidos, setAuthorAvatarsSeguidos] = useState<Record<string, string>>({});
  const [loadingSeguidos, setLoadingSeguidos] = useState(true);

  const palabrasFiltradas = useMemo(() => {
    const q = busquedaBiblioteca.trim().toLowerCase();
    if (!q) return palabrasConConteo;
    return palabrasConConteo.filter((p) =>
      p.palabra.toLowerCase().includes(q)
    );
  }, [palabrasConConteo, busquedaBiblioteca]);

  const textosComunidadFiltrados = useMemo(() => {
    if (!formatoIdFiltroComunidad) return texts;
    const selectedFormato = formatos.find((f) => f.id === formatoIdFiltroComunidad);
    const nombreFormatoLower = selectedFormato?.nombre?.trim().toLowerCase();
    return texts.filter((t) => {
      if (t.formato_id === formatoIdFiltroComunidad) return true;
      if (nombreFormatoLower && t.tematica?.trim().toLowerCase() === nombreFormatoLower) return true;
      return false;
    });
  }, [texts, formatoIdFiltroComunidad, formatos]);

  const textosSeguidosFiltrados = useMemo(() => {
    if (!formatoIdFiltroSeguidos) return textsSeguidos;
    const selectedFormato = formatos.find((f) => f.id === formatoIdFiltroSeguidos);
    const nombreFormatoLower = selectedFormato?.nombre?.trim().toLowerCase();
    return textsSeguidos.filter((t) => {
      if (t.formato_id === formatoIdFiltroSeguidos) return true;
      if (nombreFormatoLower && t.tematica?.trim().toLowerCase() === nombreFormatoLower) return true;
      return false;
    });
  }, [textsSeguidos, formatoIdFiltroSeguidos, formatos]);

  const textosComunidadBuscados = useMemo(() => {
    const q = busquedaComunidad.trim().toLowerCase();
    if (!q) return textosComunidadFiltrados;
    return textosComunidadFiltrados.filter((t) => {
      const title = (t.title ?? "").toLowerCase();
      const body = (t.body ?? "").toLowerCase();
      const tematica = (t.tematica ?? "").toLowerCase();
      const formatosTexto = Array.isArray(t.formatos_texto) ? t.formatos_texto : [];
      const formatoNames = formatosTexto.map((f) => (f.nombre ?? "").toLowerCase()).join(" ");
      return title.includes(q) || body.includes(q) || tematica.includes(q) || formatoNames.includes(q);
    });
  }, [textosComunidadFiltrados, busquedaComunidad]);

  const textosSeguidosBuscados = useMemo(() => {
    const q = busquedaComunidad.trim().toLowerCase();
    if (!q) return textosSeguidosFiltrados;
    return textosSeguidosFiltrados.filter((t) => {
      const title = (t.title ?? "").toLowerCase();
      const body = (t.body ?? "").toLowerCase();
      const tematica = (t.tematica ?? "").toLowerCase();
      const formatosTexto = Array.isArray(t.formatos_texto) ? t.formatos_texto : [];
      const formatoNames = formatosTexto.map((f) => (f.nombre ?? "").toLowerCase()).join(" ");
      return title.includes(q) || body.includes(q) || tematica.includes(q) || formatoNames.includes(q);
    });
  }, [textosSeguidosFiltrados, busquedaComunidad]);

  const bibliotecaRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    if (window.location.hash === "#biblioteca-significados") {
      bibliotecaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (showBusquedaComunidad) {
      const t = setTimeout(() => inputBusquedaComunidadRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [showBusquedaComunidad]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTexts([]);
        setAuthorNames({});
        setLoading(false);
        setTextsSeguidos([]);
        setAuthorNamesSeguidos({});
        setAuthorAvatarsSeguidos({});
        setLoadingSeguidos(false);
        return;
      }
      const [textsRes, palabrasData, formatosData] = await Promise.all([
        supabase
          .from("texts")
          .select("id, title, body, formato_id, tematica, formatos_texto(nombre), image_url, updated_at, user_id")
          .eq("status", "published")
          .order("updated_at", { ascending: false }),
        fetchPalabrasConConteo().catch(() => []),
        fetchFormatos().catch(() => []),
      ]);
      const rows = (textsRes.data ?? []) as CommunityText[];
      setTexts(rows);
      setPalabrasConConteo(palabrasData);
      setFormatos(formatosData);

      const userIds = [...new Set(rows.map((t) => t.user_id))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", userIds);
        const map: Record<string, string> = {};
        const avatarMap: Record<string, string> = {};
        for (const p of profilesData ?? []) {
          map[p.id] = authorDisplayName(p.first_name ?? null, p.last_name ?? null);
          if (p.avatar_url?.trim()) avatarMap[p.id] = p.avatar_url.trim();
        }
        setAuthorNames(map);
        setAuthorAvatars(avatarMap);
      } else {
        setAuthorNames({});
        setAuthorAvatars({});
      }

      // Textos de personas que el usuario sigue
      const { data: followsRows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followingIds = (followsRows ?? []).map((r) => r.following_id);
      if (followingIds.length > 0) {
        const { data: seguidosData } = await supabase
          .from("texts")
          .select("id, title, body, formato_id, tematica, formatos_texto(nombre), image_url, updated_at, user_id")
          .in("user_id", followingIds)
          .eq("status", "published")
          .order("updated_at", { ascending: false });
        const seguidos = (seguidosData ?? []) as CommunityText[];
        setTextsSeguidos(seguidos);
        const segIds = [...new Set(seguidos.map((t) => t.user_id))];
        if (segIds.length > 0) {
          const { data: profSeguidos } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url")
            .in("id", segIds);
          const nameMap: Record<string, string> = {};
          const avatarMap: Record<string, string> = {};
          for (const p of profSeguidos ?? []) {
            nameMap[p.id] = authorDisplayName(p.first_name ?? null, p.last_name ?? null);
            if (p.avatar_url?.trim()) avatarMap[p.id] = p.avatar_url.trim();
          }
          setAuthorNamesSeguidos(nameMap);
          setAuthorAvatarsSeguidos(avatarMap);
        } else {
          setAuthorNamesSeguidos({});
          setAuthorAvatarsSeguidos({});
        }
      } else {
        setTextsSeguidos([]);
        setAuthorNamesSeguidos({});
        setAuthorAvatarsSeguidos({});
      }
      setLoadingSeguidos(false);

      setLoading(false);
      setLoadingBiblioteca(false);
    })();
  }, []);

  const FiltroFormatoPanel = ({
    open,
    onClose,
    formatoId,
    onSelectFormato,
  }: {
    open: boolean;
    onClose: () => void;
    formatoId: string | null;
    onSelectFormato: (id: string | null) => void;
  }) => {
    if (!open) return null;
    const { ficcion, no_ficcion } = groupFormatosByCategoria(formatos);
    return (
      <>
        <div
          className="fixed inset-0 bg-black/40 z-40"
          aria-hidden
          onClick={onClose}
        />
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-lg max-h-[70vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <h3 className="text-lg font-bold text-black">Filtrar por formato</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -m-2 text-black font-medium"
              aria-label="Cerrar"
            >
              Cerrar
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-4">
            <button
              type="button"
              onClick={() => {
                onSelectFormato(null);
                onClose();
              }}
              className={`w-full text-left py-3 px-4 rounded-xl text-base font-medium mb-2 ${
                formatoId === null ? "bg-red/15 text-red" : "bg-neutral-100 text-black"
              }`}
            >
              Todos
            </button>
            <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mt-4 mb-2">Ficción</p>
            {ficcion.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  onSelectFormato(f.id);
                  onClose();
                }}
                className={`w-full text-left py-3 px-4 rounded-xl text-base font-medium mb-1 ${
                  formatoId === f.id ? "bg-red/15 text-red" : "bg-neutral-100 text-black"
                }`}
              >
                {f.nombre}
              </button>
            ))}
            <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mt-4 mb-2">No ficción</p>
            {no_ficcion.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  onSelectFormato(f.id);
                  onClose();
                }}
                className={`w-full text-left py-3 px-4 rounded-xl text-base font-medium mb-1 ${
                  formatoId === f.id ? "bg-red/15 text-red" : "bg-neutral-100 text-black"
                }`}
              >
                {f.nombre}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 overflow-hidden">
      <Header
        title="Comunidad"
        leftSlot={
          <Link href="/inicio" className="p-2 -m-2 text-black" aria-label="Volver">
            <IconChevronLeft className="size-7" />
          </Link>
        }
        rightSlot={
          <button
            type="button"
            onClick={() => setShowBusquedaComunidad((v) => !v)}
            className={`p-2 -m-2 ${showBusquedaComunidad ? "text-red" : "text-black"}`}
            aria-label={showBusquedaComunidad ? "Ocultar búsqueda" : "Buscar en comunidad"}
            aria-pressed={showBusquedaComunidad}
          >
            <IconSearch className="size-8" />
          </button>
        }
      />
      <div className="w-full h-0 border-t border-zinc-300 shrink-0" aria-hidden />

      {showBusquedaComunidad && (
        <div className="px-4 pt-2 pb-1 bg-neutral-100 shrink-0">
          <label className="sr-only" htmlFor="busqueda-comunidad">
            Buscar en la sección comunidad
          </label>
          <div className="w-full h-9 bg-white/80 rounded-full flex items-center gap-2 pl-3 pr-2.5 focus-within:ring-2 focus-within:ring-red/20 focus-within:ring-offset-1 focus-within:bg-white">
            <IconSearch className="size-3.5 shrink-0 text-neutral-400" aria-hidden />
            <input
              ref={inputBusquedaComunidadRef}
              id="busqueda-comunidad"
              type="search"
              value={busquedaComunidad}
              onChange={(e) => setBusquedaComunidad(e.target.value)}
              placeholder="Buscar en la comunidad..."
              className="flex-1 min-w-0 h-full bg-transparent text-black text-xs placeholder:text-neutral-400 focus:outline-none"
              aria-label="Buscar en todos los textos de la comunidad"
            />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 pb-6 mx-auto">
          {/* Sección Comunidad: todos los textos públicos */}
          <SectionHeader
            title="Comunidad"
            onFilter={() => setShowFiltroComunidad(true)}
            ariaLabelFilter="Filtrar textos de la comunidad por formato"
            activeFilterName={formatoIdFiltroComunidad ? formatos.find((f) => f.id === formatoIdFiltroComunidad)?.nombre ?? null : null}
            onClearFilter={() => setFormatoIdFiltroComunidad(null)}
          />

          <FiltroFormatoPanel
            open={showFiltroComunidad}
            onClose={() => setShowFiltroComunidad(false)}
            formatoId={formatoIdFiltroComunidad}
            onSelectFormato={setFormatoIdFiltroComunidad}
          />

          {loading ? (
            <div className="bg-white rounded-xl p-4 flex items-center justify-center">
              <p className="text-neutral-400 text-xs">Cargando...</p>
            </div>
          ) : textosComunidadBuscados.length === 0 ? (
            <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <p className="text-neutral-500 text-xs">
                {busquedaComunidad.trim()
                  ? `Ningún texto coincide con "${busquedaComunidad.trim()}".`
                  : "Aún no hay textos públicos en la comunidad."}
              </p>
              <Link
                href="/inicio"
                className="mt-2 text-orange-700 text-xs font-bold hover:underline"
              >
                Volver al inicio
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {textosComunidadBuscados.map((t) => (
                <Link
                  key={t.id}
                  href={`/inicio/comunidad/texto/${t.id}`}
                  className="block"
                  aria-label={`Ver texto: ${t.title?.trim() || "Sin título"}`}
                >
                  <CommunityTextCard
                    text={t}
                    authorName={authorNames[t.user_id] ?? "un miembro"}
                    authorAvatarUrl={authorAvatars[t.user_id] ?? null}
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Sección Textos de escritores que seguís */}
          <div className="mt-6">
            <SectionHeader
              title="Textos de escritores que seguís"
              onFilter={() => setShowFiltroSeguidos(true)}
              ariaLabelFilter="Filtrar textos de escritores que seguís"
              activeFilterName={formatoIdFiltroSeguidos ? formatos.find((f) => f.id === formatoIdFiltroSeguidos)?.nombre ?? null : null}
              onClearFilter={() => setFormatoIdFiltroSeguidos(null)}
            />

            <FiltroFormatoPanel
              open={showFiltroSeguidos}
              onClose={() => setShowFiltroSeguidos(false)}
              formatoId={formatoIdFiltroSeguidos}
              onSelectFormato={setFormatoIdFiltroSeguidos}
            />

            {loadingSeguidos ? (
              <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                <p className="text-neutral-400 text-xs">Cargando...</p>
              </div>
            ) : textosSeguidosBuscados.length === 0 ? (
              <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-center">
                <p className="text-neutral-500 text-xs">
                  {busquedaComunidad.trim()
                    ? `Ningún texto coincide con "${busquedaComunidad.trim()}".`
                    : "Cuando sigas a escritores con perfil público, sus textos aparecerán aquí."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {textosSeguidosBuscados.map((t) => (
                  <Link
                    key={t.id}
                    href={`/inicio/comunidad/texto/${t.id}`}
                    className="block"
                    aria-label={`Ver texto: ${t.title?.trim() || "Sin título"}`}
                  >
                    <CommunityTextCard
                      text={t}
                      authorName={authorNamesSeguidos[t.user_id] ?? "un miembro"}
                      authorAvatarUrl={authorAvatarsSeguidos[t.user_id] ?? null}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Biblioteca de significados */}
          <h2
            ref={bibliotecaRef}
            id="biblioteca-significados"
            className="text-black text-base font-bold leading-tight mt-6 mb-2 scroll-mt-4"
          >
            Biblioteca de significados
          </h2>
          <label className="sr-only" htmlFor="busqueda-biblioteca">
            Buscar por palabra en la biblioteca
          </label>
          <div className="w-full h-12 bg-zinc-100 rounded-[111px] mb-3 flex items-center gap-2 pl-4 pr-3 focus-within:ring-2 focus-within:ring-red/30 focus-within:ring-offset-2">
            <IconSearch className="size-4 shrink-0 text-neutral-400" aria-hidden />
            <input
              id="busqueda-biblioteca"
              type="search"
              value={busquedaBiblioteca}
              onChange={(e) => setBusquedaBiblioteca(e.target.value)}
              placeholder="Buscar por palabra..."
              className="flex-1 min-w-0 h-full bg-transparent text-black text-xs placeholder:text-neutral-400 focus:outline-none"
              aria-label="Buscar por palabra en la biblioteca de significados"
            />
          </div>

          {loadingBiblioteca ? (
            <div className="bg-white rounded-xl p-4 flex items-center justify-center">
              <p className="text-neutral-400 text-xs">Cargando...</p>
            </div>
          ) : palabrasFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-neutral-500 text-xs">
                {busquedaBiblioteca.trim()
                  ? `Ninguna palabra coincide con "${busquedaBiblioteca.trim()}".`
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
                    {p.cantidad_significados} significado{p.cantidad_significados !== 1 ? "s" : ""}
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
