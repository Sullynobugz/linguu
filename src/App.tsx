import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ProgressProvider, useProgress } from './store/ProgressContext';
import { Step1Language } from './screens/onboarding/Step1Language';
import { Step2Target } from './screens/onboarding/Step2Target';
import { Step2Path } from './screens/onboarding/Step2Path';
import { Step3Assessment } from './screens/onboarding/Step3Assessment';
import { Dashboard } from './screens/Dashboard';
import { LessonScreen } from './screens/LessonScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ReportView } from './screens/ReportView';
import { VocabScreen } from './screens/VocabScreen';
import { EinbuergerungChecklist } from './screens/EinbuergerungChecklist';
import { ApiCostIndicator } from './components/ApiCostIndicator';
import { XpPopAnimation } from './components/XpPopAnimation';
import { FloatingTranslator } from './components/FloatingTranslator';
import { MuteButton } from './components/MuteButton';
import { AudioProvider } from './store/AudioContext';
import { setWidCode } from './lib/widTracking';

function WidCodeFromUrl() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wid = params.get('wid');
    if (!wid || wid.length < 4) return;

    setWidCode(wid);
    const url = new URL(window.location.href);
    url.searchParams.delete('wid');
    window.history.replaceState({}, '', url.toString());
  }, []);

  return null;
}

function AppRoutes() {
  const { progress } = useProgress();

  if (!progress.onboardingComplete) {
    return (
      <Routes>
        <Route path="/onboarding/1" element={<Step1Language />} />
        <Route path="/onboarding/target" element={
          progress.language ? <Step2Target /> : <Navigate to="/onboarding/1" replace />
        } />
        <Route path="/onboarding/2" element={
          progress.language ? <Step2Path /> : <Navigate to="/onboarding/1" replace />
        } />
        <Route path="/onboarding/3" element={
          progress.path ? <Step3Assessment /> : <Navigate to="/onboarding/2" replace />
        } />
        <Route path="*" element={<Navigate to="/onboarding/1" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/lesson/:topicId" element={<LessonScreen />} />
      <Route path="/quiz/:topicId" element={<QuizScreen />} />
      <Route path="/report" element={<ReportView />} />
      <Route path="/vocab" element={<VocabScreen />} />
      <Route path="/einbuergerung" element={<EinbuergerungChecklist />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <ProgressProvider>
          <WidCodeFromUrl />
          <AppRoutes />
          <ApiCostIndicator />
          <XpPopAnimation />
          <FloatingTranslator />
          <MuteButton />
        </ProgressProvider>
      </AudioProvider>
    </BrowserRouter>
  );
}

export default App;
