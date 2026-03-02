"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchDefinicionesPublicas, fetchPalabrasDiccionario, getPalabraDelDia } from "@/lib/diccionario";
import type { DefinicionPublica } from "@/types/diccionario";
import { Header } from "@/components/layout/Header";
import { IconChevronLeft } from "@/components/ui/Icons";

export default function SignificadosPage() {
  const params = useParams();
  const palabraId = params?.id as string | undefined;

  const [palabraNombre, setPalabraNombre] = useState<string>("");
  const [definiciones, setDefiniciones] = useState<DefinicionPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userYaDefinio, setUserYaDefinio] = useState<boolean | null>(null);
  /** Solo se puede definir desde aquí si esta palabra es la del día y el usuario aún no la definió. */
  const [puedeDefinirAqui, setPuedeDefinirAqui] = useState(false);

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
        const [palabraRow, defs, miDefinicion, palabras] = await Promise.all([
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
          fetchPalabrasDiccionario().catch(() => []),
        ]);
        if (palabraRow?.data) setPalabraNombre(palabraRow.data.palabra ?? "");
        setDefiniciones(defs);
        const def = miDefinicion?.data as { definicion?: string } | null;
        const yaDefinio = user ? !!def?.definicion?.trim() : false;
        setUserYaDefinio(yaDefinio);
        const palabraDelDia = getPalabraDelDia(palabras);
        setPuedeDefinirAqui(!!user && !yaDefinio && palabraDelDia?.id === palabraId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar.");
      } finally {
        setLoading(false);
      }
    })();
  }, [palabraId]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f0e8]">
      <Header
        title={palabraNombre || "Significados"}
        leftSlot={
          <Link
            href="/inicio/diccionario"
            className="p-2 -m-2 text-black"
            aria-label="Volver a Diccionario"
          >
            <IconChevronLeft className="size-7" />
          </Link>
        }
      />
      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-neutral-500 text-sm font-serif">Cargando significados...</p>
          </div>
        ) : error ? (
          <div className="mt-4 mx-4 p-6 bg-white/80 rounded border border-red/20 text-center max-w-[65ch] mx-auto">
            <p className="text-red text-sm">{error}</p>
            <Link
              href="/inicio/diccionario"
              className="mt-3 inline-block text-red text-sm font-bold hover:underline"
            >
              Volver a Diccionario
            </Link>
          </div>
        ) : definiciones.length === 0 ? (
          <div className="mt-4 mx-4 p-8 bg-white/80 rounded border border-red/20 text-center max-w-[65ch] mx-auto">
            <p className="text-neutral-600 text-sm font-serif">
              Nadie ha definido &quot;{palabraNombre}&quot; todavía.
            </p>
            {puedeDefinirAqui && (
              <Link
                href="/inicio/definir"
                className="mt-4 inline-flex h-12 items-center justify-center px-6 bg-red text-white text-sm font-bold rounded-[47px] hover:bg-red/90 transition-colors"
              >
                Definir
              </Link>
            )}
            <Link
              href="/inicio/diccionario"
              className="mt-4 block text-red text-sm font-bold hover:underline"
            >
              Volver a Diccionario
            </Link>
          </div>
        ) : (
          <>
            {/* Barra superior tipo diccionario: cantidad + acción */}
            <div className="sticky top-0 z-10 bg-[#f5f0e8]/95 border-b border-red/10 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-neutral-600 text-xs font-serif tabular-nums">
                {definiciones.length} acepción{definiciones.length !== 1 ? "es" : ""}
              </p>
              {puedeDefinirAqui && (
                <Link
                  href="/inicio/definir"
                  className="h-8 px-4 bg-red text-white text-xs font-bold rounded-full hover:bg-red/90 transition-colors inline-flex items-center justify-center"
                >
                  Definir
                </Link>
              )}
            </div>

            {/* Columna tipo diccionario de papel */}
            <div className="px-4 py-6 pb-10 max-w-[65ch] mx-auto">
              <h1 className="font-serif text-2xl font-bold text-red mb-6 pb-1 border-b border-red/20">
                {palabraNombre}
              </h1>
              <ol className="font-serif text-[15px] leading-[1.75] text-neutral-800 list-none pl-0 space-y-0">
                {definiciones.map((d, i) => (
                  <li
                    key={`${d.user_id}-${d.palabra_id}-${i}`}
                    className="relative pl-[2.25rem] pr-0 pt-[0.6rem] pb-[0.6rem] border-b border-red/10 last:border-b-0"
                  >
                    <span className="absolute left-0 top-[0.6rem] text-red/80 font-bold text-[13px] tabular-nums">
                      {i + 1}.
                    </span>
                    <p className="whitespace-pre-wrap m-0">
                      {d.definicion}
                    </p>
                    <p className="mt-1.5 mb-0 text-[12px] text-red/70 font-serif">
                      —{" "}
                      <Link
                        href={`/inicio/comunidad/usuario/${d.user_id}`}
                        className="text-red hover:text-red/90 hover:underline"
                      >
                        {d.author_name}
                      </Link>
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
