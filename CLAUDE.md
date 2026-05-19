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
Implementierungsgrad unklar — Code muss geprüft werden. Architektur und Tech-Stack sind definiert (PROJEKT.md), aber ob alle Features tatsächlich implementiert sind ist offen.

## Nächste Schritte
1. Code-Review: Was ist tatsächlich implementiert?
2. Entscheidung: Weiterentwickeln oder pausieren?
3. Falls weiter: Deployment, erste echte Nutzer aus Zielgruppe

## Differenzierung
Nicht Duolingo-Klon — fokussiert auf konkrete Behörden-/Alltagssituationen die Einwanderer tatsächlich brauchen. Spracherkennung via Whisper erlaubt echtes Sprechen üben.
