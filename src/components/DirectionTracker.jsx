import { useState, useEffect } from "react";
import mqtt from "mqtt";

export default function DirectionTracker({ direction }) {
  const [previousDirection, setPreviousDirection] = useState("center");
  const [client, setClient] = useState(null);

  useEffect(() => {
    // Conecta ao broker MQTT
    const mqttClient = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");
    setClient(mqttClient);

    mqttClient.on("connect", () => {
      console.log("Conectado ao broker MQTT para controle do Otto");
    });

    mqttClient.on("error", (err) => {
      console.error("Erro ao conectar ao broker MQTT:", err);
    });

    return () => {
      mqttClient.end(); // Desconecta ao desmontar o componente
    };
  }, []);

  // Função para mapear direção para comando do Otto
  const getOttoCommand = (direction) => {
    const commandMap = {
      "up": "1",       // Andar FRENTE (3 passos)
      "down": "2",     // Andar TRÁS (3 passos)  
      "left": "3",     // Virar ESQUERDA (2 passos)
      "right": "4",    // Virar DIREITA (2 passos)
      "forward": "1",  // Alternativa para frente
      "backward": "2", // Alternativa para trás
      "back": "2"      // Alternativa para trás
    };
    
    return commandMap[direction.toLowerCase()] || null;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Verifica se a direção mudou e não é "center"
      if (direction !== "center" && direction !== previousDirection && client) {
        const ottoCommand = getOttoCommand(direction);
        
        if (ottoCommand) {
          console.log(`Direction changed to: ${direction} -> Otto command: ${ottoCommand}`);
          
          // Publica o comando no tópico correto do Otto
          client.publish(
            "otto/comando", // Tópico que o Otto está escutando
            ottoCommand,    // Comando simples (apenas o caractere)
            { qos: 1 },     // Qualidade de serviço
            (err) => {
              if (err) {
                console.error("Erro ao enviar comando para o Otto:", err);
              } else {
                console.log(`Comando '${ottoCommand}' enviado para o Otto (${direction})`);
              }
            }
          );
        } else {
          console.log(`Direção '${direction}' não mapeada para comando do Otto`);
        }
        
        // Atualiza a direção anterior
        setPreviousDirection(direction);
      }
    }, 1000); // Reduzido para 1 segundo para resposta mais rápida

    return () => clearInterval(interval);
  }, [direction, previousDirection, client]);

  return null; // Este componente não renderiza nada
}
