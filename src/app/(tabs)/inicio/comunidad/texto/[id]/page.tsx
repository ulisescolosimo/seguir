"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IconChevronLeft,
  IconAvatarCircle,
  IconPhoto,
  IconShare,
  IconBookmark,
  IconBookmarkFilled,
  IconComment,
  IconBrandX,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTikTok,
  IconLink,
} from "@/components/ui/Icons";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/components/ui/Toast";

type TextData = {
  id: string;
  title: string;
  body: string;
  tematica: string | null;
  formatos_texto: { nombre: string }[] | null;
  image_url: string | null;
  updated_at: string;
  published_at?: string | null;
  user_id: string;
};

type CommentData = {
  id: string;
  text_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
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

function formatFechaCorta(iso: string): string {
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

function authorDisplayName(firstName: string | null, lastName: string | null): string {
  const n = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  return n || "un miembro";
}

export default function TextoComunidadPage() {
  const params = useParams();
  const textId = params?.id as string | undefined;
  const { toast } = useToast();

  const [text, setText] = useState<TextData | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [authorAllowsComments, setAuthorAllowsComments] = useState(true);
  const [authorPublicComments, setAuthorPublicComments] = useState(true);
  const [authorAllowsShare, setAuthorAllowsShare] = useState(true);
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (!textId) {
      setLoading(false);
      setError("Falta el id del texto.");
      return;
    }
    const supabase = createClient();
    (async () => {
      try {
        const [{ data: { user } }, { data: textRow, error: textError }] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("texts")
            .select("id, title, body, tematica, formatos_texto(nombre), image_url, updated_at, published_at, user_id")
            .eq("id", textId)
            .eq("status", "published")
            .single(),
        ]);

        if (textError || !textRow) {
          setError("No se encontró el texto o no está publicado.");
          setLoading(false);
          return;
        }

        if (user) setCurrentUser({ id: user.id });

        const row = textRow as unknown as TextData;
        setText(row);

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, want_comments, public_comments, allow_share_texts, avatar_url")
          .eq("id", row.user_id)
          .single();

        setAuthorName(
          authorDisplayName(
            (profile?.first_name as string) ?? null,
            (profile?.last_name as string) ?? null
          )
        );
        setAuthorAllowsComments(profile?.want_comments === true);
        setAuthorPublicComments(profile?.public_comments !== false);
        setAuthorAllowsShare(profile?.allow_share_texts === true);
        setAuthorAvatarUrl(profile?.avatar_url?.trim() || null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar el texto.");
      } finally {
        setLoading(false);
      }
    })();
  }, [textId]);

  // Cargar si el usuario tiene guardado este texto
  useEffect(() => {
    if (!textId || !currentUser) {
      setIsSaved(false);
      return;
    }
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("saved_texts")
        .select("text_id")
        .eq("user_id", currentUser.id)
        .eq("text_id", textId)
        .maybeSingle();
      setIsSaved(!!data);
    })();
  }, [textId, currentUser]);

  const loadComments = useCallback(async () => {
    if (!textId) return;
    setLoadingComments(true);
    setCommentError(null);
    try {
      const supabase = createClient();
      const { data, error: commentsError } = await supabase
        .from("text_comments")
        .select("id, text_id, user_id, author_name, body, created_at")
        .eq("text_id", textId)
        .order("created_at", { ascending: true });

      if (commentsError) {
        setCommentError("No se pudieron cargar los comentarios.");
        setComments([]);
        return;
      }
      setComments((data as CommentData[]) ?? []);
    } catch {
      setCommentError("Error al cargar comentarios.");
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [textId]);

  useEffect(() => {
    if (!text) return;
    const canSeeComments = authorPublicComments || (currentUser && text.user_id === currentUser.id);
    if (canSeeComments) loadComments();
    else setComments([]);
  }, [text, authorPublicComments, currentUser, loadComments]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const body = newComment.trim();
    if (!body || !textId || !currentUser) return;
    setSubmittingComment(true);
    setCommentError(null);
    const supabase = createClient();
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", currentUser.id)
        .single();
      const authorNameStr = authorDisplayName(
        (profile?.first_name as string) ?? null,
        (profile?.last_name as string) ?? null
      );
      const { error: insertError } = await supabase.from("text_comments").insert({
        text_id: textId,
        user_id: currentUser.id,
        author_name: authorNameStr,
        body,
      });
      if (insertError) {
        setCommentError(insertError.message || "No se pudo publicar el comentario.");
        return;
      }
      setNewComment("");
      await loadComments();
    } catch {
      setCommentError("Error al publicar el comentario.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleToggleSave() {
    if (!textId || !currentUser || loadingSaved) return;
    setLoadingSaved(true);
    const supabase = createClient();
    try {
      if (isSaved) {
        await supabase.from("saved_texts").delete().eq("user_id", currentUser.id).eq("text_id", textId);
        setIsSaved(false);
      } else {
        await supabase.from("saved_texts").insert({ user_id: currentUser.id, text_id: textId });
        setIsSaved(true);
      }
    } catch {
      // mantener estado anterior en error
    } finally {
      setLoadingSaved(false);
    }
  }

  async function handleShare() {
    if (!authorAllowsShare || !textId || !text) return;
    setShowShareModal(true);
  }

  function getShareUrl(): string {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/cuento/${textId}`;
  }

  function getShareTitle(): string {
    return text?.title?.trim() || "Sin título";
  }

  async function copyShareLink() {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast("Enlace copiado", "success");
      setShowShareModal(false);
    } catch {
      toast("No se pudo copiar el enlace", "error");
    }
  }

  function shareToTwitter() {
    const url = getShareUrl();
    const title = getShareTitle();
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
    setShowShareModal(false);
  }

  function shareToFacebook() {
    const url = getShareUrl();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
    setShowShareModal(false);
  }

  async function shareToInstagram() {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setShowShareModal(false);
      toast("Enlace copiado. Pégalo en Instagram para compartir.", "success");
    } catch {
      toast("No se pudo copiar el enlace", "error");
    }
  }

  async function shareToTikTok() {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setShowShareModal(false);
      toast("Enlace copiado. Pégalo en TikTok para compartir.", "success");
    } catch {
      toast("No se pudo copiar el enlace", "error");
    }
  }

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
      />
      <div className="w-full h-0 border-t border-zinc-300 shrink-0" aria-hidden />

      <main className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 pb-8 max-w-lg mx-auto mb-4">
          {/* Imagen principal */}
          <div className="w-full aspect-[4/3] relative rounded-3xl bg-neutral-200 overflow-hidden">
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
            />
          </div>

          {/* Temática y fecha */}
          <div className="flex items-center justify-between mt-4 gap-4">
            <span className="text-orange-700 text-sm font-normal leading-4">
              {tematicaLabel}
            </span>
            <span className="text-neutral-400 text-sm font-normal leading-4">
              {formatFecha(text.updated_at)}
            </span>
          </div>

          {text.published_at && new Date(text.updated_at).getTime() > new Date(text.published_at).getTime() + 1000 && (
            <p className="mt-2 text-neutral-500 text-xs italic">
              Este texto fue editado después de publicarse.
            </p>
          )}

          {/* Título */}
          <h1 className="text-black text-2xl font-bold leading-7 mt-2">
            {displayTitle}
          </h1>

          {/* Autor + acciones */}
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
                <>
                  <IconAvatarCircle className="absolute inset-0 w-full h-full" />
                  <span className="relative text-black">
                    <IconPhoto className="w-4 h-4" />
                  </span>
                </>
              )}
            </div>
            <p className="text-black text-base font-normal leading-5 flex-1 min-w-0">
              Por{" "}
              <Link
                href={`/inicio/comunidad/usuario/${text.user_id}`}
                className="font-bold text-black hover:underline focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded"
              >
                {authorName}
              </Link>
            </p>
            <button
              type="button"
              onClick={handleShare}
              className={`p-2 -m-2 shrink-0 ${authorAllowsShare ? "text-black" : "text-neutral-300 cursor-not-allowed"}`}
              aria-label="Compartir"
              title={authorAllowsShare ? "Compartir" : "El autor no permite compartir este texto fuera de la comunidad"}
              disabled={!authorAllowsShare}
            >
              <IconShare className="size-5" />
            </button>
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={!currentUser || loadingSaved}
              className={`p-2 -m-2 shrink-0 ${isSaved ? "text-red" : "text-black"} ${!currentUser ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label={isSaved ? "Quitar de guardados" : "Guardar texto"}
              title={isSaved ? "Quitar de guardados" : "Guardar texto"}
            >
              {isSaved ? (
                <IconBookmarkFilled className="size-5" />
              ) : (
                <IconBookmark className="size-5" />
              )}
            </button>
          </div>

          {/* Cuerpo del texto */}
          <div className="mt-6 text-black text-xl font-normal leading-6 whitespace-pre-wrap font-serif">
            {text.body?.trim() || "Sin contenido."}
          </div>

          {/* Comentarios */}
          <h2 className="text-black text-lg font-bold leading-5 mt-10 mb-4 flex items-center gap-2">
            <IconComment className="size-5 text-neutral-500" aria-hidden />
            Comentarios
          </h2>

          {!authorAllowsComments && (
            <div className="bg-white rounded-2xl shadow-[0px_2px_4px_0px_rgba(0,0,0,0.07)] p-5 mb-2">
              <p className="text-neutral-500 text-sm">
                El autor no permite comentarios en este texto.
              </p>
            </div>
          )}

          {authorAllowsComments && !currentUser && (
            <div className="bg-white rounded-2xl shadow-[0px_2px_4px_0px_rgba(0,0,0,0.07)] p-5">
              <p className="text-neutral-500 text-sm">
                Inicia sesión para dejar un comentario.
              </p>
            </div>
          )}

          {authorAllowsComments && currentUser && (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe tu comentario..."
                rows={3}
                maxLength={2000}
                className="w-full rounded-2xl border border-zinc-300 bg-white p-4 text-black text-base placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                disabled={submittingComment}
                aria-label="Comentario"
              />
              {commentError && (
                <p className="mt-2 text-red text-sm">{commentError}</p>
              )}
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="mt-2 px-4 py-2 bg-orange-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? "Enviando..." : "Enviar comentario"}
              </button>
            </form>
          )}

          {(authorPublicComments || (currentUser && text.user_id === currentUser.id)) && (
            <div className="space-y-4">
              {loadingComments ? (
                <p className="text-neutral-400 text-sm">Cargando comentarios...</p>
              ) : comments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-[0px_2px_4px_0px_rgba(0,0,0,0.07)] p-5">
                  <p className="text-neutral-500 text-sm">
                    Aún no hay comentarios. ¡Sé el primero en comentar!
                  </p>
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl shadow-[0px_2px_4px_0px_rgba(0,0,0,0.07)] p-5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-black text-sm font-bold">
                        {c.author_name || "Un miembro"}
                      </span>
                      <span className="text-neutral-400 text-xs shrink-0">
                        {formatFechaCorta(c.created_at)}
                      </span>
                    </div>
                    <p className="text-black text-base leading-5 whitespace-pre-wrap">
                      {c.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {authorAllowsComments && authorPublicComments === false && currentUser?.id !== text.user_id && (
            <div className="bg-white rounded-2xl shadow-[0px_2px_4px_0px_rgba(0,0,0,0.07)] p-5 mt-4">
              <p className="text-neutral-500 text-sm">
                Los comentarios de este texto no son públicos.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Compartir */}
      {showShareModal && authorAllowsShare && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="share-modal-title" className="text-lg font-bold text-black mb-4">
              Compartir texto
            </h2>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={copyShareLink}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <IconLink className="size-6 text-neutral-600 shrink-0" />
                <span className="text-black text-sm font-medium">Copiar enlace</span>
              </button>
              <button
                type="button"
                onClick={shareToTwitter}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <IconBrandX className="size-6 shrink-0" />
                <span className="text-black text-sm font-medium">X (Twitter)</span>
              </button>
              <button
                type="button"
                onClick={shareToFacebook}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <IconBrandFacebook className="size-6 text-[#1877F2] shrink-0" />
                <span className="text-black text-sm font-medium">Facebook</span>
              </button>
              <button
                type="button"
                onClick={shareToInstagram}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <IconBrandInstagram className="size-6 text-[#E4405F] shrink-0" />
                <span className="text-black text-sm font-medium">Instagram</span>
              </button>
              <button
                type="button"
                onClick={shareToTikTok}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <IconBrandTikTok className="size-6 shrink-0" />
                <span className="text-black text-sm font-medium">TikTok</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full py-3 text-neutral-500 text-sm font-medium rounded-xl hover:bg-neutral-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
