"use client";

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
    <svg
      className="directional-overlay__icon"
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M13 3v10h4l-5 8-5-8h4V3h2z" />
    </svg>
  );
}

export default function DirectionalOverlay({
  visible,
  onActivateVoice,
  disableVoiceButton,
}: DirectionalOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="directional-overlay">
      {/* Organizamos as setas em cruz, alinhadas ao corpo do robô. */}
      <div className="directional-overlay__content">
        <div className="directional-overlay__row">
          {/* 180° vira a seta padrão (para baixo) para apontar para cima. */}
          <NeonArrow rotation={180} label="Mover para frente" />
        </div>
        <div className="directional-overlay__row directional-overlay__row--middle">
          <NeonArrow rotation={90} label="Mover para a esquerda" />
          <button
            type="button"
            className="directional-overlay__center"
            onClick={onActivateVoice}
            disabled={disableVoiceButton}
            aria-label="Ativar modo de voz"
          >
            <span className="directional-overlay__center-icon" aria-hidden="true">
              🎙️
            </span>
            <span className="directional-overlay__center-label">Falar</span>
          </button>
          <NeonArrow rotation={270} label="Mover para a direita" />
        </div>
        <div className="directional-overlay__row">
          <NeonArrow rotation={0} label="Mover para trás" />
        </div>
      </div>
    </div>
  );
}
