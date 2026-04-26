import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Roadmap from "./pages/Roadmap";
import LessonPage from "./pages/LessonPage";
import Session30 from "./pages/Session30";
import QuizPage from "./pages/QuizPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import WeakPage from "./pages/WeakPage";
import SearchPage from "./pages/SearchPage";
import SimPage from "./pages/SimPage";
import ImportPage from "./pages/ImportPage";
import BossHub from "./pages/BossHub";
import BossFight from "./pages/BossFight";
import HomeGate from "./components/HomeGate";
import StartHere from "./pages/StartHere";
import WatchLesson from "./pages/WatchLesson";
import PracticePage from "./pages/PracticePage";
import ProgressPage from "./pages/ProgressPage";
import PracticeExamsPage from "./pages/PracticeExamsPage";
import PracticePbqHubPage from "./pages/PracticePbqHubPage";
import PbqRunnerPage from "./pages/PbqRunnerPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeGate />} />
        <Route path="/start-here" element={<StartHere />} />
        <Route path="/watch/:id" element={<WatchLesson />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/practice-exams" element={<PracticeExamsPage />} />
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
    </Layout>
  );
}
