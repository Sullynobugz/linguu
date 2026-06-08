import { useNavigate } from 'react-router-dom';
import { useProgress } from '../store/ProgressContext';
import { t } from '../i18n';
import type { Language } from '../types';

interface ChecklistItem {
  id: string;
  icon: string;
  titleByLang: Partial<Record<Language, string>>;
  descByLang: Partial<Record<Language, string>>;
  infoDE: string;
  isLangRequirement?: boolean;
}

const items: ChecklistItem[] = [
  {
    id: 'aufenthalt',
    icon: '📅',
    titleByLang: {
      de: '5 Jahre legaler Aufenthalt',
      ar: '5 سنوات من الإقامة القانونية',
      uk: '5 років законного перебування',
      es: '5 años de residencia legal',
      en: '5 years of legal residence',
      tr: '5 yıl yasal ikamet',
      pl: '5 lat legalnego pobytu',
      ro: '5 ani de ședere legală',
      ru: '5 лет законного проживания',
    },
    descByLang: {
      ar: 'ممكن التخفيض إلى 3 سنوات مع إنجازات تكامل استثنائية',
      uk: 'Можливо скорочення до 3 років за особливі досягнення інтеграції',
      es: 'Puede reducirse a 3 años con logros de integración excepcionales',
      en: 'Can be reduced to 3 years with exceptional integration achievements',
      tr: 'Olağanüstü entegrasyon başarılarıyla 3 yıla indirilebilir',
      pl: 'Można skrócić do 3 lat przy wyjątkowych osiągnięciach integracyjnych',
      ro: 'Poate fi redus la 3 ani cu realizări excepționale de integrare',
      ru: 'Может быть сокращено до 3 лет при исключительных успехах в интеграции',
    },
    infoDE: 'Mindestens 5 Jahre mit legalem Aufenthaltstitel in Deutschland (StAG 2024)',
  },
  {
    id: 'sprache',
    icon: '🗣️',
    isLangRequirement: true,
    titleByLang: {
      de: 'Deutsches Sprachzertifikat B1',
      ar: 'شهادة لغة ألمانية B1',
      uk: 'Мовний сертифікат B1 з німецької',
      es: 'Certificado de alemán B1',
      en: 'German language certificate B1',
      tr: 'Almanca B1 dil sertifikası',
      pl: 'Certyfikat języka niemieckiego B1',
      ro: 'Certificat de limbă germană B1',
      ru: 'Языковой сертификат по немецкому B1',
    },
    descByLang: {
      de: 'Mindestens B1-Niveau — das ist dein Ziel in Linguu!',
      ar: 'مستوى B1 على الأقل — هذا هدفك في Linguu!',
      uk: 'Мінімум рівень B1 — це твоя ціль у Linguu!',
      es: 'Mínimo nivel B1 — ¡este es tu objetivo en Linguu!',
      en: 'Minimum B1 level — this is your goal in Linguu!',
      tr: 'En az B1 seviyesi — Linguu\'daki hedefiniz bu!',
      pl: 'Minimum poziom B1 — to jest Twój cel w Linguu!',
      ro: 'Minimum nivelul B1 — acesta este obiectivul tău în Linguu!',
      ru: 'Минимум уровень B1 — это твоя цель в Linguu!',
    },
    infoDE: 'Nachweis durch anerkanntes Sprachzertifikat (z.B. Goethe-Institut, telc, ÖSD)',
  },
  {
    id: 'test',
    icon: '📝',
    titleByLang: {
      de: 'Einbürgerungstest bestehen',
      ar: 'اجتياز اختبار التجنيس',
      uk: 'Скласти тест на натуралізацію',
      es: 'Superar el test de naturalización',
      en: 'Pass the naturalization test',
      tr: 'Vatandaşlık testini geçmek',
      pl: 'Zdać test naturalizacyjny',
      ro: 'Promovarea testului de naturalizare',
      ru: 'Сдать тест на натурализацию',
    },
    descByLang: {
      de: '33 Fragen — 17 richtige Antworten zum Bestehen',
      ar: '33 سؤالاً — يكفي 17 إجابة صحيحة للنجاح',
      uk: '33 запитання — достатньо 17 правильних відповідей',
      es: '33 preguntas — se necesitan 17 respuestas correctas para aprobar',
      en: '33 questions — 17 correct answers needed to pass',
      tr: '33 soru — geçmek için 17 doğru cevap yeterli',
      pl: '33 pytania — wystarczy 17 poprawnych odpowiedzi',
      ro: '33 de întrebări — sunt necesare 17 răspunsuri corecte pentru promovare',
      ru: '33 вопроса — достаточно 17 правильных ответов для сдачи',
    },
    infoDE: 'Test "Leben in Deutschland" — 310 Fragen im Katalog, 33 im Test',
  },
  {
    id: 'lebensunterhalt',
    icon: '💼',
    titleByLang: {
      de: 'Lebensunterhalt eigenständig sichern',
      ar: 'تأمين الرزق بشكل مستقل',
      uk: 'Самостійне забезпечення засобів до існування',
      es: 'Asegurar el sustento de forma independiente',
      en: 'Secure livelihood independently',
      tr: 'Bağımsız geçim güvencesi',
      pl: 'Samodzielne zapewnienie środków do życia',
      ro: 'Asigurarea independentă a mijloacelor de subzistență',
      ru: 'Самостоятельное обеспечение средств к существованию',
    },
    descByLang: {
      de: 'Keine Sozialleistungen (außer in besonderen Ausnahmefällen)',
      ar: 'لا حاجة لمساعدات اجتماعية (باستثناء الحالات الاستثنائية)',
      uk: 'Без соціальної допомоги (за винятком окремих випадків)',
      es: 'Sin prestaciones sociales (excepto en casos excepcionales)',
      en: 'No social benefits (except in exceptional cases)',
      tr: 'Sosyal yardım almadan (istisnai durumlar hariç)',
      pl: 'Bez świadczeń społecznych (z wyjątkiem wyjątkowych przypadków)',
      ro: 'Fără prestații sociale (cu excepția cazurilor excepționale)',
      ru: 'Без социальных пособий (за исключением особых случаев)',
    },
    infoDE: 'Eigenständige Sicherung des Lebensunterhalts ohne Bezug von Bürgergeld/Sozialhilfe',
  },
  {
    id: 'verfassung',
    icon: '🏛️',
    titleByLang: {
      de: 'Bekenntnis zur demokratischen Grundordnung',
      ar: 'الإقرار بالنظام الأساسي الديمقراطي',
      uk: 'Визнання основного демократичного ладу',
      es: 'Reconocimiento del orden democrático fundamental',
      en: 'Recognition of the democratic constitutional order',
      tr: 'Temel demokratik düzenin tanınması',
      pl: 'Uznanie podstawowego demokratycznego porządku',
      ro: 'Recunoașterea ordinii democratice fundamentale',
      ru: 'Признание основного демократического строя',
    },
    descByLang: {
      de: 'Bekenntnis zur freiheitlichen demokratischen Grundordnung des Grundgesetzes',
      ar: 'إقرار بالنظام الأساسي الحر الديمقراطي للجمهورية الفيدرالية',
      uk: 'Визнання вільного демократичного ладу Федеративної Республіки',
      es: 'Compromiso con el orden democrático liberal de la República Federal',
      en: 'Commitment to the free democratic constitutional order of Germany',
      tr: 'Federal Cumhuriyet\'in özgür demokratik temel düzenine bağlılık',
      pl: 'Zobowiązanie do wolnego demokratycznego porządku Republiki Federalnej',
      ro: 'Angajament față de ordinea democratică liberă a Republicii Federale',
      ru: 'Приверженность свободному демократическому строю Федеративной Республики',
    },
    infoDE: 'Bekenntnis zur freiheitlichen demokratischen Grundordnung des Grundgesetzes',
  },
  {
    id: 'straffreiheit',
    icon: '⚖️',
    titleByLang: {
      de: 'Keine Vorstrafen',
      ar: 'خلو من السجل الجنائي',
      uk: 'Відсутність судимостей',
      es: 'Sin antecedentes penales',
      en: 'No criminal record',
      tr: 'Sabıkasız olmak',
      pl: 'Brak karalności',
      ro: 'Fără antecedente penale',
      ru: 'Отсутствие судимости',
    },
    descByLang: {
      de: 'Keine Verurteilungen (außer Bagatelldelikte)',
      ar: 'لا عقوبات جنائية (باستثناء المخالفات البسيطة)',
      uk: 'Відсутність кримінальних вироків (крім незначних правопорушень)',
      es: 'Sin condenas penales (excepto infracciones menores)',
      en: 'No criminal convictions (except for minor offenses)',
      tr: 'Cezai mahkumiyet yok (küçük suçlar hariç)',
      pl: 'Brak wyroków karnych (z wyjątkiem drobnych wykroczeń)',
      ro: 'Fără condamnări penale (cu excepția contravenții minore)',
      ru: 'Отсутствие уголовных приговоров (кроме незначительных правонарушений)',
    },
    infoDE: 'Keine Verurteilungen über 90 Tagessätze oder 3 Monate Freiheitsstrafe',
  },
  {
    id: 'staatsangehoerigkeit',
    icon: '🌍',
    titleByLang: {
      de: 'Regelung der bisherigen Staatsangehörigkeit',
      ar: 'تنظيم الجنسية السابقة',
      uk: 'Врегулювання попереднього громадянства',
      es: 'Regulación de la ciudadanía anterior',
      en: 'Regulation of previous citizenship',
      tr: 'Önceki vatandaşlığın düzenlenmesi',
      pl: 'Uregulowanie poprzedniego obywatelstwa',
      ro: 'Reglementarea cetățeniei anterioare',
      ru: 'Урегулирование предыдущего гражданства',
    },
    descByLang: {
      de: 'Mehrstaatigkeit nun in den meisten Fällen erlaubt (Reform 2024)',
      ar: 'التعددية الجنسية مسموح بها الآن في أغلب الحالات (إصلاح 2024)',
      uk: 'Подвійне громадянство тепер дозволено в більшості випадків (реформа 2024)',
      es: 'La doble ciudadanía está ahora permitida en la mayoría de los casos (reforma 2024)',
      en: 'Multiple citizenship now permitted in most cases (2024 reform)',
      tr: 'Çifte vatandaşlık artık çoğu durumda mümkün (2024 reformu)',
      pl: 'Podwójne obywatelstwo jest teraz dozwolone w większości przypadków (reforma 2024)',
      ro: 'Dubla cetățenie este acum permisă în majoritatea cazurilor (reforma 2024)',
      ru: 'Двойное гражданство теперь разрешено в большинстве случаев (реформа 2024)',
    },
    infoDE: 'Seit 2024: Mehrstaatigkeit grundsätzlich erlaubt — kein Verzicht auf Herkunftspass nötig',
  },
];

