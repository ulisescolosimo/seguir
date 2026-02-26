"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPalabrasDiccionario,
  fetchMisDefiniciones,
  saveDefinicion,
  elegirSiguientePalabra,
} from "@/lib/diccionario";
import type { PalabraDiccionario, DefinicionDiccionario } from "@/types/diccionario";
import { CommunityTextCard } from "@/components/community/CommunityTextCard";
import type { CommunityTextCardData } from "@/components/community/CommunityTextCard";
import {
  IconAvatarCircle,
  IconPhoto,
  IconPalabraHeart,
  IconOtraPalabra,
  IconEscribirDesdeCero,
} from "@/components/ui/Icons";

type TextRecord = {
  id: string;
  title: string;
  body: string;
  status: "draft" | "published";
  updated_at: string;
  consigna_id?: string | null;
};

type CommunityTextPreview = CommunityTextCardData;

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

function excerpt(body: string, max = 80): string {
  const t = body.trim();
  if (!t) return "";
  return t.length <= max ? t : t.slice(0, max).trim() + "…";
}

function SectionHeader({
  title,
  linkLabel = "Ver todo",
  href = "#",
}: {
  title: string;
  linkLabel?: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold text-black leading-5">{title}</h2>
      <Link href={href} className="text-red text-base leading-5">
        {linkLabel}
      </Link>
    </div>
  );
}

function TextCardLarge({
  id,
  title,
  body,
  updated_at,
  status,
  hasConsigna,
  className = "",
}: {
  id: string;
  title: string;
  body: string;
  updated_at: string;
  status: "draft" | "published";
  hasConsigna?: boolean;
  className?: string;
}) {
  const displayTitle = title.trim() || "Sin título";
  return (
    <div className={`h-[220px] flex flex-col bg-white rounded-2xl p-4 ${className}`}>
      <div className="flex flex-col gap-0.5 flex-1 min-h-0 overflow-hidden">
        <span className="text-neutral-400 text-xs leading-3 shrink-0">
          Última edición {formatFecha(updated_at)}
        </span>
        {hasConsigna && (
          <span className="shrink-0 text-orange-700 text-xs font-medium leading-4">
            Desde consigna
          </span>
        )}
        <h3 className="text-lg font-bold text-black leading-5 line-clamp-2 shrink-0">
          {displayTitle}
        </h3>
        <p className="text-black text-sm font-normal leading-5 line-clamp-4 min-h-0 overflow-hidden">
          {excerpt(body, 220) || "Sin contenido aún."}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 shrink-0">
        <span className="text-black text-sm font-semibold leading-4">
          {status === "draft" ? "Borrador" : "Publicado"}
        </span>
        {status === "draft" && (
          <Link
            href={`/escribir/editar?id=${id}`}
            className="h-10 px-5 bg-red text-white text-sm font-bold leading-4 rounded-[47px] hover:bg-red/90 transition-colors inline-flex items-center justify-center"
          >
            Seguir escribiendo
          </Link>
        )}
      </div>
    </div>
  );
}

