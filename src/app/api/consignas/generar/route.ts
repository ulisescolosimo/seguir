import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const LIMITE_POR_DIA = 3;

const SYSTEM_PROMPT = `Sos un asistente para escritores. Tu rol es generar consignas de escritura creativa: propuestas breves que inspiren a escribir (ficción, poesía, no ficción).

Reglas:
- Usá siempre castellano argentino (voseo: vos, escribí, etc.)
- Generá UNA sola consigna por respuesta
- La consigna debe ser clara, sugerente y abierta (que invite a escribir, no que cierre)
- Podés proponer restricciones formales (ej. "en presente", "en diez renglones") o temáticas
- Devolvé un JSON con exactamente: { "titulo": "Título corto o frase de la consigna", "descripcion": "Enunciado completo de la consigna para que el autor sepa qué hacer", "tipo": "RECURSOS" | "TEMAS" | "FICCIÓN" | "POESÍA" | "NO FICCIÓN" | "OTRO" }
- titulo: corto, puede ser el mismo que la consigna si es una sola frase
- descripcion: el texto completo de la consigna; si es una sola frase podés repetirla o ampliarla un poco
- tipo: RECURSOS si apunta a técnica/forma, TEMAS si apunta a situación/tema, o los otros si aplica`;

/** Cuenta cuántas generaciones llevó hoy el usuario (por fecha UTC). */
async function getUsosRestantes(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("consigna_ia_generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfDay.toISOString());
  if (error) return LIMITE_POR_DIA; // Si la tabla no existe aún, no limitar
  const usados = count ?? 0;
  return Math.max(0, LIMITE_POR_DIA - usados);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const usosRestantes = await getUsosRestantes(supabase);
    return NextResponse.json({ usosRestantes });
  } catch {
    return NextResponse.json({ usosRestantes: LIMITE_POR_DIA }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Tenés que iniciar sesión para generar consignas con IA." },
        { status: 401 }
      );
    }

    let usosRestantes = await getUsosRestantes(supabase);
    if (usosRestantes <= 0) {
      return NextResponse.json(
        {
          error: "Llegaste al límite de 3 generaciones por día. Mañana podés generar de nuevo.",
          usosRestantes: 0,
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Faltan configuración de OpenAI (OPENAI_API_KEY)" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const formatoId = typeof body.formato_id === "string" ? body.formato_id.trim() : null;
    const tema = typeof body.tema === "string" ? body.tema.trim() : null;
    const excluirRaw = Array.isArray(body.excluir) ? body.excluir : [];
    const excluir = excluirRaw
      .filter((x: unknown) => x && typeof x === "object" && ("titulo" in x || "descripcion" in x))
      .map((x: { titulo?: string; descripcion?: string }) => ({
        titulo: typeof x.titulo === "string" ? x.titulo.trim() : "",
        descripcion: typeof x.descripcion === "string" ? x.descripcion.trim() : "",
      }))
      .filter((x) => x.titulo || x.descripcion);

    let formatoNombre: string | null = null;
    if (formatoId) {
      const { data: formato } = await supabase
        .from("formatos_texto")
        .select("nombre, categoria")
        .eq("id", formatoId)
        .single();
      if (formato?.nombre) formatoNombre = formato.nombre;
    }

    const { error: insertError } = await supabase.from("consigna_ia_generations").insert({
      user_id: user.id,
    });
    if (insertError) {
      console.error("[api/consignas/generar] insert", insertError);
      return NextResponse.json(
        { error: "No se pudo registrar la generación." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });
    let userContent = "Generá una consigna de escritura creativa nueva y distinta.";
    if (tema) {
      userContent = `Generá una consigna de escritura creativa sobre este tema o idea: "${tema}".`;
    } else if (formatoNombre) {
      userContent = `Generá una consigna de escritura creativa para el género o formato: ${formatoNombre}. La consigna debe inspirar a escribir un texto de ese tipo (${formatoNombre}).`;
    }
    if (excluir.length > 0) {
      const listaExcluir = excluir
        .map((c) => `- "${c.titulo}"${c.descripcion ? `: ${c.descripcion}` : ""}`)
        .join("\n");
      userContent += `\n\nNo repitas ninguna de estas consignas (el usuario ya las vio o descartó):\n${listaExcluir}\n\nGenerá una consigna distinta a todas las de la lista.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent + "\n\nDevolvé solo el JSON, sin markdown ni código." },
      ],
      temperature: 0.9,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = (() => {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      try {
        return JSON.parse(jsonMatch[0]) as { titulo?: string; descripcion?: string; tipo?: string };
      } catch {
        return null;
      }
    })();

    if (!parsed?.titulo) {
      return NextResponse.json(
        { error: "No se pudo generar la consigna" },
        { status: 500 }
      );
    }

    const tipoValido = ["RECURSOS", "TEMAS", "FICCIÓN", "POESÍA", "NO FICCIÓN", "OTRO"].includes(
      parsed.tipo ?? ""
    )
      ? parsed.tipo
      : "OTRO";

    usosRestantes = await getUsosRestantes(supabase);

    return NextResponse.json({
      titulo: String(parsed.titulo).trim() || "Consigna",
      descripcion: String(parsed.descripcion ?? "").trim(),
      tipo: tipoValido,
      formato_nombre: formatoNombre ?? undefined,
      usosRestantes,
    });
  } catch (err) {
    console.error("[api/consignas/generar]", err);
    const message = err instanceof Error ? err.message : "Error al generar consigna";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
