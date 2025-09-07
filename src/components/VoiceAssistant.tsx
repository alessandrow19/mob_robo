"use client";

import { useState } from "react";

import { getVoiceUrl } from "../utils/pollinations.js";


export default function VoiceAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
    if (isProcessing) return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;


    if (!SpeechRecognitionClass) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "pt-BR";
    recognition.start();
    setIsProcessing(true);


    recognition.onresult = async (event :any) => {
      const transcript = event.results[0][0].transcript;
      // Prompt para restringir respostas à astronomia
      const astronomyPrompt = `Responda apenas perguntas sobre astronomia. Pergunta: ${transcript}`;
      try {
        const textResponse = await fetch(
          `/api/pollinate?q=${encodeURIComponent(astronomyPrompt)}`,
          { cache: "no-store" }
        );
          if (!textResponse.ok) {
            throw new Error("Falha ao obter texto");
          }
          const answer = await textResponse.text();
        try {
            const audioResponse = await fetch(getVoiceUrl(answer), {
              headers: {
                Authorization: "Bearer x8ufgVqJT9VwBQo7"
              }
            });
          if (!audioResponse.ok) {
            console.error("Falha ao obter áudio do Pollinations", audioResponse.status, audioResponse.statusText);
            throw new Error("Falha ao obter áudio");
          }
          const blob = await audioResponse.blob();
          if (blob.size === 0) {
            console.error("Blob de áudio vazio");
            throw new Error("Áudio vazio");
          }
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          let playPromise;
          try {
            playPromise = audio.play();
            if (playPromise !== undefined) {
              await playPromise;
            }
          } catch (playError) {
            console.error("Erro ao tentar reproduzir áudio gerado pelo Pollinations:", playError);
            throw playError;
          } finally {
            audio.onended = () => URL.revokeObjectURL(url);
          }
        } catch (audioError) {
          // Só cai aqui se realmente não conseguir tocar o áudio do Pollinations
          console.error("Erro final ao reproduzir áudio Pollinations, usando fallback SpeechSynthesis:", audioError);
          const utterance = new SpeechSynthesisUtterance(answer);
          utterance.lang = "pt-BR";
          speechSynthesis.speak(utterance);
        }

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

