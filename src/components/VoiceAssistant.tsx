"use client";

import { useState } from "react";

export default function VoiceAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
    if (isProcessing) return;

    const SpeechRecognitionClass =
      (window as Window & {
        webkitSpeechRecognition?: typeof SpeechRecognition;
      }).SpeechRecognition ||
      (window as Window & {
        webkitSpeechRecognition?: typeof SpeechRecognition;
      }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "pt-BR";
    recognition.start();
    setIsProcessing(true);

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      try {
        const textResponse = await fetch(
          `https://text.pollinations.ai/${encodeURIComponent(transcript)}`
        );
        const answer = await textResponse.text();
        const audioUrl = `https://pollinations.ai/api/voice/speak?text=${encodeURIComponent(
          answer
        )}`;
        const audio = new Audio(audioUrl);
        await audio.play();
      } catch (error) {
        console.error("Erro ao obter resposta:", error);
      } finally {
        setIsProcessing(false);
      }
    };

    recognition.onerror = () => {
      setIsProcessing(false);
    };
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
    >
      {isProcessing ? "Escutando..." : "Fale com o Robô"}
    </button>
  );
}

