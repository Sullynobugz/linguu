import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../store/ProgressContext';
import { OnboardingLayout } from './OnboardingLayout';
import { t } from '../../i18n';
import type { Level, Language } from '../../types';

// Questions where the OPTIONS must be in the user's native language
interface TranslationQuestion {
  id: number;
  type: 'translation';
  questionDE: string;
  // Options per language — correct is always index 0 before shuffle
  optionsByLang: Record<Language, string[]>;
  correct: 0; // always first before shuffle
  level: 'A1' | 'A2' | 'B1';
}

// Questions where the options are fixed German text (grammar / register)
interface GermanQuestion {
  id: number;
  type: 'german';
  questionDE: string;
  // Hint shown below question in native language
  hintByLang: Record<Language, string>;
  options: string[];
  correct: number;
  level: 'A1' | 'A2' | 'B1';
}

// B1 question: the phrase to translate comes from native language → German
interface TranslateToGermanQuestion {
  id: number;
  type: 'toGerman';
  // The source phrase in all languages
  phraseByLang: Record<Language, string>;
  questionDE: string; // "Wie sagt man das auf Deutsch?"
  options: string[]; // always German options
  correct: number;
  level: 'B1';
}

type Question = TranslationQuestion | GermanQuestion | TranslateToGermanQuestion;

const rawQuestions: Question[] = [
  {
    id: 1,
    type: 'translation',
    questionDE: 'Was bedeutet "Guten Morgen"?',
    optionsByLang: {
      ar: ['صباح الخير', 'مساء الخير', 'تصبح على خير', 'ظهر الخير'],
      uk: ['Доброго ранку', 'Доброго вечора', 'На добраніч', 'Доброго дня'],
      es: ['Buenos días', 'Buenas noches', 'Buenas noches', 'Buenas tardes'],
      en: ['Good morning', 'Good evening', 'Good night', 'Good afternoon'],
      de: ['Guten Morgen', 'Guten Abend', 'Gute Nacht', 'Guten Mittag'],
      tr: ['Günaydın', 'İyi akşamlar', 'İyi geceler', 'İyi öğleden sonralar'],
      pl: ['Dzień dobry (rano)', 'Dobry wieczór', 'Dobranoc', 'Dzień dobry (po południu)'],
      ro: ['Bună dimineața', 'Bună seara', 'Noapte bună', 'Bună ziua'],
      ru: ['Доброе утро', 'Добрый вечер', 'Спокойной ночи', 'Добрый день'],
    },
    correct: 0,
    level: 'A1',
  },
  {
    id: 2,
    type: 'german',
    questionDE: 'Ergänze: "Ich ___ aus Spanien."',
    hintByLang: {
      ar: 'اختر الفعل الصحيح',
      uk: 'Обери правильне дієслово',
      es: 'Elige el verbo correcto',
      en: 'Choose the correct verb',
      de: 'Wähle das richtige Verb',
      tr: 'Doğru fiili seçin',
      pl: 'Wybierz właściwy czasownik',
      ro: 'Alege verbul corect',
      ru: 'Выбери правильный глагол',
    },
    options: ['habe', 'ist', 'bin', 'sind'],
    correct: 2,
    level: 'A1',
  },
  {
    id: 3,
    type: 'translation',
    questionDE: 'Was bedeutet "Ich hätte gerne einen Termin"?',
    optionsByLang: {
      ar: ['أريد تحديد موعد', 'لدي موعد', 'فاتني موعدي', 'هل يمكنك إلغاء موعدي؟'],
      uk: ['Я б хотів записатися', 'У мене є зустріч', 'Я пропустив зустріч', 'Можете скасувати зустріч?'],
      es: ['Me gustaría concertar una cita', 'Tengo una cita', 'Perdí mi cita', '¿Puede cancelar mi cita?'],
      en: ['I would like to make an appointment', 'I have an appointment', 'I missed my appointment', 'Can you cancel my appointment?'],
      de: ['Ich möchte einen Termin vereinbaren', 'Ich habe einen Termin', 'Ich habe meinen Termin verpasst', 'Können Sie meinen Termin absagen?'],
      tr: ['Randevu almak istiyorum', 'Randevum var', 'Randevumu kaçırdım', 'Randevumu iptal edebilir misiniz?'],
      pl: ['Chciałbym umówić wizytę', 'Mam wizytę', 'Przegapiłem wizytę', 'Czy może Pan odwołać wizytę?'],
      ro: ['Aș dori să fac o programare', 'Am o programare', 'Am ratat programarea', 'Poate anula programarea?'],
      ru: ['Я бы хотел записаться', 'У меня есть встреча', 'Я пропустил встречу', 'Можете отменить встречу?'],
    },
    correct: 0,
    level: 'A2',
  },
  {
    id: 4,
    type: 'german',
    questionDE: 'Welche Aussage ist formell (formal)?',
    hintByLang: {
      ar: 'أي جملة رسمية مناسبة للمكتب؟',
      uk: 'Яка фраза підходить для офіційного спілкування?',
      es: '¿Cuál es la frase formal, adecuada para una oficina?',
      en: 'Which phrase is formal, suitable for an office?',
      de: 'Welche Aussage ist für ein Büro angemessen?',
      tr: 'Hangi cümle resmi ve ofis için uygun?',
      pl: 'Które zdanie jest formalne, odpowiednie do biura?',
      ro: 'Care frază este formală, potrivită pentru birou?',
      ru: 'Какая фраза формальная, подходящая для офиса?',
    },
    options: [
      'Hey, wie geht\'s?',
      'Guten Tag, wie kann ich Ihnen helfen?',
      'Tschüss, bis später!',
      'Na, alles klar?',
    ],
    correct: 1,
    level: 'A2',
  },
  {
    id: 5,
    type: 'toGerman',
    phraseByLang: {
      ar: '"هل يمكنك تكرار ذلك بشكل أبطأ من فضلك؟"',
      uk: '"Чи могли б ви повторити це повільніше, будь ласка?"',
      es: '"¿Podría repetir eso más despacio, por favor?"',
      en: '"Could you please repeat that more slowly?"',
      de: '"Könnten Sie das bitte langsamer wiederholen?"',
      tr: '"Lütfen bunu daha yavaş tekrar edebilir misiniz?"',
      pl: '"Czy mógłby Pan to powtórzyć wolniej?"',
      ro: '"Ați putea repeta asta mai rar, vă rog?"',
      ru: '"Не могли бы вы повторить это помедленнее, пожалуйста?"',
    },
    questionDE: 'Wie sagt man das auf Deutsch?',
    options: [
      'Können Sie das bitte schneller wiederholen?',
      'Können Sie bitte lauter sprechen?',
      'Könnten Sie das bitte langsamer wiederholen?',
      'Können Sie das bitte aufschreiben?',
    ],
    correct: 2,
    level: 'B1',
  },
];

