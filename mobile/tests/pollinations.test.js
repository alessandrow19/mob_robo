import test from 'node:test';
import assert from 'node:assert/strict';
import { getVoiceUrl } from '../build/pollinations.js';

function buildUrl(text, voice = 'onyx') {
  const prompt = encodeURIComponent(text);
  const v = encodeURIComponent(voice);
  return `https://text.pollinations.ai/${prompt}?model=openai-audio&voice=${v}&format=mp3`;
}

test('getVoiceUrl matches expected Pollinations URL with default voice', () => {
  const text = 'Olá mundo!';
  assert.equal(getVoiceUrl(text), buildUrl(text));
});

test('getVoiceUrl matches expected Pollinations URL with custom voice', () => {
  const text = 'Pergunta teste';
  const voice = 'nova';
  assert.equal(getVoiceUrl(text, voice), buildUrl(text, voice));
});
