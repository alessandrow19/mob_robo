/**
 * Build Pollinations voice URL.
 * @param {string} text
 * @returns {string}
 */
export function getVoiceUrl(text) {
  return `https://pollinations.ai/api/voice/speak?text=${encodeURIComponent(text)}`;
}