function TextCardSmall({
  id,
  title,
  status,
  isOwn,
  authorName,
}: {
  id: string;
  title: string;
  status: "draft" | "published";
  isOwn: boolean;
  authorName?: string;
}) {
  const displayTitle = title.trim() || "Sin título";
  return (
    <div className="h-24 bg-white rounded-2xl p-3 flex flex-col min-w-0">
      {isOwn ? (
        <>
          <h3 className="text-sm font-bold text-black leading-4 truncate">{displayTitle}</h3>
          <div className="flex items-center gap-2 mt-auto pt-2">
            <span className="text-neutral-500 text-xs leading-4">
              {status === "draft" ? "Borrador" : "Publicado"}
            </span>
            {status === "draft" && (
              <Link
                href={`/escribir/editar?id=${id}`}
                className="text-red text-xs font-bold leading-4 ml-auto"
              >
                Editar
              </Link>
            )}
          </div>
        </>
      ) : (
        <>
          <h3 className="text-sm font-bold text-black leading-4 truncate">{displayTitle}</h3>
          <div className="flex items-center gap-2 mt-auto pt-2">
            <div className="shrink-0 relative w-6 h-6 flex items-center justify-center">
              <IconAvatarCircle className="absolute inset-0 w-full h-full" />
              <span className="relative flex items-center justify-center text-black">
                <IconPhoto className="w-3 h-3" />
              </span>
            </div>
            <p className="text-black text-xs leading-4">
              Por <span className="font-bold">{authorName ?? "Autor"}</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function PalabraCard({
  palabra,
  definicionActual,
  onOtraPalabra,
  onPublicar,
  disabled,
}: {
  palabra: PalabraDiccionario | null;
  definicionActual: DefinicionDiccionario | undefined;
  onOtraPalabra: () => void;
  onPublicar: (definicion: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(definicionActual?.definicion ?? "");
    setError(null);
  }, [palabra?.id, definicionActual?.definicion]);

  const handlePublicar = async () => {
    if (!palabra) return;
    setError(null);
    setSaving(true);
    try {
      await onPublicar(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (!palabra) {
    return (
      <div className="bg-red-50 rounded-2xl p-4 mb-4">
        <p className="text-neutral-500 text-sm">Cargando palabras...</p>
      </div>
    );
  }

  return (
    <div className="bg-red-50 rounded-2xl p-4 mb-4">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-2xl bg-red/20 flex items-center justify-center shrink-0 text-red">
          <IconPalabraHeart className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-black leading-5">{palabra.palabra}</h3>
          <p className="text-black text-sm font-normal leading-5 mt-1">
            Escribí qué significa para vos.
          </p>
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Definir palabra..."
        rows={3}
        disabled={disabled}
        className="w-full mt-4 bg-white rounded-2xl px-4 py-3 text-black text-sm leading-5 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red/30 resize-none"
      />
      {error && <p className="mt-2 text-red text-sm">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        <button
          type="button"
          onClick={onOtraPalabra}
          disabled={disabled}
          className="flex items-center gap-2 text-red text-xs font-medium uppercase leading-4 hover:underline disabled:opacity-50"
        >
          <IconOtraPalabra className="w-5 h-5" />
          Otra palabra
        </button>
        <button
          type="button"
          onClick={handlePublicar}
          disabled={saving || disabled}
          className="h-10 px-6 bg-red text-white text-sm font-bold leading-4 tracking-wider rounded-[47px] hover:bg-red/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
        >
          {saving ? "Guardando…" : "PUBLICAR"}
        </button>
      </div>
    </div>
  );
}

export default function InicioPage() {
  const searchParams = useSearchParams();
  const definirPalabraId = searchParams.get("definir");

  const [texts, setTexts] = useState<TextRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Comunidad: textos publicados de usuarios con want_to_be_read (RLS los filtra)
  const [communityTexts, setCommunityTexts] = useState<CommunityTextPreview[]>([]);
  const [communityAuthorNames, setCommunityAuthorNames] = useState<Record<string, string>>({});
  const [communityAuthorAvatars, setCommunityAuthorAvatars] = useState<Record<string, string>>({});
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  // Diccionario: palabras, definiciones del usuario, palabra actual
  const [palabras, setPalabras] = useState<PalabraDiccionario[]>([]);
  const [definiciones, setDefiniciones] = useState<Record<string, DefinicionDiccionario>>({});
  const [palabraActual, setPalabraActual] = useState<PalabraDiccionario | null>(null);
  const [loadingDiccionario, setLoadingDiccionario] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const elegirPalabra = useCallback(() => {
    setPalabraActual(elegirSiguientePalabra(palabras, definiciones));
  }, [palabras, definiciones]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTexts([]);
        setLoading(false);
        setLoadingDiccionario(false);
        setLoadingCommunity(false);
        setUserId(null);
        return;
      }
      setUserId(user.id);
      const [textsData, palabrasData, defsData] = await Promise.all([
        supabase
          .from("texts")
          .select("id, title, body, status, updated_at, consigna_id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
        fetchPalabrasDiccionario().catch(() => []),
        fetchMisDefiniciones(user.id).catch(() => ({})),
      ]);
      setTexts((textsData.data as TextRecord[]) ?? []);
      setPalabras(palabrasData);
      setDefiniciones(defsData);
      const siguiente = elegirSiguientePalabra(palabrasData, defsData);
      setPalabraActual(siguiente);
      setLoading(false);
      setLoadingDiccionario(false);

      // Textos de comunidad: publicados por otros (RLS solo devuelve autores con want_to_be_read)
      const { data: communityData } = await supabase
        .from("texts")
        .select("id, title, body, formato_id, tematica, formatos_texto(nombre), image_url, updated_at, user_id")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(30);
      const rows = (communityData ?? []) as CommunityTextPreview[];
      const others = rows.filter((t) => t.user_id !== user.id);
      setCommunityTexts(others);

      const authorIds = [...new Set(others.map((t) => t.user_id))];
      if (authorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", authorIds);
        const map: Record<string, string> = {};
        const avatarMap: Record<string, string> = {};
        for (const p of profilesData ?? []) {
          const name = [p.first_name?.trim(), p.last_name?.trim()].filter(Boolean).join(" ");
          map[p.id] = name || "un miembro";
          if (p.avatar_url?.trim()) avatarMap[p.id] = p.avatar_url.trim();
        }
        setCommunityAuthorNames(map);
        setCommunityAuthorAvatars(avatarMap);
      } else {
        setCommunityAuthorNames({});
        setCommunityAuthorAvatars({});
      }
      setLoadingCommunity(false);
    })();
  }, []);

  const diccionarioRef = useRef<HTMLDivElement>(null);

  // Si llegamos con ?definir=palabraId, preseleccionar esa palabra y scroll al diccionario
  useEffect(() => {
    if (!definirPalabraId || palabras.length === 0) return;
    const palabra = palabras.find((p) => p.id === definirPalabraId);
    if (palabra) {
      setPalabraActual(palabra);
      diccionarioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [definirPalabraId, palabras]);

  // Actualizar palabra actual cuando cambien palabras o definiciones (p. ej. tras guardar)
  useEffect(() => {
    if (palabras.length > 0 && !palabraActual)
      setPalabraActual(elegirSiguientePalabra(palabras, definiciones));
  }, [palabras, definiciones]);

  const handlePublicarDefinicion = async (definicion: string) => {
    const { data: { user } } = await createClient().auth.getUser();
    if (!user || !palabraActual) return;
    await saveDefinicion(user.id, palabraActual.id, definicion);
    setDefiniciones((prev) => ({
      ...prev,
      [palabraActual.id]: {
        user_id: user.id,
        palabra_id: palabraActual.id,
        definicion: definicion.trim() || "",
        updated_at: new Date().toISOString(),
      },
    }));
    setPalabraActual(elegirSiguientePalabra(palabras, {
      ...definiciones,
      [palabraActual.id]: {
        user_id: user.id,
        palabra_id: palabraActual.id,
        definicion: definicion.trim() || "",
      },
    }));
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  const communityCarouselRef = useRef<HTMLDivElement>(null);
  const [communitySlideIndex, setCommunitySlideIndex] = useState(0);

  const TEXTS_PER_SLIDE = 3;
  const communityChunks = useMemo(() => {
    const list = communityTexts;
    const result: CommunityTextPreview[][] = [];
    for (let i = 0; i < list.length; i += TEXTS_PER_SLIDE) {
      result.push(list.slice(i, i + TEXTS_PER_SLIDE));
    }
    return result;
  }, [communityTexts]);

  const goToSlide = (index: number) => {
    const el = carouselRef.current;
    if (!el || index < 0 || index >= texts.length) return;
    const slide = el.querySelector(`[data-slide="${index}"]`);
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    setSlideIndex(index);
  };

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el || texts.length === 0) return;
    const scrollLeft = el.scrollLeft;
    const step = el.offsetWidth + 16; // ancho card + gap-4
    const index = Math.round(scrollLeft / step);
    setSlideIndex(Math.min(Math.max(0, index), texts.length - 1));
  };

  const goToCommunitySlide = (index: number) => {
    const el = communityCarouselRef.current;
    if (!el || index < 0 || index >= communityChunks.length) return;
    const slide = el.querySelector(`[data-community-slide="${index}"]`);
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    setCommunitySlideIndex(index);
  };

  const handleCommunityCarouselScroll = () => {
    const el = communityCarouselRef.current;
    if (!el || communityChunks.length === 0) return;
    const scrollLeft = el.scrollLeft;
    const step = el.offsetWidth + 16;
    const index = Math.round(scrollLeft / step);
    setCommunitySlideIndex(Math.min(Math.max(0, index), communityChunks.length - 1));
  };

  return (
    <div className="px-5 py-4 pb-8">
      <SectionHeader title="Mis textos" href="/inicio/textos" />
      {loading ? (
        <div className="h-[220px] bg-white rounded-2xl p-4 mb-4 flex items-center">
          <p className="text-neutral-400 text-sm">Cargando...</p>
        </div>
      ) : texts.length > 0 ? (
        <div className="mb-4">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex overflow-x-auto gap-4 snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {texts.map((t, i) => (
              <div
                key={t.id}
                data-slide={i}
                className="flex-[0_0_100%] min-w-0 w-full snap-start snap-always"
              >
                <TextCardLarge
                  id={t.id}
                  title={t.title}
                  body={t.body}
                  updated_at={t.updated_at}
                  status={t.status}
                  hasConsigna={!!t.consigna_id}
                />
              </div>
            ))}
          </div>
          {texts.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {texts.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSlide(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === slideIndex ? "bg-red w-4" : "bg-neutral-300"
                  }`}
                  aria-label={`Ir a texto ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-[220px] bg-white rounded-2xl p-4 mb-4 flex items-center justify-center">
          <p className="text-neutral-400 text-sm text-center">
            Aún no tienes textos escritos. Cuando crees uno, aparecerá aquí.
          </p>
        </div>
      )}

      <Link
        href="/escribir/editar"
        className="flex items-center justify-center gap-2 py-3 mb-6 text-red text-base font-bold leading-5"
      >
        <IconEscribirDesdeCero className="w-[18px] h-[18px] shrink-0" />
        Escribir desde cero
      </Link>

      <SectionHeader title="Comunidad" href="/inicio/comunidad" />
      {loadingCommunity ? (
        <div className="h-28 bg-white rounded-xl p-4 mb-6 flex items-center">
          <p className="text-neutral-400 text-sm">Cargando...</p>
        </div>
      ) : communityTexts.length === 0 ? (
        <div className="h-28 bg-white rounded-xl p-4 mb-6 flex items-center justify-center">
          <p className="text-neutral-400 text-sm text-center">
            Aún no hay textos de la comunidad.
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <div
            ref={communityCarouselRef}
            onScroll={handleCommunityCarouselScroll}
            className="flex overflow-x-auto gap-4 snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {communityChunks.map((chunk: CommunityTextPreview[], slideIdx: number) => (
              <div
                key={slideIdx}
                data-community-slide={slideIdx}
                className="flex-[0_0_100%] min-w-0 w-full snap-start snap-always flex flex-col gap-3"
              >
                {chunk.map((t: CommunityTextPreview) => (
                  <Link
                    key={t.id}
                    href={`/inicio/comunidad/texto/${t.id}`}
                    className="block"
                    aria-label={`Ver texto: ${t.title?.trim() || "Sin título"}`}
                  >
                    <CommunityTextCard
                      text={t}
                      authorName={communityAuthorNames[t.user_id] ?? "un miembro"}
                      authorAvatarUrl={communityAuthorAvatars[t.user_id] ?? null}
                    />
                  </Link>
                ))}
              </div>
            ))}
          </div>
          {communityChunks.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {communityChunks.map((_: CommunityTextPreview[], i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToCommunitySlide(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === communitySlideIndex ? "bg-red w-4" : "bg-neutral-300"
                  }`}
                  aria-label={`Ir a slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {userId && (
        <>
          <SectionHeader
            title="Diccionario"
            linkLabel="Ver más"
            href="/inicio/comunidad#biblioteca-significados"
          />
          <div ref={diccionarioRef} id="diccionario" className="scroll-mt-4">
          <PalabraCard
            palabra={palabraActual}
            definicionActual={palabraActual ? definiciones[palabraActual.id] : undefined}
            onOtraPalabra={elegirPalabra}
            onPublicar={handlePublicarDefinicion}
            disabled={loadingDiccionario}
          />
          </div>
        </>
      )}
    </div>
  );
}
