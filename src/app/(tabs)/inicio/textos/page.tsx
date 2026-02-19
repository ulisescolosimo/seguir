"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { IconChevronLeft } from "@/components/ui/Icons";

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

function TextCard({
  id,
  title,
  body,
  updated_at,
  status,
}: {
  id: string;
  title: string;
  body: string;
  updated_at: string;
  status: "draft" | "published";
}) {
  const displayTitle = title.trim() || "Sin título";
  return (
    <div className="flex flex-col bg-white rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 shrink-0">
        <h3 className="text-lg font-bold text-black leading-5">{displayTitle}</h3>
        <span className="text-neutral-400 text-xs leading-3">
          Última edición {formatFecha(updated_at)}
        </span>
      </div>
      <p className="text-black text-sm font-normal leading-5 mt-2 line-clamp-2 overflow-hidden">
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

export default function MisTextosPage() {
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

  const drafts = texts.filter((t) => t.status === "draft");
  const published = texts.filter((t) => t.status === "published");

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100">
      <Header
        title="Mis textos"
        leftSlot={
          <Link href="/inicio" className="p-2 -m-2 text-black" aria-label="Volver">
            <IconChevronLeft className="size-7" />
          </Link>
        }
      />
      <main className="flex-1 px-5 py-6 pb-8">
        {loading ? (
          <div className="bg-white rounded-2xl p-4 flex items-center py-8">
            <p className="text-neutral-400 text-sm">Cargando...</p>
          </div>
        ) : texts.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center py-8">
            <p className="text-neutral-400 text-sm">No tenés textos aún.</p>
            <Link
              href="/escribir/editar"
              className="mt-3 text-red text-sm font-bold hover:underline"
            >
              Escribir desde cero
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {drafts.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-black leading-5 mb-3">
                  Borradores
                </h2>
                <div className="space-y-4">
                  {drafts.map((t) => (
                    <TextCard
                      key={t.id}
                      id={t.id}
                      title={t.title}
                      body={t.body}
                      updated_at={t.updated_at}
                      status={t.status}
                    />
                  ))}
                </div>
              </section>
            )}
            {published.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-black leading-5 mb-3">
                  Publicados
                </h2>
                <div className="space-y-4">
                  {published.map((t) => (
                    <TextCard
                      key={t.id}
                      id={t.id}
                      title={t.title}
                      body={t.body}
                      updated_at={t.updated_at}
                      status={t.status}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
