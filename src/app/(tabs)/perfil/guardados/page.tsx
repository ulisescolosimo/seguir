"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CommunityTextCard } from "@/components/community/CommunityTextCard";
import type { CommunityTextCardData } from "@/components/community/CommunityTextCard";
import { Header } from "@/components/layout/Header";
import { IconChevronLeft } from "@/components/ui/Icons";

export default function GuardadosPage() {
  const [savedTexts, setSavedTexts] = useState<CommunityTextCardData[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [authorAvatars, setAuthorAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
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
            setAuthorNames(nameMap);
            setAuthorAvatars(avatarMap);
          } else {
            setAuthorNames({});
            setAuthorAvatars({});
          }
        } else {
          setSavedTexts([]);
          setAuthorNames({});
          setAuthorAvatars({});
        }
      } catch {
        setSavedTexts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 overflow-hidden">
      <Header
        title="Textos guardados"
        leftSlot={
          <Link href="/perfil" className="p-2 -m-2 text-black" aria-label="Volver al perfil">
            <IconChevronLeft className="size-7" />
          </Link>
        }
      />
      <div className="w-full h-0 border-t border-zinc-300 shrink-0" aria-hidden />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[384px] mx-auto px-5 py-4 pb-8">
          {loading ? (
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
                    authorName={authorNames[t.user_id] ?? "un miembro"}
                    authorAvatarUrl={authorAvatars[t.user_id] ?? null}
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
