import { NextRequest, NextResponse } from "next/server";

import { buildGroqTtsBody, resolveGroqConfig } from "@/utils/groqConfig";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";

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
    const groqConfig = resolveGroqConfig();
    console.log("[Groq] Config resolvida:", groqConfig);

    // ===== VALIDAÇÃO PRÉVIA =====
    console.log("[Groq] API Key presente?", !!apiKey);
    console.log(
      "[Groq] API Key primeiros 10 chars:",
      apiKey.substring(0, 10) + "..."
    );
    console.log("[Groq] URL do Chat:", GROQ_CHAT_URL);
    console.log("[Groq] URL do TTS:", GROQ_TTS_URL);

    // ===== CHAT =====
    console.log("[Groq] Iniciando chamada de chat...");
    const chatPayload = {
      model: groqConfig.chatModel,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    };
    console.log("[Groq] Chat payload:", JSON.stringify(chatPayload, null, 2));

    let chatResponse;
    try {
      chatResponse = await fetch(GROQ_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(chatPayload),
      });
    } catch (fetchError) {
      console.error("[Groq] ERRO NO FETCH DE CHAT:", fetchError);
      console.error(
        "[Groq] Mensagem:",
        fetchError instanceof Error ? fetchError.message : String(fetchError)
      );
      console.error(
        "[Groq] Stack:",
        fetchError instanceof Error ? fetchError.stack : "sem stack"
      );

      return NextResponse.json(
        {
          error: "Falha ao conectar à API Groq (chat)",
          details:
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError),
          url: GROQ_CHAT_URL,
        },
        { status: 502 }
      );
    }

    console.log("[Groq] Chat response status:", chatResponse.status);

    if (!chatResponse.ok) {
      const reason = await safeReadError(chatResponse);
      console.error("[Groq] Chat falhou:", reason);
      return NextResponse.json(
        { error: `Falha ao consultar Groq (chat): ${reason}` },
        { status: 502 }
      );
    }

    const chatJson = await chatResponse.json();
    console.log(
      "[Groq] Chat response JSON:",
      JSON.stringify(chatJson, null, 2)
    );

    const answer: string | undefined = chatJson?.choices?.[0]?.message?.content;

    if (!answer) {
      console.error("[Groq] Answer vazio. Response:", chatJson);
      return NextResponse.json(
        { error: "Resposta da Groq sem conteúdo." },
        { status: 502 }
      );
    }

    console.log("[Groq] Answer recebida:", answer);

    // ===== TTS =====
    console.log("[Groq] Iniciando chamada de TTS...");
    const ttsPayload = buildGroqTtsBody(answer, groqConfig);
    console.log("[Groq] TTS payload:", JSON.stringify(ttsPayload, null, 2));

    let ttsResponse;
    try {
      ttsResponse = await fetch(GROQ_TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(ttsPayload),
      });
    } catch (fetchError) {
      console.error("[Groq] ERRO NO FETCH DE TTS:", fetchError);
      console.error(
        "[Groq] Mensagem:",
        fetchError instanceof Error ? fetchError.message : String(fetchError)
      );
      console.error(
        "[Groq] Stack:",
        fetchError instanceof Error ? fetchError.stack : "sem stack"
      );

      return NextResponse.json(
        {
          error: "Falha ao conectar à API Groq (TTS)",
          details:
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError),
          url: GROQ_TTS_URL,
        },
        { status: 502 }
      );
    }

    console.log("[Groq] TTS response status:", ttsResponse.status);

    if (!ttsResponse.ok) {
      const reason = await safeReadError(ttsResponse);
      console.error("[Groq] TTS falhou:", reason);
      return NextResponse.json(
        { error: `Falha ao sintetizar fala: ${reason}` },
        { status: 502 }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    console.log(
      "[Groq] Audio buffer recebido, tamanho:",
      audioBuffer.byteLength
    );

    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    const contentType = ttsResponse.headers.get("content-type") ?? "audio/mpeg";

    console.log("[Groq] Sucesso! Retornando áudio...");

    return NextResponse.json({
      answer,
      audioBase64,
      contentType,
    });
  } catch (error) {
    console.error("[Groq] ERRO NÃO CAPTURADO NO TRY-CATCH:", error);
    console.error("[Groq] Tipo:", typeof error);
    console.error(
      "[Groq] Mensagem:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "[Groq] Stack trace:",
      error instanceof Error ? error.stack : "sem stack"
    );

    return NextResponse.json(
      {
        error: "Erro interno durante a chamada à Groq.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return typeof data?.error === "string" ? data.error : JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return `status ${response.status}`;
    }
  }
}
