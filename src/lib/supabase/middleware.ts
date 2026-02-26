import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Permitir /forgot-password y /reset-password sin lógica de auth y preservar query params
  if (pathname === "/forgot-password" || pathname === "/reset-password") {
    return NextResponse.next({ request });
  }

  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathnameFromUrl = request.nextUrl.pathname;
  const isLoginPage = pathnameFromUrl === "/login";
  const isSignupPage = pathnameFromUrl === "/signup";
  const isOnboardingPage = pathnameFromUrl === "/onboarding/seguir";

  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((p) => pathnameFromUrl === p || pathnameFromUrl.startsWith(p + "/"));

  function redirectTo(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c.name, c.value));
    return res;
  }

  if (!user) {
    if (!isPublicPath) return redirectTo("/login");
    return response;
  }

  if (isLoginPage || isSignupPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || !profile.onboarding_completed) {
      return redirectTo("/onboarding/seguir");
    }
    return redirectTo("/inicio");
  }

  if (!isOnboardingPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.onboarding_completed) {
      return redirectTo("/onboarding/seguir");
    }
  }

  return response;
}
