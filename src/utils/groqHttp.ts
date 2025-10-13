import fs from "node:fs";
import https from "node:https";
import type { IncomingHttpHeaders } from "node:http";
import { URL } from "node:url";

export type GroqHttpEnv = Partial<
  Pick<
    NodeJS.ProcessEnv,
    "GROQ_TLS_REJECT_UNAUTHORIZED" | "GROQ_CA_CERT" | "GROQ_CA_CERT_FILE"
  >
>;

export type GroqTlsConfig = {
  rejectUnauthorized: boolean;
  ca?: string;
};

type SimpleFetchInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string | Buffer;
};

/**
 * Determina se precisamos ajustar as opções de TLS para chamadas à Groq. Quando
 * não há ajustes necessários, retornamos undefined para que o fetch padrão seja
 * utilizado. Quando há certificados personalizados ou desabilitação da
 * verificação estrita, retornamos a configuração apropriada.
 */
export function resolveGroqTlsConfig(
  env: GroqHttpEnv = process.env as GroqHttpEnv
): GroqTlsConfig | undefined {
  const rejectUnauthorized = env.GROQ_TLS_REJECT_UNAUTHORIZED !== "false";
  const inlineCertificate = normalizeCertificate(env.GROQ_CA_CERT);
  const fileCertificate = readCertificateFromFile(env.GROQ_CA_CERT_FILE);

  const ca = [inlineCertificate, fileCertificate]
    .filter((value): value is string => Boolean(value))
    .join("\n");

  if (rejectUnauthorized && !ca) {
    return undefined;
  }

  return {
    rejectUnauthorized,
    ca: ca || undefined,
  };
}

/**
 * Executa uma requisição HTTP utilizando as opções de TLS quando necessário.
 * Se nenhuma configuração especial for informada, delegamos para fetch.
 */
export async function fetchWithGroqTls(
  url: string,
  init: SimpleFetchInit,
  tlsConfig?: GroqTlsConfig
): Promise<GroqResponseLike> {
  if (!tlsConfig) {
    return fetch(url, init as RequestInit) as Promise<GroqResponseLike>;
  }

  return performHttpsRequest(url, init, tlsConfig);
}

async function performHttpsRequest(
  url: string,
  init: SimpleFetchInit,
  tlsConfig: GroqTlsConfig
): Promise<GroqResponseLike> {
  const parsed = new URL(url);

  const options: https.RequestOptions = {
    method: init.method ?? "GET",
    headers: init.headers,
    hostname: parsed.hostname,
    port: parsed.port || 443,
    path: `${parsed.pathname}${parsed.search}`,
    rejectUnauthorized: tlsConfig.rejectUnauthorized,
  };

  if (tlsConfig.ca) {
    options.ca = tlsConfig.ca;
  }

  const body = typeof init.body === "string" ? init.body : init.body?.toString();

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      const chunks: Buffer[] = [];

      response.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(new GroqResponse(response.statusCode ?? 0, response.headers, buffer));
      });
    });

    request.on("error", (error) => {
      reject(error);
    });

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

class GroqResponse implements GroqResponseLike {
  readonly status: number;
  readonly headers: ResponseHeaders;
  private readonly buffer: Buffer;

  constructor(status: number, headers: IncomingHttpHeaders, buffer: Buffer) {
    this.status = status;
    this.headers = createHeaders(headers);
    this.buffer = buffer;
  }

  get ok(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  async json(): Promise<unknown> {
    return JSON.parse(await this.text());
  }

  async text(): Promise<string> {
    return this.buffer.toString("utf8");
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const view = this.buffer;
    const arrayBuffer = new ArrayBuffer(view.byteLength);
    new Uint8Array(arrayBuffer).set(view);
    return arrayBuffer;
  }
}

type ResponseHeaders = {
  get(name: string): string | null;
};

type GroqResponseLike = {
  status: number;
  ok: boolean;
  headers: ResponseHeaders;
  json(): Promise<unknown>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
};

function createHeaders(headers: IncomingHttpHeaders): ResponseHeaders {
  const normalized = new Map<string, string>();

  for (const [key, value] of Object.entries(headers)) {
    if (!key) {
      continue;
    }

    const headerValue = Array.isArray(value) ? value[0] : value;
    if (headerValue) {
      normalized.set(key.toLowerCase(), headerValue);
    }
  }

  return {
    get(name: string) {
      return normalized.get(name.toLowerCase()) ?? null;
    },
  };
}

/**
 * Normaliza certificados fornecidos via variável de ambiente, aceitando tanto
 * conteúdo PEM direto quanto representações em base64.
 */
function normalizeCertificate(rawValue?: string): string | undefined {
  if (!rawValue) {
    return undefined;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.includes("-----BEGIN")) {
    return trimmed;
  }

  if (looksLikeBase64(trimmed)) {
    try {
      const decoded = Buffer.from(trimmed, "base64").toString("utf8").trim();
      if (decoded && decoded.includes("-----BEGIN")) {
        return decoded;
      }
    } catch {
      // Se a decodificação falhar seguimos com o valor original.
    }
  }

  return trimmed;
}

/**
 * Carrega um certificado a partir de um arquivo, retornando undefined caso o
 * caminho não exista ou não possa ser lido.
 */
function readCertificateFromFile(pathname?: string): string | undefined {
  if (!pathname) {
    return undefined;
  }

  try {
    return fs.readFileSync(pathname, "utf8").trim() || undefined;
  } catch (error) {
    console.error(
      "[Groq] Falha ao ler certificado informado em GROQ_CA_CERT_FILE:",
      error
    );
    return undefined;
  }
}

function looksLikeBase64(value: string): boolean {
  if (!/^[0-9a-zA-Z+/=\s]+$/.test(value)) {
    return false;
  }

  const sanitized = value.replace(/\s+/g, "");
  return sanitized.length % 4 === 0;
}

export const __test__ = {
  normalizeCertificate,
  readCertificateFromFile,
  looksLikeBase64,
  createHeaders,
};
