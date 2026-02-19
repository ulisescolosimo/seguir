/**
 * Variables de entorno de Supabase.
 * En producción (Vercel, etc.) deben estar configuradas en el dashboard del proyecto.
 */
function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      process.env.NODE_ENV === "development"
        ? `Faltan variables de Supabase: ${missing}. Añádelas en .env.local`
        : "Configuración del servidor incompleta. Revisa las variables de entorno en Vercel (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }
  return { url, anonKey };
}

export { getSupabaseEnv };
