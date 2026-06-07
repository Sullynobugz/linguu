# Linguu — Deutsch lernen für Einwanderer

## Status
Aktiv

## Was diese App ist
Mobile-first Web-App für Menschen die neu nach Deutschland kommen. Fokus auf echte Alltagssituationen: Jobcenter, Arztbesuch, Wohnung suchen, Behördengänge. Kein Backend — alles im Browser via localStorage.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM (SPA via `app/page.tsx` dynamic import, SSR disabled)
- **API-Proxy**: Next.js API Routes (`app/api/claude`, `app/api/openai/tts`, `app/api/openai/whisper`, `app/api/assessment/save`)
- **KI**: Anthropic API (`claude-sonnet-4-6`) — Erklärungen, Quiz-Motivation
- **Sprachausgabe (TTS)**: OpenAI TTS (`tts-1`) — `nova` für Deutsch, `shimmer` für Muttersprache
- **Spracherkennung**: OpenAI Whisper (`whisper-1`)
- **Persistenz**: localStorage (kein Backend)
- **Cross-App Tracking**: WID-Code via `src/lib/widTracking.ts` — meldet Lernfortschritt an WID-Dashboard

## Dev-Befehle
```bash
npm run dev   # http://localhost:3001 (Next.js)
```

## Aktueller Stand
Vollwertiges Produkt, live auf linguu.techstag.de. Auf Next.js migriert (API-Keys sicher serverseitig). Coolify-Webhook aktiv.

- **8 Themen**: Jobcenter, Arzt, Wohnung, Alltag, Behörden, Notfälle, Schule & Kinder, Freizeit & Integration
- **~400 Phrasen** (~67 pro Thema, `src/data/content.ts`, 4844 Zeilen)
- **2.000 Vokabeln** (`src/data/words.ts`, 2789 Zeilen)
- **5 Sprachen**: Arabisch, Ukrainisch, Spanisch, Englisch, Kurdisch
- Onboarding (Sprache → Pfad → Level-Assessment A1–B2)
- Vokabeltrainer (Flashcards mit Flip-Animation, Mastery-Level)
- Quiz (Multiple Choice + Claude-Motivationsnachrichten)
- TTS zweisprachig (OpenAI `nova`/`shimmer`) + Whisper Aussprache-Scoring
- AI-Erklärungen (Claude Sonnet, Streaming)
- XP/Level/Streak/Badges, Einbürgerungs-Checkliste (StAG 2024), Behörden-Report (druckbar)
- Kein Backend — alles localStorage

## ⚠️ Deployment-Notiz
`vite.config.ts` und Vite-tsconfigs wurden entfernt (waren Überbleibsel). nixpacks erkennt das Projekt jetzt sauber als Next.js. API-Keys sind serverseitig (keine VITE_-Prefix-Keys mehr).

## ⚠️ Waveform-Implementierung
`src/components/AudioControls.tsx` — Waveform nutzt **reines CSS** (`@keyframes lbar`), kein JS/rAF/AudioContext. 5 Balken mit unterschiedlichen `animation-duration`-Werten (0.28s–0.50s) und gestaffelten Delays. Wird nur als Prop `active: boolean` gesteuert — `analyserRef` nicht mehr nötig. Falls jemand die Web-Audio-API wieder einbauen möchte: `useSpeech.ts` hat den Setup-Code noch drin (AudioContext + AnalyserNode), wird nur nicht mehr von Waveform gelesen.

## ⚠️ LessonScreen Nav-Buttons
`src/screens/LessonScreen.tsx` — Zurück/Weiter-Buttons sind **keine absolut-positionierten Elemente** mehr. Sie sind Flex-Geschwister des Content-Bereichs in einem `flex items-stretch`-Container. Nicht auf `absolute` zurückstellen — sie würden dann nicht mehr an die Karte andocken.

## Nächste Schritte
1. **Quiz: Muttersprachen-Audio** — nach falscher Antwort native Übersetzung vorlesen (`AudioControls` unterstützt das bereits)
2. **Sprechen-Flow prominenter** — Whisper/Mikrofon ist der USP, aber UI-mäßig noch nicht genug hervorgehoben
3. **Pitch-Kontext**: Bastian pitcht die App seiner eigenen Weiterbildungseinrichtung als kostenloses Angebot im Austausch gegen eine Anstellung — persönliche Story ist der stärkste Pitch-Moment

## Differenzierung
Nicht Duolingo-Klon — fokussiert auf konkrete Behörden-/Alltagssituationen die Einwanderer tatsächlich brauchen. Spracherkennung via Whisper erlaubt echtes Sprechen üben.

## Entwicklungslog
| Datum | Was & Warum |
|-------|-------------|
| 2026-06-07 | Waveform auf pure CSS umgestellt — JS/rAF-Ansatz war unzuverlässig (AudioContext suspended state, barRefs-Timing). CSS-Animation ist browserübergreifend garantiert. |
| 2026-06-07 | LessonScreen Nav-Buttons von absolute auf flex-row — docken jetzt direkt an die Content-Karte an statt am Screen-Rand zu floaten |
| 2026-06-07 | UI-Overhaul: größere Icons (56×56px Bubbles), Hover-Animationen auf Topic/Action-Cards, Wegweiser-Pfeile, OnboardingLayout Step-Dots vergrößert |
