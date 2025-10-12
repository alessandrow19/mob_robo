import { NextRequest, NextResponse } from "next/server";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const DEFAULT_CHAT_MODEL = "mixtral-8x7b-32768";
const DEFAULT_TTS_MODEL = "gpt-4o-mini-tts";
const DEFAULT_TTS_VOICE = "alloy";

/**
 * Conversa com a API da Groq para gerar o texto e sintetizar a resposta.
 * Mantemos toda a integração do lado do servidor para proteger a API key
 * e para que o front receba apenas os dados necessários para tocar o áudio.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  const payload = await request.json().catch(() => null);
  const prompt = payload?.prompt;

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Corpo da requisição inválido. Informe 'prompt'." },
      { status: 400 }
    );
  }

  const systemMessage =
    "Você é um astrônomo que responde apenas em português do Brasil e fala somente sobre astronomia.";

  try {
    const chatResponse = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_CHAT_MODEL ?? DEFAULT_CHAT_MODEL,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!chatResponse.ok) {
      const reason = await safeReadError(chatResponse);
      return NextResponse.json(
        { error: `Falha ao consultar Groq (chat): ${reason}` },
        { status: 502 }
      );
    }

    const chatJson = await chatResponse.json();
    const answer: string | undefined = chatJson?.choices?.[0]?.message?.content;

    if (!answer) {
      return NextResponse.json(
        { error: "Resposta da Groq sem conteúdo." },
        { status: 502 }
      );
    }

    const ttsResponse = await fetch(GROQ_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_TTS_MODEL ?? DEFAULT_TTS_MODEL,
        voice: process.env.GROQ_TTS_VOICE ?? DEFAULT_TTS_VOICE,
        input: answer,
      }),
    });

    if (!ttsResponse.ok) {
      const reason = await safeReadError(ttsResponse);
      return NextResponse.json(
        { error: `Falha ao sintetizar fala: ${reason}` },
        { status: 502 }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    const contentType =
      ttsResponse.headers.get("content-type") ?? "audio/mpeg";

    return NextResponse.json({
      answer,
      audioBase64,
      contentType,
    });
  } catch (error) {
    console.error("Erro ao conversar com a Groq:", error);
    return NextResponse.json(
      { error: "Erro interno durante a chamada à Groq." },
      { status: 500 }
    );
  }
}

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return typeof data?.error === "string"
      ? data.error
      : JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return `status ${response.status}`;
    }
  }
}
