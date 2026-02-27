"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPalabrasDiccionario,
  fetchMisDefiniciones,
  saveDefinicion,
  getPalabraDelDia,
} from "@/lib/diccionario";
import type { PalabraDiccionario } from "@/types/diccionario";
import { Header } from "@/components/layout/Header";
import { IconChevronLeft } from "@/components/ui/Icons";

export default function DefinirPage() {
  const router = useRouter();
  const [palabraDelDia, setPalabraDelDia] = useState<PalabraDiccionario | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [definicion, setDefinicion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/inicio");
          return;
        }
        const [palabras, definiciones] = await Promise.all([
          fetchPalabrasDiccionario().catch(() => []),
          fetchMisDefiniciones(user.id).catch(() => ({})),
        ]);
        const palabra = getPalabraDelDia(palabras);
        setPalabraDelDia(palabra);
        if (!palabra) {
          setRedirecting(true);
          router.replace("/inicio");
          return;
        }
        const yaDefinida = definiciones[palabra.id]?.definicion?.trim();
        if (yaDefinida) {
          setRedirecting(true);
          router.replace("/inicio");
          return;
        }
        setDefinicion(definiciones[palabra.id]?.definicion ?? "");
      } catch {
        setError("Error al cargar.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handlePublicar = async () => {
    if (!palabraDelDia) return;
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      await saveDefinicion(user.id, palabraDelDia.id, definicion);
      router.replace("/inicio");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
      setSaving(false);
    }
  };

  if (redirecting || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-100">
        <Header title="Definir" leftSlot={<span />} />
        <main className="flex-1 flex items-center justify-center px-5">
          <p className="text-neutral-400 text-sm">Cargando...</p>
        </main>
      </div>
    );
  }

  if (!palabraDelDia) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-100">
        <Header
          title="Definir"
          leftSlot={
            <Link href="/inicio" className="p-2 -m-2 text-black" aria-label="Volver">
              <IconChevronLeft className="size-7" />
            </Link>
          }
        />
        <main className="flex-1 flex flex-col items-center justify-center px-5">
          <p className="text-neutral-500 text-sm text-center">
            No hay palabra del día disponible.
          </p>
          <Link href="/inicio" className="mt-4 text-orange-700 text-sm font-bold hover:underline">
            Volver al inicio
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100">
      <Header
        title={`Definir "${palabraDelDia.palabra}"`}
        leftSlot={
          <Link href="/inicio" className="p-2 -m-2 text-black" aria-label="Volver">
            <IconChevronLeft className="size-7" />
          </Link>
        }
      />
      <main className="flex-1 overflow-y-auto px-5 py-6 pb-8">
        <p className="text-black text-sm leading-5 mb-4">
          Escribí qué significa para vos.
        </p>
        <textarea
          value={definicion}
          onChange={(e) => setDefinicion(e.target.value)}
          placeholder="Tu definición..."
          rows={5}
          className="w-full bg-white rounded-2xl px-4 py-3 text-black text-sm leading-6 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red/30 resize-none border border-transparent"
          aria-label="Definición de la palabra"
        />
        {error && <p className="mt-2 text-red text-sm">{error}</p>}
        <button
          type="button"
          onClick={handlePublicar}
          disabled={saving}
          className="mt-6 w-full h-12 bg-red text-white text-sm font-bold rounded-[47px] hover:bg-red/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
        >
          {saving ? "Guardando…" : "Publicar"}
        </button>
      </main>
    </div>
  );
}
