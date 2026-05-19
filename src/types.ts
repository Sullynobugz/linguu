export type Language = 'ar' | 'uk' | 'es' | 'en' | 'tr' | 'pl' | 'ro' | 'ru' | 'de';
export type Path = 'neu' | 'beruf' | 'sprache' | 'einbuergerung';
export type Level = 'A1' | 'A2' | 'B1' | 'B2';

export interface Phrase {
  id: string;
  german: string;
  phonetics: string;
  translations: Partial<Record<Language, string>>;
  exampleDE: string;
  exampleTranslations: Partial<Record<Language, string>>;
}

export interface Topic {
  id: string;
  icon: string;
  titleDE: string;
  subtitleDE: string;
  requiredLevel: Level | null;
  alwaysUnlocked: boolean;
  phrases: Phrase[];
}

export interface Badge {
  id: string;
  icon: string;
  name: Partial<Record<Language, string>>;
  description: Partial<Record<Language, string>>;
  earned: boolean;
  earnedAt?: string;
}

export interface UserProgress {
  language: Language | null;
  targetLanguage: Language | null;
  path: Path | null;
  level: Level;
  xp: number;
  completedTopics: string[];
  seenPhrases: string[];
  quizScores: Record<string, number>;
  perfectQuizzes: number;
  badges: string[];
  streak: number;
  lastActiveDate: string | null;
  longestStreak: number;
  activeDays: number;
  totalTimeMinutes: number;
  sessionApiCostEur: number;
  totalApiCostEur: number;
  onboardingComplete: boolean;
  assessmentLevel: Level | null;
  // 0 = new, 1 = learning, 2 = mastered
  vocabMastery: Record<string, 0 | 1 | 2>;
  einbuergerungChecklist: Record<string, boolean>;
}

export interface ApiUsage {
  inputTokens: number;
  outputTokens: number;
  costEur: number;
}
