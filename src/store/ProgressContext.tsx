import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProgress, Level } from '../types';
import { loadProgress, saveProgress, getLevelFromXp, updateStreak } from './progress';
import { allBadges } from '../data/badges';

interface ProgressContextValue {
  progress: UserProgress;
  addXp: (amount: number) => void;
  markPhrasesSeen: (phraseIds: string[]) => void;
  markTopicComplete: (topicId: string) => void;
  recordQuizScore: (topicId: string, score: number, perfect: boolean) => void;
  addApiCost: (eur: number) => void;
  setLanguage: (lang: UserProgress['language']) => void;
  setTargetLanguage: (lang: UserProgress['targetLanguage']) => void;
  setPath: (path: UserProgress['path']) => void;
  completeOnboarding: (level: Level) => void;
  setVocabMastery: (phraseId: string, level: 0 | 1 | 2) => void;
  toggleEinbuergerungCheck: (itemId: string) => void;
  xpAnimation: number | null;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const p = loadProgress();
    return updateStreak(p);
  });
  const [xpAnimation, setXpAnimation] = useState<number | null>(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Time tracking: every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        const updated = { ...p, totalTimeMinutes: p.totalTimeMinutes + 0.5 };
        return updated;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAndAwardBadges = useCallback((p: UserProgress): UserProgress => {
    const earned = new Set(p.badges);
    const updated = { ...p };

    if (p.completedTopics.length >= 1 && !earned.has('first_step')) {
      earned.add('first_step');
    }
    if (p.streak >= 3 && !earned.has('streak_3')) {
      earned.add('streak_3');
    }
    if (p.streak >= 7 && !earned.has('streak_7')) {
      earned.add('streak_7');
    }
    if (p.completedTopics.includes('jobcenter') && !earned.has('jobcenter_pro')) {
      earned.add('jobcenter_pro');
    }
    if (p.completedTopics.includes('arzt') && !earned.has('arzt_complete')) {
      earned.add('arzt_complete');
    }
    if (p.seenPhrases.length >= 50 && !earned.has('words_50')) {
      earned.add('words_50');
    }
    if (getLevelFromXp(p.xp) !== 'A1' && !earned.has('level_a2')) {
      earned.add('level_a2');
    }
    if (p.perfectQuizzes >= 5 && !earned.has('quiz_master')) {
      earned.add('quiz_master');
    }

    updated.badges = Array.from(earned);
    return updated;
  }, []);

  const addXp = useCallback((amount: number) => {
    setXpAnimation(amount);
    setTimeout(() => setXpAnimation(null), 1100);
    setProgress(p => {
      const newXp = p.xp + amount;
      const newLevel = getLevelFromXp(newXp);
      const updated = checkAndAwardBadges({ ...p, xp: newXp, level: newLevel });
      return updated;
    });
  }, [checkAndAwardBadges]);

  const markPhrasesSeen = useCallback((phraseIds: string[]) => {
    setProgress(p => {
      const seen = new Set(p.seenPhrases);
      phraseIds.forEach(id => seen.add(id));
      return checkAndAwardBadges({ ...p, seenPhrases: Array.from(seen) });
    });
  }, [checkAndAwardBadges]);

  const markTopicComplete = useCallback((topicId: string) => {
    setProgress(p => {
      if (p.completedTopics.includes(topicId)) return p;
      return checkAndAwardBadges({
        ...p,
        completedTopics: [...p.completedTopics, topicId],
      });
    });
  }, [checkAndAwardBadges]);

  const recordQuizScore = useCallback((topicId: string, score: number, perfect: boolean) => {
    setProgress(p => {
      const newPerfect = perfect ? p.perfectQuizzes + 1 : p.perfectQuizzes;
      return checkAndAwardBadges({
        ...p,
        quizScores: { ...p.quizScores, [topicId]: score },
        perfectQuizzes: newPerfect,
      });
    });
  }, [checkAndAwardBadges]);

  const addApiCost = useCallback((eur: number) => {
    setProgress(p => ({
      ...p,
      sessionApiCostEur: p.sessionApiCostEur + eur,
      totalApiCostEur: p.totalApiCostEur + eur,
    }));
  }, []);

  const setLanguage = useCallback((lang: UserProgress['language']) => {
    setProgress(p => ({ ...p, language: lang }));
  }, []);

  const setTargetLanguage = useCallback((lang: UserProgress['targetLanguage']) => {
    setProgress(p => ({ ...p, targetLanguage: lang }));
  }, []);

  const setPath = useCallback((path: UserProgress['path']) => {
    setProgress(p => ({ ...p, path }));
  }, []);

  const completeOnboarding = useCallback((level: Level) => {
    const xpMap: Record<Level, number> = { A1: 0, A2: 500, B1: 1500, B2: 3000 };
    setProgress(p => ({
      ...p,
      assessmentLevel: level,
      level,
      xp: xpMap[level],
      onboardingComplete: true,
    }));
  }, []);

  const setVocabMastery = useCallback((phraseId: string, level: 0 | 1 | 2) => {
    setProgress(p => ({
      ...p,
      vocabMastery: { ...p.vocabMastery, [phraseId]: level },
    }));
  }, []);

  const toggleEinbuergerungCheck = useCallback((itemId: string) => {
    setProgress(p => ({
      ...p,
      einbuergerungChecklist: {
        ...p.einbuergerungChecklist,
        [itemId]: !p.einbuergerungChecklist?.[itemId],
      },
    }));
  }, []);

  return (
    <ProgressContext.Provider value={{
      progress,
      addXp,
      markPhrasesSeen,
      markTopicComplete,
      recordQuizScore,
      addApiCost,
      setLanguage,
      setTargetLanguage,
      setPath,
      completeOnboarding,
      setVocabMastery,
      toggleEinbuergerungCheck,
      xpAnimation,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}

export { allBadges };
