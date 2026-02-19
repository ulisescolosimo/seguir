/** Header de pantalla con título y slots opcionales (sin back en tabs). */
export function Header({
  title,
  leftSlot,
  rightSlot,
}: {
  title: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-neutral-200 bg-neutral-100 shrink-0">
      <div className="w-10 flex items-center justify-start">{leftSlot ?? null}</div>
      <h1 className="text-lg font-semibold text-neutral-900 truncate flex-1 text-center px-2">
        {title}
      </h1>
      <div className="w-10 flex items-center justify-end">{rightSlot ?? null}</div>
    </header>
  );
}
