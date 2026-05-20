import { useNavigate } from 'react-router-dom';
import { useProgress } from '../store/ProgressContext';
import { topics } from '../data/content';
import { t } from '../i18n';
import type { Language } from '../types';

const topicTitlesNative: Partial<Record<Language, Record<string, string>>> = {
  de: { jobcenter: 'Jobcenter', arzt: 'Arzt', wohnung: 'Wohnung suchen', alltag: 'Alltag', behoerden: 'Behörden', notfall: 'Notfall' },
  ar: { jobcenter: 'مركز العمل', arzt: 'الطبيب', wohnung: 'البحث عن شقة', alltag: 'الحياة اليومية', behoerden: 'الجهات الرسمية', notfall: 'الطوارئ' },
  uk: { jobcenter: 'Центр зайнятості', arzt: 'Лікар', wohnung: 'Пошук квартири', alltag: 'Щоденне життя', behoerden: 'Держоргани', notfall: 'Надзвичайні ситуації' },
  es: { jobcenter: 'Oficina de empleo', arzt: 'Médico', wohnung: 'Buscar apartamento', alltag: 'Vida cotidiana', behoerden: 'Organismos oficiales', notfall: 'Emergencias' },
  en: { jobcenter: 'Job Center', arzt: 'Doctor', wohnung: 'Finding Apartment', alltag: 'Daily Life', behoerden: 'Government Offices', notfall: 'Emergencies' },
  tr: { jobcenter: 'İş Merkezi', arzt: 'Doktor', wohnung: 'Daire Arama', alltag: 'Günlük Yaşam', behoerden: 'Resmi Kurumlar', notfall: 'Acil Durumlar' },
  pl: { jobcenter: 'Urząd Pracy', arzt: 'Lekarz', wohnung: 'Szukanie Mieszkania', alltag: 'Życie Codzienne', behoerden: 'Urzędy', notfall: 'Sytuacje Awaryjne' },
  ro: { jobcenter: 'Oficiul de Șomaj', arzt: 'Medic', wohnung: 'Apartament', alltag: 'Viața Cotidiană', behoerden: 'Instituții', notfall: 'Urgențe' },
  ru: { jobcenter: 'Центр Занятости', arzt: 'Врач', wohnung: 'Поиск Квартиры', alltag: 'Повседневная Жизнь', behoerden: 'Госорганы', notfall: 'Чрезвычайные Ситуации' },
};

