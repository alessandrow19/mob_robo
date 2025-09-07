interface SpeechRecognition {
  lang: string;
  start(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
}

type SpeechRecognitionEvent = any;
