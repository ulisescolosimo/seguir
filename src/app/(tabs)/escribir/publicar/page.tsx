"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchFormatos, groupFormatosByCategoria } from "@/lib/formatos";
import type { Formato } from "@/types/formatos";
import { Header } from "@/components/layout/Header";
import { IconChevronLeft, IconEdit } from "@/components/ui/Icons";

const BUCKET_IMAGENES = "text-images";
const MAX_IMAGE_SIZE_MB = 3;

export default function PublicarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const textId = searchParams.get("id");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [formatoId, setFormatoId] = useState<string | null>(null);
  const [formatos, setFormatos] = useState<Formato[]>([]);
  const [loadingFormatos, setLoadingFormatos] = useState(true);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(!!textId);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vista previa
  const [showPrevia, setShowPrevia] = useState(false);
  const [previaBody, setPreviaBody] = useState("");
  const [previaImageUrl, setPreviaImageUrl] = useState<string | null>(null);
  const [previaLoading, setPreviaLoading] = useState(false);

  // Cargar catálogo de formatos
  useEffect(() => {
    fetchFormatos()
      .then(setFormatos)
      .catch(() => setFormatos([]))
      .finally(() => setLoadingFormatos(false));
  }, []);

  // Cargar datos del texto cuando hay id
  useEffect(() => {
    if (!textId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    (async () => {
      const { data, error: fetchError } = await supabase
        .from("texts")
        .select("title, formato_id")
        .eq("id", textId)
        .single();
      if (!fetchError && data) {
        setTitulo(data.title ?? "");
        setFormatoId(data.formato_id ?? null);
      }
      setLoading(false);
    })();
  }, [textId]);

  // Limpiar object URL al cerrar vista previa
  useEffect(() => {
    if (!showPrevia && previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }, [showPrevia]);

  async function handleVistaPrevia() {
    setPreviaLoading(true);
    setShowPrevia(true);
    setPreviaBody("");
    setPreviaImageUrl(null);

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    if (imagenFile) {
      const url = URL.createObjectURL(imagenFile);
      previewObjectUrlRef.current = url;
      setPreviaImageUrl(url);
    }

    if (textId) {
      const supabase = createClient();
      const { data } = await supabase
        .from("texts")
        .select("body, image_url")
        .eq("id", textId)
        .single();
      if (data) {
        setPreviaBody(data.body ?? "");
        if (!imagenFile && data.image_url) {
          setPreviaImageUrl(data.image_url);
        }
      }
    }

    setPreviaLoading(false);
  }

  function cerrarPrevia() {
    setShowPrevia(false);
  }

  async function handlePublicar() {
    setError(null);
    setPublishing(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Tenés que iniciar sesión para publicar.");
      setPublishing(false);
      return;
    }

    const titleToSave = titulo.trim() || "Sin título";
    const tematicaNombre = formatoId
      ? formatos.find((f) => f.id === formatoId)?.nombre ?? null
      : null;

    // Si no hay textId, crear un texto nuevo en draft y redirigir
    if (!textId) {
      const { data: newText, error: insertError } = await supabase
        .from("texts")
        .insert({
          user_id: user.id,
          title: titleToSave,
          body: "",
          status: "draft",
          formato_id: formatoId,
          tematica: tematicaNombre,
        })
        .select("id")
        .single();
      if (insertError) {
        setError(insertError.message);
        setPublishing(false);
        return;
      }
      router.push(`/escribir/publicar?id=${newText.id}`);
      setPublishing(false);
      return;
    }

    let imageUrl: string | null = null;

    if (imagenFile) {
      if (imagenFile.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(`La imagen debe ser menor a ${MAX_IMAGE_SIZE_MB}MB.`);
        setPublishing(false);
        return;
      }
      const ext = imagenFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${textId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_IMAGENES)
        .upload(path, imagenFile, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        setError(
          uploadError.message.includes("Bucket not found")
            ? "Creá el bucket 'text-images' en Supabase Dashboard > Storage."
            : uploadError.message
        );
        setPublishing(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from(BUCKET_IMAGENES)
        .getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from("texts")
      .update({
        title: titleToSave,
        formato_id: formatoId,
        tematica: formatoId
          ? formatos.find((f) => f.id === formatoId)?.nombre ?? null
          : null,
        image_url: imageUrl,
        status: "published",
      })
      .eq("id", textId)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setPublishing(false);
      return;
    }

    setPublishing(false);
    router.push("/inicio");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(`La imagen debe ser menor a ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }
      setImagenFile(f);
      setError(null);
    }
  }

  const backHref = textId ? `/escribir/editar?id=${textId}` : "/escribir/editar";
  const editHref = textId ? `/escribir/editar?id=${textId}` : "/escribir/editar";

  const tituloPrevia = titulo.trim() || "Sin título";

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100">
      {showPrevia && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-100">
          <Header
            title="Vista previa"
            rightSlot={
              <button
                type="button"
                onClick={cerrarPrevia}
                className="p-2 -m-2 text-red text-base font-bold"
              >
                Cerrar
              </button>
            }
          />
          <main className="flex-1 overflow-y-auto px-5 py-6 pb-8">
            {previaLoading ? (
              <p className="text-neutral-400 text-sm">Cargando vista previa...</p>
            ) : (
              <article className="flex flex-col gap-6">
                <header>
                  <span className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
                    {formatoId
                      ? formatos.find((f) => f.id === formatoId)?.nombre ?? ""
                      : ""}
                  </span>
                  <h1 className="text-2xl font-bold text-black leading-tight mt-1">
                    {tituloPrevia}
                  </h1>
                </header>

                {previaImageUrl && (
                  <figure className="w-full rounded-2xl overflow-hidden bg-neutral-200 aspect-[16/10]">
                    <img
                      src={previaImageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </figure>
                )}

                <div className="bg-white rounded-2xl p-4 shadow-[0px_2px_2px_0px_rgba(0,0,0,0.05)]">
                  <div className="text-black text-sm leading-6 whitespace-pre-wrap">
                    {previaBody || "Sin contenido aún."}
                  </div>
                </div>
              </article>
            )}
          </main>
        </div>
      )}

      <Header
        title="Publicar"
        leftSlot={
          <Link href={backHref} className="p-2 -m-2 text-black" aria-label="Volver">
            <IconChevronLeft className="size-7" />
          </Link>
        }
        rightSlot={
          <Link href={editHref} className="p-1 text-red" aria-label="Editar">
            <IconEdit className="size-6" />
          </Link>
        }
      />
      <main className="flex-1 px-5 py-6 pb-8 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-neutral-400 text-sm">Cargando...</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-black leading-5 mb-2">Título</h2>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del texto"
              className="w-full h-14 px-4 bg-white rounded-2xl shadow-[0px_2px_2px_0px_rgba(0,0,0,0.05)] text-black text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red/30"
            />

            <h2 className="text-lg font-bold text-black leading-5 mt-6 mb-1">
              Formato
            </h2>
            <p className="text-neutral-400 text-xs leading-4 tracking-wide mb-2">
              Seleccioná entre las opciones
            </p>
            <div className="relative">
              <select
                value={formatoId ?? ""}
                onChange={(e) => setFormatoId(e.target.value || null)}
                disabled={loadingFormatos}
                className="w-full h-14 px-4 pr-12 bg-white rounded-2xl shadow-[0px_2px_2px_0px_rgba(0,0,0,0.05)] text-black text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-red/30 disabled:opacity-60"
              >
                <option value="">Elegir formato</option>
                {!loadingFormatos &&
                  (() => {
                    const { ficcion, no_ficcion } = groupFormatosByCategoria(formatos);
                    return (
                      <>
                        <optgroup label="Ficción">
                          {ficcion.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.nombre}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="No ficción">
                          {no_ficcion.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.nombre}
                            </option>
                          ))}
                        </optgroup>
                      </>
                    );
                  })()}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                <svg width="19" height="22" viewBox="0 0 19 22" fill="none" aria-hidden>
                  <path
                    d="M10.4585 16.0961C9.92835 16.6332 9.06741 16.6332 8.53728 16.0961L1.75156 9.22107C1.22143 8.68396 1.22143 7.8117 1.75156 7.27459C2.2817 6.73748 3.14263 6.73748 3.67277 7.27459L9.5 13.1785L15.3272 7.27888C15.8574 6.74177 16.7183 6.74177 17.2484 7.27888C17.7786 7.81599 17.7786 8.68826 17.2484 9.22537L10.4627 16.1004L10.4585 16.0961Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-lg font-bold text-black leading-5 mt-6 mb-1">
              Imagen principal
            </h2>
            <p className="text-neutral-400 text-xs leading-4 tracking-wide mb-3">
              Archivo .JPEG, .PNG de {MAX_IMAGE_SIZE_MB}MB máximo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpeg,.jpg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-[12rem] h-10 bg-red rounded-lg flex items-center justify-center gap-2 text-white text-sm font-bold tracking-wider hover:bg-red/90 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 21C4.45 21 3.97933 20.8043 3.588 20.413C3.19667 20.0217 3.00067 19.5507 3 19V5C3 4.45 3.196 3.97933 3.588 3.588C3.98 3.19667 4.45067 3.00067 5 3H19C19.55 3 20.021 3.196 20.413 3.588C20.805 3.98 21.0007 4.45067 21 5V19C21 19.55 20.8043 20.021 20.413 20.413C20.0217 20.805 19.5507 21.0007 19 21H5ZM5 19H19V5H5V19ZM6 17H18L14.25 12L11.25 16L9 13L6 17Z"
                  fill="currentColor"
                />
              </svg>
              CARGAR IMAGEN
            </button>
            {imagenFile && (
              <p className="mt-2 text-neutral-600 text-sm">{imagenFile.name}</p>
            )}

            {error && (
              <p className="mt-4 text-red text-sm">{error}</p>
            )}

            <div className="mt-auto pt-8 flex flex-nowrap gap-3 w-full">
              <button
                type="button"
                onClick={handleVistaPrevia}
                className="flex-1 h-14 min-w-0 bg-neutral-200 text-black text-base font-bold leading-5 tracking-wider rounded-[47px] hover:bg-neutral-300 transition-colors"
              >
                VISTA PREVIA
              </button>
              <button
                type="button"
                onClick={handlePublicar}
                disabled={publishing}
                className="flex-1 h-14 min-w-0 bg-red border-2 border-red text-white text-base font-bold leading-5 tracking-wider rounded-[47px] hover:bg-red/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
              >
                {publishing ? "Publicando…" : "PUBLICAR"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
