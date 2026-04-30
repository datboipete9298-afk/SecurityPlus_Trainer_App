import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useProgress } from "../context/ProgressContext";
import MobileStickyContinue from "./MobileStickyContinue";
import BackupNudgeBanner from "./BackupNudgeBanner";
import OfflineStatusBanner from "./OfflineStatusBanner";
import AppUpdateBanner from "./AppUpdateBanner";

const mainNav = [
  { to: "/", label: "Home" },
  { to: "/roadmap", label: "Lesson path" },
  { to: "/practice", label: "Practice" },
  { to: "/sim", label: "Labs" },
  { to: "/progress", label: "Progress" },
];

const moreNav = [
  { to: "/start-here", label: "Start here" },
  { to: "/pdf-setup", label: "Add PDF files" },
  { to: "/pdf-guides", label: "PDF study guides" },
  { to: "/practice-exams", label: "Practice exams" },
  { to: "/session", label: "30-min session" },
  { to: "/flashcards", label: "Flashcards" },
  { to: "/weak", label: "Weak areas" },
  { to: "/search", label: "Search" },
  { to: "/import", label: "Author import (JSON)" },
  { to: "/boss", label: "Boss fights" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const { state, setBeginnerMode, setSimpleLessonMode } = useProgress();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const NavInner = (
    <>
      <div className="mb-5 md:mb-6 flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-bold text-emerald-400 leading-tight">Security+ Trainer</div>
          <div className="text-xs text-slate-500 mt-0.5">Security+ study that tells you exactly what to do next.</div>
        </div>
        <button
          type="button"
          className="rounded-lg p-2 min-w-[44px] min-h-[44px] text-slate-400 hover:bg-slate-800 hover:text-white touch-manipulation md:hidden"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        >
          ✕
        </button>
      </div>
      <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/50 p-3">
        <label className="flex items-center justify-between gap-2 text-sm text-slate-200 cursor-pointer touch-manipulation">
          <span>Beginner mode</span>
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-500 text-emerald-500 focus:ring-emerald-500"
            checked={state.beginnerMode}
            onChange={(e) => setBeginnerMode(e.target.checked)}
          />
        </label>
        <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">Extra plain-English on every lesson when on.</p>
        <label className="mt-3 flex items-center justify-between gap-2 text-sm text-slate-200 cursor-pointer touch-manipulation">
          <span>Simple lesson view</span>
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-500 text-emerald-500 focus:ring-emerald-500"
            checked={!!state.simpleLessonMode}
            onChange={(e) => setSimpleLessonMode(e.target.checked)}
          />
        </label>
        <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">Less on screen: video, hooks, note, action, quiz — full lesson one tap away.</p>
      </div>
      <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Main</p>
      <nav className="flex flex-col gap-1">
        {mainNav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            aria-current={loc.pathname === n.to ? "page" : undefined}
            className={`rounded-lg px-3 py-3 text-sm min-h-[44px] flex items-center touch-manipulation transition-colors duration-200 ease-ds-out ${
              loc.pathname === n.to ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <p className="text-[10px] text-slate-600 uppercase tracking-wide mt-4 mb-1">More</p>
      <nav className="flex flex-col gap-0.5">
        {moreNav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            aria-current={loc.pathname === n.to ? "page" : undefined}
            className={`rounded-lg px-3 py-2.5 text-sm min-h-[44px] flex items-center touch-manipulation transition-colors duration-200 ease-ds-out ${
              loc.pathname === n.to ? "bg-slate-800/80 text-slate-200" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950">
      <OfflineStatusBanner />
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-[120%] opacity-0 pointer-events-none focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg outline-none ring-2 ring-emerald-300/80 ring-offset-2 ring-offset-slate-950"
      >
        Skip to main content
      </a>
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-3 py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link to="/" className="font-bold text-emerald-400 text-base truncate touch-manipulation" onClick={() => setNavOpen(false)}>
          Security+ Trainer
        </Link>
        <button
          type="button"
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 touch-manipulation min-h-[44px] min-w-[44px]"
          aria-expanded={navOpen}
          aria-controls="mobile-drawer"
          aria-label="Open menu"
          onClick={() => setNavOpen(true)}
        >
          Menu
        </button>
      </header>

      {navOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          aria-label="Close menu backdrop"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        id="mobile-drawer"
        className={`fixed md:static inset-y-0 left-0 z-50 w-[min(100vw-3rem,20rem)] md:w-56 shrink-0 border-r border-slate-800 bg-slate-900/95 md:bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto transition-transform duration-200 ease-out md:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {NavInner}
      </aside>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full min-w-0 px-3 py-4 sm:px-4 md:p-8 max-w-5xl mx-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8 text-base outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-sm"
      >
        <div key={loc.pathname} className="min-w-0 ds-route-enter">
          {children}
        </div>
        <BackupNudgeBanner />
      </main>

      <MobileStickyContinue />
      <AppUpdateBanner />
    </div>
  );
}
