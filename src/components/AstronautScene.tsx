import UniverseBackground from "./UniverseBackground";

/**
 * Renderiza um cenário espacial com elementos animados para reforçar
 * a fantasia de que o robô é um astronauta viajando pelo universo.
 */
export default function AstronautScene() {
  return (
    <div className="astronaut-scene">
      {/* Camada de estrelas e nebulosas em movimento */}
      <UniverseBackground />

      {/* Elemento decorativo representando um planeta com anel */}
      <div className="astronaut-scene__planet">
        <span className="astronaut-scene__planet-core" />
        <span className="astronaut-scene__planet-ring" />
      </div>

      {/* Pequeno satélite orbitando o planeta para dar vida ao cenário */}
      <div className="astronaut-scene__orbit">
        <div className="astronaut-scene__satellite" />
      </div>

      {/* Solo lunar sutil para que o robô pareça estar em missão */}
      <div className="astronaut-scene__ground">
        <div className="astronaut-scene__ground-detail" />
        <div className="astronaut-scene__flag">
          <span className="astronaut-scene__flag-pole" />
          <span className="astronaut-scene__flag-cloth">Robo One</span>
        </div>
      </div>

      {/* Corpo estilizado do astronauta com mochila e visor */}
      <div className="astronaut-scene__astronaut">
        <div className="astronaut-scene__astronaut-backpack" />
        <div className="astronaut-scene__astronaut-body" />
        <div className="astronaut-scene__astronaut-helmet">
          <span className="astronaut-scene__astronaut-glass" />
          <span className="astronaut-scene__astronaut-shine" />
        </div>
      </div>
    </div>
  );
}
