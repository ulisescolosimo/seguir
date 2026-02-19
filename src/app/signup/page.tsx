"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    if (data.user) {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      setLoading(false);
      router.refresh();
      router.push("/onboarding/seguir");
      return;
    }
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center px-5 py-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-black mb-2">Listo</h1>
          <p className="text-sm text-neutral-600 mb-6">
            Revisá tu email para confirmar la cuenta y después iniciá sesión.
          </p>
          <Link
            href="/login"
            className="inline-block w-full h-12 bg-red text-white text-sm font-bold rounded-[47px] hover:bg-red/90 transition-colors leading-[3rem]"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center px-5 py-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-black mb-2">Crear cuenta</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Registrate con tu nombre, email y contraseña.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Nombre</span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              placeholder="Ej. María"
              className="h-11 px-4 rounded-xl border border-neutral-200 bg-white text-black text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">Apellido</span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              placeholder="Ej. García"
              className="h-11 px-4 rounded-xl border border-neutral-200 bg-white text-black text-sm"
            />
          </label>
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
              autoComplete="new-password"
              minLength={6}
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
            className="w-full h-12 bg-red text-white text-sm font-bold rounded-[47px] hover:bg-red/90 transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "Creando…" : "Registrarme"}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-600 mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-red font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
