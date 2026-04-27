import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import PageFallback from "./components/PageFallback";

const HomeGate = lazy(() => import("./components/HomeGate"));
const StartHere = lazy(() => import("./pages/StartHere"));
const WatchLesson = lazy(() => import("./pages/WatchLesson"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const PracticePage = lazy(() => import("./pages/PracticePage"));
const PracticeExamsPage = lazy(() => import("./pages/PracticeExamsPage"));
const PracticePbqHubPage = lazy(() => import("./pages/PracticePbqHubPage"));
const PbqRunnerPage = lazy(() => import("./pages/PbqRunnerPage"));
const ProgressPage = lazy(() => import("./pages/ProgressPage"));
const Session30 = lazy(() => import("./pages/Session30"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const FlashcardsPage = lazy(() => import("./pages/FlashcardsPage"));
const WeakPage = lazy(() => import("./pages/WeakPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SimPage = lazy(() => import("./pages/SimPage"));
const ImportPage = lazy(() => import("./pages/ImportPage"));
const BossHub = lazy(() => import("./pages/BossHub"));
const BossFight = lazy(() => import("./pages/BossFight"));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomeGate />} />
          <Route path="/start-here" element={<StartHere />} />
          <Route path="/watch/:id" element={<WatchLesson />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/practice-exams" element={<PracticeExamsPage />} />
          <Route path="/pbq" element={<Navigate to="/practice-exams/pbq" replace />} />
          <Route path="/practice-exams/pbq" element={<PracticePbqHubPage />} />
          <Route path="/pbq/:id" element={<PbqRunnerPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/session" element={<Session30 />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/weak" element={<WeakPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/sim" element={<SimPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/boss" element={<BossHub />} />
          <Route path="/boss/:id" element={<BossFight />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
