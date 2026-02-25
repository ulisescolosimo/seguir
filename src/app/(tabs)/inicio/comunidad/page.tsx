"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchPalabrasConConteo } from "@/lib/diccionario";
import { fetchFormatos, groupFormatosByCategoria } from "@/lib/formatos";
import type { PalabraConConteo } from "@/types/diccionario";
import type { Formato } from "@/types/formatos";
import {
  IconAvatarCircle,
  IconPhoto,
  IconSearch,
  IconChevronLeft,
  IconFilter,
} from "@/components/ui/Icons";
import { Header } from "@/components/layout/Header";

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

function formatFecha(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function excerpt(body: string, max = 60): string {
  const t = body.trim();
  if (!t) return "";
  return t.length <= max ? t : t.slice(0, max).trim() + "…";
}

function authorDisplayName(firstName: string | null, lastName: string | null): string {
  const n = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  return n || "un miembro";
}

/** Card de texto según template: imagen izquierda, contenido a la derecha (tag, título, descripción, fecha, autor). */
function CommunityTextCard({
  text,
  authorName,
}: {
  text: CommunityText;
  authorName: string;
}) {
  const displayTitle = text.title?.trim() || "Sin título";
  const formatoLabel = (
    text.formatos_texto?.[0]?.nombre ||
    text.tematica?.trim() ||
    "TEXTO"
  ).toUpperCase();
  const imageUrl = text.image_url || "https://placehold.co/112x112";

  return (
    <div className="w-full h-28 bg-white rounded-xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.06)] overflow-hidden flex">
      <div className="w-28 h-28 shrink-0 bg-neutral-200 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0 p-2.5 flex flex-col relative">
        <span className="text-orange-700 text-xs font-medium leading-tight">
          {formatoLabel}
        </span>
        <span className="absolute top-2.5 right-2.5 text-neutral-400 text-[10px] font-normal leading-tight">
          {formatFecha(text.updated_at)}
        </span>
        <h3 className="text-black text-sm font-bold leading-tight mt-0.5 pr-14">
          {displayTitle}
        </h3>
        <p className="text-black text-xs font-normal leading-tight mt-0.5 line-clamp-2">
          {excerpt(text.body)}
        </p>
        <div className="mt-auto flex items-center gap-1.5">
          <div className="relative shrink-0 w-5 h-5 flex items-center justify-center">
            <IconAvatarCircle className="absolute inset-0 w-full h-full" />
            <span className="relative text-black">
              <IconPhoto className="w-3 h-3" />
            </span>
          </div>
          <p className="text-black text-xs font-normal leading-tight">
            Por <span className="font-semibold">{authorName}</span>
          </p>
        </div>
      </div>
    </div>
  );
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
  const [loading, setLoading] = useState(true);

  const [palabrasConConteo, setPalabrasConConteo] = useState<PalabraConConteo[]>([]);
  const [loadingBiblioteca, setLoadingBiblioteca] = useState(true);
  const [busquedaBiblioteca, setBusquedaBiblioteca] = useState("");

  const [formatos, setFormatos] = useState<Formato[]>([]);
  const [showFiltroComunidad, setShowFiltroComunidad] = useState(false);
  const [showFiltroSeguidos, setShowFiltroSeguidos] = useState(false);
  const [formatoIdFiltroComunidad, setFormatoIdFiltroComunidad] = useState<string | null>(null);
  const [formatoIdFiltroSeguidos, setFormatoIdFiltroSeguidos] = useState<string | null>(null);

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

  const bibliotecaRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    if (window.location.hash === "#biblioteca-significados") {
      bibliotecaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTexts([]);
        setAuthorNames({});
        setLoading(false);
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
          .select("id, first_name, last_name")
          .in("id", userIds);
        const map: Record<string, string> = {};
        for (const p of profilesData ?? []) {
          map[p.id] = authorDisplayName(p.first_name ?? null, p.last_name ?? null);
        }
        setAuthorNames(map);
      } else {
        setAuthorNames({});
      }
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
          <button type="button" className="p-2 -m-2 text-red" aria-label="Buscar">
            <IconSearch className="size-8" />
          </button>
        }
      />
      <div className="w-full h-0 border-t border-zinc-300 shrink-0" aria-hidden />

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
          ) : textosComunidadFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <p className="text-neutral-500 text-xs">
                Aún no hay textos públicos en la comunidad.
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
              {textosComunidadFiltrados.map((t) => (
                <Link
                  key={t.id}
                  href={`/inicio/comunidad/texto/${t.id}`}
                  className="block"
                  aria-label={`Ver texto: ${t.title?.trim() || "Sin título"}`}
                >
                  <CommunityTextCard
                    text={t}
                    authorName={authorNames[t.user_id] ?? "un miembro"}
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Sección Textos de escritores que seguís (por ahora vacía; luego: textos de perfiles seguidos) */}
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

          <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <p className="text-neutral-500 text-xs">
              Cuando sigas a escritores con perfil público, sus textos aparecerán aquí.
            </p>
          </div>
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
