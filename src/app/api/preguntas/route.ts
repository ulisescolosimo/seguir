import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `Sos un asistente para escritores. Tu rol es hacer preguntas reflexivas sobre el texto que te pasan, para ayudar al autor a seguir escribiendo. No respondés las preguntas ni escribís por la persona.

Reglas:
- Usá siempre castellano argentino (voseo: vos, querés, pensás, etc.; vocabulario rioplatense cuando corresponda)
- Generá exactamente 3 preguntas cortas (una por línea)
- Las preguntas deben invitar a profundizar. Cuando el texto lo permita, orientá las preguntas hacia alguno de estos ejes (no hace falta tocar los tres en cada respuesta): descripciones (qué se describe, qué se omite, ritmo); escena (dónde ocurre, qué está en juego, tensión o cambio); personajes (gestos, voz, deseos, obstáculos); interioridad (pensamientos, emociones, sensaciones, lo no dicho); narrador (voz, distancia con los personajes, qué sabe y qué no).
- Estilo: amable, directo, sin exceso de formalidad
- Si el texto está vacío o es muy breve, generá preguntas genéricas para arrancar a escribir
- Devolvé solo las 3 preguntas, una por línea, sin numeración ni prefijos`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Faltan configuración de OpenAI (OPENAI_API_KEY)" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const preguntaIndex = typeof body.regenerarIndex === "number" ? body.regenerarIndex : null;

    const openai = new OpenAI({ apiKey });
    const userContent =
      text ||
      "(El autor aún no escribió nada. Generá 3 preguntas para ayudarlo a arrancar a escribir.)";

    let prompt = `Texto del autor:\n\n${userContent}\n\n---\n\nGenerá 3 preguntas para que el autor siga escribiendo:`;
    if (preguntaIndex !== null && preguntaIndex >= 0 && preguntaIndex <= 2) {
      prompt = `Texto del autor:\n\n${userContent}\n\n---\n\nGenerá UNA sola pregunta diferente (índice ${preguntaIndex + 1}) para que el autor siga escribiendo. Respondé solo con esa pregunta, sin numeración.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";

    if (preguntaIndex !== null && preguntaIndex >= 0 && preguntaIndex <= 2) {
      return NextResponse.json({ preguntas: [raw] });
    }

    const preguntas = raw
      .split("\n")
      .map((p) => p.replace(/^[\d.)\-\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    if (preguntas.length === 0) {
      return NextResponse.json(
        { error: "No se pudieron generar preguntas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preguntas });
  } catch (err) {
    console.error("[api/preguntas]", err);
    const message = err instanceof Error ? err.message : "Error al generar preguntas";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
