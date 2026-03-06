"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { useToast } from "@/components/ui/Toast";

const MIN_PASSWORD_LENGTH = 6;
const REDIRECT_DELAY_MS = 5000;

type Status =
  | "verifying"
  | "error"
  | "code_ok"
  | "success";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const hasRunEffect = useRef(false);

  useEffect(() => {
    if (hasRunEffect.current) return;
    hasRunEffect.current = true;

    const run = async () => {
      const supabase = createClient();

      // Errores en la URL: query params o hash (Supabase puede usar uno u otro)
      let urlError: string | null =
        searchParams.get("error") || searchParams.get("error_description");
      let errorCode = searchParams.get("error_code");
      let errorDescription = searchParams.get("error_description");
      if (typeof window !== "undefined" && window.location.hash && !urlError) {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        urlError = hash.get("error") || hash.get("error_description");
        errorCode = errorCode || hash.get("error_code");
        errorDescription = errorDescription || hash.get("error_description");
      }
      if (urlError || errorCode) {
        const isExpired =
          errorCode === "otp_expired" || errorCode === "expired";
        const msg = isExpired
          ? "El enlace venció. Solicitá uno nuevo."
          : getAuthErrorMessage(
              {
                message: urlError ?? undefined,
                error_description: errorDescription ?? undefined,
              },
              "password-reset"
            );
        setErrorMessage(msg);
        setStatus("error");
        toast(msg, "error");
        setTimeout(() => router.replace("/forgot-password"), REDIRECT_DELAY_MS);
        return;
      }

      const code = searchParams.get("code");
      const type = searchParams.get("type");
      let codeFromHash: string | null = null;
      let typeFromHash: string | null = null;
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        codeFromHash = hash.get("code");
        typeFromHash = hash.get("type");
      }
      const finalCode = code || codeFromHash;
      const finalType = type || typeFromHash;

      if (finalCode && finalType === "recovery") {
        const { error } = await supabase.auth.exchangeCodeForSession(finalCode);
        if (error) {
          const msg = getAuthErrorMessage(error, "password-reset");
          setErrorMessage(msg);
          setStatus("error");
          toast(msg, "error");
          setTimeout(() => router.replace("/forgot-password"), REDIRECT_DELAY_MS);
          return;
        }
        window.history.replaceState({}, document.title, window.location.pathname);
        setStatus("code_ok");
        return;
      }

      if (!finalCode) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setErrorMessage("Usá el enlace que te enviamos por email para restablecer la contraseña.");
          setStatus("error");
          toast("Usá el enlace del email para restablecer la contraseña.", "error");
          setTimeout(() => router.replace("/forgot-password"), REDIRECT_DELAY_MS);
          return;
        }
        setStatus("code_ok");
        return;
      }

      setErrorMessage("Enlace no válido. Solicitá uno nuevo.");
      setStatus("error");
      setTimeout(() => router.replace("/forgot-password"), REDIRECT_DELAY_MS);
    };

    run();
  }, [searchParams, router, toast]);

  useEffect(() => {
    if (status === "code_ok") passwordRef.current?.focus();
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      const msg = getAuthErrorMessage(error, "password-reset");
      setFormError(msg);
      toast(msg, "error");
      return;
    }
    setStatus("success");
    toast("Contraseña actualizada. Redirigiendo…", "success");
    setTimeout(() => router.replace("/login"), 2000);
  }

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center px-5 py-6">
        <div className="w-full max-w-sm flex flex-col items-center">
          <Image
            src="/images/Vector.png"
            alt="Seguir"
            width={176}
            height={40}
            className="h-10 w-auto mb-8"
          />
          <div className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm p-8 flex flex-col items-center gap-4">
            <span
              className="h-8 w-8 rounded-full border-2 border-neutral-300 border-t-red animate-spin"
              aria-hidden
            />
            <p className="text-sm text-neutral-600 text-center">Verificando enlace…</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center px-5 py-6">
        <div className="w-full max-w-sm flex flex-col items-center">
          <Image
            src="/images/Vector.png"
            alt="Seguir"
            width={176}
            height={40}
            className="h-10 w-auto mb-8"
          />
          <div className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <h1 className="text-xl font-bold text-black">Enlace inválido</h1>
              <p className="text-sm text-neutral-600 mt-1" role="alert">
                {errorMessage}
              </p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <Link
                href="/forgot-password"
                className="w-full h-12 rounded-[47px] bg-red text-white text-sm font-bold flex items-center justify-center hover:bg-red/90 active:bg-red/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Solicitar nuevo enlace
              </Link>
              <Link
                href="/login"
                className="text-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 rounded"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center px-5 py-6">
        <div className="w-full max-w-sm flex flex-col items-center">
          <Image
            src="/images/Vector.png"
            alt="Seguir"
            width={176}
            height={40}
            className="h-10 w-auto mb-8"
          />
          <div className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm p-6">
            <h1 className="text-xl font-bold text-black">Listo</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Tu contraseña fue actualizada. Redirigiendo al inicio de sesión…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // status === "code_ok" -> formulario nueva contraseña
  const hasFormError = Boolean(formError);
  const inputErrorClasses = hasFormError
    ? "border-red-400 focus-visible:ring-red-300"
    : "border-neutral-200 focus-visible:ring-neutral-300";

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center px-5 py-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <Image
          src="/images/Vector.png"
          alt="Seguir"
          width={176}
          height={40}
          className="h-10 w-auto mb-8"
        />
        <div className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <h1 className="text-xl font-bold text-black">Nueva contraseña</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Elegí una contraseña de al menos {MIN_PASSWORD_LENGTH} caracteres.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            <label htmlFor="reset-password" className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-700">Contraseña</span>
              <input
                id="reset-password"
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError(null);
                }}
                required
                autoComplete="new-password"
                disabled={loading}
                aria-invalid={hasFormError}
                aria-describedby={hasFormError ? "reset-form-error" : undefined}
                className={`h-11 px-4 rounded-xl border bg-white text-black text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${inputErrorClasses}`}
              />
            </label>
            <label htmlFor="reset-confirm" className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-700">Confirmar contraseña</span>
              <input
                id="reset-confirm"
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setFormError(null);
                }}
                required
                autoComplete="new-password"
                disabled={loading}
                aria-invalid={hasFormError}
                aria-describedby={hasFormError ? "reset-form-error" : undefined}
                className={`h-11 px-4 rounded-xl border bg-white text-black text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${inputErrorClasses}`}
              />
            </label>
            {formError && (
              <p id="reset-form-error" role="alert" aria-live="polite" className="text-sm text-red-600">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-red text-white text-sm font-bold rounded-[47px] hover:bg-red/90 active:bg-red/80 outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                    aria-hidden
                  />
                  <span>Guardando…</span>
                </span>
              ) : (
                "Guardar contraseña"
              )}
            </button>
          </form>
          <div className="px-6 pb-6">
            <Link
              href="/login"
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 rounded"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifyingFallback() {
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center px-5 py-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="h-10 w-auto mb-8" />
        <div className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm p-8 flex flex-col items-center gap-4">
          <span
            className="h-8 w-8 rounded-full border-2 border-neutral-300 border-t-red animate-spin"
            aria-hidden
          />
          <p className="text-sm text-neutral-600 text-center">Verificando enlace…</p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<VerifyingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
