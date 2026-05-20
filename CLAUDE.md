# Linguu — Deutsch lernen für Einwanderer

## Status
Aktiv

## Was diese App ist
Mobile-first Web-App für Menschen die neu nach Deutschland kommen. Fokus auf echte Alltagssituationen: Jobcenter, Arztbesuch, Wohnung suchen, Behördengänge. Kein Backend — alles im Browser via localStorage.

## Tech Stack
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **KI**: Anthropic API (`claude-sonnet-4-6`) — Erklärungen, Quiz-Motivation
- **Sprachausgabe (TTS)**: OpenAI TTS (`tts-1`) — `nova` für Deutsch, `shimmer` für Muttersprache
- **Spracherkennung**: OpenAI Whisper (`whisper-1`)
- **Persistenz**: localStorage (kein Backend)

## Dev-Befehle
```bash
npm run dev   # http://localhost:5173
```

## Aktueller Stand
MVP läuft vollständig lokal (`localhost:5173`). Folgende Features sind implementiert:
- Onboarding (Sprache, Pfad, Level-Assessment)
- 6 Themen × 8 Phrasen (Jobcenter, Arzt, Wohnung, Alltag, Behörden, Notfall)
- Vokabeltrainer (Flashcards, Phrasen + Einzelwörter)
- Quiz (5 Fragen pro Thema, Multiple Choice)
- TTS (OpenAI `nova`/`shimmer`) + Spracherkennung (Whisper)
- AI-Erklärungen (Claude Sonnet) + Quiz-Motivation
- Zweisprachige UI (Muttersprache + Deutsch) in allen Screens
- Einbürgerung-Checkliste (StAG 2024)
- Behörden-Bericht (druckbar)
- Kein Backend — alles localStorage

## ⚠️ Sicherheitsnotiz — API Keys
`VITE_ANTHROPIC_API_KEY` und `VITE_OPENAI_API_KEY` liegen im Browser-Bundle (durch `VITE_`-Prefix).
**Für Demo:** Kein Problem — Demo wird lokal gezeigt, kein öffentlicher Zugriff.
**Vor Go-Live:** Backend-Proxy nötig (z.B. Vercel Edge Functions). Nie mit diesen Keys deployen wie sie sind.

## Nächste Schritte
1. **Jobcenter-Content erweitern** — von 8 auf 16 Phrasen (für Demo-Termin)
2. **Deployment** — Vercel, aber erst nach Backend-Proxy für API-Keys
3. **Sprechen-Flow prominenter** — Whisper/Mikrofon ist USP, aber UI-mäßig versteckt

## Differenzierung
Nicht Duolingo-Klon — fokussiert auf konkrete Behörden-/Alltagssituationen die Einwanderer tatsächlich brauchen. Spracherkennung via Whisper erlaubt echtes Sprechen üben.