const reportLabels: Partial<Record<Language, Record<string, string>>> = {
  ar: {
    currentLevel: 'المستوى اللغوي الحالي',
    totalTime: 'إجمالي وقت التعلم',
    activeDays: 'الأيام النشطة',
    completedLessons: 'الدروس المكتملة',
    learnedPhrases: 'العبارات المتعلمة',
    quizAvg: 'متوسط الاختبار',
    longestStreak: 'أطول سلسلة',
    totalXp: 'مجموع نقاط XP',
    currentStreak: 'السلسلة الحالية',
    topics: 'الموضوعات المعالجة',
    badges: 'الشارات المكتسبة',
    noQuiz: 'لم يُكمل أي اختبار بعد',
    inProgress: 'جارٍ',
    notStarted: 'لم يبدأ بعد',
    anon: 'مجهول (لا بيانات شخصية مخزنة)',
    created: 'تاريخ الإنشاء',
    user: 'المستخدم',
    footer: 'تم الإنشاء باستخدام Linguu — تعلم الألمانية للحياة اليومية',
  },
  uk: {
    currentLevel: 'Поточний мовний рівень',
    totalTime: 'Загальний час навчання',
    activeDays: 'Активних днів',
    completedLessons: 'Завершених уроків',
    learnedPhrases: 'Вивчених фраз',
    quizAvg: 'Середній бал вікторини',
    longestStreak: 'Найдовша серія',
    totalXp: 'Всього XP',
    currentStreak: 'Поточна серія',
    topics: 'Опрацьовані теми',
    badges: 'Отримані бейджі',
    noQuiz: 'Жодної вікторини ще не завершено',
    inProgress: 'В процесі',
    notStarted: 'Ще не розпочато',
    anon: 'Анонімно (особисті дані не зберігаються)',
    created: 'Дата створення',
    user: 'Користувач',
    footer: 'Створено з Linguu — вчи німецьку для повсякденного життя',
  },
  es: {
    currentLevel: 'Nivel de idioma actual',
    totalTime: 'Tiempo total de aprendizaje',
    activeDays: 'Días activos',
    completedLessons: 'Lecciones completadas',
    learnedPhrases: 'Frases aprendidas',
    quizAvg: 'Promedio del quiz',
    longestStreak: 'Racha más larga',
    totalXp: 'XP total',
    currentStreak: 'Racha actual',
    topics: 'Temas trabajados',
    badges: 'Insignias obtenidas',
    noQuiz: 'Ningún quiz completado todavía',
    inProgress: 'En curso',
    notStarted: 'Sin comenzar',
    anon: 'Anónimo (sin datos personales almacenados)',
    created: 'Fecha de creación',
    user: 'Usuario',
    footer: 'Creado con Linguu — aprende alemán para la vida diaria',
  },
  en: {
    currentLevel: 'Current language level',
    totalTime: 'Total learning time',
    activeDays: 'Active days',
    completedLessons: 'Completed lessons',
    learnedPhrases: 'Learned phrases',
    quizAvg: 'Quiz average',
    longestStreak: 'Longest streak',
    totalXp: 'Total XP',
    currentStreak: 'Current streak',
    topics: 'Covered topics',
    badges: 'Earned badges',
    noQuiz: 'No quiz completed yet',
    inProgress: 'In progress',
    notStarted: 'Not started yet',
    anon: 'Anonymous (no personal data stored)',
    created: 'Created',
    user: 'User',
    footer: 'Created with Linguu — learn German for daily life',
  },
  de: {
    currentLevel: 'Aktuelles Sprachniveau',
    totalTime: 'Gesamte Lernzeit',
    activeDays: 'Aktive Tage',
    completedLessons: 'Abgeschlossene Lektionen',
    learnedPhrases: 'Gelernte Phrasen',
    quizAvg: 'Quiz-Durchschnitt',
    longestStreak: 'Längste Serie',
    totalXp: 'Gesamt XP',
    currentStreak: 'Aktuelle Serie',
    topics: 'Behandelte Themen',
    badges: 'Verdiente Abzeichen',
    noQuiz: 'Noch kein Quiz abgeschlossen',
    inProgress: 'In Bearbeitung',
    notStarted: 'Noch nicht begonnen',
    anon: 'Anonym (keine persönlichen Daten gespeichert)',
    created: 'Erstellt am',
    user: 'Nutzer',
    footer: 'Erstellt mit Linguu — Sprachen lernen für den Alltag',
  },
  tr: {
    currentLevel: 'Mevcut dil seviyesi',
    totalTime: 'Toplam öğrenme süresi',
    activeDays: 'Aktif günler',
    completedLessons: 'Tamamlanan dersler',
    learnedPhrases: 'Öğrenilen ifadeler',
    quizAvg: 'Quiz ortalaması',
    longestStreak: 'En uzun seri',
    totalXp: 'Toplam XP',
    currentStreak: 'Mevcut seri',
    topics: 'Ele alınan konular',
    badges: 'Kazanılan rozetler',
    noQuiz: 'Henüz quiz tamamlanmadı',
    inProgress: 'Devam ediyor',
    notStarted: 'Başlanmadı',
    anon: 'Anonim (kişisel veri saklanmaz)',
    created: 'Oluşturulma tarihi',
    user: 'Kullanıcı',
    footer: 'Linguu ile oluşturuldu — günlük yaşam için Almanca öğren',
  },
  pl: {
    currentLevel: 'Aktualny poziom języka',
    totalTime: 'Łączny czas nauki',
    activeDays: 'Aktywne dni',
    completedLessons: 'Ukończone lekcje',
    learnedPhrases: 'Nauczone zwroty',
    quizAvg: 'Średnia z quizów',
    longestStreak: 'Najdłuższa seria',
    totalXp: 'Łącznie XP',
    currentStreak: 'Aktualna seria',
    topics: 'Omówione tematy',
    badges: 'Zdobyte odznaki',
    noQuiz: 'Brak ukończonych quizów',
    inProgress: 'W toku',
    notStarted: 'Nie zaczęto',
    anon: 'Anonimowy (brak przechowywanych danych osobowych)',
    created: 'Data utworzenia',
    user: 'Użytkownik',
    footer: 'Stworzone z Linguu — ucz się niemieckiego na co dzień',
  },
  ro: {
    currentLevel: 'Nivelul lingvistic actual',
    totalTime: 'Timp total de învățare',
    activeDays: 'Zile active',
    completedLessons: 'Lecții finalizate',
    learnedPhrases: 'Fraze învățate',
    quizAvg: 'Media quizurilor',
    longestStreak: 'Cea mai lungă serie',
    totalXp: 'Total XP',
    currentStreak: 'Seria actuală',
    topics: 'Teme abordate',
    badges: 'Insigne câștigate',
    noQuiz: 'Niciun quiz finalizat încă',
    inProgress: 'În curs',
    notStarted: 'Neînceput',
    anon: 'Anonim (fără date personale stocate)',
    created: 'Data creării',
    user: 'Utilizator',
    footer: 'Creat cu Linguu — învață germana pentru viața de zi cu zi',
  },
  ru: {
    currentLevel: 'Текущий уровень языка',
    totalTime: 'Общее время обучения',
    activeDays: 'Активные дни',
    completedLessons: 'Завершённые уроки',
    learnedPhrases: 'Выученные фразы',
    quizAvg: 'Средний балл за тесты',
    longestStreak: 'Самая длинная серия',
    totalXp: 'Всего XP',
    currentStreak: 'Текущая серия',
    topics: 'Пройденные темы',
    badges: 'Полученные значки',
    noQuiz: 'Тесты ещё не пройдены',
    inProgress: 'В процессе',
    notStarted: 'Не начато',
    anon: 'Анонимно (личные данные не хранятся)',
    created: 'Дата создания',
    user: 'Пользователь',
    footer: 'Создано с Linguu — учи немецкий для повседневной жизни',
  },
};

