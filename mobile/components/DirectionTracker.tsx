import { useEffect, useState } from 'react';
import mqtt from 'mqtt';

type Props = {
  direction: string;
};

export default function DirectionTracker({ direction }: Props) {
  const [previousDirection, setPreviousDirection] = useState('center');
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  useEffect(() => {
    const mqttClient = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');
    setClient(mqttClient);

    mqttClient.on('connect', () => {
      console.log('Conectado ao broker MQTT para controle do Otto');
    });

    mqttClient.on('error', (err) => {
      console.error('Erro ao conectar ao broker MQTT:', err);
    });

    return () => {
      mqttClient.end();
    };
  }, []);

  const getOttoCommand = (dir: string) => {
    const commandMap: Record<string, string> = {
      up: '1',
      down: '2',
      left: '3',
      right: '4',
      forward: '1',
      backward: '2',
      back: '2',
    };
    return commandMap[dir.toLowerCase()] || null;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (direction !== 'center' && direction !== previousDirection && client) {
        const ottoCommand = getOttoCommand(direction);

        if (ottoCommand) {
          client.publish('mob/comando', ottoCommand, { qos: 1 });
          setPreviousDirection(direction);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [direction, previousDirection, client]);

  return null;
}
