"use client";

type DirectionalOverlayProps = {
  /** Controls the visibility of the overlay. */
  visible: boolean;
};

function NeonArrow({ rotation }: { rotation: number }) {
  return (
    <svg
      className="directional-overlay__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M13 3v10h4l-5 8-5-8h4V3h2z" />
    </svg>
  );
}

export default function DirectionalOverlay({ visible }: DirectionalOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="directional-overlay" aria-hidden="true">
      {/* Organizamos as setas em cruz, alinhadas ao corpo do robô. */}
      <div className="directional-overlay__content">
        <div className="directional-overlay__row">
          <NeonArrow rotation={0} />
        </div>
        <div className="directional-overlay__row directional-overlay__row--middle">
          <NeonArrow rotation={270} />
          <div className="directional-overlay__center" />
          <NeonArrow rotation={90} />
        </div>
        <div className="directional-overlay__row">
          <NeonArrow rotation={180} />
        </div>
      </div>
    </div>
  );
}
