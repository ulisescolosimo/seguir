"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { IconChevronLeft } from "@/components/ui/Icons";
import { CommunityTextCard } from "@/components/community/CommunityTextCard";

type TextRecord = {
  id: string;
  title: string;
  body: string;
  status: "draft" | "published";
  updated_at: string;
  formato_id?: string | null;
  tematica?: string | null;
  formatos_texto?: { nombre: string }[] | null;
  image_url?: string | null;
  user_id?: string;
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
  const href = status === "published" ? `/inicio/comunidad/texto/${id}` : `/escribir/editar?id=${id}`;
  return (
    <Link
      href={href}
      className="flex flex-col bg-white rounded-2xl p-4 block"
      aria-label={status === "draft" ? `Editar: ${displayTitle}` : `Ver texto: ${displayTitle}`}
    >
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
          <span className="h-10 px-5 bg-red text-white text-sm font-bold leading-4 rounded-[47px] inline-flex items-center justify-center">
            Seguir escribiendo
          </span>
        )}
      </div>
    </Link>
  );
}

export default function MisTextosPage() {
  const router = useRouter();
  const [texts, setTexts] = useState<TextRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState<string>("");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(null);
  const [editPublishedId, setEditPublishedId] = useState<string | null>(null);

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
        .select("id, title, body, status, updated_at, formato_id, tematica, formatos_texto(nombre), image_url, user_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      const rows = (data ?? []).map((r) => ({ ...r, user_id: user.id })) as TextRecord[];
      setTexts(rows);

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (profile) {
        const name = [profile.first_name?.trim(), profile.last_name?.trim()].filter(Boolean).join(" ");
        setAuthorName(name || "Vos");
        setAuthorAvatarUrl(profile.avatar_url?.trim() || null);
      } else {
        setAuthorName("Vos");
      }
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
            <div className="mt-3 flex flex-col items-center gap-2">
              <Link
                href="/escribir/editar"
                className="text-red text-sm font-bold hover:underline"
              >
                Escribir desde cero
              </Link>
              <Link
                href="/consignas"
                className="text-red text-sm font-bold hover:underline"
              >
                Escribir con consigna
              </Link>
            </div>
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
                <div className="space-y-3">
                  {published.map((t) => (
                    <div key={t.id}>
                      <Link
                        href={`/inicio/comunidad/texto/${t.id}`}
                        className="block"
                        aria-label={`Ver texto: ${t.title?.trim() || "Sin título"}`}
                      >
                        <CommunityTextCard
                          text={{
                            id: t.id,
                            title: t.title,
                            body: t.body,
                            updated_at: t.updated_at,
                            user_id: t.user_id ?? "",
                            formato_id: t.formato_id ?? null,
                            tematica: t.tematica ?? null,
                            formatos_texto: t.formatos_texto ?? null,
                            image_url: t.image_url ?? null,
                          }}
                          authorName={authorName}
                          authorAvatarUrl={authorAvatarUrl}
                        />
                      </Link>
                      <div className="flex justify-end mt-1.5 px-0.5">
                        <button
                          type="button"
                          onClick={() => setEditPublishedId(t.id)}
                          className="text-red text-xs font-bold hover:underline"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Modal: aviso al editar un texto publicado */}
      {editPublishedId && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editar-publicado-modal-title"
          onClick={() => setEditPublishedId(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="editar-publicado-modal-title" className="text-lg font-bold text-black mb-3">
              Editar texto publicado
            </h2>
            <p className="text-neutral-600 text-sm leading-5 mb-6">
              Si editás este texto, se mostrará la leyenda <strong>«Este texto fue editado después de publicarse»</strong> para que los lectores lo sepan. ¿Querés continuar?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditPublishedId(null)}
                className="flex-1 py-3 rounded-xl border border-zinc-200 text-black text-sm font-semibold hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = editPublishedId;
                  setEditPublishedId(null);
                  router.push(`/escribir/editar?id=${id}`);
                }}
                className="flex-1 py-3 rounded-xl bg-red text-white text-sm font-bold hover:bg-red/90"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
