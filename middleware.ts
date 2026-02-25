import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/login/:path*",
    "/signup",
    "/signup/:path*",
    "/inicio",
    "/inicio/:path*",
    "/escribir",
    "/escribir/:path*",
    "/consignas",
    "/consignas/:path*",
    "/recursos",
    "/recursos/:path*",
    "/perfil",
    "/perfil/:path*",
    "/onboarding/:path*",
  ],
};
