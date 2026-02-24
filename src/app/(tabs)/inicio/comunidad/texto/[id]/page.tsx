"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IconChevronLeft,
  IconSearch,
  IconAvatarCircle,
  IconPhoto,
  IconShare,
  IconBookmark,
} from "@/components/ui/Icons";
import { Header } from "@/components/layout/Header";

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
  return n || "un miembro";
}

export default function TextoComunidadPage() {
  const params = useParams();
  const textId = params?.id as string | undefined;

  const [text, setText] = useState<TextData | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .select("first_name, last_name")
          .eq("id", row.user_id)
          .single();

        setAuthorName(
          authorDisplayName(
            (profile?.first_name as string) ?? null,
            (profile?.last_name as string) ?? null
          )
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar el texto.");
      } finally {
        setLoading(false);
      }
    })();
  }, [textId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-100">
        <Header
          title="Comunidad"
          leftSlot={
            <Link href="/inicio/comunidad" className="p-2 -m-2 text-black" aria-label="Volver">
              <IconChevronLeft className="size-7" />
            </Link>
          }
          rightSlot={
            <button type="button" className="p-2 -m-2 text-red" aria-label="Buscar">
              <IconSearch className="size-8" />
            </button>
          }
        />
        <main className="flex-1 flex items-center justify-center px-5">
          <p className="text-neutral-400 text-sm">Cargando...</p>
        </main>
      </div>
    );
  }

  if (error || !text) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-100">
        <Header
          title="Comunidad"
          leftSlot={
            <Link href="/inicio/comunidad" className="p-2 -m-2 text-black" aria-label="Volver">
              <IconChevronLeft className="size-7" />
            </Link>
          }
          rightSlot={
            <button type="button" className="p-2 -m-2 text-red" aria-label="Buscar">
              <IconSearch className="size-8" />
            </button>
          }
        />
        <main className="flex-1 px-5 py-6">
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-red text-sm">{error ?? "No se encontró el texto."}</p>
            <Link
              href="/inicio/comunidad"
              className="mt-3 inline-block text-orange-700 text-sm font-bold hover:underline"
            >
              Volver a Comunidad
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayTitle = text.title?.trim() || "Sin título";
  const tematicaLabel = (
    text.tematica?.trim() ||
    text.formatos_texto?.[0]?.nombre ||
    "TEXTO"
  ).toUpperCase();
  const imageUrl = text.image_url || "https://placehold.co/400x174";

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 overflow-hidden">
      <Header
        title="Comunidad"
        leftSlot={
          <Link href="/inicio/comunidad" className="p-2 -m-2 text-black" aria-label="Volver">
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
        <div className="px-5 py-4 pb-8 max-w-lg mx-auto mb-4">
          {/* Imagen principal */}
          <img
            src={imageUrl}
            alt=""
            className="w-full aspect-[4/3] object-cover rounded-3xl bg-neutral-200"
          />

          {/* Temática y fecha */}
          <div className="flex items-center justify-between mt-4 gap-4">
            <span className="text-orange-700 text-sm font-normal leading-4">
              {tematicaLabel}
            </span>
            <span className="text-neutral-400 text-sm font-normal leading-4">
              {formatFecha(text.updated_at)}
            </span>
          </div>

          {/* Título */}
          <h1 className="text-black text-2xl font-bold leading-7 mt-2">
            {displayTitle}
          </h1>

          {/* Autor + acciones */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative shrink-0 w-9 h-9 flex items-center justify-center">
              <IconAvatarCircle className="absolute inset-0 w-full h-full" />
              <span className="relative text-black">
                <IconPhoto className="w-4 h-4" />
              </span>
            </div>
            <p className="text-black text-base font-normal leading-5 flex-1 min-w-0">
              Por <span className="font-bold">{authorName}</span>
            </p>
            <button
              type="button"
              className="p-2 -m-2 text-black shrink-0"
              aria-label="Compartir"
            >
              <IconShare className="size-5" />
            </button>
            <button
              type="button"
              className="p-2 -m-2 text-black shrink-0"
              aria-label="Guardar"
            >
              <IconBookmark className="size-5" />
            </button>
          </div>

          {/* Cuerpo del texto */}
          <div className="mt-6 text-black text-xl font-normal leading-6 whitespace-pre-wrap font-serif">
            {text.body?.trim() || "Sin contenido."}
          </div>

          {/* Comentarios */}
          <h2 className="text-black text-lg font-bold leading-5 mt-10 mb-4">
            Comentarios
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-[0px_2px_4px_0px_rgba(0,0,0,0.07)] p-5">
              <p className="text-neutral-500 text-sm">
                Aún no hay comentarios. Cuando esté disponible la funcionalidad, podrás ver y escribir comentarios aquí.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
