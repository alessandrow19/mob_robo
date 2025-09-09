import test from "node:test";
import assert from "node:assert/strict";
import { getVoiceUrl } from "../src/utils/pollinations.js";

test("getVoiceUrl encodes text for Pollinations URL", () => {
  const text = "Olá mundo!";
  const url = getVoiceUrl(text);
  assert.equal(
    url,
    `https://text.pollinations.ai/${encodeURIComponent(text)}?model=openai-audio&voice=onyx&format=mp3`
  );
});
