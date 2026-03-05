"use client";

import {
  IconAvatarCircle,
  IconPhoto,
} from "@/components/ui/Icons";

export type CommunityTextCardData = {
  id: string;
  title: string;
  body: string;
  formato_id?: string | null;
  tematica?: string | null;
  formatos_texto?: { nombre: string }[] | null;
  image_url?: string | null;
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

function excerpt(body: string, max = 80): string {
  const t = body.trim();
  if (!t) return "";
  return t.length <= max ? t : t.slice(0, max).trim() + "…";
}

/** Card de comunidad: imagen izquierda, contenido a la derecha (tag, título, descripción, fecha, autor). */
export function CommunityTextCard({
  text,
  authorName,
  authorAvatarUrl,
  imageWidth = "w-28",
}: {
  text: CommunityTextCardData;
  authorName: string;
  authorAvatarUrl?: string | null;
  imageWidth?: "w-24" | "w-28" | "w-40";
}) {
  const displayTitle = text.title?.trim() || "Sin título";
  const formatoLabel = (
    text.formatos_texto?.[0]?.nombre ||
    text.tematica?.trim() ||
    "TEXTO"
  ).toUpperCase();
  const hasImage = Boolean(text.image_url?.trim());

  return (
    <div className="w-full h-32 bg-white rounded-xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.06)] overflow-hidden flex">
      <div className={`${imageWidth} h-32 shrink-0 bg-neutral-200 overflow-hidden`}>
        {hasImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={text.image_url!}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400" aria-hidden>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 p-2.5 pb-4 flex flex-col relative">
        <span className="text-orange-700 text-xs font-medium leading-tight shrink-0">
          {formatoLabel}
        </span>
        <span className="absolute top-2.5 right-2.5 text-neutral-400 text-[10px] font-normal leading-tight">
          {formatFecha(text.updated_at)}
        </span>
        <h3 className="text-black text-sm font-bold leading-tight mt-0.5 pr-14 shrink-0 line-clamp-1">
          {displayTitle}
        </h3>
        <div className="mt-0.5 h-[2.5rem] overflow-hidden shrink-0">
          <p className="text-black text-xs font-normal leading-tight line-clamp-2">
            {excerpt(text.body, 120)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-1 mb-1">
          <div className="relative shrink-0 w-5 h-5 rounded-full overflow-hidden bg-neutral-200 flex items-center justify-center">
            {authorAvatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={authorAvatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <IconAvatarCircle className="absolute inset-0 w-full h-full" />
                <span className="relative text-black">
                  <IconPhoto className="w-3 h-3" />
                </span>
              </>
            )}
          </div>
          <p className="text-black text-xs font-normal leading-tight min-w-0 truncate">
            Por <span className="font-semibold">{authorName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
