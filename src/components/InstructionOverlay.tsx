"use client";
import React from "react";

interface InstructionOverlayProps {
  active: boolean; // janela de sorriso ativa
  remainingMs: number; // ms restantes
  totalMs: number; // total janela
  onClick?: () => void; // ação ao clicar (tentar iniciar)
  visible: boolean; // exibir overlay (não escutando / não falando)
}

// Ícones simples em SVG para manter leve e sem dependências externas
const SmileIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" className="drop-shadow-sm">
    <circle cx="12" cy="12" r="10" fill="url(#grad-smile)" />
    <defs>
      {/* Gradiente ajustado para tons de amarelo */}
      <linearGradient id="grad-smile" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
    </defs>
    <circle cx="9" cy="10" r="1.4" fill="#0f172a" />
    <circle cx="15" cy="10" r="1.4" fill="#0f172a" />
    <path
      d="M8 14c1.2 1.6 2.8 2.4 4 2.4s2.8-.8 4-2.4"
      stroke="#0f172a"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const TapIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="url(#grad-tap)" />
    <defs>
      <linearGradient id="grad-tap" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <path
      d="M12 8v8M9.5 11.5 12 9l2.5 2.5"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle
      cx="12"
      cy="12"
      r="5.5"
      stroke="#fff"
      strokeWidth="1.2"
      fill="none"
      strokeDasharray="4 4"
    />
  </svg>
);

const MicIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24">
    <rect x="9" y="5" width="6" height="10" rx="3" fill="url(#grad-mic)" />
    <defs>
      <linearGradient id="grad-mic" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <path
      d="M5 11v1a7 7 0 0 0 14 0v-1"
      stroke="#059669"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M12 18v3"
      stroke="#059669"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const PlanetIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5.5" fill="url(#grad-planet)" />
    <defs>
      <linearGradient id="grad-planet" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fb923c" />
      </linearGradient>
    </defs>
    <ellipse
      cx="12"
      cy="12"
      rx="9"
      ry="3.2"
      fill="none"
      stroke="#f59e0b"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeDasharray="2 4"
    />
  </svg>
);

export default function InstructionOverlay({
  active,
  remainingMs,
  totalMs,
  onClick,
  visible,
}: InstructionOverlayProps) {
  if (!visible) return null;
  const pct = Math.max(0, Math.min(1, remainingMs / totalMs));
  const circleCirc = 2 * Math.PI * 54; // raio 54
  const dash = circleCirc * pct;

  return (
    <div
      className="pointer-events-none fixed inset-0 flex flex-col items-center justify-end pb-20 z-[20] text-white"
      aria-live="polite"
    >
      {/* Cartão principal */}
      <div
        className="pointer-events-auto relative w-[min(600px,92%)] rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/60 backdrop-blur-md shadow-2xl p-6 overflow-hidden animate-[fadeIn_.6s_ease]"
        onClick={onClick}
        style={{ cursor: active ? "pointer" : "default" }}
      >
        {/* Glow decorativo */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.35),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.25),transparent_65%)]" />
        {/* Borda animada */}
        <div className="absolute inset-0 rounded-2xl border border-transparent [mask:linear-gradient(#000,#000)_padding-box,linear-gradient(#000,#000)] [mask-composite:exclude] before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-[linear-gradient(120deg,rgba(56,189,248,.7),rgba(168,85,247,.5),rgba(16,185,129,.6))] before:animate-[borderRotate_6s_linear_infinite]" />

        {/* Conteúdo */}
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Coluna ícones */}
          <div className="flex items-center gap-4 md:flex-col md:gap-6">
            <div className="animate-floatSlow">
              <SmileIcon />
            </div>
            <div className="animate-floatMid delay-150">
              <TapIcon />
            </div>
            <div className="animate-floatSlow2 delay-300">
              <MicIcon />
            </div>
            <div className="hidden md:block animate-floatMid delay-500">
              <PlanetIcon />
            </div>
          </div>
          {/* Texto e instrução */}
          <div className="flex-1 flex flex-col gap-3 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-emerald-300 to-sky-400">
              Assistente Astro Interativo
            </h2>
            {!active && (
              <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                Sorria para abrir uma janela mágica de 5 segundos. Enquanto a
                barra circular estiver ativa, toque em qualquer lugar para fazer
                uma pergunta sobre{" "}
                <span className="text-emerald-300 font-medium">astronomia</span>
                .
              </p>
            )}
            {active && (
              <p className="text-sm md:text-base text-emerald-300 leading-relaxed animate-pulse">
                Janela aberta! Toque agora para perguntar algo sobre o universo.
              </p>
            )}
          </div>
          {/* Indicador circular */}
          <div className="relative w-[140px] h-[140px] flex items-center justify-center">
            <div
              className="absolute inset-0 animate-spin-slow opacity-40"
              style={{ filter: "blur(1px)" }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-500/40 via-fuchsia-500/30 to-emerald-500/30" />
            </div>
            <svg width={140} height={140} className="rotate-[-90deg]">
              <circle
                cx={70}
                cy={70}
                r={54}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={10}
                fill="none"
              />
              <circle
                cx={70}
                cy={70}
                r={54}
                stroke="url(#grad-progress)"
                strokeWidth={10}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${dash} ${circleCirc - dash}`}
                className="transition-[stroke-dasharray] duration-150 ease-linear"
              />
              <defs>
                <linearGradient id="grad-progress" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              {active ? (
                <>
                  <span className="block text-lg font-semibold text-emerald-300">
                    {Math.ceil((remainingMs / 1000) * 10) / 10}s
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                    restante
                  </span>
                </>
              ) : (
                <span className="text-[11px] leading-tight text-slate-400 max-w-[80px] inline-block">
                  Sorria para liberar o toque
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