function getItemTitle(item: ChecklistItem, lang: Language): string {
  return item.titleByLang[lang] ?? item.titleByLang['en'] ?? '';
}
function getItemDesc(item: ChecklistItem, lang: Language): string {
  return item.descByLang[lang] ?? item.descByLang['en'] ?? '';
}

const levelColors = { A1: '#10b981', A2: '#3b82f6', B1: '#8b5cf6', B2: '#4f46e5' };

export function EinbuergerungChecklist() {
  const navigate = useNavigate();
  const { progress, toggleEinbuergerungCheck } = useProgress();
  const lang = (progress.language ?? 'en') as Language;

  const checklist = progress.einbuergerungChecklist ?? {};
  const checkedCount = items.filter(item => checklist[item.id]).length;
  const totalCount = items.length;
  const progressPct = Math.round((checkedCount / totalCount) * 100);

  const isB1Reached = ['B1', 'B2'].includes(progress.level);

  const headings: Partial<Record<Language, string>> = {
    de: 'Einbürgerungsvoraussetzungen in Deutschland',
    ar: 'متطلبات التجنيس في ألمانيا',
    uk: 'Вимоги для отримання громадянства Німеччини',
    es: 'Requisitos de naturalización en Alemania',
    en: 'Naturalization Requirements in Germany',
    tr: 'Almanya\'da Vatandaşlık Gereksinimleri',
    pl: 'Wymagania naturalizacji w Niemczech',
    ro: 'Cerințele de naturalizare în Germania',
    ru: 'Требования для натурализации в Германии',
  };
  const subheadings: Partial<Record<Language, string>> = {
    de: 'Hake ab, was du bereits erfüllt hast',
    ar: 'ضع علامة على ما أنجزته بالفعل',
    uk: 'Відмічай, що вже виконано',
    es: 'Marca lo que ya has cumplido',
    en: 'Mark what you have already fulfilled',
    tr: 'Zaten tamamladıklarınızı işaretleyin',
    pl: 'Zaznacz, co już spełniłeś',
    ro: 'Bifează ce ai îndeplinit deja',
    ru: 'Отмечай, что уже выполнено',
  };
  const fulfilledLabel: Partial<Record<Language, string>> = {
    de: 'erfüllt', en: 'fulfilled', ar: 'محقق', uk: 'виконано',
    tr: 'karşılandı', pl: 'spełnione', ro: 'îndeplinite', ru: 'выполнено', es: 'cumplidos',
  };
  const currentLevelLabel: Partial<Record<Language, string>> = {
    de: 'Dein aktuelles Niveau', en: 'Your current level', ar: 'مستواك الحالي',
    uk: 'Твій рівень', tr: 'Mevcut seviyeniz', pl: 'Twój obecny poziom',
    ro: 'Nivelul tău actual', ru: 'Твой текущий уровень', es: 'Tu nivel actual',
  };
  const b1ReachedMsg: Partial<Record<Language, string>> = {
    de: 'B1-Niveau erreicht! Sprachliche Anforderung erfüllt.',
    en: 'You reached B1 level! Language requirement fulfilled.',
    ar: 'وصلت إلى مستوى B1! متطلب اللغة محقق.',
    uk: 'Досягнуто рівень B1! Мовна вимога виконана.',
    tr: 'B1 seviyesine ulaştınız! Dil şartı karşılandı.',
    pl: 'Osiągnąłeś poziom B1! Wymóg językowy spełniony.',
    ro: 'Ai atins nivelul B1! Cerința lingvistică îndeplinită.',
    ru: 'Достигнут уровень B1! Языковое требование выполнено.',
    es: '¡Alcanzaste el nivel B1! Requisito lingüístico cumplido.',
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm transition-all"
          style={{ color: '#64748b' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          {t('back', lang)}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🪪</span>
          <span style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#0f172a', fontWeight: 700, fontSize: 18 }}>
            Einbürgerung
          </span>
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Titel */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#0f172a', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
          >
            {headings[lang] ?? headings['en']}
          </h1>
          <p style={{ color: '#64748b', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
            {subheadings[lang] ?? subheadings['en']}
          </p>
        </div>

        {/* Fortschrittsbalken */}
        <div
          className="rounded-2xl p-5 mb-8 animate-fade-in-up"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: '#818cf8' }}>
              {checkedCount} / {totalCount} {fulfilledLabel[lang] ?? fulfilledLabel['en']}
            </span>
            <span className="text-2xl font-bold" style={{ color: '#818cf8' }}>
              {progressPct}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)' }}
            />
          </div>
        </div>

        {/* B1-Hinweis wenn Ziel noch nicht erreicht */}
        {!isB1Reached && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in-up"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.35)' }}
          >
            <span className="text-2xl">🎯</span>
            <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <p className="font-semibold text-sm" style={{ color: '#a78bfa' }}>
                {t('b1Goal', lang)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                {(currentLevelLabel[lang] ?? currentLevelLabel['en'])}: {progress.level}
              </p>
            </div>
            <div
              className="ml-auto px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: `${levelColors[progress.level]}20`,
                color: levelColors[progress.level],
                border: `1px solid ${levelColors[progress.level]}50`,
              }}
            >
              {progress.level}
            </div>
          </div>
        )}

        {isB1Reached && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in-up"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)' }}
          >
            <span className="text-2xl">✅</span>
            <p className="font-semibold text-sm" style={{ color: '#10b981' }}>
              {b1ReachedMsg[lang] ?? b1ReachedMsg['en']}
            </p>
          </div>
        )}

        {/* Checkliste */}
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => {
            const checked = !!checklist[item.id];
            const isLangItem = item.isLangRequirement;
            const autoChecked = isLangItem && isB1Reached;
            const effectivelyChecked = checked || autoChecked;

            return (
              <button
                key={item.id}
                onClick={() => !autoChecked && toggleEinbuergerungCheck(item.id)}
                className="flex items-start gap-4 p-5 rounded-2xl text-left transition-all duration-200 animate-fade-in-up"
                style={{
                  animationDelay: `${idx * 60}ms`,
                  background: effectivelyChecked
                    ? 'rgba(99,102,241,0.12)'
                    : 'rgba(255,255,255,0.9)',
                  border: effectivelyChecked
                    ? '2px solid rgba(99,102,241,0.5)'
                    : '2px solid rgba(0,0,0,0.05)',
                  cursor: autoChecked ? 'default' : 'pointer',
                }}
                onMouseEnter={e => {
                  if (!autoChecked) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)';
                  }
                }}
                onMouseLeave={e => {
                  if (!autoChecked) {
                    (e.currentTarget as HTMLElement).style.borderColor = effectivelyChecked
                      ? 'rgba(99,102,241,0.5)'
                      : 'rgba(0,0,0,0.05)';
                  }
                }}
              >
                {/* Checkbox */}
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all duration-200"
                  style={{
                    borderColor: effectivelyChecked ? '#6366f1' : 'rgba(0,0,0,0.15)',
                    background: effectivelyChecked ? '#6366f1' : 'transparent',
                  }}
                >
                  {effectivelyChecked && (
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>
                  )}
                </div>

                {/* Inhalt */}
                <div className="flex-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{item.icon}</span>
                    <span className="font-semibold" style={{ color: effectivelyChecked ? '#a5b4fc' : '#0f172a' }}>
                      {getItemTitle(item, lang)}
                    </span>
                    {isLangItem && (
                      <span
                        className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)' }}
                      >
                        B1
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                    {getItemDesc(item, lang)}
                  </p>
                  <p className="text-xs mt-1.5 italic" style={{ color: 'rgba(100,116,139,0.6)' }}>
                    {item.infoDE}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* StAG 2024 Hinweis */}
        <div
          className="mt-8 rounded-xl p-4 text-center"
          style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(0,0,0,0.05)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(100,116,139,0.6)' }}>
            Staatsangehörigkeitsgesetz (StAG) — Reform Januar 2024 · Kein Rechtsanspruch
          </p>
        </div>
      </div>
    </div>
  );
}
