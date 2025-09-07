/**
 * Build Pollinations voice URL.
 * @param {string} text
 * @returns {string}
 */
export function getVoiceUrl(text) {
  return `https://text.pollinations.ai/${encodeURIComponent(text)}?model=openai-audio&voice=Shimmer`;
}
