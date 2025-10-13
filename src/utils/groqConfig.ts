const DEFAULT_CHAT_MODEL = "qwen/qwen3-32b";
const DEFAULT_TTS_MODEL = "playai-tts";
const DEFAULT_TTS_VOICE = "Aaliyah-PlayAI";
const DEFAULT_TTS_FORMAT = "wav";

type EnvSource = {
  GROQ_CHAT_MODEL?: string;
  GROQ_TTS_MODEL?: string;
  GROQ_TTS_VOICE?: string;
  GROQ_TTS_FORMAT?: string;
};

export type GroqResolvedConfig = {
  chatModel: string;
  ttsModel: string;
  ttsVoice: string;
  ttsFormat: string;
};

/**
 * Concentra a resolução dos parâmetros de integração com a Groq.
 * Ter essa lógica centralizada nos ajuda a garantir, via testes,
 * que a aplicação continuará chamando a API com os valores esperados.
 */
export function resolveGroqConfig(env?: EnvSource): GroqResolvedConfig {
  const source = (env ?? process.env) as EnvSource;

  return {
    chatModel: source.GROQ_CHAT_MODEL ?? DEFAULT_CHAT_MODEL,
    ttsModel: source.GROQ_TTS_MODEL ?? DEFAULT_TTS_MODEL,
    ttsVoice: source.GROQ_TTS_VOICE ?? DEFAULT_TTS_VOICE,
    ttsFormat: source.GROQ_TTS_FORMAT ?? DEFAULT_TTS_FORMAT,
  };
}

/**
 * Monta o corpo da requisição de TTS para a Groq garantindo
 * que o formato de saída seja explicitamente solicitado.
 */
export function buildGroqTtsBody(
  input: string,
  config: GroqResolvedConfig
): Record<string, string> {
  return {
    model: config.ttsModel,
    voice: config.ttsVoice,
    input,
    response_format: config.ttsFormat,
  };
}

export const __test__ = {
  DEFAULT_CHAT_MODEL,
  DEFAULT_TTS_MODEL,
  DEFAULT_TTS_VOICE,
  DEFAULT_TTS_FORMAT,
};
