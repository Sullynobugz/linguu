import type { Language } from '../types';

export const allBadges: {
  id: string;
  icon: string;
  name: Partial<Record<Language, string>>;
  description: Partial<Record<Language, string>>;
}[] = [
  {
    id: 'first_step',
    icon: '🌟',
    name: { de: 'Erster Schritt', en: 'First Step', ar: 'الخطوة الأولى', uk: 'Перший крок', ru: 'Первый шаг', tr: 'İlk Adım', pl: 'Pierwszy krok', ro: 'Primul pas', es: 'Primer paso' },
    description: { ar: 'أكملت أول درس لك!', uk: 'Ти завершив свій перший урок!', es: '¡Completaste tu primera lección!', en: 'You completed your first lesson!', tr: 'İlk dersi tamamladın!', pl: 'Ukończyłeś pierwszą lekcję!', ro: 'Ai finalizat prima lecție!', ru: 'Ты завершил свой первый урок!', de: 'Du hast deine erste Lektion abgeschlossen!' },
  },
  {
    id: 'streak_3',
    icon: '🔥',
    name: { de: '3 Tage dabei', en: '3-Day Streak', ar: '٣ أيام متتالية', uk: '3 дні поспіль', ru: '3 дня подряд', tr: '3 Günlük Seri', pl: '3 Dni z rzędu', ro: '3 Zile la rând', es: '3 días seguidos' },
    description: { ar: '3 أيام متتالية من التعلم!', uk: '3 дні поспіль навчання!', es: '¡3 días consecutivos de aprendizaje!', en: '3 days of learning in a row!', tr: '3 gün üst üste öğrendin!', pl: '3 dni nauki z rzędu!', ro: '3 zile consecutive de învățare!', ru: '3 дня обучения подряд!', de: '3 Tage Lernen am Stück!' },
  },
  {
    id: 'streak_7',
    icon: '🔥🔥',
    name: { de: 'Eine Woche', en: 'One Week', ar: 'أسبوع كامل', uk: 'Цілий тиждень', ru: 'Целая неделя', tr: 'Bir Hafta', pl: 'Cały tydzień', ro: 'O Săptămână', es: 'Una semana' },
    description: { ar: 'أسبوع كامل من التعلم المستمر!', uk: 'Цілий тиждень безперервного навчання!', es: '¡Una semana completa de aprendizaje continuo!', en: 'A full week of continuous learning!', tr: 'Bir hafta kesintisiz öğrendin!', pl: 'Cały tydzień ciągłej nauki!', ro: 'O săptămână întreagă de învățare!', ru: 'Целую неделю непрерывного обучения!', de: 'Eine volle Woche durchgehalten!' },
  },
  {
    id: 'jobcenter_pro',
    icon: '🏛️',
    name: { de: 'Jobcenter-Profi', en: 'Job Center Pro', ar: 'خبير مركز العمل', uk: 'Профі Центру зайнятості', ru: 'Профи центра занятости', tr: 'İş Merkezi Uzmanı', pl: 'Ekspert Urzędu Pracy', ro: 'Expert Oficiul Muncii', es: 'Pro del Centro de Empleo' },
    description: { ar: 'أتقنت الجلسة في مركز العمل!', uk: 'Ти освоїв тему центру зайнятості!', es: '¡Dominaste el tema del centro de empleo!', en: 'You mastered the job center topic!', tr: 'İş merkezi konusunu hallетtin!', pl: 'Opanowałeś temat urzędu pracy!', ro: 'Ai stăpânit subiectul oficiului de muncă!', ru: 'Ты освоил тему центра занятости!', de: 'Du hast das Thema Jobcenter gemeistert!' },
  },
  {
    id: 'arzt_complete',
    icon: '🏥',
    name: { de: 'Gesundheit ist wichtig', en: 'Health First', ar: 'الصحة مهمة', uk: 'Здоров\'я важливе', ru: 'Здоровье важно', tr: 'Sağlık Önemli', pl: 'Zdrowie jest ważne', ro: 'Sănătatea contează', es: 'La salud es importante' },
    description: { ar: 'أتقنت موضوع الطبيب!', uk: 'Ти освоїв тему лікаря!', es: '¡Dominaste el tema del médico!', en: 'You mastered the doctor topic!', tr: 'Doktor konusunu hallетtin!', pl: 'Opanowałeś temat wizyty u lekarza!', ro: 'Ai stăpânit subiectul medicinei!', ru: 'Ты освоил тему врача!', de: 'Du hast das Thema Arzt gemeistert!' },
  },
  {
    id: 'words_50',
    icon: '📚',
    name: { de: '50 Wörter', en: '50 Words', ar: '٥٠ كلمة', uk: '50 слів', ru: '50 слов', tr: '50 Kelime', pl: '50 słów', ro: '50 Cuvinte', es: '50 palabras' },
    description: { ar: 'تعلمت 50 عبارة!', uk: 'Ти вивчив 50 фраз!', es: '¡Aprendiste 50 frases!', en: 'You learned 50 phrases!', tr: '50 ifade öğrendin!', pl: 'Nauczyłeś się 50 zwrotów!', ro: 'Ai învățat 50 de expresii!', ru: 'Ты выучил 50 фраз!', de: 'Du hast 50 Phrasen gelernt!' },
  },
  {
    id: 'level_a2',
    icon: '⭐',
    name: { de: 'Levelaufstieg', en: 'Level Up', ar: 'ارتفاع المستوى', uk: 'Підвищення рівня', ru: 'Повышение уровня', tr: 'Seviye Atladı', pl: 'Awans poziomy', ro: 'Nivel superior', es: 'Subida de nivel' },
    description: { ar: 'وصلت إلى مستوى A2!', uk: 'Ти досяг рівня A2!', es: '¡Alcanzaste el nivel A2!', en: 'You reached level A2!', tr: 'A2 seviyesine ulaştın!', pl: 'Osiągnąłeś poziom A2!', ro: 'Ai atins nivelul A2!', ru: 'Ты достиг уровня A2!', de: 'Du hast Niveau A2 erreicht!' },
  },
  {
    id: 'quiz_master',
    icon: '🎯',
    name: { de: 'Quiz-Meister', en: 'Quiz Master', ar: 'بطل الاختبارات', uk: 'Майстер вікторин', ru: 'Мастер тестов', tr: 'Test Ustası', pl: 'Mistrz Quizów', ro: 'Maestrul Quizului', es: 'Maestro del Quiz' },
    description: { ar: '5 اختبارات مثالية!', uk: '5 ідеальних вікторин!', es: '¡5 cuestionarios perfectos!', en: '5 perfect quiz scores!', tr: '5 mükemmel test puanı!', pl: '5 idealnych wyników quizów!', ro: '5 scoruri perfecte la quiz!', ru: '5 идеальных результатов теста!', de: '5 perfekte Quiz-Ergebnisse!' },
  },
];