// Shuffle options but track where the correct answer ends up
function shuffleWithCorrect(options: string[], correctIdx: number): { options: string[]; correct: number } {
  const pairs = options.map((o, i) => ({ o, isCorrect: i === correctIdx }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return {
    options: pairs.map(p => p.o),
    correct: pairs.findIndex(p => p.isCorrect),
  };
}

// Build display questions for the given language
interface DisplayQuestion {
  id: number;
  questionLine1: string; // German question
  questionLine2?: string; // native hint/phrase
  options: string[];
  correct: number;
  level: 'A1' | 'A2' | 'B1';
}

function buildQuestions(lang: Language): DisplayQuestion[] {
  return rawQuestions.map(q => {
    if (q.type === 'translation') {
      const shuffled = shuffleWithCorrect(q.optionsByLang[lang], q.correct);
      return {
        id: q.id,
        questionLine1: q.questionDE,
        options: shuffled.options,
        correct: shuffled.correct,
        level: q.level,
      };
    }
    if (q.type === 'german') {
      const shuffled = shuffleWithCorrect(q.options, q.correct);
      return {
        id: q.id,
        questionLine1: q.questionDE,
        questionLine2: q.hintByLang[lang],
        options: shuffled.options,
        correct: shuffled.correct,
        level: q.level,
      };
    }
    // toGerman
    const shuffled = shuffleWithCorrect(q.options, q.correct);
    return {
      id: q.id,
      questionLine1: q.phraseByLang[lang],
      questionLine2: q.questionDE,
      options: shuffled.options,
      correct: shuffled.correct,
      level: q.level,
    };
  });
}

const resultMessages: Record<Level, Partial<Record<Language, { title: string; text: string }>>> = {
  A1: {
    de: { title: '🌱 Niveau A1', text: 'Super! Wir starten von Anfang an und bauen gemeinsam eine starke Grundlage im Deutschen.' },
    ar: { title: '🌱 المستوى A1', text: 'ممتاز! سنبدأ من البداية معاً ونبني أساساً قوياً باللغة الألمانية.' },
    uk: { title: '🌱 Рівень A1', text: 'Чудово! Ми почнемо з основ і разом побудуємо міцну базу з німецької.' },
    es: { title: '🌱 Nivel A1', text: '¡Genial! Empezaremos desde el principio y construiremos juntos una base sólida en alemán.' },
    en: { title: '🌱 Level A1', text: 'Great! We\'ll start from the beginning and build a strong German foundation together.' },
    tr: { title: '🌱 A1 Seviyesi', text: 'Harika! Başlangıçtan başlayıp birlikte güçlü bir Almanca temeli oluşturacağız.' },
    pl: { title: '🌱 Poziom A1', text: 'Świetnie! Zaczniemy od początku i razem zbudujemy solidną podstawę w języku niemieckim.' },
    ro: { title: '🌱 Nivelul A1', text: 'Grozav! Vom începe de la zero și vom construi împreună o bază solidă în germană.' },
    ru: { title: '🌱 Уровень A1', text: 'Отлично! Начнём с самого начала и вместе построим прочную основу в немецком.' },
  },
  A2: {
    de: { title: '📈 Niveau A2', text: 'Du hast eine gute Grundlage! Wir erweitern dein Wissen und deinen praktischen Wortschatz.' },
    ar: { title: '📈 المستوى A2', text: 'لديك أساس جيد! سنبني على معرفتك ونوسّع مفرداتك العملية.' },
    uk: { title: '📈 Рівень A2', text: 'У тебе хороша база! Ми розширимо твій практичний словник.' },
    es: { title: '📈 Nivel A2', text: '¡Tienes una buena base! Construiremos sobre tus conocimientos.' },
    en: { title: '📈 Level A2', text: 'You have a good foundation! We\'ll build on your knowledge.' },
    tr: { title: '📈 A2 Seviyesi', text: 'İyi bir temeliniz var! Bilginizi genişletip pratik kelime dağarcığınızı büyüteceğiz.' },
    pl: { title: '📈 Poziom A2', text: 'Masz dobrą podstawę! Rozbudujemy Twoją wiedzę i praktyczne słownictwo.' },
    ro: { title: '📈 Nivelul A2', text: 'Ai o bază bună! Vom construi pe cunoștințele tale și vom extinde vocabularul practic.' },
    ru: { title: '📈 Уровень A2', text: 'У тебя хорошая база! Расширим твои знания и практическую лексику.' },
  },
  B1: {
    de: { title: '🚀 Niveau B1', text: 'Ausgezeichnetes Niveau! Wir fordern dich mit komplexeren Gesprächen heraus.' },
    ar: { title: '🚀 المستوى B1', text: 'مستوى رائع! سنتحدى قدراتك بمحادثات أكثر تعقيداً.' },
    uk: { title: '🚀 Рівень B1', text: 'Відмінний рівень! Складніші розмови тебе чекають.' },
    es: { title: '🚀 Nivel B1', text: '¡Nivel excelente! Te desafiaremos con conversaciones más complejas.' },
    en: { title: '🚀 Level B1', text: 'Excellent level! We\'ll challenge you with more complex conversations.' },
    tr: { title: '🚀 B1 Seviyesi', text: 'Harika bir seviye! Daha karmaşık konuşmalarla sizi zorlayacağız.' },
    pl: { title: '🚀 Poziom B1', text: 'Doskonały poziom! Będziemy Cię wyzywać bardziej złożonymi rozmowami.' },
    ro: { title: '🚀 Nivelul B1', text: 'Nivel excelent! Te vom provoca cu conversații mai complexe.' },
    ru: { title: '🚀 Уровень B1', text: 'Отличный уровень! Будем вызывать тебя более сложными разговорами.' },
  },
  B2: {
    de: { title: '⭐ Niveau B2', text: 'Sehr fortgeschrittenes Niveau!' },
    ar: { title: '⭐ المستوى B2', text: 'مستوى متقدم جداً!' },
    uk: { title: '⭐ Рівень B2', text: 'Дуже просунутий рівень!' },
    es: { title: '⭐ Nivel B2', text: '¡Nivel muy avanzado!' },
    en: { title: '⭐ Level B2', text: 'Very advanced level!' },
    tr: { title: '⭐ B2 Seviyesi', text: 'Çok ileri düzey!' },
    pl: { title: '⭐ Poziom B2', text: 'Bardzo zaawansowany poziom!' },
    ro: { title: '⭐ Nivelul B2', text: 'Nivel foarte avansat!' },
    ru: { title: '⭐ Уровень B2', text: 'Очень продвинутый уровень!' },
  },
};

function computeLevel(questions: DisplayQuestion[], answers: number[]): Level {
  let a1 = 0, a2 = 0, b1 = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correct) {
      if (q.level === 'A1') a1++;
      else if (q.level === 'A2') a2++;
      else if (q.level === 'B1') b1++;
    }
  });
  if (b1 >= 1 && a2 >= 1 && a1 >= 1) return 'B1';
  if (a2 >= 1 && a1 >= 1) return 'A2';
  return 'A1';
}

