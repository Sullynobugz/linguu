import { useState, useCallback, useRef } from 'react';
import { ttsSpeak, whisperTranscribe } from '../api/openaiAudio';
import type { AudioUsage } from '../api/openaiAudio';
import { useAudio } from '../store/AudioContext';

// ── TEXT-TO-SPEECH ──────────────────────────────────────────────
export function useSpeak() {
  const { muted } = useAudio();
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (
    text: string,
    speed = 0.9,
    onUsage?: (u: AudioUsage) => void,
    voice = 'nova'
  ) => {
    if (muted) return;
    // Stop any current playback
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }

    setLoading(true);
    try {
      const audio = await ttsSpeak(text, speed, onUsage, voice);
      currentAudio.current = audio;
      audio.onplay = () => { setLoading(false); setSpeaking(true); };
      audio.onended = () => { setSpeaking(false); currentAudio.current = null; };
      audio.onerror = () => { setSpeaking(false); setLoading(false); currentAudio.current = null; };
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setLoading(false);
      setSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    setSpeaking(false);
    setLoading(false);
  }, []);

  return { speak, stop, speaking, loading };
}

// ── PRONUNCIATION SCORING ───────────────────────────────────────
export type PronunciationStatus = 'perfect' | 'good' | 'try_again';

export interface RecognitionResult {
  transcript: string;
  score: number;       // 0–100
  status: PronunciationStatus;
}

function normStr(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:'"„"«»]/g, '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .trim();
}

function scorePronunciation(expected: string, heard: string): RecognitionResult {
  const expWords = normStr(expected).split(/\s+/);
  const heardWords = normStr(heard).split(/\s+/);
  let matches = 0;
  for (const w of expWords) {
    if (heardWords.some(h => h === w || h.includes(w) || w.includes(h))) matches++;
  }
  const score = Math.round((matches / expWords.length) * 100);
  const status: PronunciationStatus =
    score >= 80 ? 'perfect' : score >= 50 ? 'good' : 'try_again';
  return { transcript: heard, score, status };
}

// ── SPEECH-TO-TEXT via Whisper ──────────────────────────────────
export function useListen() {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const listen = useCallback(async (
    expectedPhrase: string,
    onUsage?: (u: AudioUsage) => void
  ) => {
    if (listening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick best supported format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg;codecs=opus';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setListening(false);
        setProcessing(true);

        const durationSec = (Date.now() - startTimeRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: mimeType });

        try {
          const transcript = await whisperTranscribe(blob, durationSec, onUsage);
          const scored = scorePronunciation(expectedPhrase, transcript);
          setResult(scored);
        } catch (err) {
          console.error('Whisper error:', err);
          setResult({ transcript: '— Fehler beim Erkennen —', score: 0, status: 'try_again' });
        } finally {
          setProcessing(false);
        }
      };

      recorder.start();
      setListening(true);
      setResult(null);
    } catch (err) {
      console.error('Mic access error:', err);
      setResult({ transcript: '— Kein Mikrofon-Zugriff —', score: 0, status: 'try_again' });
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => setResult(null), []);

  return { listen, stop, reset, listening, processing, result };
}
