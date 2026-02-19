"use client";

const OPTIONS: { value: 0 | 1 | 2 | 3; label: string }[] = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 0, label: "No recordarme" },
];

export function ReminderSelect({
  value,
  onChange,
}: {
  value: 0 | 1 | 2 | 3;
  onChange: (value: 0 | 1 | 2 | 3) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        const isWide = opt.value === 0;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`h-9 rounded-xl text-xs font-medium leading-tight transition-colors min-w-[3rem] ${
              isWide ? "flex-1 min-w-0 px-3" : "w-12"
            } ${
              isSelected
                ? "bg-red text-white"
                : "bg-red/20 text-black"
            }`}
            aria-pressed={isSelected}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
