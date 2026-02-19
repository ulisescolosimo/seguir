/** Contenedor estándar mobile: ancho máximo, centrado, padding y safe area. */
export function Screen({
  children,
  className = "",
  noNav,
}: {
  children: React.ReactNode;
  className?: string;
  /** true en pantallas sin bottom nav (ej. onboarding) */
  noNav?: boolean;
}) {
  const bottomPad = noNav
    ? "[padding-bottom:env(safe-area-inset-bottom)]"
    : "pb-28 [padding-bottom:max(7rem,env(safe-area-inset-bottom))]";
  return (
    <div
      className={`max-w-[420px] w-full mx-auto min-h-screen bg-neutral-100 pb-8 ${className}`}
    >
      {children}
    </div>
  );
}
