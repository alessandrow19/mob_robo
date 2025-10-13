const test = require("node:test");
const assert = require("node:assert/strict");

const {
  resolveGroqTlsConfig,
  __test__,
} = require("../build/utils/groqHttp.js");

test("resolveGroqTlsConfig retorna undefined com TLS padrão", () => {
  const config = resolveGroqTlsConfig({});
  assert.equal(config, undefined);
});

test("resolveGroqTlsConfig desabilita validação quando configurado", () => {
  const config = resolveGroqTlsConfig({
    GROQ_TLS_REJECT_UNAUTHORIZED: "false",
  });

  assert.ok(config);
  assert.equal(config.rejectUnauthorized, false);
});

test("resolveGroqTlsConfig aceita certificado em base64", () => {
  const pem = "-----BEGIN CERTIFICATE-----\nFAKE\n-----END CERTIFICATE-----";
  const config = resolveGroqTlsConfig({
    GROQ_CA_CERT: Buffer.from(pem, "utf8").toString("base64"),
  });

  assert.ok(config);
  assert.equal(config.rejectUnauthorized, true);
  assert.ok(config.ca.includes("FAKE"));
});

test("normalizeCertificate remove espaços", () => {
  const { normalizeCertificate } = __test__;
  assert.equal(normalizeCertificate("  test  "), "test");
});

test("normalizeCertificate decodifica certificado em base64", () => {
  const { normalizeCertificate } = __test__;
  const pem = "-----BEGIN CERTIFICATE-----\nFAKE\n-----END CERTIFICATE-----";
  const value = Buffer.from(pem, "utf8").toString("base64");
  assert.equal(normalizeCertificate(value), pem);
});

test("normalizeCertificate mantém base64 inválida", () => {
  const { normalizeCertificate } = __test__;
  assert.equal(normalizeCertificate("@@@@"), "@@@@");
});
