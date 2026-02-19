"use client";

import { useState } from "react";
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
        <h1 className="text-xl font-bold text-black mb-2 w-full text-left">Iniciar sesión</h1>
        <p className="text-sm text-neutral-600 mb-6 w-full text-left">
          Ingresá con tu email y contraseña.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 px-4 rounded-xl border border-neutral-200 bg-white text-black text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-11 px-4 rounded-xl border border-neutral-200 bg-white text-black text-sm"
            />
          </label>
          {error && (
            <p className="text-sm text-red" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-red text-white text-sm font-bold rounded-[47px] hover:bg-red/90 active:bg-red/80 transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-600 mt-6 w-full">
          ¿No tenés cuenta?{" "}
          <Link href="/signup" className="text-red font-medium">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  );
}
