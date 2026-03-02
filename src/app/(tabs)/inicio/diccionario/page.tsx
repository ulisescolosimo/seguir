import { fetchPalabrasConConteo } from "@/lib/diccionario";
import { DiccionarioClient } from "@/components/diccionario/DiccionarioClient";

export const dynamic = "force-dynamic";

export default async function DiccionarioPage() {
  let initialPalabras: Awaited<ReturnType<typeof fetchPalabrasConConteo>> = [];
  try {
    initialPalabras = await fetchPalabrasConConteo();
  } catch {
    // El cliente mostrará estado vacío o reintentará
  }
  return <DiccionarioClient initialPalabras={initialPalabras} />;
}
