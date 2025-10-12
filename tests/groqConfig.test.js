const test = require("node:test");
const assert = require("node:assert/strict");

const {
  resolveGroqConfig,
  buildGroqTtsBody,
  __test__,
} = require("../build/utils/groqConfig.js");

test("resolveGroqConfig usa os valores padrão esperados", () => {
  const config = resolveGroqConfig({});
  assert.equal(config.chatModel, __test__.DEFAULT_CHAT_MODEL);
  assert.equal(config.ttsModel, __test__.DEFAULT_TTS_MODEL);
  assert.equal(config.ttsVoice, __test__.DEFAULT_TTS_VOICE);
  assert.equal(config.ttsFormat, __test__.DEFAULT_TTS_FORMAT);
});

test("resolveGroqConfig respeita variáveis de ambiente", () => {
  const config = resolveGroqConfig({
    GROQ_CHAT_MODEL: "custom-chat",
    GROQ_TTS_MODEL: "custom-tts",
    GROQ_TTS_VOICE: "custom-voice",
    GROQ_TTS_FORMAT: "ogg",
  });

  assert.equal(config.chatModel, "custom-chat");
  assert.equal(config.ttsModel, "custom-tts");
  assert.equal(config.ttsVoice, "custom-voice");
  assert.equal(config.ttsFormat, "ogg");
});

test("buildGroqTtsBody replica exatamente o payload esperado", () => {
  const config = resolveGroqConfig({});
  const body = buildGroqTtsBody("Olá", config);

  assert.deepEqual(body, {
    model: __test__.DEFAULT_TTS_MODEL,
    voice: __test__.DEFAULT_TTS_VOICE,
    input: "Olá",
    response_format: __test__.DEFAULT_TTS_FORMAT,
  });
});
