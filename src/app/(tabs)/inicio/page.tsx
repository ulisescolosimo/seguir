"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
  className = "",
}: {
  id: string;
  title: string;
  body: string;
  updated_at: string;
  status: "draft" | "published";
  className?: string;
}) {
  const displayTitle = title.trim() || "Sin título";
  return (
    <div className={`h-[220px] flex flex-col bg-white rounded-2xl p-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 shrink-0">
        <h3 className="text-lg font-bold text-black leading-5">{displayTitle}</h3>
        <span className="text-neutral-400 text-xs leading-3">
          Última edición {formatFecha(updated_at)}
        </span>
      </div>
      <p className="text-black text-sm font-normal leading-5 mt-2 line-clamp-2 flex-1 min-h-0 overflow-hidden">
        {excerpt(body) || "Sin contenido aún."}
      </p>
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
}: {
  id: string;
  title: string;
  status: "draft" | "published";
  isOwn: boolean;
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
              Por <span className="font-bold">Autor</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function PalabraCard() {
  return (
    <div className="bg-red-50 rounded-2xl p-4 mb-4">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-2xl bg-red/20 flex items-center justify-center shrink-0 text-red">
          <IconPalabraHeart className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-black leading-5">Amor</h3>
          <p className="text-black text-sm font-normal leading-5 mt-1">
            Escribí qué significa para vos.
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl h-12 px-4 flex items-center mt-4">
        <span className="text-neutral-400 text-sm leading-4">Definir palabra...</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        <button
          type="button"
          className="flex items-center gap-2 text-red text-xs font-medium uppercase leading-4"
        >
          <IconOtraPalabra className="w-5 h-5" />
          Otra palabra
        </button>
        <button
          type="button"
          className="h-10 px-6 bg-red text-white text-sm font-bold leading-4 tracking-wider rounded-[47px] hover:bg-red/90 transition-colors"
        >
          PUBLICAR
        </button>
      </div>
    </div>
  );
}

export default function InicioPage() {
  const [texts, setTexts] = useState<TextRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTexts([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("texts")
        .select("id, title, body, status, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      setTexts((data as TextRecord[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [slideIndex, setSlideIndex] = useState(0);

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
      ) : null}

      <Link
        href="/escribir/editar"
        className="flex items-center justify-center gap-2 py-3 mb-6 text-red text-base font-bold leading-5"
      >
        <IconEscribirDesdeCero className="w-[18px] h-[18px] shrink-0" />
        Escribir desde cero
      </Link>

      <SectionHeader title="Comunidad" href="/inicio/comunidad" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <TextCardSmall
          id=""
          title="El susurro del viento"
          status="published"
          isOwn={false}
        />
        <TextCardSmall
          id=""
          title="Otro texto"
          status="published"
          isOwn={false}
        />
      </div>

      <PalabraCard />
    </div>
  );
}
