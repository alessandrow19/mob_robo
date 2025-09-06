"use client";

import { useState } from "react";

export default function VoiceAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
    if (isProcessing) return;

    // Add type for SpeechRecognition if not present
    type SpeechRecognitionType = typeof window & {
      SpeechRecognition?: any;
      webkitSpeechRecognition?: any;
    };

    const SpeechRecognitionClass =
      (window as SpeechRecognitionType).SpeechRecognition ||
      (window as SpeechRecognitionType).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "pt-BR";
    recognition.start();
    setIsProcessing(true);

    recognition.onresult = async (event: Event) => {
      // Type assertion to access results property
      const speechEvent = event as any;
      const transcript = speechEvent.results[0][0].transcript;
      try {
        const textResponse = await fetch(
          `https://text.pollinations.ai/${encodeURIComponent(transcript)}`
        );
        const answer = await textResponse.text();
        const audioUrl = `https://pollinations.ai/api/voice/speak?text=${encodeURIComponent(
          answer
        )}&format=mp3`;
        const audioResponse = await fetch(audioUrl, {
          headers: {
            Authorization: "Bearer yaIazPLvX25cX_7v"
          }
        });
        const audioBlob = await audioResponse.blob();
        const audio = new Audio(URL.createObjectURL(audioBlob));
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

