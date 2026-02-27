"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CommunityTextCard } from "@/components/community/CommunityTextCard";
import type { CommunityTextCardData } from "@/components/community/CommunityTextCard";

const BUCKET_IMAGENES = "text-images";
const MAX_AVATAR_SIZE_MB = 2;

type RemindersValue = 0 | 1 | 2 | 3;

function PrivacySwitch({
  checked,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className="relative inline-flex flex-shrink-0 h-6 w-11 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
    >
      {/* Track */}
      <span
        className={`absolute inset-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-orange-700" : "bg-neutral-300"
        }`}
      />
      {/* Thumb: 20px, 2px from edges. When on: left = 44 - 2 - 20 = 22px */}
      <span
        className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out ${
          checked ? "left-[22px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [remindersPerWeek, setRemindersPerWeek] = useState<RemindersValue>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quieroQueMeLean, setQuieroQueMeLean] = useState(true);
  const [quieroQueMeComenten, setQuieroQueMeComenten] = useState(true);
  const [comentariosPublicos, setComentariosPublicos] = useState(true);
  const [quieroQueCompartan, setQuieroQueCompartan] = useState(true);

  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [savedTexts, setSavedTexts] = useState<CommunityTextCardData[]>([]);
  const [savedAuthorNames, setSavedAuthorNames] = useState<Record<string, string>>({});
  const [savedAuthorAvatars, setSavedAuthorAvatars] = useState<Record<string, string>>({});
  const [loadingSaved, setLoadingSaved] = useState(false);

  const [followingTexts, setFollowingTexts] = useState<CommunityTextCardData[]>([]);
  const [followingAuthorNames, setFollowingAuthorNames] = useState<Record<string, string>>({});
  const [followingAuthorAvatars, setFollowingAuthorAvatars] = useState<Record<string, string>>({});
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from("profiles")
        .select(
          "first_name, last_name, username, avatar_url, reminders_per_week, want_to_be_read, want_comments, public_comments, allow_share_texts"
        )
        .eq("id", user.id)
        .single();
      if (data) {
        setFirstName((data.first_name as string) ?? "");
        setLastName((data.last_name as string) ?? "");
        setUsername((data.username as string) ?? "");
        setAvatarUrl((data.avatar_url as string) ?? null);
        if (typeof data.reminders_per_week === "number") {
          const v = Math.min(
            3,
            Math.max(0, data.reminders_per_week)
          ) as RemindersValue;
          setRemindersPerWeek(v);
        }
        if (typeof data.want_to_be_read === "boolean")
          setQuieroQueMeLean(data.want_to_be_read);
        if (typeof data.want_comments === "boolean")
          setQuieroQueMeComenten(data.want_comments);
        if (typeof data.public_comments === "boolean")
          setComentariosPublicos(data.public_comments);
        if (typeof data.allow_share_texts === "boolean")
          setQuieroQueCompartan(data.allow_share_texts);
      }
      setLoading(false);

      // Textos guardados del usuario
      if (user) {
        setLoadingSaved(true);
        try {
          const { data: savedRows } = await supabase
            .from("saved_texts")
            .select("text_id, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          const textIds = (savedRows ?? []).map((r) => r.text_id);
          if (textIds.length > 0) {
            const { data: textsData } = await supabase
              .from("texts")
              .select("id, title, body, formato_id, tematica, formatos_texto(nombre), image_url, updated_at, user_id")
              .in("id", textIds)
              .eq("status", "published");
            const textMap: Record<string, CommunityTextCardData> = {};
            for (const t of textsData ?? []) {
              textMap[t.id] = t as unknown as CommunityTextCardData;
            }
            const ordered = textIds.map((id) => textMap[id]).filter(Boolean);
            setSavedTexts(ordered);
            const authorIds = [...new Set(ordered.map((t) => t.user_id))];
            if (authorIds.length > 0) {
              const { data: profilesData } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, avatar_url")
                .in("id", authorIds);
              const nameMap: Record<string, string> = {};
              const avatarMap: Record<string, string> = {};
              for (const p of profilesData ?? []) {
                const name = [p.first_name?.trim(), p.last_name?.trim()].filter(Boolean).join(" ");
                nameMap[p.id] = name || "un miembro";
                if (p.avatar_url?.trim()) avatarMap[p.id] = p.avatar_url.trim();
              }
              setSavedAuthorNames(nameMap);
              setSavedAuthorAvatars(avatarMap);
            } else {
              setSavedAuthorNames({});
              setSavedAuthorAvatars({});
            }
          } else {
            setSavedTexts([]);
            setSavedAuthorNames({});
            setSavedAuthorAvatars({});
          }
        } catch {
          setSavedTexts([]);
        } finally {
          setLoadingSaved(false);
        }
      }

      // Textos de quienes sigo
      if (user) {
        setLoadingFollowing(true);
        try {
          const { data: followsRows } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id);
          const followingIds = (followsRows ?? []).map((r) => r.following_id);
          if (followingIds.length > 0) {
            const { data: textsData } = await supabase
              .from("texts")
              .select("id, title, body, formato_id, tematica, formatos_texto(nombre), image_url, updated_at, user_id")
              .in("user_id", followingIds)
              .eq("status", "published")
              .order("updated_at", { ascending: false })
              .limit(20);
            const ordered = (textsData ?? []) as unknown as CommunityTextCardData[];
            setFollowingTexts(ordered);
            const authorIds = [...new Set(ordered.map((t) => t.user_id))];
            if (authorIds.length > 0) {
              const { data: profilesData } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, avatar_url")
                .in("id", authorIds);
              const nameMap: Record<string, string> = {};
              const avatarMap: Record<string, string> = {};
              for (const p of profilesData ?? []) {
                const name = [p.first_name?.trim(), p.last_name?.trim()].filter(Boolean).join(" ");
                nameMap[p.id] = name || "un miembro";
                if (p.avatar_url?.trim()) avatarMap[p.id] = p.avatar_url.trim();
              }
              setFollowingAuthorNames(nameMap);
              setFollowingAuthorAvatars(avatarMap);
            } else {
              setFollowingAuthorNames({});
              setFollowingAuthorAvatars({});
            }
          } else {
            setFollowingTexts([]);
            setFollowingAuthorNames({});
            setFollowingAuthorAvatars({});
          }
        } catch {
          setFollowingTexts([]);
        } finally {
          setLoadingFollowing(false);
        }
      }
    })();
  }, []);

  async function savePrivacy(prefs: {
    want_to_be_read: boolean;
    want_comments: boolean;
    public_comments: boolean;
    allow_share_texts: boolean;
  }) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
  }

  function handlePrivacyChange(
    key: "want_to_be_read" | "want_comments" | "public_comments" | "allow_share_texts",
    value: boolean
  ) {
    const setters = {
      want_to_be_read: setQuieroQueMeLean,
      want_comments: setQuieroQueMeComenten,
      public_comments: setComentariosPublicos,
      allow_share_texts: setQuieroQueCompartan,
    };
    setters[key](value);
    savePrivacy({
      want_to_be_read: key === "want_to_be_read" ? value : quieroQueMeLean,
      want_comments: key === "want_comments" ? value : quieroQueMeComenten,
      public_comments: key === "public_comments" ? value : comentariosPublicos,
      allow_share_texts: key === "allow_share_texts" ? value : quieroQueCompartan,
    });
  }

  async function saveReminders(value: RemindersValue) {
    setRemindersPerWeek(value);
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          reminders_per_week: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }
    setSaving(false);
  }

  function openEdit() {
    setEditFirstName(firstName);
    setEditLastName(lastName);
    setEditUsername(username);
    setEditAvatarFile(null);
    setEditAvatarPreview(avatarUrl);
    setProfileError(null);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditAvatarFile(null);
    if (editAvatarPreview && editAvatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(editAvatarPreview);
    }
    setEditAvatarPreview(null);
  }

  function handleEditAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
        setProfileError(`La imagen debe ser menor a ${MAX_AVATAR_SIZE_MB} MB.`);
        return;
      }
      if (editAvatarPreview?.startsWith("blob:")) URL.revokeObjectURL(editAvatarPreview);
      setEditAvatarFile(f);
      setEditAvatarPreview(URL.createObjectURL(f));
      setProfileError(null);
    }
  }

  async function saveProfile() {
    setProfileError(null);
    setSavingProfile(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingProfile(false);
      return;
    }
    let newAvatarUrl: string | null = avatarUrl;
    if (editAvatarFile) {
      const ext = editAvatarFile.name.split(".").pop() || "jpg";
      const path = `avatars/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_IMAGENES)
        .upload(path, editAvatarFile, { cacheControl: "3600", upsert: false });
      if (uploadError) {
        setProfileError(
          uploadError.message.includes("Bucket not found")
            ? "Configurá el bucket en Supabase Storage."
            : uploadError.message
        );
        setSavingProfile(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from(BUCKET_IMAGENES)
        .getPublicUrl(path);
      newAvatarUrl = urlData.publicUrl;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          first_name: editFirstName.trim() || null,
          last_name: editLastName.trim() || null,
          username: normalizeUsername(editUsername) ?? null,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    if (updateError) {
      setProfileError(updateError.message);
      setSavingProfile(false);
      return;
    }
    setFirstName(editFirstName.trim());
    setLastName(editLastName.trim());
    setUsername(normalizeUsername(editUsername) ?? "");
    setAvatarUrl(newAvatarUrl);
    setSavingProfile(false);
    closeEdit();
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Usuario";
  const usernameDisplay = username.trim()
    ? `@${username.trim().replace(/^@+/, "")}`
    : email
      ? `@${email.split("@")[0]}`
      : "";

  function normalizeUsername(value: string): string | null {
    const v = value.trim().replace(/^@+/, "").trim();
    return v || null;
  }

  return (
    <div className="w-full max-w-[384px] mx-auto min-h-screen bg-neutral-100 overflow-hidden relative">

      {/* Modal Editar perfil */}
      {editOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            aria-hidden
            onClick={closeEdit}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-lg p-5 max-w-[384px] mx-auto">
            <h3 className="text-lg font-bold text-black mb-4">Editar perfil</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-orange-700/20 flex items-center justify-center overflow-hidden"
                >
                  {editAvatarPreview ? (
                    <img
                      src={editAvatarPreview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M7.08333 29.75C6.30417 29.75 5.63739 29.4728 5.083 28.9184C4.52861 28.364 4.25094 27.6968 4.25 26.9167V7.08333C4.25 6.30417 4.52767 5.63739 5.083 5.083C5.63833 4.52861 6.30511 4.25094 7.08333 4.25H26.9167C27.6958 4.25 28.3631 4.52767 28.9184 5.083C29.4737 5.63833 29.7509 6.30511 29.75 7.08333V26.9167C29.75 27.6958 29.4728 28.3631 28.9184 28.9184C28.364 29.4737 27.6968 29.7509 26.9167 29.75H7.08333ZM8.5 24.0833H25.5L20.1875 17L15.9375 22.6667L12.75 18.4167L8.5 24.0833Z"
                        fill="#CF3617"
                      />
                    </svg>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEditAvatarChange}
                />
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-neutral-700">Nombre</span>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="Ej. María"
                  className="h-11 px-4 rounded-xl border border-neutral-200 bg-white text-black text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-neutral-700">Apellido</span>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Ej. García"
                  className="h-11 px-4 rounded-xl border border-neutral-200 bg-white text-black text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-neutral-700">Usuario</span>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="mi_usuario (se mostrará como @mi_usuario)"
                  className="h-11 px-4 rounded-xl border border-neutral-200 bg-white text-black text-sm"
                />
              </label>
              {profileError && (
                <p className="text-sm text-red-600" role="alert">{profileError}</p>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 h-11 rounded-xl border border-neutral-300 text-black text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="flex-1 h-11 rounded-xl bg-orange-700 text-white text-sm font-bold disabled:opacity-60"
                >
                  {savingProfile ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="pb-8 px-5">
        {/* Avatar y nombre */}
        <div className="flex flex-col items-center pt-10">
          <div className="w-28 h-28 bg-orange-700/20 rounded-[57px] flex items-center justify-center relative overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                width="34"
                height="34"
                viewBox="0 0 34 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute"
              >
                <path
                  d="M7.08333 29.75C6.30417 29.75 5.63739 29.4728 5.083 28.9184C4.52861 28.364 4.25094 27.6968 4.25 26.9167V7.08333C4.25 6.30417 4.52767 5.63739 5.083 5.083C5.63833 4.52861 6.30511 4.25094 7.08333 4.25H26.9167C27.6958 4.25 28.3631 4.52767 28.9184 5.083C29.4737 5.63833 29.7509 6.30511 29.75 7.08333V26.9167C29.75 27.6958 29.4728 28.3631 28.9184 28.9184C28.364 29.4737 27.6968 29.7509 26.9167 29.75H7.08333ZM8.5 24.0833H25.5L20.1875 17L15.9375 22.6667L12.75 18.4167L8.5 24.0833Z"
                  fill="#CF3617"
                />
              </svg>
            )}
          </div>
          <p className="text-black text-lg font-bold font-['Inter'] leading-5 mt-4">
            {displayName}
          </p>
          {usernameDisplay ? (
            <p className="text-orange-700 text-sm font-normal font-['Inter'] leading-5">
              {usernameDisplay}
            </p>
          ) : null}
          <button
            type="button"
            onClick={openEdit}
            className="mt-2 text-orange-700 text-sm font-bold font-['Inter'] leading-4 underline"
          >
            Editar perfil
          </button>
        </div>

        {/* Hábitos de escritura */}
        <section className="mt-8">
          <h2 className="text-black text-lg font-bold font-['Inter'] leading-5 mb-2">
            Hábitos de escritura
          </h2>
          <div className="w-full h-20 bg-red-50 rounded-2xl shadow-[0px_8px_8px_0px_rgba(0,0,0,0.07)] border border-orange-700 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(207, 54, 23, 0.16)" }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87005 6.4 7.85005 10.07 9.07005 13.22C9.11005 13.32 9.15005 13.42 9.15005 13.55C9.15005 13.77 9.00005 13.97 8.80005 14.05C8.57005 14.15 8.33005 14.09 8.14005 13.93C8.08329 13.8825 8.03583 13.8248 8.00005 13.76C6.87005 12.33 6.69005 10.28 7.45005 8.64C5.78005 10 4.87005 12.3 5.00005 14.47C5.06005 14.97 5.12005 15.47 5.29005 15.97C5.43005 16.57 5.70005 17.17 6.00005 17.7C7.08005 19.43 8.95005 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.0301 19.32C18.8601 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2ZM14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5Z"
                    fill="#CF3617"
                  />
                </svg>
              </div>
              <div>
                <p className="text-orange-700 text-sm font-bold font-['Inter'] leading-4">
                  Escritura consciente
                </p>
                <p className="text-orange-700 text-sm font-normal font-['Inter'] leading-4">
                  Racha actual: 5 días
                </p>
              </div>
            </div>
            <Link
              href="#"
              className="text-orange-700 text-sm font-bold font-['Inter'] leading-4"
            >
              Ver hábitos
            </Link>
          </div>
        </section>

        {/* Textos de quienes sigo */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-black text-lg font-bold font-['Inter'] leading-5">
              Textos de quienes sigo
            </h2>
            {followingTexts.length > 0 && (
              <Link
                href="/inicio/comunidad"
                className="text-orange-700 text-sm font-bold font-['Inter'] leading-4"
              >
                Ver comunidad
              </Link>
            )}
          </div>
          {loadingFollowing ? (
            <p className="text-neutral-500 text-sm">Cargando...</p>
          ) : followingTexts.length === 0 ? (
            <p className="text-neutral-500 text-sm">
              Seguí a escritores desde la comunidad para ver sus textos aquí.
            </p>
          ) : (
            <div className="space-y-3">
              {followingTexts.map((t) => (
                <Link
                  key={t.id}
                  href={`/inicio/comunidad/texto/${t.id}`}
                  className="block"
                  aria-label={`Ver texto: ${t.title?.trim() || "Sin título"}`}
                >
                  <CommunityTextCard
                    text={t}
                    authorName={followingAuthorNames[t.user_id] ?? "un miembro"}
                    authorAvatarUrl={followingAuthorAvatars[t.user_id] ?? null}
                    imageWidth="w-28"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Guardados */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-black text-lg font-bold font-['Inter'] leading-5">
              Guardados
            </h2>
            {savedTexts.length > 0 && (
              <Link
                href="/perfil/guardados"
                className="text-orange-700 text-sm font-bold font-['Inter'] leading-4"
              >
                Ver todos
              </Link>
            )}
          </div>
          {loadingSaved ? (
            <p className="text-neutral-500 text-sm">Cargando guardados...</p>
          ) : savedTexts.length === 0 ? (
            <p className="text-neutral-500 text-sm">
              Aún no tenés textos guardados. Guardá textos desde la comunidad para verlos aquí.
            </p>
          ) : (
            <div className="space-y-3">
              {savedTexts.map((t) => (
                <Link
                  key={t.id}
                  href={`/inicio/comunidad/texto/${t.id}`}
                  className="block"
                  aria-label={`Ver texto: ${t.title?.trim() || "Sin título"}`}
                >
                  <CommunityTextCard
                    text={t}
                    authorName={savedAuthorNames[t.user_id] ?? "un miembro"}
                    authorAvatarUrl={savedAuthorAvatars[t.user_id] ?? null}
                    imageWidth="w-28"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recordatorios amorosos - conectado a profiles */}
        <section className="mt-8">
          <h2 className="text-black text-lg font-bold font-['Inter'] leading-5 mb-1">
            Recordatorios amorosos
          </h2>
          <p className="text-neutral-400 text-sm font-normal font-['Inter'] leading-5 mb-4">
            Sin culpa, si no pintó, no pasa nada...
          </p>
          {loading ? (
            <p className="text-neutral-500 text-sm">Cargando...</p>
          ) : (
            <div className="flex gap-2 flex-nowrap">
              {([1, 3, 0] as const).map((value) => {
                const label =
                  value === 1
                    ? "Diario"
                    : value === 3
                      ? "3 x semana"
                      : "No recordarme";
                const isSelected = remindersPerWeek === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={saving}
                    onClick={() => saveReminders(value)}
                    className={`flex-1 min-w-0 h-12 px-2 rounded-2xl text-sm font-medium font-['Inter'] leading-4 transition-colors ${
                      isSelected
                        ? "bg-orange-700 text-white"
                        : "bg-neutral-300/20 text-black border border-stone-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Privacidad */}
        <section className="mt-8">
          <h2 className="text-black text-lg font-bold font-['Inter'] leading-5 mb-1">
            Privacidad
          </h2>
          <p className="text-neutral-400 text-sm font-normal font-['Inter'] leading-5 mb-4">
            Configuración para compartir tus textos
          </p>

          <div className="border-b border-neutral-200 pb-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: "rgba(207, 54, 23, 0.16)" }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 9C11.2044 9 10.4413 9.31607 9.87868 9.87868C9.31607 10.4413 9 11.2044 9 12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12C15 11.2044 14.6839 10.4413 14.1213 9.87868C13.5587 9.31607 12.7956 9 12 9ZM12 17C10.6739 17 9.40215 16.4732 8.46447 15.5355C7.52678 14.5979 7 13.3261 7 12C7 10.6739 7.52678 9.40215 8.46447 8.46447C9.40215 7.52678 10.6739 7 12 7C13.3261 7 14.5979 7.52678 15.5355 8.46447C16.4732 9.40215 17 10.6739 17 12C17 13.3261 16.4732 14.5979 15.5355 15.5355C14.5979 16.4732 13.3261 17 12 17ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z"
                    fill="#CF3617"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-black text-base font-bold font-['Inter'] leading-5">
                  Quiero que me lean
                </p>
                <p className="text-black text-xs font-normal font-['Inter'] leading-5 mt-0.5">
                  Si está apagado no podrás publicar tus textos
                </p>
              </div>
              <PrivacySwitch
                checked={quieroQueMeLean}
                onChange={(checked) =>
                  handlePrivacyChange("want_to_be_read", checked)
                }
                aria-label="Quiero que me lean"
              />
            </div>
          </div>

          <div className="border-b border-neutral-200 pb-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: "rgba(207, 54, 23, 0.16)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.5 3.5C5.5 2.83696 5.76339 2.20107 6.23223 1.73223C6.70107 1.26339 7.33696 1 8 1C8.66304 1 9.29892 1.26339 9.76777 1.73223C10.2366 2.20107 10.5 2.83696 10.5 3.5C10.5 4.16304 10.2366 4.79893 9.76777 5.26777C9.29892 5.73661 8.66304 6 8 6C7.33696 6 6.70107 5.73661 6.23223 5.26777C5.76339 4.79893 5.5 4.16304 5.5 3.5ZM6.5 7C6.10217 7 5.72064 7.15804 5.43934 7.43934C5.15803 7.72064 5 8.10218 5 8.5V11C5 11.7956 5.31607 12.5587 5.87868 13.1213C6.44129 13.6839 7.20435 14 8 14C8.79565 14 9.55871 13.6839 10.1213 13.1213C10.6839 12.5587 11 11.7956 11 11V8.5C11 8.10218 10.842 7.72064 10.5607 7.43934C10.2794 7.15804 9.89782 7 9.5 7H6.5ZM4.056 7.97C4.0185 8.14417 3.99973 8.32184 4 8.5V11C3.9999 11.5352 4.10721 12.065 4.31556 12.558C4.52392 13.0509 4.82909 13.4971 5.213 13.87L5.113 13.898C4.34467 14.1036 3.52616 13.9956 2.8374 13.5979C2.14864 13.2002 1.64601 12.5452 1.44 11.777L1.051 10.327C1.00004 10.1367 0.987059 9.93826 1.0128 9.74295C1.03854 9.54765 1.1025 9.35933 1.20103 9.18875C1.29955 9.01817 1.43071 8.86866 1.58701 8.74877C1.74332 8.62888 1.92171 8.54095 2.112 8.49L4.056 7.97ZM10.786 13.87C11.1701 13.4972 11.4754 13.0511 11.684 12.5581C11.8925 12.0651 12 11.5353 12 11V8.5C11.9993 8.31733 11.9807 8.14067 11.944 7.97L13.887 8.49C14.0774 8.54094 14.2559 8.62891 14.4123 8.74887C14.5687 8.86882 14.6999 9.01843 14.7984 9.18912C14.8969 9.35982 14.9609 9.54826 14.9865 9.74367C15.0122 9.93909 14.9991 10.1376 14.948 10.328L14.56 11.777C14.4558 12.1659 14.2744 12.5298 14.0265 12.8471C13.7787 13.1644 13.4696 13.4286 13.1175 13.6239C12.7654 13.8192 12.3777 13.9416 11.9773 13.9839C11.5769 14.0262 11.1711 13.9875 10.786 13.87ZM0.999998 5C0.999998 4.46957 1.21071 3.96086 1.58578 3.58579C1.96086 3.21071 2.46957 3 3 3C3.53043 3 4.03914 3.21071 4.41421 3.58579C4.78928 3.96086 5 4.46957 5 5C5 5.53043 4.78928 6.03914 4.41421 6.41421C4.03914 6.78929 3.53043 7 3 7C2.46957 7 1.96086 6.78929 1.58578 6.41421C1.21071 6.03914 0.999998 5.53043 0.999998 5ZM11 5C11 4.46957 11.2107 3.96086 11.5858 3.58579C11.9609 3.21071 12.4696 3 13 3C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5C15 5.53043 14.7893 6.03914 14.4142 6.41421C14.0391 6.78929 13.5304 7 13 7C12.4696 7 11.9609 6.78929 11.5858 6.41421C11.2107 6.03914 11 5.53043 11 5Z"
                    fill="#CF3617"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-black text-base font-bold font-['Inter'] leading-5">
                  Quiero que me comenten
                </p>
                <p className="text-black text-xs font-normal font-['Inter'] leading-5 mt-0.5">
                  Permitir comentarios de otros usuarios
                </p>
              </div>
              <PrivacySwitch
                checked={quieroQueMeComenten}
                onChange={(checked) =>
                  handlePrivacyChange("want_comments", checked)
                }
                aria-label="Quiero que me comenten"
              />
            </div>
          </div>

          <div className="border-b border-neutral-200 pb-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-black text-sm font-bold font-['Inter'] leading-4">
                  Comentarios públicos
                </p>
                <p className="text-black text-xs font-normal font-['Inter'] leading-5 mt-0.5">
                  Los comentarios que recibas serán visibles para otros usuarios.
                </p>
              </div>
              <PrivacySwitch
                checked={comentariosPublicos}
                onChange={(checked) =>
                  handlePrivacyChange("public_comments", checked)
                }
                aria-label="Comentarios públicos"
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: "rgba(207, 54, 23, 0.16)" }}
            >
              <svg
                width="17"
                height="18"
                viewBox="0 0 17 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.1667 12.7229C13.4489 12.7229 12.8067 12.994 12.3156 13.4187L5.58167 9.66867C5.62889 9.46084 5.66667 9.25301 5.66667 9.03614C5.66667 8.81928 5.62889 8.61145 5.58167 8.40361L12.24 4.68976C12.75 5.14157 13.4206 5.42169 14.1667 5.42169C15.7344 5.42169 17 4.21084 17 2.71084C17 1.21084 15.7344 0 14.1667 0C12.5989 0 11.3333 1.21084 11.3333 2.71084C11.3333 2.92771 11.3711 3.13554 11.4183 3.34337L4.76 7.05723C4.25 6.60542 3.57944 6.3253 2.83333 6.3253C1.26556 6.3253 0 7.53614 0 9.03614C0 10.5361 1.26556 11.747 2.83333 11.747C3.57944 11.747 4.25 11.4669 4.76 11.0151L11.4844 14.7741C11.4372 14.9639 11.4089 15.1627 11.4089 15.3614C11.4089 16.8163 12.6461 18 14.1667 18C15.6872 18 16.9244 16.8163 16.9244 15.3614C16.9244 13.9066 15.6872 12.7229 14.1667 12.7229Z"
                  fill="#CF3617"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-black text-base font-bold font-['Inter'] leading-5">
                Quiero que compartan mis textos
              </p>
              <p className="text-black text-xs font-normal font-['Inter'] leading-5 mt-0.5">
                Tus textos se comparten fuera de la comunidad
              </p>
            </div>
            <PrivacySwitch
              checked={quieroQueCompartan}
              onChange={(checked) =>
                handlePrivacyChange("allow_share_texts", checked)
              }
              aria-label="Quiero que compartan mis textos"
            />
          </div>
        </section>

        {/* Ayuda y Términos */}
        <section className="mt-8 border-t border-neutral-200 pt-4">
          <Link
            href="#"
            className="flex items-center justify-between py-3 text-black text-lg font-bold font-['Inter'] leading-5"
          >
            Ayuda
            <svg
              width="20"
              height="17"
              viewBox="0 0 20 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.2148 7.6424C14.6891 8.11673 14.6891 8.88704 14.2148 9.36137L8.14338 15.4328C7.66905 15.9071 6.89874 15.9071 6.42441 15.4328C5.95008 14.9585 5.95008 14.1882 6.42441 13.7138L11.6382 8.49999L6.4282 3.28615C5.95387 2.81182 5.95387 2.0415 6.4282 1.56717C6.90253 1.09284 7.67285 1.09284 8.14718 1.56717L14.2186 7.6386L14.2148 7.6424Z"
                fill="black"
              />
            </svg>
          </Link>
          <Link
            href="#"
            className="flex items-center justify-between py-3 text-black text-lg font-bold font-['Inter'] leading-5 border-t border-neutral-200"
          >
            Términos y condiciones
            <svg
              width="20"
              height="17"
              viewBox="0 0 20 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.2148 7.6424C14.6891 8.11673 14.6891 8.88704 14.2148 9.36137L8.14338 15.4328C7.66905 15.9071 6.89874 15.9071 6.42441 15.4328C5.95008 14.9585 5.95008 14.1882 6.42441 13.7138L11.6382 8.49999L6.4282 3.28615C5.95387 2.81182 5.95387 2.0415 6.4282 1.56717C6.90253 1.09284 7.67285 1.09284 8.14718 1.56717L14.2186 7.6386L14.2148 7.6424Z"
                fill="black"
              />
            </svg>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-3 text-orange-700 text-lg font-bold font-['Inter'] leading-5 border-t border-neutral-200 disabled:opacity-60"
          >
            {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </section>
      </div>
    </div>
  );
}
