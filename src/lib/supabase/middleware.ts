import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
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

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";
  const isOnboardingPage = pathname === "/onboarding/seguir";

  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

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
