"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { Screen } from "@/components/layout/Screen";

const fullScreenPaths = [];

export function TabsLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullScreen = fullScreenPaths.some((p) => pathname.startsWith(p));

  if (isFullScreen) {
    return <Screen noNav>{children}</Screen>;
  }

  return (
    <Screen>
      <main className="flex-1">{children}</main>
      <BottomNav />
    </Screen>
  );
}
