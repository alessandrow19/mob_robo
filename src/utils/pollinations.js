// Ajuste a voz se quiser: "alloy", "echo", "fable", "nova", etc.
// (model=openai-audio aceita voice e format=mp3/wav)
export function getVoiceUrl(text, 
  voice = "ash") {
  const prompt = encodeURIComponent(text);
  const v = encodeURIComponent(voice);
  // Repare em model=openai-audio e format=mp3
  return `https://text.pollinations.ai/${prompt}?model=openai-audio&voice=${v}&format=mp3`;
}
