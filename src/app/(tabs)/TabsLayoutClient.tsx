"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Screen } from "@/components/layout/Screen";
import { IconSearch } from "@/components/ui/Icons";
import { tabTitles } from "@/lib/nav";

const fullScreenPaths = ["/escribir/editar", "/escribir/publicar"];

export function TabsLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullScreen = fullScreenPaths.some((p) => pathname.startsWith(p));
  const title = tabTitles[pathname] ?? "Seguir";

  if (isFullScreen) {
    return <Screen noNav>{children}</Screen>;
  }

  return (
    <Screen>
      <Header
        title={title}
        rightSlot={
          pathname === "/inicio" ? (
            <button type="button" className="p-1 text-red" aria-label="Buscar">
              <IconSearch className="size-8" />
            </button>
          ) : undefined
        }
      />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </Screen>
  );
}
