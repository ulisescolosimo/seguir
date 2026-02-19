"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import {
  IconChevronLeft,
  IconEdit,
  IconSave,
  IconNavRecursos,
  IconSparklesAI,
  IconRefresh,
} from "@/components/ui/Icons";

const PREGUNTAS_INICIALES = [
  "¿Cuál es el miedo oculto del personaje?",
  "¿Qué está en juego en esta escena?",
  "¿Cómo se siente el personaje en este momento?",
];

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function EditarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const textId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showIABox, setShowIABox] = useState(true);
  const [showIAPanel, setShowIAPanel] = useState(false);
  const [showConfirmarPublicar, setShowConfirmarPublicar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [preguntas, setPreguntas] = useState<string[]>(PREGUNTAS_INICIALES);
  const [preguntasLoading, setPreguntasLoading] = useState(false);
  const [preguntasError, setPreguntasError] = useState<string | null>(null);
  const words = useMemo(() => countWords(body), [body]);

  async function fetchPreguntas(regenerarIndex?: number) {
    setPreguntasError(null);
    setPreguntasLoading(true);
    try {
      const res = await fetch("/api/preguntas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: body,
          ...(regenerarIndex != null && { regenerarIndex }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al generar preguntas");
      if (regenerarIndex != null && Array.isArray(data.preguntas) && data.preguntas[0]) {
        setPreguntas((prev) => {
          const next = [...prev];
          next[regenerarIndex] = data.preguntas[0];
          return next;
        });
      } else if (Array.isArray(data.preguntas) && data.preguntas.length > 0) {
        setPreguntas(data.preguntas);
      }
    } catch (err) {
      setPreguntasError(err instanceof Error ? err.message : "Error al generar preguntas");
    } finally {
      setPreguntasLoading(false);
    }
  }

  function handleRegenerarPregunta(index: number) {
    fetchPreguntas(index);
  }

  // Generar preguntas cuando se abre el panel de IA
  useEffect(() => {
    if (showIAPanel) fetchPreguntas();
  }, [showIAPanel]);

  // Cargar borrador cuando hay id en la URL
  useEffect(() => {
    if (!textId) return;
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase
        .from("texts")
        .select("title, body")
        .eq("id", textId)
        .single();
      if (!error && data) {
        setTitle(data.title ?? "");
        setBody(data.body ?? "");
      }
    })();
  }, [textId]);

  async function handleGuardar() {
    setSaveError(null);
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaveError("Tenés que iniciar sesión para guardar.");
      setSaving(false);
      return;
    }

    const payload = {
      title: title.trim() || "Sin título",
      body: body.trim(),
      status: "draft" as const,
    };

    if (textId) {
      const { error } = await supabase
        .from("texts")
        .update(payload)
        .eq("id", textId)
        .eq("user_id", user.id);
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("texts")
        .insert({ ...payload, user_id: user.id })
        .select("id")
        .single();
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
      // Redirigir a la misma página con el nuevo id para que el próximo guardado actualice
      if (data?.id) router.replace(`/escribir/editar?id=${data.id}`);
    }

    setSaving(false);
    router.back();
  }

  function handlePublicar() {
    setShowConfirmarPublicar(true);
  }

  function handleConfirmarPublicar() {
    setShowConfirmarPublicar(false);
    const target = textId ? `/escribir/publicar?id=${textId}` : "/escribir/publicar";
    router.push(target);
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100">
      <Header
        title={title.trim() || "Sin título"}
        leftSlot={
          <Link href="/inicio" className="p-2 -m-2 text-black" aria-label="Volver">
            <IconChevronLeft className="size-7" />
          </Link>
        }
        rightSlot={
          <button type="button" className="p-1 text-red" aria-label="Editar">
            <IconEdit className="size-6" />
          </button>
        }
      />
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto py-4 pb-8 px-4">
        {/* Título editable */}
        <div className="shrink-0 w-full mb-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-black text-2xl font-bold leading-7 bg-transparent border-0 focus:outline-none placeholder:text-neutral-400"
            placeholder="Título"
          />
        </div>
        {/* Área de texto: altura mínima generosa, página con scroll */}
        <div className="w-full shrink-0">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full min-h-[50vh] text-black text-xl font-normal leading-6 bg-transparent resize-y focus:outline-none overflow-y-auto py-0 border-0"
            placeholder="Escribí acá..."
          />
        </div>

        <div className="shrink-0 border-t border-neutral-200 py-">
          <p className="text-center pt-2 text-neutral-400 text-sm font-normal uppercase leading-4">
            {words} palabras
          </p>
        </div>

        {/* Mensaje intro "La IA te hace preguntas...": se puede cerrar; al cerrar queda solo el botón IA */}
        {showIABox && (
          <div className="shrink-0 mt-4 p-4 bg-red/10 rounded-xl border border-red flex gap-3">
            <div className="shrink-0 text-red">
              <IconNavRecursos className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-red text-sm font-bold leading-4">
                La IA te hace preguntas para seguir
              </p>
              <p className="text-black text-xs font-normal leading-4 mt-1">
                Recordá que no responde ni escribe por vos
              </p>
              <p className="text-neutral-600 text-xs font-normal leading-4 mt-0.5">
                Entrenada por escritores reales para destrabar tu escritura
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIABox(false)}
              className="shrink-0 p-1 text-neutral-400 hover:text-black"
              aria-label="Cerrar"
            >
              <svg width="17" height="17" viewBox="0 0 17 17" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.5 10.0031L12.2563 13.7594C12.4556 13.9587 12.726 14.0707 13.0078 14.0707C13.2897 14.0707 13.5601 13.9587 13.7594 13.7594C13.9587 13.5601 14.0707 13.2897 14.0707 13.0079C14.0707 12.726 13.9587 12.4556 13.7594 12.2563L10.0017 8.50002L13.7587 4.74373C13.8573 4.64503 13.9356 4.52787 13.9889 4.39894C14.0423 4.27001 14.0698 4.13183 14.0697 3.99229C14.0697 3.85275 14.0422 3.71458 13.9887 3.58567C13.9353 3.45676 13.857 3.33964 13.7583 3.241C13.6596 3.14235 13.5425 3.06411 13.4135 3.01074C13.2846 2.95737 13.1464 2.92991 13.0069 2.92995C12.8673 2.92998 12.7292 2.9575 12.6003 3.01093C12.4714 3.06436 12.3542 3.14266 12.2556 3.24135L8.5 6.99764L4.74371 3.24135C4.64575 3.13983 4.52855 3.05883 4.39894 3.00308C4.26934 2.94734 4.12993 2.91796 3.98886 2.91667C3.84778 2.91538 3.70786 2.9422 3.57726 2.99556C3.44665 3.04892 3.32799 3.12776 3.22818 3.22747C3.12837 3.32718 3.04942 3.44578 2.99594 3.57633C2.94245 3.70688 2.9155 3.84678 2.91666 3.98785C2.91782 4.12893 2.94706 4.26837 3.00269 4.39802C3.05831 4.52768 3.1392 4.64496 3.24063 4.74302L6.99834 8.50002L3.24134 12.257C3.13991 12.3551 3.05902 12.4724 3.0034 12.602C2.94777 12.7317 2.91853 12.8711 2.91737 13.0122C2.91621 13.1533 2.94316 13.2932 2.99665 13.4237C3.05013 13.5543 3.12908 13.6728 3.22889 13.7726C3.3287 13.8723 3.44736 13.9511 3.57796 14.0045C3.70857 14.0578 3.84849 14.0847 3.98956 14.0834C4.13064 14.0821 4.27005 14.0527 4.39965 13.997C4.52925 13.9412 4.64646 13.8602 4.74442 13.7587L8.5 10.0031Z"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Icono IA: siempre visible cuando el mensaje está cerrado; click abre el panel de preguntas */}
        {!showIABox && (
          <div className="shrink-0 mt-4 flex justify-end pb-2">
            <button
              type="button"
              onClick={() => setShowIAPanel(true)}
              className="w-10 h-10 rounded-2xl bg-red flex items-center justify-center text-white hover:bg-red/90 transition-colors"
              aria-label="Generar preguntas con IA"
            >
              <IconSparklesAI className="size-5" />
            </button>
          </div>
        )}

        {/* Panel de preguntas IA (al clickear el icono sparkles) */}
        {showIAPanel && (
          <div className="shrink-0 mt-4 p-4 bg-white rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] relative">
            <button
              type="button"
              onClick={() => setShowIAPanel(false)}
              className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-black"
              aria-label="Cerrar"
            >
              <svg width="17" height="17" viewBox="0 0 17 17" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.5 10.0031L12.2563 13.7594C12.4556 13.9587 12.726 14.0707 13.0078 14.0707C13.2897 14.0707 13.5601 13.9587 13.7594 13.7594C13.9587 13.5601 14.0707 13.2897 14.0707 13.0079C14.0707 12.726 13.9587 12.4556 13.7594 12.2563L10.0017 8.50002L13.7587 4.74373C13.8573 4.64503 13.9356 4.52787 13.9889 4.39894C14.0423 4.27001 14.0698 4.13183 14.0697 3.99229C14.0697 3.85275 14.0422 3.71458 13.9887 3.58567C13.9353 3.45676 13.857 3.33964 13.7583 3.241C13.6596 3.14235 13.5425 3.06411 13.4135 3.01074C13.2846 2.95737 13.1464 2.92991 13.0069 2.92995C12.8673 2.92998 12.7292 2.9575 12.6003 3.01093C12.4714 3.06436 12.3542 3.14266 12.2556 3.24135L8.5 6.99764L4.74371 3.24135C4.64575 3.13983 4.52855 3.05883 4.39894 3.00308C4.26934 2.94734 4.12993 2.91796 3.98886 2.91667C3.84778 2.91538 3.70786 2.9422 3.57726 2.99556C3.44665 3.04892 3.32799 3.12776 3.22818 3.22747C3.12837 3.32718 3.04942 3.44578 2.99594 3.57633C2.94245 3.70688 2.9155 3.84678 2.91666 3.98785C2.91782 4.12893 2.94706 4.26837 3.00269 4.39802C3.05831 4.52768 3.1392 4.64496 3.24063 4.74302L6.99834 8.50002L3.24134 12.257C3.13991 12.3551 3.05902 12.4724 3.0034 12.602C2.94777 12.7317 2.91853 12.8711 2.91737 13.0122C2.91621 13.1533 2.94316 13.2932 2.99665 13.4237C3.05013 13.5543 3.12908 13.6728 3.22889 13.7726C3.3287 13.8723 3.44736 13.9511 3.57796 14.0045C3.70857 14.0578 3.84849 14.0847 3.98956 14.0834C4.13064 14.0821 4.27005 14.0527 4.39965 13.997C4.52925 13.9412 4.64646 13.8602 4.74442 13.7587L8.5 10.0031Z"
                />
              </svg>
            </button>
            <div className="flex gap-3 pr-8">
              <div className="shrink-0 text-red">
                <IconNavRecursos className="size-6" />
              </div>
              <div>
                <p className="text-black text-lg font-bold leading-5">
                  Te hago preguntas para seguir...
                </p>
                <p className="text-black text-xs font-normal leading-4 mt-1">
                  Recordá que no respondo ni escribo por vos
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {preguntasLoading && preguntas.every((p, i) => p === PREGUNTAS_INICIALES[i]) ? (
                <p className="text-neutral-500 text-sm text-center py-4">
                  Generando preguntas...
                </p>
              ) : (
                [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 min-h-12 px-3 py-3 bg-red-300/20 rounded-2xl"
                  >
                    <p className="flex-1 min-w-0 text-neutral-600 text-xs font-normal leading-4">
                      {preguntas[i] ?? PREGUNTAS_INICIALES[i]}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRegenerarPregunta(i)}
                      disabled={preguntasLoading}
                      className="shrink-0 p-1 text-red hover:opacity-80 disabled:opacity-50 disabled:pointer-events-none"
                      aria-label="Regenerar pregunta"
                    >
                      <IconRefresh className="size-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {preguntasError && (
              <p className="mt-2 text-red text-xs text-center">{preguntasError}</p>
            )}
            <p className="mt-4 text-center text-neutral-400 text-xs font-normal leading-3 tracking-wide">
              LA ESCRITURA ES HUMANA. LA IA SOLO PREGUNTA
            </p>
          </div>
        )}

        {saveError && (
          <p className="shrink-0 pt-2 text-red text-sm text-center">{saveError}</p>
        )}
        <div className="shrink-0 pt-6 flex flex-nowrap gap-3 w-full">
          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving}
            className="flex-1 h-14 min-w-0 bg-neutral-200 text-black text-base font-bold leading-5 tracking-wider rounded-[47px] flex items-center justify-center gap-2 hover:bg-neutral-300 transition-colors disabled:opacity-60 disabled:pointer-events-none"
          >
            <IconSave className="size-4 shrink-0" />
            {saving ? "Guardando…" : "GUARDAR"}
          </button>
          <button
            type="button"
            onClick={handlePublicar}
            className="flex-1 h-14 min-w-0 rounded-[47px] border-2 border-red text-red text-base font-bold leading-5 tracking-wider flex items-center justify-center hover:bg-red/10 transition-colors"
          >
            PUBLICAR
          </button>
        </div>
      </div>

      {/* Popup de confirmación para publicar */}
      {showConfirmarPublicar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowConfirmarPublicar(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-publicar-title"
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-lg"
          >
            <h2
              id="confirmar-publicar-title"
              className="text-lg font-bold text-black leading-5 mb-2"
            >
              ¿Publicar este texto?
            </h2>
            <p className="text-neutral-600 text-sm leading-5 mb-6">
              Vas a poder completar detalles (título, temática, imagen) en la siguiente pantalla.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmarPublicar(false)}
                className="flex-1 h-12 bg-neutral-200 text-black text-sm font-bold rounded-[47px] hover:bg-neutral-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarPublicar}
                className="flex-1 h-12 bg-red text-white text-sm font-bold rounded-[47px] hover:bg-red/90 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
