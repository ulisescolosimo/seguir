"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconShare } from "@/components/ui/Icons";

type TextData = {
  id: string;
  title: string;
  body: string;
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
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function authorDisplayName(firstName: string | null, lastName: string | null): string {
  const n = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  return n || "Un autor";
}

export default function CuentoPublicPage() {
  const params = useParams();
  const textId = params?.id as string | undefined;

  const [text, setText] = useState<TextData | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!textId) {
      setLoading(false);
      setError("Falta el id del texto.");
      return;
    }
    const supabase = createClient();
    (async () => {
      try {
        const { data: textRow, error: textError } = await supabase
          .from("texts")
          .select("id, title, body, tematica, formatos_texto(nombre), image_url, updated_at, user_id")
          .eq("id", textId)
          .eq("status", "published")
          .single();

        if (textError || !textRow) {
          setError("No se encontró el texto o no está publicado.");
          setLoading(false);
          return;
        }

        const row = textRow as unknown as TextData;
        setText(row);

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, avatar_url")
          .eq("id", row.user_id)
          .single();

        setAuthorName(
          authorDisplayName(
            (profile?.first_name as string) ?? null,
            (profile?.last_name as string) ?? null
          )
        );
        setAuthorAvatarUrl(profile?.avatar_url?.trim() || null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar el texto.");
      } finally {
        setLoading(false);
      }
    })();
  }, [textId]);

  async function handleShare() {
    if (!textId || !text) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/cuento/${textId}`;
    const title = text.title?.trim() || "Sin título";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          await copyToClipboard(url);
        }
      }
    } else {
      await copyToClipboard(url);
    }
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-100">
        <header className="h-14 flex items-center justify-center border-b border-neutral-200 bg-neutral-100 shrink-0">
          <Link href="/login" className="text-lg font-semibold text-neutral-900">
            Seguir
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-5">
          <p className="text-neutral-400 text-sm">Cargando...</p>
        </main>
      </div>
    );
  }

  if (error || !text) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-100">
        <header className="h-14 flex items-center justify-center border-b border-neutral-200 bg-neutral-100 shrink-0">
          <Link href="/login" className="text-lg font-semibold text-neutral-900">
            Seguir
          </Link>
        </header>
        <main className="flex-1 px-5 py-6">
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-red text-sm">{error ?? "No se encontró el texto."}</p>
            <Link
              href="/login"
              className="mt-3 inline-block text-orange-700 text-sm font-bold hover:underline"
            >
              Ir a Seguir
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayTitle = text.title?.trim() || "Sin título";
  const tematicaLabel = (
    text.tematica?.trim() ||
    (Array.isArray(text.formatos_texto) ? text.formatos_texto?.[0]?.nombre : null) ||
    "TEXTO"
  ).toUpperCase();
  const imageUrl = text.image_url || "https://placehold.co/400x174";

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 overflow-hidden">
      <header className="h-14 flex items-center justify-between px-4 border-b border-neutral-200 bg-neutral-100 shrink-0">
        <Link href="/login" className="text-lg font-semibold text-neutral-900">
          Seguir
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="p-2 -m-2 text-black shrink-0"
          aria-label="Compartir"
          title="Compartir"
        >
          <IconShare className="size-5" />
        </button>
      </header>
      {shareCopied && (
        <p className="text-center py-2 text-green-600 text-sm font-medium bg-green-50" role="status">
          Link copiado
        </p>
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 pb-8 max-w-lg mx-auto mb-4">
          <img
            src={imageUrl}
            alt=""
            className="w-full aspect-[4/3] object-cover rounded-3xl bg-neutral-200"
          />

          <div className="flex items-center justify-between mt-4 gap-4">
            <span className="text-orange-700 text-sm font-normal leading-4">
              {tematicaLabel}
            </span>
            <span className="text-neutral-400 text-sm font-normal leading-4">
              {formatFecha(text.updated_at)}
            </span>
          </div>

          <h1 className="text-black text-2xl font-bold leading-7 mt-2">
            {displayTitle}
          </h1>

          <div className="flex items-center gap-3 mt-4">
            <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden bg-neutral-200 flex items-center justify-center">
              {authorAvatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={authorAvatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-neutral-500 text-sm font-medium">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-black text-base font-normal leading-5 flex-1 min-w-0">
              Por <span className="font-bold">{authorName}</span>
            </p>
          </div>

          <div className="mt-6 text-black text-xl font-normal leading-6 whitespace-pre-wrap font-serif">
            {text.body?.trim() || "Sin contenido."}
          </div>

          <div className="mt-10 pt-6 border-t border-neutral-200 text-center">
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 bg-orange-700 text-white text-sm font-bold rounded-xl hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              Ver más en Seguir
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
