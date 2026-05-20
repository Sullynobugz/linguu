import type { UserProgress, Level } from '../types';

const STORAGE_KEY = 'linguu_progress';

const defaultProgress: UserProgress = {
  language: null,
  targetLanguage: null,
  path: null,
  level: 'A1',
  xp: 0,
  completedTopics: [],
  seenPhrases: [],
  quizScores: {},
  perfectQuizzes: 0,
  badges: [],
  streak: 0,
  lastActiveDate: null,
  longestStreak: 0,
  activeDays: 0,
  totalTimeMinutes: 0,
  openAiCostEur: 0,
  claudeCostEur: 0,
  onboardingComplete: false,
  assessmentLevel: null,
  vocabMastery: {},
  wordMastery: {},
  einbuergerungChecklist: {},
};

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProgress };
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return { ...defaultProgress };
  }
}

export function saveProgress(p: UserProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getLevelFromXp(xp: number): Level {
  if (xp >= 3000) return 'B2';
  if (xp >= 1500) return 'B1';
  if (xp >= 500) return 'A2';
  return 'A1';
}

export function getXpForLevel(level: Level): { min: number; max: number } {
  const ranges: Record<Level, { min: number; max: number }> = {
    A1: { min: 0, max: 500 },
    A2: { min: 500, max: 1500 },
    B1: { min: 1500, max: 3000 },
    B2: { min: 3000, max: 5000 },
  };
  return ranges[level];
}

export function getNextLevel(level: Level): Level | null {
  const order: Level[] = ['A1', 'A2', 'B1', 'B2'];
  const idx = order.indexOf(level);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

export function updateStreak(p: UserProgress): UserProgress {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (p.lastActiveDate === today) return p;

  let newStreak = 1;
  let newActiveDays = p.activeDays + 1;

  if (p.lastActiveDate === yesterday) {
    newStreak = p.streak + 1;
  }

  const newLongest = Math.max(p.longestStreak, newStreak);

  return {
    ...p,
    streak: newStreak,
    longestStreak: newLongest,
    activeDays: newActiveDays,
    lastActiveDate: today,
  };
}
