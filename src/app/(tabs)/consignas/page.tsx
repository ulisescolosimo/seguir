"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UnifiedTabHeader } from "@/components/layout/UnifiedTabHeader";
import { IconRefresh } from "@/components/ui/Icons";

const STORAGE_KEY_PREFIX = "seguir-consignas-dia-";
const LIMITE_POR_DIA = 3;

type ConsignaGenerada = { titulo: string; descripcion: string; tipo: string };

function getHoyKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function loadConsignasDelDia(): ConsignaGenerada[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + getHoyKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConsignasDelDia(list: ConsignaGenerada[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + getHoyKey(), JSON.stringify(list));
  } catch {}
}

export default function ConsignasPage() {
  const router = useRouter();
  const [usosRestantes, setUsosRestantes] = useState<number | null>(null);
  const [consignasDelDia, setConsignasDelDia] = useState<ConsignaGenerada[]>(() => loadConsignasDelDia());
  const [consignaActual, setConsignaActual] = useState<ConsignaGenerada | null>(() => {
    const list = loadConsignasDelDia();
    return list.length > 0 ? list[list.length - 1] : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoyKey = getHoyKey();

  const fetchUsos = useCallback(async () => {
    try {
      const res = await fetch("/api/consignas/generar");
      const data = await res.json();
      setUsosRestantes(typeof data.usosRestantes === "number" ? data.usosRestantes : LIMITE_POR_DIA);
    } catch {
      setUsosRestantes(LIMITE_POR_DIA);
    }
  }, []);

  useEffect(() => {
    fetchUsos();
  }, [fetchUsos]);

  // Recargar consignas del día si cambió la fecha (p. ej. medianoche)
  useEffect(() => {
    const list = loadConsignasDelDia();
    setConsignasDelDia(list);
    if (list.length > 0) setConsignaActual(list[list.length - 1]);
    else setConsignaActual(null);
  }, [hoyKey]);

  async function generarNueva(excluir: ConsignaGenerada[] = []) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/consignas/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          excluir: excluir.map((c) => ({ titulo: c.titulo, descripcion: c.descripcion })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar la consigna.");
        if (data.usosRestantes !== undefined) setUsosRestantes(data.usosRestantes);
        return;
      }
      const nueva: ConsignaGenerada = {
        titulo: data.titulo ?? "Consigna",
        descripcion: data.descripcion ?? "",
        tipo: data.tipo ?? "OTRO",
      };
      setConsignaActual(nueva);
      const actualizadas = [...consignasDelDia, nueva];
      setConsignasDelDia(actualizadas);
      saveConsignasDelDia(actualizadas);
      if (data.usosRestantes !== undefined) setUsosRestantes(data.usosRestantes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  function handleActualizar() {
    if (!consignaActual || (usosRestantes !== null && usosRestantes <= 0)) return;
    // Excluir todas las consignas ya mostradas hoy para no repetir
    generarNueva(consignasDelDia);
  }

  function handleUsarEsta() {
    if (!consignaActual) return;
    const params = new URLSearchParams({
      titulo: consignaActual.titulo,
      descripcion: consignaActual.descripcion,
      tipo: consignaActual.tipo,
    });
    router.push(`/consignas/escribir?${params.toString()}`);
  }

  function handleSeleccionarConsigna(c: ConsignaGenerada) {
    setConsignaActual(c);
  }

  const puedeGenerar = usosRestantes !== null && usosRestantes > 0 && !loading;
  // Todas las consignas del día, más reciente primero
  const listaConsignas = [...consignasDelDia].reverse();

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen bg-neutral-100 overflow-hidden flex flex-col">
      <UnifiedTabHeader title="Consignas" backHref="/inicio" />

      <main className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Enlace Diccionarios (reemplaza la lista de consignas) */}
        <div className="mt-6 flex justify-end">
          <Link
            href="/inicio/diccionario"
            className="text-orange-700 text-base font-normal font-['Inter'] leading-5 hover:underline"
          >
            Diccionarios
          </Link>
        </div>

        <h2 className="text-black text-lg font-bold font-['Inter'] leading-5 mt-4">
          Escribir con consignas
        </h2>
        <p className="text-neutral-600 text-sm mt-1">
          Te damos una consigna para escribir. Si no te cierra, podés actualizarla (3 por día).
        </p>

        {error && (
          <p className="mt-3 text-orange-700 text-sm" role="alert">
            {error}
          </p>
        )}

        {!consignaActual ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => generarNueva([])}
              disabled={!puedeGenerar}
              className="w-full h-14 rounded-[47px] bg-orange-700 text-white text-base font-bold leading-5 flex items-center justify-center gap-2 hover:bg-orange-800 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Generando…" : "Obtener consigna"}
            </button>
            {usosRestantes !== null && (
              <p className="mt-3 text-neutral-500 text-sm text-center">
                {usosRestantes} {usosRestantes === 1 ? "consigna" : "consignas"} disponibles hoy
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 w-full rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] bg-white p-5 flex flex-col">
              <span className="text-orange-700 text-sm font-normal font-['Inter'] leading-4">
                {consignaActual.tipo}
              </span>
              <h3 className="mt-1 text-neutral-800 text-base font-medium font-['Inter'] leading-5">
                {consignaActual.titulo}
              </h3>
              {consignaActual.descripcion ? (
                <p className="mt-2 text-black text-sm font-normal font-['Inter'] leading-5">
                  {consignaActual.descripcion}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleUsarEsta}
                  className="h-10 px-5 bg-orange-700 rounded-[47px] text-white text-sm font-bold leading-4 flex items-center justify-center hover:bg-orange-800"
                >
                  Usar esta consigna
                </button>
                <button
                  type="button"
                  onClick={handleActualizar}
                  disabled={!puedeGenerar}
                  className="h-10 px-5 rounded-[47px] border-2 border-orange-700 text-orange-700 text-sm font-bold leading-4 flex items-center justify-center gap-1.5 hover:bg-orange-50 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <IconRefresh className="size-4" />
                  Actualizar
                </button>
              </div>
            </div>

            {/* Lista de consignas obtenidas hoy: siempre visible, elegir una */}
            {listaConsignas.length > 0 && (
              <div className="mt-6">
                <p className="text-neutral-600 text-sm font-medium mb-3">Elegí una de las consignas que obtuviste:</p>
                <ul className="space-y-3">
                  {listaConsignas.map((c, i) => {
                    const esSeleccionada =
                      consignaActual?.titulo === c.titulo &&
                      consignaActual?.descripcion === c.descripcion;
                    return (
                      <li key={`${c.titulo}-${i}`}>
                        <button
                          type="button"
                          onClick={() => handleSeleccionarConsigna(c)}
                          className={`w-full text-left rounded-2xl bg-white p-4 shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] border transition-colors ${
                            esSeleccionada
                              ? "border-orange-700 ring-1 ring-orange-700/30"
                              : "border-transparent hover:border-orange-700/30"
                          }`}
                        >
                          <span className="text-orange-700 text-xs font-normal">{c.tipo}</span>
                          <p className="mt-0.5 text-black text-sm font-medium leading-5 line-clamp-2">
                            {c.titulo}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {usosRestantes !== null && (
              <p className="mt-4 text-neutral-500 text-sm text-center">
                {usosRestantes} {usosRestantes === 1 ? "actualización" : "actualizaciones"} disponibles hoy
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
