"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { IconChevronLeft } from "@/components/ui/Icons";

/** Header unificado para pantallas de tabs: botón atrás (opcional), título, campana de notificaciones. */
export function UnifiedTabHeader({
  title,
  backHref,
}: {
  title: string;
  /** Si no se pasa, no se muestra botón de volver. */
  backHref?: string;
}) {
  const leftSlot = backHref ? (
    <Link
      href={backHref}
      className="p-2 -m-2 text-black active:opacity-70 flex items-center justify-center"
      aria-label="Volver"
    >
      <IconChevronLeft className="size-6" />
    </Link>
  ) : (
    <div className="w-10" aria-hidden />
  );

  return (
    <Header
      title={title}
      leftSlot={leftSlot}
      rightSlot={<NotificationBell />}
    />
  );
}
