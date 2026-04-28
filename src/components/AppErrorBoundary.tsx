import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { markUsage } from "../utils/localUsageSignals";

type Props = { children: ReactNode };
type State = { err: Error | null };

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("App error boundary:", err, info.componentStack);
    markUsage("error_boundary_hit");
  }

  render() {
    if (this.state.err) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
          <div className="max-w-md card border-rose-900/50 space-y-4" role="alert">
            <h1 className="text-lg font-semibold text-white">We hit a snag rendering this view</h1>
            <p className="text-sm text-slate-400">
              <strong className="text-slate-200">Your progress is safe</strong> — quiz history, notes, and streak are still on this device. Reloading almost always clears it.
            </p>
            <pre className="text-xs text-rose-300/90 overflow-auto max-h-32 rounded bg-slate-900 p-2">{this.state.err.message}</pre>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={() => window.location.reload()}>
                Reload
              </button>
              <Link to="/" className="btn-ghost">
                Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
