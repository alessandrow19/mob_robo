"use client";

import type { ReactNode } from "react";

type ListeningIndicatorProps = {
  /**
   * Exibe o indicador apenas quando o microfone está em modo de captura ativa.
   */
  isListening: boolean;
};

/**
 * Mostra ao usuário que o assistente está ouvindo e que o áudio está sendo capturado.
 * Mantemos a mensagem simples e direta para evitar ambiguidades.
 */
export default function ListeningIndicator({
  isListening,
}: ListeningIndicatorProps): ReactNode {
  if (!isListening) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 flex justify-center"
    >
      <div
        className="flex items-center gap-3 rounded-full border border-cyan-400/70 bg-black/80 px-5 py-3 text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.45)] backdrop-blur-sm"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-300" />
        </span>
        <div className="flex flex-col text-sm font-semibold leading-tight">
          <span>Estamos escutando...</span>
          <span className="text-xs font-normal text-cyan-200">
            Pode falar, o áudio está sendo capturado.
          </span>
        </div>
      </div>
    </div>
  );
}
