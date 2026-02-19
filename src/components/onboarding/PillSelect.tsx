"use client";

import type { StartMode } from "@/types/onboarding";

const OPTIONS: { value: StartMode; label: string }[] = [
  { value: "zero", label: "Escribir desde cero" },
  { value: "prompts", label: "Escribir con consignas" },
];

export function PillSelect({
  value,
  onChange,
}: {
  value: StartMode;
  onChange: (value: StartMode) => void;
}) {
  return (
    <div className="flex w-full flex-nowrap gap-0">
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 min-w-0 rounded-[47px] h-9 px-3 text-xs font-medium leading-tight transition-colors first:rounded-r-none last:rounded-l-none ${
              isSelected
                ? "bg-red text-white"
                : "bg-neutral-200 text-black"
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
