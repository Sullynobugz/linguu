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
  const reqId = useRef(0);

  const speak = useCallback(async (
    text: string,
    speed = 0.9,
    onUsage?: (u: AudioUsage) => void,
    voice = 'nova'
  ) => {
    if (muted) return;
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }

    const thisReq = ++reqId.current;
    setLoading(true);
    setSpeaking(false);
    try {
      const audio = await ttsSpeak(text, speed, onUsage, voice);
      if (reqId.current !== thisReq) return;
      currentAudio.current = audio;
      audio.onplay  = () => { setLoading(false); setSpeaking(true); };
      audio.onended = () => { setSpeaking(false); currentAudio.current = null; };
      audio.onerror = () => { setSpeaking(false); setLoading(false); currentAudio.current = null; };
      await audio.play();
    } catch (err) {
      if (reqId.current === thisReq) {
        console.error('TTS error:', err);
        setLoading(false);
        setSpeaking(false);
      }
    }
  }, [muted]);

  const stop = useCallback(() => {
    reqId.current++;
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

function normStr(s: string, lang?: string): string {
  let n = s.toLowerCase().replace(/[.,!?;:'"„"«»¿¡]/g, '').trim();
  if (lang === 'de') {
    n = n.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  }
  return n;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function scorePronunciation(expected: string, heard: string, lang?: string): RecognitionResult {
  const expWords = normStr(expected, lang).split(/\s+/).filter(Boolean);
  const heardWords = normStr(heard, lang).split(/\s+/).filter(Boolean);
  if (expWords.length === 0) return { transcript: heard, score: 0, status: 'try_again' };
  let matches = 0;
  for (const w of expWords) {
    if (heardWords.some(h => h === w || (w.length >= 5 && levenshtein(h, w) <= 1))) matches++;
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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const listen = useCallback(async (
    expectedPhrase: string,
    onUsage?: (u: AudioUsage) => void,
    lang = 'de'
  ) => {
    if (listening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Web Audio API für Echtzeit-Pegelanalyse
      try {
        const ctx = new AudioContext();
        // Nach await getUserMedia ist der AudioContext oft im suspended state → resume() nötig
        if (ctx.state === 'suspended') await ctx.resume();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        src.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      } catch {
        // Web Audio API nicht verfügbar — Waveform nutzt Sinus-Simulation
      }

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
        audioCtxRef.current?.close().catch(() => {});
        audioCtxRef.current = null;
        analyserRef.current = null;
        setListening(false);
        setProcessing(true);

        const durationSec = (Date.now() - startTimeRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: mimeType });

        try {
          const transcript = await whisperTranscribe(blob, durationSec, onUsage, lang);
          const scored = scorePronunciation(expectedPhrase, transcript, lang);
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

  return { listen, stop, reset, listening, processing, result, analyserRef };
}
