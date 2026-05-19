# Linguu — Projektdokumentation

## Was ist Linguu?

Linguu ist eine mobile-first Web-App, die Menschen, die neu nach Deutschland kommen, beim Erlernen der deutschen Sprache unterstützt. Der Fokus liegt auf konkreten Alltagssituationen: Jobcenter, Arztbesuch, Wohnung suchen, Behördengänge.

Die App funktioniert komplett im Browser, ohne Backend. Alle Daten werden im `localStorage` gespeichert.

---

## Technik-Stack

| Was | Womit |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| KI-Erklärungen / Quiz-Motivation | Anthropic API (`claude-sonnet-4-20250514`) |
| Sprachausgabe (TTS) | OpenAI TTS (`tts-1`, Stimmen: `nova` für Deutsch, `shimmer` für Muttersprache) |
| Spracherkennung | OpenAI Whisper (`whisper-1`) |
| Persistenz | `localStorage` |

**Starten:** `npm run dev` → http://localhost:5173

---

## Unterstützte Sprachen

Arabisch (`ar`) · Ukrainisch (`uk`) · Spanisch (`es`) · Englisch (`en`)

Die gesamte UI, alle Übersetzungen und Audio-Ausgabe passen sich der gewählten Muttersprache an.

---

## Aktueller Stand

### Screens & Features

#### Onboarding (3 Schritte)
- **Schritt 1** — Muttersprache wählen (ar / uk / es / en)
- **Schritt 2** — Lernpfad wählen: Neu in Deutschland / Beruf & Arbeit / Sprache vertiefen
- **Schritt 3** — Einstufungstest (5 Fragen, sprachspezifisch) → ermittelt A1–B2

