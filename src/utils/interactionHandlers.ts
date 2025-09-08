export function handleSmileInteraction(
  isListening: boolean,
  setIsListening: (value: boolean) => void,
  setListenTrigger: (updater: (t: number) => number) => void
) {
  if (!isListening) {
    setIsListening(true);
    setListenTrigger((t) => t + 1);
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

