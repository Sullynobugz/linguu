import type { Language } from '../types';

export const allBadges: {
  id: string;
  icon: string;
  name: string;
  description: Record<Language, string>;
}[] = [
  {
    id: 'first_step',
    icon: '🌟',
    name: 'Erster Schritt',
    description: {
      ar: 'أكملت أول درس لك!',
      uk: 'Ти завершив свій перший урок!',
      es: '¡Completaste tu primera lección!',
      en: 'You completed your first lesson!',
    },
  },
  {
    id: 'streak_3',
    icon: '🔥',
    name: '3 Tage dabei',
    description: {
      ar: '3 أيام متتالية من التعلم!',
      uk: '3 дні поспіль навчання!',
      es: '¡3 días consecutivos de aprendizaje!',
      en: '3 days of learning in a row!',
    },
  },
  {
    id: 'streak_7',
    icon: '🔥🔥',
    name: 'Eine Woche',
    description: {
      ar: 'أسبوع كامل من التعلم المستمر!',
      uk: 'Цілий тиждень безперервного навчання!',
      es: '¡Una semana completa de aprendizaje continuo!',
      en: 'A full week of continuous learning!',
    },
  },
  {
    id: 'jobcenter_pro',
    icon: '🏛️',
    name: 'Jobcenter-Profi',
    description: {
      ar: 'أتقنت الجلسة في مركز العمل!',
      uk: 'Ти освоїв тему центру зайнятості!',
      es: '¡Dominaste el tema del centro de empleo!',
      en: 'You mastered the job center topic!',
    },
  },
  {
    id: 'arzt_complete',
    icon: '🏥',
    name: 'Gesundheit ist wichtig',
    description: {
      ar: 'أتقنت موضوع الطبيب!',
      uk: 'Ти освоїв тему лікаря!',
      es: '¡Dominaste el tema del médico!',
      en: 'You mastered the doctor topic!',
    },
  },
  {
    id: 'words_50',
    icon: '📚',
    name: '50 Wörter',
    description: {
      ar: 'تعلمت 50 عبارة!',
      uk: 'Ти вивчив 50 фраз!',
      es: '¡Aprendiste 50 frases!',
      en: 'You learned 50 phrases!',
    },
  },
  {
    id: 'level_a2',
    icon: '⭐',
    name: 'Levelaufstieg',
    description: {
      ar: 'وصلت إلى مستوى A2!',
      uk: 'Ти досяг рівня A2!',
      es: '¡Alcanzaste el nivel A2!',
      en: 'You reached level A2!',
    },
  },
  {
    id: 'quiz_master',
    icon: '🎯',
    name: 'Quiz-Meister',
    description: {
      ar: '5 اختبارات مثالية!',
      uk: '5 ідеальних вікторин!',
      es: '¡5 cuestionarios perfectos!',
      en: '5 perfect quiz scores!',
    },
  },
];
