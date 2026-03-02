import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Cliente Supabase con service role. Solo usar en el servidor para operaciones
 * que requieren bypass de RLS (ej. cron de recordatorios, leer auth.users).
 * No exponer SUPABASE_SERVICE_ROLE_KEY al cliente.
 */
export function createAdminClient() {
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Solo deben usarse en el servidor."
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Devuelve true si las variables para el cliente admin están definidas. */
export function hasAdminEnv(): boolean {
  return Boolean(url && serviceRoleKey);
}
