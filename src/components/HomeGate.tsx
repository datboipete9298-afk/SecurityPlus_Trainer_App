import { lazy, Suspense } from "react";
import PageFallback from "./PageFallback";

const Dashboard = lazy(() => import("../pages/Dashboard"));

/** Always land on the dashboard — onboarding is a banner, not a wall (see Dashboard). */
export default function HomeGate() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Dashboard />
    </Suspense>
  );
}
