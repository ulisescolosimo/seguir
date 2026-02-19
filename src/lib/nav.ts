/** Items del bottom nav: label y href para next/link */
export const bottomNavItems = [
  { label: "Escribir", href: "/escribir" },
  { label: "Consignas", href: "/consignas" },
  { label: "Inicio", href: "/inicio" },
  { label: "Recursos", href: "/recursos" },
  { label: "Perfil", href: "/perfil" },
] as const;

export type NavItem = (typeof bottomNavItems)[number];

/** Título de header por ruta de tabs */
export const tabTitles: Record<string, string> = {
  "/inicio": "Inicio",
  "/escribir": "Escribir",
  "/consignas": "Consignas",
  "/recursos": "Recursos",
  "/perfil": "Perfil",
};
