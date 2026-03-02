"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPalabrasDiccionario,
  fetchMisDefiniciones,
  getPalabraDelDia,
} from "@/lib/diccionario";
import { loadOnboardingPrefs } from "@/lib/onboardingPrefs";
import { maybeCreateReminderNotification } from "@/lib/notifications";
import type { PalabraDiccionario } from "@/types/diccionario";
import { CommunityTextCard } from "@/components/community/CommunityTextCard";
import type { CommunityTextCardData } from "@/components/community/CommunityTextCard";
import {
  IconAvatarCircle,
  IconPhoto,
  IconPalabraHeart,
  IconEscribirDesdeCero,
  IconNavConsignas,
  IconInfo,
} from "@/components/ui/Icons";
import { UnifiedTabHeader } from "@/components/layout/UnifiedTabHeader";

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
  onInfoClick,
}: {
  title: string;
  linkLabel?: string;
  href?: string;
  onInfoClick?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5 min-w-0">
        <h2 className="text-lg font-bold text-black leading-5">{title}</h2>
        {onInfoClick && (
          <button
            type="button"
            onClick={onInfoClick}
            className="shrink-0 p-0.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-red/30 focus:ring-offset-1"
            aria-label="Más información"
          >
            <IconInfo className="w-5 h-5 shrink-0" />
          </button>
        )}
      </div>
      <Link href={href} className="text-red text-base leading-5 shrink-0">
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
  const href = status === "published" ? `/inicio/comunidad/texto/${id}` : `/escribir/editar?id=${id}`;
  return (
    <Link
      href={href}
      className={`flex flex-col bg-white rounded-2xl p-4 block ${className}`}
      aria-label={status === "draft" ? `Editar: ${displayTitle}` : `Ver texto: ${displayTitle}`}
    >
      <div className="flex flex-col gap-0.5 flex-1 min-h-0 overflow-hidden pb-2">
        <span className="text-neutral-400 text-xs leading-3 shrink-0 pb-2">
          Última edición {formatFecha(updated_at)}
        </span>
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
          <span className="h-10 px-5 bg-red text-white text-sm font-bold leading-4 rounded-[47px] inline-flex items-center justify-center">
            Seguir escribiendo
          </span>
        )}
      </div>
    </Link>
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

