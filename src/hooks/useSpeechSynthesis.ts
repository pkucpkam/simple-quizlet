import { useCallback, useState, useRef } from 'react';

interface SpeakOptions {
    text: string;
    lang?: string;
    voice?: SpeechSynthesisVoice;
    rate?: number;
    pitch?: number;
}

declare global {
    interface Window {
        utterances: SpeechSynthesisUtterance[];
    }
}

export const useSpeechSynthesis = () => {
    const [mode, setModeState] = useState<'google'|'native'>(() => {
        return (localStorage.getItem('tts_mode') as 'google'|'native') || 'native';
    });
    const [speaking, setSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const setMode = useCallback((newMode: 'google'|'native') => {
        setModeState(newMode);
        localStorage.setItem('tts_mode', newMode);
    }, []);

    const speak = useCallback(({ text, lang = 'en' }: SpeakOptions) => {
        if (!text) return;

        // Cancel any ongoing speech
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        
        const fallbackTTS = () => {
            if (!window.speechSynthesis) {
                setSpeaking(false);
                return;
            }
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // CRITICAL FIX: Store utterance globally to prevent garbage collection on Android/Chrome
            window.utterances = window.utterances || [];
            window.utterances.push(utterance);

            const voices = window.speechSynthesis.getVoices();
            let selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(lang) && v.name.includes('Google'));
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(lang));
            }
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            
            utterance.lang = lang;
            utterance.onstart = () => setSpeaking(true);
            utterance.onend = () => {
                setSpeaking(false);
                window.utterances = window.utterances.filter(u => u !== utterance);
            };
            utterance.onerror = (e) => {
                console.error('Speech synthesis error:', e);
                setSpeaking(false);
                window.utterances = window.utterances.filter(u => u !== utterance);
            };
            
            window.speechSynthesis.speak(utterance);
        };

        const playSoundOfText = async () => {
            try {
                const voice = lang.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US';
                const safeText = text.slice(0, 200);

                const createRes = await fetch('https://api.soundoftext.com/sounds', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        engine: 'Google',
                        data: { text: safeText, voice }
                    })
                });

                if (!createRes.ok) throw new Error('Failed to create sound');
                const createData = await createRes.json();
                if (!createData.success) throw new Error(createData.message || 'API error');

                const soundId = createData.id;
                let audioUrl = '';
                let attempts = 0;

                while (attempts < 10) {
                    const statusRes = await fetch(`https://api.soundoftext.com/sounds/${soundId}`);
                    const statusData = await statusRes.json();

                    if (statusData.status === 'Done') {
                        audioUrl = statusData.location;
                        break;
                    } else if (statusData.status === 'Error') {
                        throw new Error('Sound generation error on server');
                    }

                    await new Promise(resolve => setTimeout(resolve, 500));
                    attempts++;
                }

                if (!audioUrl) throw new Error('Timeout waiting for audio');

                const audio = new Audio(audioUrl);
                audioRef.current = audio;

                audio.onplay = () => setSpeaking(true);
                audio.onended = () => setSpeaking(false);
                audio.onerror = () => {
                    console.warn('Audio URL playback failed, falling back to local speech');
                    fallbackTTS();
                };

                await audio.play();

            } catch (error) {
                console.error('SoundOfText failed:', error);
                fallbackTTS();
            }
        };

        if (mode === 'google') {
            playSoundOfText();
        } else {
            fallbackTTS();
        }
    }, [mode]);

    const cancel = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        window.speechSynthesis?.cancel();
        setSpeaking(false);
    }, []);

    return {
        speak,
        cancel,
        speaking,
        mode,
        setMode,
        voices: [],
        supported: true,
    };
};
