"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { useToast } from "@/components/ui/Toast";

function getSiteUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const siteUrl = getSiteUrl() || window.location.origin;
    const redirectTo = `${siteUrl}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setLoading(false);
    if (error) {
      const message = getAuthErrorMessage(error, "forgot-password");
      toast(message, "error");
      return;
    }
    setEmailSent(true);
  }

  if (emailSent) {
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
              <h1 className="text-xl font-bold text-black">Revisá tu email</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Te enviamos un enlace para restablecer la contraseña. Revisá la bandeja de entrada y la carpeta de spam.
              </p>
            </div>
            <div className="p-6">
              <Link
                href="/login"
                className="block w-full h-12 rounded-[47px] bg-red text-white text-sm font-bold flex items-center justify-center hover:bg-red/90 active:bg-red/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-black">Olvidé mi contraseña</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Ingresá tu email y te enviamos un enlace para restablecerla.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            <label htmlFor="forgot-email" className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-700">Email</span>
              <input
                id="forgot-email"
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="h-11 px-4 rounded-xl border border-neutral-200 bg-white text-black text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </label>
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
                  <span>Enviando…</span>
                </span>
              ) : (
                "Enviar enlace"
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
