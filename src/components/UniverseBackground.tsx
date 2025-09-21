import "../app/universe.css";

export default function UniverseBackground() {
  return (
    <div className="universe-background">
      <div className="stars-layer universe-depth-1">
        <div className="nebula"></div>
      </div>
      <div className="stars-layer universe-depth-2">
        <div className="stars-small"></div>
      </div>
      <div className="stars-layer universe-depth-3">
        <div className="stars-medium"></div>
      </div>
      <div className="stars-layer universe-depth-4">
        <div className="stars-large"></div>
      </div>
      <div className="stars-layer">
        <div className="stars-twinkle"></div>
      </div>
      <div className="comet-layer" aria-hidden>
        <span className="comet comet-1" />
        <span className="comet comet-2" />
        <span className="comet comet-3" />
      </div>
    </div>
  );
}