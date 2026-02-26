/**
 * Traduce mensajes de error de Supabase Auth al castellano argentino.
 * Incluye mensaje genérico para errores no mapeados.
 * @param context - Opcional: 'forgot-password' | 'password-reset' para mensajes específicos del flujo.
 */
export type AuthErrorContext = "login" | "forgot-password" | "password-reset";

const ERROR_MAP: Record<string, string> = {
  // Registro
  "User already registered": "Ese usuario ya está registrado.",
  "A user with this email address has already been registered":
    "Ya hay una cuenta con ese email.",
  "Signup requires a valid password": "La contraseña no es válida.",
  "Password should be at least 6 characters":
    "La contraseña tiene que tener al menos 6 caracteres.",
  "Unable to validate email address: invalid format":
    "El email no tiene un formato válido.",

  // Login
  "Invalid login credentials": "Email o contraseña incorrectos.",
  "Email not confirmed": "Tenés que confirmar tu email antes de iniciar sesión.",
  "User not found": "No encontramos ese usuario.",

  // Forgot password / reset
  "For security purposes, you can only request this once every 60 seconds":
    "Esperá un minuto antes de pedir otro enlace.",
  "Email not found": "No hay ninguna cuenta con ese email.",
  "Password link has expired or is invalid":
    "El enlace venció o no es válido. Solicitá uno nuevo.",
  "New password should be different from the old password.":
    "La nueva contraseña tiene que ser distinta a la anterior.",
  "Token has expired or is invalid": "El enlace venció o no es válido. Solicitá uno nuevo.",
  "Code exchange failed": "El enlace ya fue usado o venció. Solicitá uno nuevo.",

  // Rate limit / servidor
  "Too many requests": "Demasiados intentos. Esperá un poco y probá de nuevo.",
  "Forbidden": "No tenés permiso para hacer esto.",
  "Server error": "Hubo un error en el servidor. Probá de nuevo más tarde.",
};

const LOWER_MAP = Object.fromEntries(
  Object.entries(ERROR_MAP).map(([k, v]) => [k.toLowerCase(), v])
);

/**
 * Devuelve el mensaje de error en castellano argentino.
 * Si no hay traducción, devuelve un mensaje genérico.
 * @param context - 'forgot-password' o 'password-reset' para mensaje genérico contextual.
 */
export function getAuthErrorMessage(
  error: { message?: string; error_description?: string } | null,
  context?: AuthErrorContext
): string {
  const raw =
    error && (typeof (error as { message?: string }).message === "string"
      ? (error as { message: string }).message
      : typeof (error as { error_description?: string }).error_description === "string"
        ? (error as { error_description: string }).error_description
        : "");
  if (!raw) {
    if (context === "forgot-password")
      return "No pudimos enviar el email. Probá de nuevo.";
    if (context === "password-reset")
      return "No pudimos restablecer la contraseña. Probá de nuevo.";
    return "Ocurrió un error. Probá de nuevo.";
  }
  const msg = raw.trim().replace(/\s+/g, " ");
  const exact = ERROR_MAP[msg];
  if (exact) return exact;
  const lower = LOWER_MAP[msg.toLowerCase()];
  if (lower) return lower;
  // Errores que contienen ciertas frases
  if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered"))
    return "Ese usuario ya está registrado.";
  if (msg.toLowerCase().includes("invalid login"))
    return "Email o contraseña incorrectos.";
  if (msg.toLowerCase().includes("email not confirmed"))
    return "Tenés que confirmar tu email antes de iniciar sesión.";
  if (msg.toLowerCase().includes("at least 6"))
    return "La contraseña tiene que tener al menos 6 caracteres.";
  if (msg.toLowerCase().includes("too many"))
    return "Demasiados intentos. Esperá un poco y probá de nuevo.";
  if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("already used")) {
    if (context === "password-reset" || context === "forgot-password")
      return "El enlace venció o ya fue usado. Solicitá uno nuevo.";
    return "El enlace venció o no es válido. Probá de nuevo.";
  }
  if (context === "forgot-password") return "No pudimos enviar el email. Probá de nuevo.";
  if (context === "password-reset") return "No pudimos restablecer la contraseña. Probá de nuevo.";
  return "Ocurrió un error. Probá de nuevo.";
}