export default function InicioPage() {
  const [texts, setTexts] = useState<TextRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Comunidad: textos publicados de otros
  const [communityTexts, setCommunityTexts] = useState<CommunityTextPreview[]>([]);
  const [communityAuthorNames, setCommunityAuthorNames] = useState<Record<string, string>>({});
  const [communityAuthorAvatars, setCommunityAuthorAvatars] = useState<Record<string, string>>({});
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  // Palabra del día: una por día, solo si el usuario aún no la definió
  const [palabras, setPalabras] = useState<PalabraDiccionario[]>([]);
  const [definiciones, setDefiniciones] = useState<Record<string, { definicion?: string }>>({});
  const [palabraDelDia, setPalabraDelDia] = useState<PalabraDiccionario | null>(null);
  const [loadingDiccionario, setLoadingDiccionario] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showDiccionarioModal, setShowDiccionarioModal] = useState(false);
  const [showPalabraDelDiaPopup, setShowPalabraDelDiaPopup] = useState(false);

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
      const [textsData, palabrasData, defsData, prefs] = await Promise.all([
        supabase
          .from("texts")
          .select("id, title, body, status, updated_at, consigna_id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
        fetchPalabrasDiccionario().catch(() => []),
        fetchMisDefiniciones(user.id).catch(() => ({})),
        loadOnboardingPrefs(supabase),
      ]);
      setTexts((textsData.data as TextRecord[]) ?? []);
      setPalabras(palabrasData);
      setDefiniciones(defsData);
      setPalabraDelDia(getPalabraDelDia(palabrasData));
      setLoading(false);
      setLoadingDiccionario(false);
      if (prefs) {
        if (prefs.remindersPerWeek) {
          maybeCreateReminderNotification(supabase, prefs.remindersPerWeek).catch(() => {});
        }
      }

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

  // Popup invitación palabra del día: solo primera vez en el día si no la definió
  const PALABRA_POPUP_KEY = "seguir-inicio-palabra-popup-date";
  useEffect(() => {
    if (loadingDiccionario || !userId || !palabraDelDia) return;
    const tieneDefinicion = !!definiciones[palabraDelDia.id]?.definicion?.trim();
    if (tieneDefinicion) return;
    const hoy = new Date().toISOString().slice(0, 10);
    try {
      const ultimoPopup = typeof window !== "undefined" ? localStorage.getItem(PALABRA_POPUP_KEY) : null;
      if (ultimoPopup === hoy) return; // ya mostramos hoy
      setShowPalabraDelDiaPopup(true);
    } catch {
      setShowPalabraDelDiaPopup(true);
    }
  }, [loadingDiccionario, userId, palabraDelDia, definiciones]);

  const closePalabraDelDiaPopup = () => {
    setShowPalabraDelDiaPopup(false);
    try {
      localStorage.setItem(PALABRA_POPUP_KEY, new Date().toISOString().slice(0, 10));
    } catch {}
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
    <>
      <UnifiedTabHeader title="Inicio" />
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

      <div className="flex flex-col gap-3 mb-6">
        <Link
          href="/escribir/editar"
          className="flex items-center justify-center gap-2 w-full py-3.5 px-5 bg-red text-white text-base font-bold leading-5 rounded-[47px] hover:bg-red/90 active:bg-red/80 transition-colors shadow-[0px_2px_8px_0px_rgba(207,54,23,0.35)]"
        >
          <IconEscribirDesdeCero className="w-[18px] h-[18px] shrink-0" />
          Escribir desde cero
        </Link>
        <Link
          href="/consignas"
          className="flex items-center justify-center gap-2 w-full py-3.5 px-5 bg-red text-white text-base font-bold leading-5 rounded-[47px] hover:bg-red/90 active:bg-red/80 transition-colors shadow-[0px_2px_8px_0px_rgba(207,54,23,0.35)]"
        >
          <IconNavConsignas className="w-[18px] h-[18px] shrink-0" />
          Escribir con consignas
        </Link>
      </div>

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
            href="/inicio/diccionario"
            onInfoClick={() => setShowDiccionarioModal(true)}
          />
          {showDiccionarioModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-diccionario-title"
              onClick={() => setShowDiccionarioModal(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5 flex-1 overflow-y-auto">
                  <h2 id="modal-diccionario-title" className="text-lg font-bold text-black leading-5 mb-3">
                    Diccionario
                  </h2>
                  <p className="text-black text-sm leading-6">
                    El diccionario es un espacio donde la comunidad comparte el significado personal de diferentes palabras. No se trata de acertar una definición &quot;correcta&quot; sino de construir desde la propia mirada. Cada día hay una palabra nueva para definir y siempre podés ver y buscar todas las que ya tienen múltiples significados.
                  </p>
                </div>
              </div>
            </div>
          )}
          {showPalabraDelDiaPopup && palabraDelDia && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-palabra-dia-title"
              onClick={closePalabraDelDiaPopup}
            >
              <div
                className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5">
                  <div className="w-12 h-12 rounded-2xl bg-red/20 flex items-center justify-center text-red mb-4">
                    <IconPalabraHeart className="w-6 h-6" />
                  </div>
                  <h2 id="modal-palabra-dia-title" className="text-lg font-bold text-black leading-5 mb-2">
                    La palabra del día: {palabraDelDia.palabra}
                  </h2>
                  <p className="text-black text-sm leading-6 mb-5">
                    ¿Qué significa para vos? Definila con tu propia mirada y sumala al diccionario de la comunidad.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/inicio/definir"
                      onClick={closePalabraDelDiaPopup}
                      className="flex items-center justify-center gap-2 w-full py-3.5 px-5 bg-red text-white text-base font-bold leading-5 rounded-[47px] hover:bg-red/90 active:bg-red/80 transition-colors"
                    >
                      Definir palabra
                    </Link>
                    <button
                      type="button"
                      onClick={closePalabraDelDiaPopup}
                      className="text-neutral-500 text-sm font-medium hover:text-neutral-700"
                    >
                      Ahora no
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div id="diccionario" className="scroll-mt-4">
            {loadingDiccionario ? (
              <div className="bg-red-50 rounded-2xl p-4 mb-4">
                <p className="text-neutral-500 text-sm">Cargando...</p>
              </div>
            ) : palabraDelDia && !definiciones[palabraDelDia.id]?.definicion?.trim() ? (
              <Link
                href="/inicio/definir"
                className="block bg-red-50 rounded-2xl p-4 mb-4 hover:bg-red-50/90 active:bg-red-100/50 transition-colors"
                aria-label={`Definir la palabra del día: ${palabraDelDia.palabra}`}
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red/20 flex items-center justify-center shrink-0 text-red">
                    <IconPalabraHeart className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-black leading-5">
                      La palabra del día: {palabraDelDia.palabra}
                    </h3>
                    <p className="text-black text-sm font-normal leading-5 mt-1">
                      Escribí qué significa para vos.
                    </p>
                    <span className="inline-block mt-3 text-red text-sm font-bold">
                      Definir →
                    </span>
                  </div>
                </div>
              </Link>
            ) : palabraDelDia ? (
              <div className="bg-white rounded-2xl p-5 mb-4 border border-neutral-200/80 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]">
                <p className="text-neutral-600 text-sm leading-6">
                  Hoy ya definiste <span className="font-bold text-black">&quot;{palabraDelDia.palabra}&quot;</span>. Mañana hay otra.
                </p>
                <Link
                  href="/inicio/diccionario"
                  className="mt-4 inline-flex h-10 items-center justify-center px-5 rounded-[47px] bg-neutral-100 text-black text-sm font-bold hover:bg-neutral-200/80 active:bg-neutral-200 transition-colors"
                >
                  Ver diccionario
                </Link>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
    </>
  );
}
