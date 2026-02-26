"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Autofocus: email si está vacío, password si email tiene valor
  useEffect(() => {
    if (!email.trim()) {
      emailInputRef.current?.focus();
    } else if (!password) {
      passwordInputRef.current?.focus();
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(getAuthErrorMessage(err));
      return;
    }
    router.refresh();
    router.push("/inicio");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.currentTarget.form?.requestSubmit();
    }
  }

  const hasError = Boolean(error);
  const inputErrorClasses = hasError
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
        <h1 className="text-xl font-bold text-black mb-2 w-full text-left">
          Iniciar sesión
        </h1>
        <p className="text-sm text-neutral-600 mb-6 w-full text-left">
          Ingresá con tu email y contraseña.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          <label htmlFor="login-email" className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-700">Email</span>
            <input
              id="login-email"
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              required
              autoComplete="email"
              disabled={loading}
              aria-invalid={hasError}
              aria-describedby={hasError ? "login-error" : undefined}
              className={`h-11 px-4 rounded-xl border bg-white text-black text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${inputErrorClasses}`}
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="block">
              <span className="text-sm font-medium text-neutral-700">
                Contraseña
              </span>
            </label>
            <div className="relative">
              <input
                id="login-password"
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
                autoComplete="current-password"
                disabled={loading}
                aria-invalid={hasError}
                aria-describedby={hasError ? "login-error" : undefined}
                className={`h-11 w-full pl-4 pr-11 rounded-xl border bg-white text-black text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${inputErrorClasses}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                disabled={loading}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {showPassword ? (
                  <>
                    <span className="sr-only">Ocultar contraseña</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span className="sr-only">Mostrar contraseña</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-neutral-500 hover:text-neutral-700 mt-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 rounded"
            >
              Olvidé mi contraseña
            </Link>
          </div>

          {error && (
            <p
              id="login-error"
              role="alert"
              aria-live="polite"
              className="text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-red text-white text-sm font-bold rounded-[47px] hover:bg-red/90 active:bg-red/80 outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                  aria-hidden
                />
                <span>Entrando…</span>
              </span>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-600 mt-6 w-full">
          ¿No tenés cuenta?{" "}
          <Link
            href="/signup"
            className="text-red font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 rounded"
          >
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  );
}
