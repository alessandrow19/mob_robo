export function handleSmileInteraction(
  isVoiceSessionActive: boolean,
  incrementListenTrigger: (updater: (t: number) => number) => void
) {
  // Evitamos múltiplos disparos simultâneos do assistente de voz.
  if (!isVoiceSessionActive) {
    incrementListenTrigger((t) => t + 1);
  }
}

export function handleAngryInteraction(
  isListening: boolean,
  setStopTrigger: (updater: (t: number) => number) => void
) {
  if (isListening) {
    setStopTrigger((t) => t + 1);
  }
}

