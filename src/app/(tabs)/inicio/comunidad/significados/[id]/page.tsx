"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchDefinicionesPublicas } from "@/lib/diccionario";
import type { DefinicionPublica } from "@/types/diccionario";
import { Header } from "@/components/layout/Header";
import { IconChevronLeft } from "@/components/ui/Icons";

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

export default function SignificadosPage() {
  const params = useParams();
  const palabraId = params?.id as string | undefined;

  const [palabraNombre, setPalabraNombre] = useState<string>("");
  const [definiciones, setDefiniciones] = useState<DefinicionPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userYaDefinio, setUserYaDefinio] = useState<boolean | null>(null);

  useEffect(() => {
    if (!palabraId) {
      setLoading(false);
      setError("Falta el id de la palabra.");
      return;
    }
    const supabase = createClient();
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const [palabraRow, defs, miDefinicion] = await Promise.all([
          supabase
            .from("palabras_diccionario")
            .select("palabra")
            .eq("id", palabraId)
            .single(),
          fetchDefinicionesPublicas(palabraId),
          user
            ? supabase
                .from("definiciones_diccionario")
                .select("definicion")
                .eq("user_id", user.id)
                .eq("palabra_id", palabraId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (palabraRow?.data) setPalabraNombre(palabraRow.data.palabra ?? "");
        setDefiniciones(defs);
        const def = miDefinicion?.data as { definicion?: string } | null;
        setUserYaDefinio(user ? !!def?.definicion?.trim() : false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar.");
      } finally {
        setLoading(false);
      }
    })();
  }, [palabraId]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100">
      <Header
        title={palabraNombre || "Significados"}
        leftSlot={
          <Link
            href="/inicio/comunidad"
            className="p-2 -m-2 text-black"
            aria-label="Volver a Comunidad"
          >
            <IconChevronLeft className="size-7" />
          </Link>
        }
      />
      <main className="flex-1 overflow-y-auto px-5 py-6 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-neutral-400 text-sm">Cargando significados...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-red text-sm">{error}</p>
            <Link
              href="/inicio/comunidad"
              className="mt-3 inline-block text-orange-700 text-sm font-bold hover:underline"
            >
              Volver a Comunidad
            </Link>
          </div>
        ) : definiciones.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-neutral-500 text-sm">
              Nadie ha definido &quot;{palabraNombre}&quot; todavía.
            </p>
            {userYaDefinio === false && (
              <Link
                href={`/inicio?definir=${palabraId}`}
                className="mt-4 inline-flex h-12 items-center justify-center px-6 bg-red text-white text-sm font-bold rounded-[47px] hover:bg-red/90 transition-colors"
              >
                Definir
              </Link>
            )}
            <Link
              href="/inicio/comunidad"
              className="mt-4 block text-orange-700 text-sm font-bold hover:underline"
            >
              Volver a Comunidad
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-neutral-500 text-sm">
                {definiciones.length} significado{definiciones.length !== 1 ? "s" : ""}
              </p>
              {userYaDefinio === false && (
                <Link
                  href={`/inicio?definir=${palabraId}`}
                  className="h-10 px-5 bg-red text-white text-sm font-bold leading-4 rounded-[47px] hover:bg-red/90 transition-colors inline-flex items-center justify-center"
                >
                  Definir
                </Link>
              )}
            </div>
            <div className="space-y-4">
              {definiciones.map((d) => (
                <article
                  key={`${d.user_id}-${d.palabra_id}`}
                  className="bg-white rounded-2xl p-4 shadow-[0px_2px_2px_0px_rgba(0,0,0,0.05)]"
                >
                  <p className="text-black text-sm leading-6 whitespace-pre-wrap">
                    {d.definicion}
                  </p>
                  <footer className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-black text-sm font-bold leading-4">
                      {d.author_name}
                    </span>
                    {d.updated_at && (
                      <span className="text-neutral-400 text-xs leading-3">
                        {formatFecha(d.updated_at)}
                      </span>
                    )}
                  </footer>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
