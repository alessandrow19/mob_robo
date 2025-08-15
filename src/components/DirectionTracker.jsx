import { useState, useEffect } from "react";
import mqtt from "mqtt";

export default function DirectionTracker({ direction }) {
  const [previousDirection, setPreviousDirection] = useState("center");
  const [client, setClient] = useState(null);

  useEffect(() => {
    // Conecta ao broker MQTT
    const mqttClient = mqtt.connect("wss://broker.hivemq.com:8884/mqtt"); // URL do HiveMQ
    setClient(mqttClient);

    mqttClient.on("connect", () => {
      console.log("Conectado ao broker MQTT");
    });

    mqttClient.on("error", (err) => {
      console.error("Erro ao conectar ao broker MQTT:", err);
    });

    return () => {
      mqttClient.end(); // Desconecta ao desmontar o componente
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Verifica se a direção mudou e não é "center"
      if (direction !== "center" && direction !== previousDirection && client) {
        console.log(`Direction changed to: ${direction}`);

        // Publica a mensagem no broker MQTT
        client.publish(
          "directions", // Tópico
          JSON.stringify({
            title: "Direction Update",
            body: `The current direction is ${direction}`,
          }),
          { qos: 1 }, // Qualidade de serviço
          (err) => {
            if (err) {
              console.error("Erro ao publicar no MQTT:", err);
            } else {
              console.log("Mensagem publicada no MQTT");
            }
          }
        );

        // Atualiza a direção anterior
        setPreviousDirection(direction);
      }
    }, 5000); // Intervalo de 5 segundos

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, [direction, previousDirection, client]);

  return null; // Este componente não renderiza nada
}