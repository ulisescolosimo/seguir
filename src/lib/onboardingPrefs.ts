import type { SupabaseClient } from "@supabase/supabase-js";
import type { OnboardingPrefs } from "@/types/onboarding";

const STORAGE_KEY = "seguir_onboarding_prefs";

/** Carga prefs: desde Supabase si hay sesión, sino desde localStorage. */
export async function loadOnboardingPrefs(
  supabaseClient?: SupabaseClient
): Promise<OnboardingPrefs | null> {
  if (typeof window === "undefined") return null;
  try {
    if (supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const { data } = await supabaseClient
          .from("profiles")
          .select("onboarding_completed, start_mode, reminders_per_week")
          .eq("id", user.id)
          .single();
        if (data && typeof data === "object" && "onboarding_completed" in data) {
          const p = data as { onboarding_completed: boolean; start_mode: string; reminders_per_week: number };
          return {
            onboardingCompleted: p.onboarding_completed,
            startMode: p.start_mode === "prompts" ? "prompts" : "zero",
            remindersPerWeek: Math.min(3, Math.max(0, p.reminders_per_week)) as 0 | 1 | 2 | 3,
          };
        }
      }
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (
      data &&
      typeof data === "object" &&
      "onboardingCompleted" in data &&
      "startMode" in data &&
      "remindersPerWeek" in data
    ) {
      return data as OnboardingPrefs;
    }
    return null;
  } catch {
    return null;
  }
}

/** Guarda prefs en Supabase (si hay sesión) y en localStorage como respaldo. */
export async function saveOnboardingPrefs(
  prefs: OnboardingPrefs,
  supabaseClient?: SupabaseClient
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        await supabaseClient.from("profiles").upsert({
          id: user.id,
          onboarding_completed: prefs.onboardingCompleted,
          start_mode: prefs.startMode,
          reminders_per_week: prefs.remindersPerWeek,
          updated_at: new Date().toISOString(),
        });
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignorar
    }
  }
}
