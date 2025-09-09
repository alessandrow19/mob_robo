import test from "node:test";
import assert from "node:assert/strict";
import { getVoiceUrl } from "./pollinations.js";

test("getVoiceUrl encodes text for URL", () => {
  const url = getVoiceUrl("Olá mundo!");
  assert.equal(
    url,
    "https://pollinations.ai/api/voice/speak?text=Ol%C3%A1%20mundo!"
  );
});
