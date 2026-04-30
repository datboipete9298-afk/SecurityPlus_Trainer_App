import { Link } from "react-router-dom";
import { useEffect } from "react";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import { markUsage } from "../utils/localUsageSignals";
import { PRODUCT_PROMISE_LINE } from "../copy/productIdentity";

/** Clear route when bookmarks or deeplinks don’t exist — avoids silent redirects. */
export default function NotFoundPage() {
  useEffect(() => {
    markUsage("unknown_route_hit");
  }, []);
  return (
    <AppShell>
      <div className="max-w-xl space-y-6">
        <PageHeader
          title="Page not found"
          purpose={
            <>
              That URL isn&apos;t in this build of Security+ Trainer. {PRODUCT_PROMISE_LINE} Pick Home or Search — nothing here touched your saved progress in this browser.
            </>
          }
        />
        <div className="card border-slate-700 space-y-4">
          <p className="text-sm text-slate-400 leading-relaxed">
            Your quizzes, streak, and backups stay in this browser unless you exported them. Wrong links sometimes happen after an app update or a pasted link from an old bookmark.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <Link className="btn w-full sm:w-auto min-h-[48px] text-center inline-flex items-center justify-center" to="/">
              Home
            </Link>
            <Link className="btn-ghost w-full sm:w-auto min-h-[48px] text-center justify-center inline-flex items-center justify-center border border-slate-600" to="/search">
              Search lessons
            </Link>
            <Link className="btn-ghost w-full sm:w-auto min-h-[48px] text-center justify-center inline-flex items-center justify-center border border-slate-600" to="/roadmap">
              Lesson path
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
