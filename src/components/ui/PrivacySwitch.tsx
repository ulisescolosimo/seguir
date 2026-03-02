"use client";

export function PrivacySwitch({
  checked,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className="relative inline-flex flex-shrink-0 h-6 w-11 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
    >
      <span
        className={`absolute inset-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-orange-700" : "bg-neutral-300"
        }`}
      />
      <span
        className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out ${
          checked ? "left-[22px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}
