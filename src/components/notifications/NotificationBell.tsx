"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fetchNotifications,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRow,
  type NotificationPayload,
} from "@/lib/notifications";
import { IconBell } from "@/components/ui/Icons";
import { IconComment } from "@/components/ui/Icons";
import { IconBookmark } from "@/components/ui/Icons";
import { IconEscribirDesdeCero } from "@/components/ui/Icons";

function formatNotificationTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function NotificationItem({
  n,
  onMarkRead,
  onClose,
}: {
  n: NotificationRow;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  const payload = n.payload as NotificationPayload;
  const isComment = n.type === "comment" && "actor_name" in payload;
  const isSaved = n.type === "saved_text" && "text_title" in payload;
  const isReminder = n.type === "reminder";
  const textId = isComment || isSaved ? (payload as { text_id: string }).text_id : null;
  const href = textId ? `/inicio/comunidad/texto/${textId}` : null;

  const handleClick = () => {
    onMarkRead(n.id);
    onClose();
  };

  let label = "";
  let icon = null;
  if (isComment) {
    const p = payload as { actor_name: string; body_preview?: string };
    label = `${p.actor_name} comentó tu texto${p.body_preview ? `: "${p.body_preview.slice(0, 40)}${p.body_preview.length > 40 ? "…" : ""}"` : ""}`;
    icon = <IconComment className="w-4 h-4 shrink-0 text-neutral-500" />;
  } else if (isSaved) {
    const p = payload as { text_title: string };
    label = `Alguien guardó tu texto "${p.text_title}"`;
    icon = <IconBookmark className="w-4 h-4 shrink-0 text-neutral-500" />;
  } else if (isReminder) {
    label = "Recordatorio: es un buen momento para escribir.";
    icon = <IconEscribirDesdeCero className="w-4 h-4 shrink-0 text-neutral-500" />;
  }

  const content = (
    <div className="flex gap-3 p-3 min-h-[44px] sm:min-h-0 rounded-xl active:bg-neutral-100 hover:bg-neutral-100 transition-colors text-left w-full items-start">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-5 ${n.read_at ? "text-neutral-600" : "text-black font-medium"}`}>
          {label}
        </p>
        <span className="text-neutral-400 text-xs">{formatNotificationTime(n.created_at)}</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={handleClick} className="block">
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={handleClick} className="block w-full">
      {content}
    </button>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, count] = await Promise.all([
      fetchNotifications(supabase),
      countUnreadNotifications(supabase),
    ]);
    setNotifications(list);
    setUnreadCount(count);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => { load(); }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(supabase, id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(supabase);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 -m-1.5 text-neutral-600 active:text-black rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red/30 focus:ring-offset-1"
        aria-label={open ? "Cerrar notificaciones" : "Ver notificaciones"}
        aria-expanded={open}
      >
        <IconBell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 right-0 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-red text-white text-[10px] font-bold rounded-full leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-2 right-2 top-[3.75rem] z-50 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-1 sm:w-[min(320px,calc(100vw-2rem))] max-h-[calc(100vh-5rem)] sm:max-h-[70vh] bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b border-neutral-100">
            <h2 className="text-sm sm:text-base font-bold text-black">Notificaciones</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-red text-xs sm:text-sm font-bold hover:underline touch-manipulation"
              >
                Marcar todas leídas
              </button>
            )}
          </div>
          <div className="max-h-[calc(100vh-8rem)] sm:max-h-[60vh] overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="p-4 text-neutral-400 text-sm">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-neutral-500 text-sm text-center">
                No tenés notificaciones aún.
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <NotificationItem
                      n={n}
                      onMarkRead={handleMarkRead}
                      onClose={() => setOpen(false)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
