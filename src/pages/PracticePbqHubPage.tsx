import { Link } from "react-router-dom";
import { PBQ_SCENARIOS } from "../data/pbqCatalog";

export default function PracticePbqHubPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link to="/practice-exams" className="text-sm text-emerald-400 hover:underline">
          ← Practice exams
        </Link>
        <h1 className="h1 mt-2">PBQ-style skill labs</h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 leading-relaxed">
          Original ordering and matching drills — not copies of proprietary exam interfaces. Use Up/Down to reorder, then submit. Failing a lab
          nudges your weak-area signals for that domain.
        </p>
      </div>
      <ul className="space-y-3">
        {PBQ_SCENARIOS.map((p) => (
          <li key={p.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-medium text-white">{p.title}</h2>
              <p className="text-xs text-slate-500 mt-1">Domain {p.domain}</p>
            </div>
            <Link to={`/pbq/${p.id}`} className="btn text-center sm:inline-block">
              Open lab
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
