"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ValueCard } from "@/components/onboarding/ValueCard";
import { PillSelect } from "@/components/onboarding/PillSelect";
import { ReminderSelect } from "@/components/onboarding/ReminderSelect";
import { createClient } from "@/lib/supabase/client";
import { saveOnboardingPrefs } from "@/lib/onboardingPrefs";
import type { StartMode } from "@/types/onboarding";

const PLACEHOLDER_ICON = (
  <div className="w-5 h-5 rounded-sm bg-red" aria-hidden />
);

export default function SeguirPage() {
  const router = useRouter();
  const [startMode, setStartMode] = useState<StartMode>("zero");
  const [remindersPerWeek, setRemindersPerWeek] = useState<0 | 1 | 2 | 3>(1);

  async function handleEmpezar() {
    const supabase = createClient();
    await saveOnboardingPrefs(
      { onboardingCompleted: true, startMode, remindersPerWeek },
      supabase
    );
    router.refresh();
    router.push("/inicio");
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100">
      <Header title="Seguir" />
      <div className="flex-1 px-5 pb-6 flex flex-col gap-8">
        <div className="flex justify-center mt-6">
          <Image
            src="/images/Vector.png"
            alt=""
            width={40}
            height={40}
            className="h-8 w-auto"
          />
        </div>
        <p className="text-base font-normal text-black leading-5 text-center">
          Un espacio íntimo de escritura.
          <br />
          El lugar en el que seguís escribiendo.
        </p>

        <div className="flex flex-col gap-4">
          <ValueCard
            title="Acá escribís vos"
            description="Valoramos tu voz auténtica por encima de todo."
            icon={PLACEHOLDER_ICON}
          />
          <ValueCard
            title="Respetamos tu estilo"
            description="Primero sale. Después se afina."
            icon={PLACEHOLDER_ICON}
          />
          <ValueCard
            title="La IA sólo hace preguntas"
            description="Herramientas para profundizar, no para reemplazar."
            icon={PLACEHOLDER_ICON}
          />
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-black leading-5">
            ¿Cómo querés empezar hoy?
          </h2>
          <PillSelect value={startMode} onChange={setStartMode} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-black leading-6">
            ¿Cuántas veces por semana querés que te recordemos escribir?
          </h2>
          <ReminderSelect value={remindersPerWeek} onChange={setRemindersPerWeek} />
        </section>

        <div className="mt-auto pt-4 pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            onClick={handleEmpezar}
            className="w-full h-14 bg-red text-white text-base font-bold leading-5 tracking-wider rounded-[47px] hover:bg-red/90 active:bg-red/80 transition-colors"
          >
            EMPEZAR
          </button>
        </div>
      </div>
    </div>
  );
}
