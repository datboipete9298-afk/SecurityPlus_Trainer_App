import { Navigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import Dashboard from "../pages/Dashboard";

export default function HomeGate() {
  const { state } = useProgress();
  if (!state.onboarding.hasSeenStartHere) {
    return <Navigate to="/start-here" replace />;
  }
  return <Dashboard />;
}