#### Dashboard
- XP-Anzeige + Level-Fortschritt (A1 → A2 → B1 → B2)
- Tagessempfehlung (nächstes offenes Thema)
- **Vokabelkarten-Einstieg** mit Fortschrittsanzeige (z. B. „5 / 48 gemeistert")
- Themenübersicht (6 Themen × 8 Phrasen) mit Fortschrittsbalken
- Badges / Errungenschaften
- Streak-Anzeige (🔥 Lerntage in Folge)

#### Lernscreen (`/lesson/:topicId`)
- Phrase-für-Phrase mit Phonetik und Übersetzung
- **Zweisprachige Audio-Buttons:**
  - 🔊 **Auf Deutsch** (TTS, Stimme `nova`, normale Geschwindigkeit)
  - 🔊 **In Muttersprache** (TTS, Stimme `shimmer`, übersetzter Text)
  - 🐢 Langsam (Deutsch, 0.6× Geschwindigkeit)
  - 🎤 Nachsprechen + Aussprache-Feedback via Whisper (Score 0–100%)
- KI-Erklärung per Claude (Streaming, in Muttersprache)
- Auto-Play beim Blättern (ein-/ausschaltbar)
- Beispielsatz mit separatem Abspiel-Button

#### Quiz (`/quiz/:topicId`)
- 5 Multiple-Choice-Fragen (Deutsch → Muttersprache)
- Hör-Button pro Frage (Deutsch TTS)
- Sofortfeedback (richtig/falsch + korrekte Antwort)
- KI-Motivationsnachricht nach dem Quiz (Claude)
- +50 XP (+ 30 XP bei perfektem Ergebnis)

#### Vokabelkarten (`/vocab`)
- Alle 48 Phrasen als Lernstapel (neue/unfertige Karten zuerst)
- **Karte vorne:** Deutscher Begriff + Phonetik + 🔊 Abspielen
- **Karte hinten (Flip-Animation):** Übersetzung in Muttersprache + 🔊 Abspielen + Beispielsatz
- Selbstbewertung: 🔄 Nochmal / 👍 Gut / ⭐ Gemeistert
- Mastery-Level (`0=neu`, `1=lernend`, `2=gemeistert`) wird in `localStorage` gespeichert
- +5 XP pro erstmalig bewerteter Karte

#### Behörden-Report (`/report`)
- Druckbarer Fortschrittsbericht (PDF-fähig)
- Zeigt Level, absolvierte Themen, Lernzeit, Streak

### XP-System

| Level | XP-Bereich |
|---|---|
| A1 | 0 – 499 |
| A2 | 500 – 1.499 |
| B1 | 1.500 – 2.999 |
| B2 | 3.000+ |

### Kosten-Tracking

Alle API-Kosten (Anthropic + OpenAI TTS + Whisper) werden in Echtzeit angezeigt und in `localStorage` summiert.

---

## Dateistruktur (Wichtigste Dateien)

```
src/
├── api/
│   ├── claude.ts          # Anthropic: explainPhrase (streaming), getEncouragingMessage
│   └── openaiAudio.ts     # OpenAI: ttsSpeak(text, speed, onUsage, voice), whisperTranscribe
├── components/
│   ├── AudioControls.tsx  # Zweisprachige Audio-Buttons + Whisper-Mic
│   ├── ApiCostIndicator.tsx
│   ├── ProgressBar.tsx
│   └── XpPopAnimation.tsx
├── data/
│   ├── content.ts         # 6 Themen × 8 Phrasen, 4 Sprachen
│   └── badges.ts          # 8 Badges
├── hooks/
│   └── useSpeech.ts       # useSpeak(), useListen()
├── pages/
│   ├── onboarding/        # Step1Language, Step2Path, Step3Assessment
│   ├── Dashboard.tsx
│   ├── LessonScreen.tsx
│   ├── QuizScreen.tsx
│   ├── VocabScreen.tsx
│   └── ReportView.tsx
├── store/
│   ├── ProgressContext.tsx # Globaler State, XP, Badges, vocabMastery
│   └── progress.ts         # localStorage, getLevelFromXp, updateStreak
├── i18n.ts                 # Alle UI-Strings in 4 Sprachen
└── types.ts                # Language, Level, Phrase, Topic, UserProgress, ...
```

---

## Nächste Schritte

### Priorität 1 — Muttersprachen-Button im Quiz
Im Quiz-Screen gibt es aktuell nur einen „Auf Deutsch"-Button zum Anhören der Frage. Sinnvoll wäre:
- Nach der Antwort (wenn der Nutzer falsch lag) die korrekte Antwort **auch in der Muttersprache** abspielen
- Alternativ: zweiter Audio-Button direkt neben dem deutschen Hör-Button, der die native Übersetzung vorliest
- Die `AudioControls`-Komponente unterstützt das bereits (`nativeTranslation`-Prop + `compact`-Modus muss erweitert werden)

### Priorität 2 — Mehr Inhalt
- Aktuell 6 Themen × 8 Phrasen = 48 Phrasen
- Ziel: 10–12 Themen, idealerweise 10+ Phrasen pro Thema
- Neue Themen-Ideen: Schule / Kita, Bank & Finanzen, Supermarkt, Öffentliche Verkehrsmittel

### Priorität 3 — Aussprache-Training im Quiz
- Whisper-Mikrofon auch im Quiz-Screen einbauen
- Nutzer spricht die deutsche Phrase nach → bekommt Score
- Fördert aktives Sprechen, nicht nur passives Erkennen

### Priorität 4 — Onboarding verfeinern
- Fortschrittsbalken im Onboarding (Schritt 1 von 3)
- Motivierender Abschlussscreen nach Step 3 mit dem ermittelten Level

### Priorität 5 — Offline-Fähigkeit (PWA)
- Service Worker + Manifest → App installierbar, Inhalte offline verfügbar
- TTS-Audio cachen (häufig gehörte Phrasen)

### Priorität 6 — Lernstatistiken
- Wochengraph: wie viele Phrasen pro Tag gelernt
- Schwächste Themen hervorheben (Quiz-Score < 60%)

---

## Demo-Hinweise (Jobcenter-Präsentation)

- Demopfad: Sprache **Arabisch** → Pfad **Neu in Deutschland** → Thema **Jobcenter**
- Das Jobcenter-Thema ist immer entsperrt (`alwaysUnlocked: true`)
- Reset: `localStorage.removeItem('linguu_progress')` im Browser-Dev-Tools
