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
Vollwertiges Produkt, läuft lokal. Auf Next.js migriert (API-Keys sicher serverseitig). Nicht deployed.

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

## ⚠️ Sicherheitsnotiz — API Keys
`VITE_ANTHROPIC_API_KEY` und `VITE_OPENAI_API_KEY` liegen im Browser-Bundle (durch `VITE_`-Prefix).
**Für Demo:** Kein Problem — Demo wird lokal gezeigt, kein öffentlicher Zugriff.
**Vor Go-Live:** Backend-Proxy nötig (z.B. Vercel Edge Functions). Nie mit diesen Keys deployen wie sie sind.

## Nächste Schritte
1. **Deployment** — Vercel Edge Functions als Proxy für API-Keys, dann public deploybar
2. **Sprechen-Flow prominenter** — Whisper/Mikrofon ist der USP, aber UI-mäßig versteckt
3. **Quiz: Muttersprachen-Audio** — nach falscher Antwort native Übersetzung vorlesen (`AudioControls` unterstützt das bereits)
4. **Pitch-Kontext**: Bastian pitcht die App seiner eigenen Weiterbildungseinrichtung als kostenloses Angebot im Austausch gegen eine Anstellung — persönliche Story ist der stärkste Pitch-Moment

## Differenzierung
Nicht Duolingo-Klon — fokussiert auf konkrete Behörden-/Alltagssituationen die Einwanderer tatsächlich brauchen. Spracherkennung via Whisper erlaubt echtes Sprechen üben.
