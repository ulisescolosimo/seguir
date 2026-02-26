"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconChevronLeft, IconAvatarCircle, IconPhoto } from "@/components/ui/Icons";
import { Header } from "@/components/layout/Header";
import { CommunityTextCard } from "@/components/community/CommunityTextCard";
import type { CommunityTextCardData } from "@/components/community/CommunityTextCard";

type ProfileData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

function authorDisplayName(firstName: string | null, lastName: string | null): string {
  const n = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  return n || "Un miembro";
}

export default function PerfilPublicoPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string | undefined;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [texts, setTexts] = useState<CommunityTextCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("Falta el id del usuario.");
      return;
    }
    const supabase = createClient();
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, username, avatar_url")
          .eq("id", userId)
          .eq("want_to_be_read", true)
          .single();

        if (profileError || !profileRow) {
          setError("No se encontró el perfil o no está visible.");
          setLoading(false);
          return;
        }

        setProfile(profileRow as ProfileData);

        const [{ data: textsRows }, { data: followRow }] = await Promise.all([
          supabase
            .from("texts")
            .select("id, title, body, tematica, formatos_texto(nombre), image_url, updated_at, user_id")
            .eq("user_id", userId)
            .eq("status", "published")
            .order("updated_at", { ascending: false }),
          user
            ? supabase
                .from("follows")
                .select("follower_id")
                .eq("follower_id", user.id)
                .eq("following_id", userId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        setTexts((textsRows as CommunityTextCardData[]) ?? []);
        setIsFollowing(!!followRow?.follower_id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar el perfil.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  async function toggleFollow() {
    if (!userId || !currentUserId || currentUserId === userId || followLoading) return;
    const supabase = createClient();
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", userId);
        setIsFollowing(false);
      } else {
        await supabase.from("follows").insert({ follower_id: currentUserId, following_id: userId });
        setIsFollowing(true);
      }
    } finally {
      setFollowLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-100">
        <Header
          title="Perfil"
          leftSlot={
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 -m-2 text-black"
              aria-label="Volver"
            >
              <IconChevronLeft className="size-7" />
            </button>
          }
        />
        <main className="flex-1 flex items-center justify-center px-5">
          <p className="text-neutral-400 text-sm">Cargando...</p>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-100">
        <Header
          title="Perfil"
          leftSlot={
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 -m-2 text-black"
              aria-label="Volver"
            >
              <IconChevronLeft className="size-7" />
            </button>
          }
        />
        <main className="flex-1 px-5 py-6">
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-red text-sm">{error ?? "No se encontró el perfil."}</p>
            <Link
              href="/inicio/comunidad"
              className="mt-3 inline-block text-orange-700 text-sm font-bold hover:underline"
            >
              Volver a Comunidad
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayName = authorDisplayName(profile.first_name, profile.last_name);
  const usernameDisplay = profile.username?.trim()
    ? `@${profile.username.replace(/^@/, "")}`
    : null;
  const isOwnProfile = !!currentUserId && currentUserId === userId;
  const canFollow = !!currentUserId && !isOwnProfile;

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 overflow-hidden">
      <Header
        title={displayName}
        leftSlot={
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 -m-2 text-black"
            aria-label="Volver"
          >
            <IconChevronLeft className="size-7" />
          </button>
        }
      />
      <div className="w-full h-0 border-t border-zinc-300 shrink-0" aria-hidden />

      <main className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 pb-8 max-w-lg mx-auto">
          {/* Avatar */}
          <div className="flex justify-center mt-4">
            <div className="relative w-24 h-24 rounded-[57px] bg-stone-300 overflow-hidden flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <IconAvatarCircle className="absolute inset-0 w-full h-full scale-[1.2]" />
                  <span className="relative z-10 text-black">
                    <IconPhoto className="w-6 h-6" />
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Nombre y @username */}
          <h2 className="text-center text-black text-lg font-bold leading-5 mt-4">
            {displayName}
          </h2>
          {usernameDisplay && (
            <p className="text-center text-black text-sm font-normal leading-5 mt-1 text-neutral-600">
              {usernameDisplay}
            </p>
          )}

          {/* Botón Seguir / Dejar de seguir */}
          {canFollow && (
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={toggleFollow}
                disabled={followLoading}
                className={`inline-flex items-center gap-2 px-5 py-2 text-white text-sm font-bold rounded-lg disabled:opacity-70 disabled:cursor-wait ${
                  isFollowing ? "bg-neutral-600 hover:bg-neutral-700" : "bg-black hover:bg-neutral-800"
                }`}
                aria-label={isFollowing ? "Dejar de seguir" : "Seguir"}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.0625 8.0625V6H15.1875V8.0625H17.25V9.1875H15.1875V11.25H14.0625V9.1875H12V8.0625H14.0625ZM5.874 9.2625C5.322 8.6085 4.875 7.3875 4.875 6.5325V5.25C4.875 4.45435 5.19107 3.69129 5.75368 3.12868C6.31629 2.56607 7.07935 2.25 7.875 2.25C8.67065 2.25 9.43371 2.56607 9.99632 3.12868C10.5589 3.69129 10.875 4.45435 10.875 5.25V6.5325C10.875 7.3875 10.425 8.61225 9.876 9.264L9.60525 9.585C9.16275 10.1092 9.30075 10.776 9.9195 11.0775L14.1645 13.149C14.6257 13.374 15 13.9688 15 14.4862V15.0015C14.9996 15.2003 14.9203 15.3908 14.7795 15.5311C14.6388 15.6715 14.448 15.7502 14.2493 15.75H1.5C1.30135 15.75 1.11081 15.6712 0.9702 15.5309C0.82959 15.3905 0.750397 15.2002 0.75 15.0015V14.4862C0.75 13.9725 1.1235 13.374 1.5855 13.1483L5.8305 11.0767C6.44625 10.7767 6.5895 10.1108 6.1455 9.58425L5.874 9.2625Z"
                    fill="currentColor"
                  />
                </svg>
                {followLoading ? "..." : isFollowing ? "Dejar de seguir" : "Seguir"}
              </button>
            </div>
          )}

          {/* Sección: Textos de [Nombre] */}
          <h3 className="text-black text-lg font-bold leading-5 mt-10 mb-4">
            Textos de {displayName}
          </h3>
          {texts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] border border-stone-200 p-6">
              <p className="text-neutral-500 text-sm text-center">
                Aún no hay textos publicados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {texts.map((t) => (
                <Link
                  key={t.id}
                  href={`/inicio/comunidad/texto/${t.id}`}
                  className="block"
                  aria-label={`Ver texto: ${t.title?.trim() || "Sin título"}`}
                >
                  <CommunityTextCard
                    text={t}
                    authorName={displayName}
                    authorAvatarUrl={profile.avatar_url}
                    imageWidth="w-28"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
