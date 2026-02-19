"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { IconChevronLeft, IconAvatarCircle, IconPhoto } from "@/components/ui/Icons";

type CommunityText = {
  id: string;
  title: string;
  body: string;
  tematica: string | null;
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

function excerpt(body: string, max = 80): string {
  const t = body.trim();
  if (!t) return "";
  return t.length <= max ? t : t.slice(0, max).trim() + "…";
}

function authorDisplayName(firstName: string | null, lastName: string | null): string {
  const n = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  return n || "un miembro";
}

function CommunityTextCard({
  text,
  authorName,
}: {
  text: CommunityText;
  authorName: string;
}) {
  const displayTitle = text.title?.trim() || "Sin título";
  const tematica = text.tematica?.toUpperCase() || "TEXTO";
  const imageUrl = text.image_url || "https://placehold.co/166x130";

  return (
    <div className="w-full bg-white rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col sm:flex-row">
      <div className="relative w-full sm:w-40 h-32 sm:h-40 shrink-0 bg-neutral-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex-1 min-w-0 flex flex-col">
        <span className="text-orange-700 text-sm font-normal leading-4">
          {tematica}
        </span>
        <h3 className="text-lg font-bold text-black leading-5 mt-1">
          {displayTitle}
        </h3>
        <p className="text-black text-sm font-normal leading-5 mt-1 line-clamp-2">
          {excerpt(text.body)}
        </p>
        <div className="mt-auto pt-3 flex items-center gap-2 flex-wrap">
          <div className="shrink-0 relative w-7 h-7 flex items-center justify-center">
            <IconAvatarCircle className="absolute inset-0 w-full h-full" />
            <span className="relative flex items-center justify-center text-black">
              <IconPhoto className="w-3 h-3" />
            </span>
          </div>
          <p className="text-black text-base leading-5">
            Por <span className="font-bold">{authorName}</span>
          </p>
        </div>
        <span className="text-neutral-400 text-xs leading-3 mt-1">
          {formatFecha(text.updated_at)}
        </span>
      </div>
    </div>
  );
}

export default function ComunidadPage() {
  const [texts, setTexts] = useState<CommunityText[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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
      const { data } = await supabase
        .from("texts")
        .select("id, title, body, tematica, image_url, updated_at, user_id")
        .eq("status", "published")
        .order("updated_at", { ascending: false });

      const rows = (data ?? []) as CommunityText[];
      setTexts(rows);

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
    })();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100">
      <Header
        title="Comunidad"
        leftSlot={
          <Link href="/inicio" className="p-2 -m-2 text-black" aria-label="Volver">
            <IconChevronLeft className="size-7" />
          </Link>
        }
      />
      <main className="flex-1 px-5 py-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-black leading-5">
            Textos de escritores que quieren ser leídos
          </h2>
          <button
            type="button"
            className="text-black text-lg font-normal leading-5"
            aria-label="Filtrar"
          >
            Filtrar
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-6 flex items-center justify-center">
            <p className="text-neutral-400 text-sm">Cargando...</p>
          </div>
        ) : texts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <p className="text-neutral-500 text-sm">
              Aún no hay textos de la comunidad con &quot;Quiero que me lean&quot; activado.
            </p>
            <Link
              href="/inicio"
              className="mt-3 text-orange-700 text-sm font-bold hover:underline"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {texts.map((t) => (
              <CommunityTextCard
                key={t.id}
                text={t}
                authorName={authorNames[t.user_id] ?? "un miembro"}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