const daysLabel: Partial<Record<Language, string>> = { ar: ' أيام', uk: ' днів', es: ' días', en: ' days', de: ' Tage', tr: ' gün', pl: ' dni', ro: ' zile', ru: ' дней' };
const hoursLabel: Partial<Record<Language, string>> = { ar: 'ساعة ', uk: 'год. ', es: 'h ', en: 'h ', de: 'h ', tr: 'sa ', pl: 'godz. ', ro: 'ore ', ru: 'ч. ' };
const minsLabel: Partial<Record<Language, string>> = { ar: ' دقيقة', uk: ' хв.', es: ' min', en: ' min', de: ' Min', tr: ' dk', pl: ' min', ro: ' min', ru: ' мин' };

export function ReportView() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const lang = (progress.language ?? 'en') as Language;
  const lbl = reportLabels[lang] ?? reportLabels['en']!;

  const localeMap: Partial<Record<Language, string>> = {
    de: 'de-DE', ar: 'ar-SA', uk: 'uk-UA', es: 'es-ES',
    en: 'en-GB', tr: 'tr-TR', pl: 'pl-PL', ro: 'ro-RO', ru: 'ru-RU',
  };
  const today = new Date().toLocaleDateString(localeMap[lang] ?? 'de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const totalHours = Math.floor(progress.totalTimeMinutes / 60);
  const totalMins = Math.floor(progress.totalTimeMinutes % 60);

  const allScores = Object.values(progress.quizScores);
  const avgQuizScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null;

  const rows = [
    { label: lbl.currentLevel, value: progress.level, highlight: true },
    { label: lbl.totalTime, value: `${hoursLabel[lang]}${totalHours} ${minsLabel[lang]}${totalMins}` },
    { label: lbl.activeDays, value: `${progress.activeDays}${daysLabel[lang]}` },
    { label: lbl.completedLessons, value: `${progress.completedTopics.length} / ${topics.length}` },
    { label: lbl.learnedPhrases, value: String(progress.seenPhrases.length) },
    { label: lbl.quizAvg, value: avgQuizScore !== null ? `${avgQuizScore}%` : lbl.noQuiz },
    { label: lbl.longestStreak, value: `${progress.longestStreak}${daysLabel[lang]}` },
    { label: lbl.totalXp, value: `${progress.xp} XP` },
    { label: lbl.currentStreak, value: `${progress.streak}${daysLabel[lang]}` },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0f1117' }}>
      {/* Nav bar — hidden in print */}
      <div
        className="px-6 py-4 flex items-center justify-between print:hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-sm transition-all"
          style={{ color: '#8b8fa8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8b8fa8')}
        >
          ← {t('overview', lang)}
        </button>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f1117' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {t('printSave', lang)}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10" id="report">
        {/* Header */}
        <div className="text-center mb-8 pb-6" style={{ borderBottom: '2px solid rgba(245,158,11,0.4)' }}>
          <div className="flex justify-center items-center gap-3 mb-3">
            <span className="text-3xl">🇩🇪</span>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8' }}>
              Linguu
            </h1>
          </div>
          {/* Title in native language first */}
          <h2
            className="text-xl mb-1"
            style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', fontWeight: 600, direction: lang === 'ar' ? 'rtl' : 'ltr' }}
          >
            {t('reportTitle', lang)}
          </h2>
          {lang !== 'de' && (
            <p className="text-sm" style={{ color: '#8b8fa8' }}>Linguu Fortschrittsbericht</p>
          )}
          <p className="text-sm mt-2" style={{ color: '#8b8fa8' }}>
            {lbl.created}: {today}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(139,143,168,0.6)', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
            {lbl.user}: {lbl.anon}
          </p>
        </div>

        {/* Stats table */}
        <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center px-6 py-4"
              style={{
                background: idx % 2 === 0 ? 'rgba(26,29,39,0.8)' : 'rgba(22,25,35,0.8)',
                borderBottom: idx < rows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <span className="text-sm" style={{ color: '#8b8fa8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                {row.label}
              </span>
              <span
                className="font-semibold"
                style={{ color: row.highlight ? '#f59e0b' : '#f0ede8', fontSize: row.highlight ? 20 : 14 }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Topics */}
        <div className="mb-8">
          <h3
            className="text-base font-semibold mb-3"
            style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
          >
            {lbl.topics}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {topics.map(topic => {
              const completed = progress.completedTopics.includes(topic.id);
              const seenCount = topic.phrases.filter(p => progress.seenPhrases.includes(p.id)).length;
              const score = progress.quizScores[topic.id];
              const nativeTitle = (topicTitlesNative[lang] ?? topicTitlesNative['en']!)[topic.id] ?? topic.titleDE;

              return (
                <div
                  key={topic.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: completed ? 'rgba(245,158,11,0.08)' : 'rgba(26,29,39,0.5)',
                    border: completed ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span>{topic.icon}</span>
                  <div className="flex-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <span className="text-sm font-medium" style={{ color: '#f0ede8' }}>
                      {nativeTitle}
                    </span>
                    <span className="text-xs ml-1" style={{ color: '#8b8fa8' }}>
                      · {topic.titleDE}
                    </span>
                    <span className="text-xs ml-2" style={{ color: '#8b8fa8' }}>
                      ({seenCount}/{topic.phrases.length})
                    </span>
                  </div>
                  <span className="text-xs font-semibold" style={{
                    color: completed ? '#f59e0b' : seenCount > 0 ? '#8b8fa8' : 'rgba(139,143,168,0.4)',
                  }}>
                    {completed ? (score !== undefined ? `✓ ${score}%` : '✓') : seenCount > 0 ? lbl.inProgress : lbl.notStarted}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges */}
        {progress.badges.length > 0 && (
          <div className="mb-8">
            <h3
              className="text-base font-semibold mb-2"
              style={{ fontFamily: 'Fraunces, serif', color: '#f0ede8', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
            >
              {lbl.badges}
            </h3>
            <p className="text-sm" style={{ color: '#8b8fa8' }}>
              {progress.badges.length} / 8
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: 'rgba(139,143,168,0.6)', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
            {lbl.footer}
          </p>
          {lang !== 'de' && (
            <p className="text-xs mt-1" style={{ color: 'rgba(139,143,168,0.4)' }}>
              Erstellt mit Linguu — Sprachen lernen für den Alltag
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
