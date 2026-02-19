"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNavItems } from "@/lib/nav";
import {
  IconNavEscribir,
  IconNavConsignas,
  IconNavInicio,
  IconNavRecursos,
  IconNavPerfil,
} from "@/components/ui/Icons";

const icons: Record<string, React.ReactNode> = {
  Escribir: <IconNavEscribir className="size-6" />,
  Consignas: <IconNavConsignas className="size-6" />,
  Inicio: <IconNavInicio className="size-6" />,
  Recursos: <IconNavRecursos className="size-6" />,
  Perfil: <IconNavPerfil className="size-6" />,
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-neutral-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] pt-2 z-10"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-around">
        {bottomNavItems.map(({ label, href }) => {
          const isActive = pathname === href;
          const colorClass = isActive ? "text-red" : "text-red/80";
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 min-w-0 flex-1 ${colorClass}`}
              aria-current={isActive ? "page" : undefined}
            >
              {icons[label] ?? null}
              <span className="text-xs font-medium truncate max-w-full">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
