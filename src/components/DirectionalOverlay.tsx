"use client";
import { useEffect } from "react";

type DirectionalOverlayProps = {
  /** Controls the visibility of the overlay. */
  visible: boolean;
  /**
   * Função disparada para iniciar o modo de voz ao pressionar o botão central.
   */
  onActivateVoice: () => void;
  /**
   * Evita cliques repetidos enquanto o robô já está ouvindo/processando.
   */
  disableVoiceButton?: boolean;
};

type ArrowProps = {
  /** Rotação do SVG em graus para apontar na direção correta. */
  rotation: number;
  /** Texto auxiliar para tecnologias assistivas. */
  label: string;
};

function NeonArrow({ rotation, label }: ArrowProps) {
  return (
    <div
      style={{
        transform: `rotate(${rotation}deg)`,
        display: "inline-block",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        role="img"
        aria-label={label}
        style={{
          width: "100px",
          height: "100px",
          fill: "#00ffff",
          filter: "drop-shadow(0 0 8px #00ffff)",
        }}
      >
        <path d="M13 3v10h4l-5 8-5-8h4V3h2z" />
      </svg>
    </div>
  );
}

export default function DirectionalOverlay({
  visible,
  onActivateVoice,
  disableVoiceButton,
}: DirectionalOverlayProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0)",
        zIndex: 1000,
        paddingTop: 200,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* Seta para cima (frente) */}
        <div>
          <NeonArrow rotation={180} label="Mover para frente" />
        </div>

        {/* Linha do meio: Esquerda + Botão Central + Direita */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <NeonArrow rotation={90} label="Mover para a esquerda" />

          <button
            type="button"
            onClick={onActivateVoice}
            disabled={disableVoiceButton}
            aria-label="Ativar modo de voz"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: "3px solid #00ffff",
              backgroundColor: "rgba(0, 255, 255, 0.1)",
              color: "#00ffff",
              fontSize: "32px",
              cursor: disableVoiceButton ? "not-allowed" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              boxShadow: "0 0 20px #00ffff",
              opacity: disableVoiceButton ? 0.5 : 1,
            }}
          >
            <span aria-hidden="true">🎙️</span>
            <span style={{ fontSize: "12px", fontWeight: "bold" }}>Falar</span>
          </button>

          <NeonArrow rotation={270} label="Mover para a direita" />
        </div>

        {/* Seta para baixo (trás) */}
        <div>
          <NeonArrow rotation={0} label="Mover para trás" />
        </div>
      </div>
    </div>
  );
}
