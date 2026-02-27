"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";

const REGISTRATION_MAIL_WEBHOOK_URL =
  "https://orsai.app.n8n.cloud/webhook/seguir-mail";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptTerms) {
      setError("Tenés que aceptar los términos y condiciones para registrarte.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    // Supabase envía automáticamente el correo de confirmación (personalizable en Dashboard > Auth > Email Templates)
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setLoading(false);
      setError(getAuthErrorMessage(err));
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
      // Enviar datos al webhook para correo de confirmación de registro
      fetch(REGISTRATION_MAIL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          user_id: data.user.id,
        }),
      }).catch(() => {});
      setLoading(false);
      router.refresh();
      router.push("/onboarding/seguir");
      return;
    }
    setLoading(false);
    setDone(true);
    // Envío de correo de confirmación (flujo con confirmación de email)
    fetch(REGISTRATION_MAIL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      }),
    }).catch(() => {});
  }

  if (done) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center px-5 py-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-black mb-2">Listo</h1>
          <p className="text-sm text-neutral-600 mb-6">
            Te enviamos un correo de confirmación. Revisá tu email para activar tu cuenta y después iniciá sesión.
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                className="h-11 w-full pl-4 pr-11 rounded-xl border border-neutral-200 bg-white text-black text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-neutral-300"
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
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-red focus:ring-red"
              />
              <span className="text-sm text-neutral-700">
                Acepto los{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-red font-medium underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1 rounded"
                >
                  términos y condiciones
                </button>
              </span>
            </label>
          </div>
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

      {/* Modal Términos y condiciones */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-title"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 id="terms-title" className="text-lg font-bold text-black">
                Términos y condiciones
              </h2>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                aria-label="Cerrar"
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto text-sm text-neutral-600">
              <p className="mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p className="mb-4">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              <p className="mb-4">
                Curabitur pretium tincidunt lacus. Nulla facilisi. Ut fringilla. Suspendisse potenti. Nunc feugiat mi a tellus consequat imperdiet. Vestibulum sapien. Proin quam. Etiam ultrices.
              </p>
              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
            </div>
            <div className="p-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-full h-11 bg-red text-white text-sm font-bold rounded-xl hover:bg-red/90 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
