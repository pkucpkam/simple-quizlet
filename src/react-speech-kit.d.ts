declare module 'react-speech-kit' {
    export interface SpeechSynthesisOptions {
        text: string;
        voice?: SpeechSynthesisVoice;
        rate?: number;
        pitch?: number;
        volume?: number;
    }

    export interface UseSpeechSynthesisResult {
        speak: (options: SpeechSynthesisOptions) => void;
        cancel: () => void;
        speaking: boolean;
        supported: boolean;
        voices: SpeechSynthesisVoice[];
    }

    export function useSpeechSynthesis(): UseSpeechSynthesisResult;

    export interface UseSpeechRecognitionResult {
        listen: () => void;
        stop: () => void;
        listening: boolean;
        supported: boolean;
    }

    export function useSpeechRecognition(): UseSpeechRecognitionResult;
}