const levelColors: Record<Level, string> = {
  A1: '#10b981', A2: '#3b82f6', B1: '#8b5cf6', B2: '#f59e0b',
};

const targetLangNameDE: Partial<Record<Language, string>> = {
  de: 'Deutsch', en: 'Englisch', tr: 'Türkisch', ar: 'Arabisch',
  es: 'Spanisch', uk: 'Ukrainisch', ru: 'Russisch', pl: 'Polnisch', ro: 'Rumänisch',
};

const selfAssessLevels: { level: Level; label: string; desc: string }[] = [
  { level: 'A1', label: 'A1 — Anfänger',        desc: 'Ich kenne kaum Wörter oder Grundphrasen.' },
  { level: 'A2', label: 'A2 — Grundkenntnisse', desc: 'Ich verstehe einfache Sätze und kann mich in vertrauten Situationen verständigen.' },
  { level: 'B1', label: 'B1 — Mittelstufe',     desc: 'Ich kann mich in den meisten Alltagssituationen ausdrücken.' },
  { level: 'B2', label: 'B2 — Fortgeschritten', desc: 'Ich kommuniziere fließend und verstehe komplexe Texte.' },
];

export function Step3Assessment() {
  const navigate = useNavigate();
  const { completeOnboarding, progress } = useProgress();
  const lang = (progress.language ?? 'en') as Language;
  const isGerman = lang === 'de';

  // Build questions once per render, keyed to language
  const [questions] = useState<DisplayQuestion[]>(() => buildQuestions(lang));

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<Level>('A1');

  const question = questions[current];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);

    setTimeout(() => {
      const newAnswers = [...answers, idx];
      setAnswers(newAnswers);
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        const level = computeLevel(questions, newAnswers);
        setResult(level);
        setShowResult(true);
      }
    }, 700);
  };

  // Für deutsche Muttersprachler: einfache Selbsteinschätzung statt Quiz
  if (isGerman) {
    const targetName = targetLangNameDE[progress.targetLanguage as Language] ?? progress.targetLanguage ?? 'der Zielsprache';
    return (
      <OnboardingLayout step={4} total={4} onBack={() => navigate('/onboarding/2')}>

        <div className="text-center mb-8">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8' }}
          >
            Dein {targetName}-Niveau?
          </h1>
          <p className="text-base mt-1" style={{ color: '#8b8fa8' }}>
            Wähle dein aktuelles Sprachniveau — wir passen die Inhalte darauf an.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {selfAssessLevels.map(({ level, label, desc }) => (
            <button
              key={level}
              onClick={() => { completeOnboarding(level); navigate('/'); }}
              className="flex items-center gap-5 p-5 rounded-2xl text-left transition-all duration-200"
              style={{
                background: 'rgba(26,29,39,0.8)',
                border: `2px solid ${levelColors[level]}30`,
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = levelColors[level];
                (e.currentTarget as HTMLElement).style.background = `${levelColors[level]}12`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${levelColors[level]}30`;
                (e.currentTarget as HTMLElement).style.background = 'rgba(26,29,39,0.8)';
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: `${levelColors[level]}20`, color: levelColors[level], border: `2px solid ${levelColors[level]}50` }}
              >
                {level}
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold" style={{ color: '#f0ede8' }}>{label}</div>
                <div className="text-sm mt-0.5" style={{ color: '#8b8fa8' }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </OnboardingLayout>
    );
  }

  if (showResult) {
    const msg = resultMessages[result][lang] ?? resultMessages[result]['en']!;
    return (
      <OnboardingLayout step={4} total={4} onBack={() => navigate('/onboarding/2')}>
        <div className="text-center animate-fade-in-up">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 text-4xl"
            style={{ background: `${levelColors[result]}20`, border: `3px solid ${levelColors[result]}` }}
          >
            🎉
          </div>
          <h1
            className="text-4xl font-bold mb-3"
            style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
          >
            {msg.title}
          </h1>
          <p
            className="text-lg mb-8 max-w-md mx-auto"
            style={{ color: '#8b8fa8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
          >
            {msg.text}
          </p>
          <div
            className="inline-flex items-center px-6 py-3 rounded-full mb-8 text-2xl font-bold"
            style={{ background: `${levelColors[result]}15`, border: `2px solid ${levelColors[result]}`, color: levelColors[result] }}
          >
            {result}
          </div>
          <br />
          <button
            onClick={() => { completeOnboarding(result); navigate('/'); }}
            className="px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f1117' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {t('startNow', lang)}
          </button>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout step={4} total={4} onBack={() => navigate('/onboarding/2')}>
      <div className="text-center mb-6">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-1"
          style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
        >
          {t('whereAreYou', lang)}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(139,143,168,0.6)' }}>
          {t('assessmentHint', lang)}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              background: i < current ? '#f59e0b' : i === current ? '#f59e0b' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      <div
        className="rounded-2xl p-8 mb-6"
        style={{ background: 'rgba(26,29,39,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-xs mb-3 font-semibold uppercase tracking-widest" style={{ color: '#f59e0b', opacity: 0.8 }}>
          {t('questionOf', lang, String(current + 1), String(questions.length))}
        </p>

        {/* Main question line */}
        <p
          className="text-xl font-semibold mb-1"
          style={{ color: '#f0ede8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
        >
          {question.questionLine1}
        </p>

        {/* Optional second line (hint or German sub-question) */}
        {question.questionLine2 && (
          <p className="text-sm mb-6" style={{ color: '#8b8fa8' }}>
            {question.questionLine2}
          </p>
        )}
        {!question.questionLine2 && <div className="mb-6" />}

        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, idx) => {
            let bg = 'rgba(255,255,255,0.04)';
            let border = 'rgba(255,255,255,0.1)';
            let color = '#f0ede8';

            if (selected !== null) {
              if (idx === question.correct) {
                bg = 'rgba(16,185,129,0.15)'; border = '#10b981'; color = '#10b981';
              } else if (idx === selected && selected !== question.correct) {
                bg = 'rgba(239,68,68,0.15)'; border = '#ef4444'; color = '#ef4444';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selected !== null}
                className="text-left px-5 py-4 rounded-xl transition-all duration-200 text-sm font-medium"
                style={{ background: bg, border: `1px solid ${border}`, color, cursor: selected !== null ? 'default' : 'pointer' }}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                onMouseEnter={e => {
                  if (selected === null) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.5)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.08)';
                  }
                }}
                onMouseLeave={e => {
                  if (selected === null) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
              >
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'inherit', flexShrink: 0 }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingLayout>
  );
}
