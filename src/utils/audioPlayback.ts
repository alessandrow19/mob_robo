export type AudioPlaybackParams = {
  audio: HTMLAudioElement;
  url: string;
  onAudioStart?: () => void;
  onResponsePendingEnd?: () => void;
  onPlaybackFinished: () => void;
};

/**
 * Centraliza a orquestração da reprodução do áudio para que possamos testá-la isoladamente.
 * A ideia é garantir que o reset só ocorra após o evento `onended`, evitando cortes prematuros.
 */
export async function playAudioResponse({
  audio,
  url,
  onAudioStart,
  onResponsePendingEnd,
  onPlaybackFinished,
}: AudioPlaybackParams): Promise<void> {
  let hasFinished = false;

  // Quando o áudio termina naturalmente, liberamos o URL e sinalizamos o fim do fluxo.
  audio.onended = () => {
    if (hasFinished) return;
    hasFinished = true;
    URL.revokeObjectURL(url);
    onPlaybackFinished();
  };

  if (onResponsePendingEnd) {
    onResponsePendingEnd();
  }

  const playPromise = audio.play();

  try {
    if (typeof playPromise?.then === "function") {
      await playPromise;
    }

    if (onAudioStart) {
      onAudioStart();
    }
  } catch (error) {
    audio.onended = null;
    URL.revokeObjectURL(url);
    throw error;
  }
}
