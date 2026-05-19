import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProgressProvider, useProgress } from './store/ProgressContext';
import { Step1Language } from './pages/onboarding/Step1Language';
import { Step2Target } from './pages/onboarding/Step2Target';
import { Step2Path } from './pages/onboarding/Step2Path';
import { Step3Assessment } from './pages/onboarding/Step3Assessment';
import { Dashboard } from './pages/Dashboard';
import { LessonScreen } from './pages/LessonScreen';
import { QuizScreen } from './pages/QuizScreen';
import { ReportView } from './pages/ReportView';
import { VocabScreen } from './pages/VocabScreen';
import { EinbuergerungChecklist } from './pages/EinbuergerungChecklist';
import { ApiCostIndicator } from './components/ApiCostIndicator';
import { XpPopAnimation } from './components/XpPopAnimation';
import { FloatingTranslator } from './components/FloatingTranslator';
import { MuteButton } from './components/MuteButton';
import { AudioProvider } from './store/AudioContext';

function AppRoutes() {
  const { progress } = useProgress();

  if (!progress.onboardingComplete) {
    return (
      <Routes>
        <Route path="/onboarding/1" element={<Step1Language />} />
        <Route path="/onboarding/2" element={
          progress.language ? <Step2Target /> : <Navigate to="/onboarding/1" replace />
        } />
        <Route path="/onboarding/3" element={
          progress.targetLanguage ? <Step2Path /> : <Navigate to="/onboarding/2" replace />
        } />
        <Route path="/onboarding/4" element={
          progress.path ? <Step3Assessment /> : <Navigate to="/onboarding/3" replace />
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
