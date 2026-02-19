/** Card de valor con icono placeholder en cuadrado naranja suave. */
export function ValueCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl shadow-[0px_2px_2px_0px_rgba(0,0,0,0.05)]">
      <div
        className="shrink-0 w-16 h-16 rounded-2xl bg-red/20 flex items-center justify-center text-red"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold text-black leading-5">{title}</h3>
        <p className="text-sm font-normal text-black leading-4 mt-1">
          {description}
        </p>
      </div>
    </div>
  );
}
