import { useState } from "react";

const BUILTIN: Record<string, { out: string }> = {
  help: {
    out: "Safe mock shell. Try: ipconfig, ping, tracert, whoami, clear",
  },
  ipconfig: {
    out:
      "Ethernet adapter Lab:\n   IPv4 Address. . . . . . . : 192.168.1.42\n   Subnet Mask . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . : 192.168.1.1\n   DNS Servers . . . . . . . : 1.1.1.1",
  },
  "ipconfig /all": {
    out: "(same as ipconfig — trimmed for study)\nDNS: 1.1.1.1 · Gateway: 192.168.1.1 · Hostname: LAB-STATION",
  },
  ping: {
    out: "Usage: ping 192.168.1.1 -n 2  (simulated success, 0% loss)",
  },
  "ping 192.168.1.1 -n 2": {
    out: "Reply from 192.168.1.1: bytes=32 time=2ms TTL=64\nReply from 192.168.1.1: bytes=32 time=3ms TTL=64\nPackets: Sent = 2, Received = 2, Lost = 0",
  },
  tracert: {
    out: "Usage: tracert 1.1.1.1",
  },
  "tracert 1.1.1.1": {
    out: "Tracing route...\n  1  192.168.1.1  2 ms\n  2  10.5.0.1    8 ms\n  3  1.1.1.1     12 ms\nTrace complete. (simulated)",
  },
  whoami: {
    out: "lab-student\\you",
  },
  clear: { out: "__CLEAR__" },
};

function normalize(cmd: string) {
  return cmd.trim().replace(/\s+/g, " ").toLowerCase();
}

type Props = {
  scenarioId?: string;
  onCommandSuccess?: (cmd: string) => void;
};

export default function MockTerminal({ scenarioId, onCommandSuccess }: Props) {
  const [lines, setLines] = useState<string[]>(["Security+ mock terminal — type help", ""]);
  const [input, setInput] = useState("");

  const run = (raw: string) => {
    const cmd = normalize(raw);
    if (!cmd) return;
    const next = [...lines.slice(0, -1), `> ${raw}`];
    const entry = BUILTIN[cmd];
    let out = entry?.out ?? `Command not simulated: ${raw}\nTry: help, ipconfig, ping 192.168.1.1 -n 2`;
    if (out === "__CLEAR__") {
      setLines(["(cleared)", ""]);
      setInput("");
      onCommandSuccess?.(cmd);
      return;
    }
    next.push(out, "");
    setLines(next);
    setInput("");
    onCommandSuccess?.(cmd);
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-black/80 font-mono text-xs sm:text-sm text-emerald-200/90 p-3">
      {scenarioId && <p className="text-[10px] text-slate-500 mb-2">Scenario: {scenarioId}</p>}
      <div className="h-40 overflow-y-auto whitespace-pre-wrap text-[11px] sm:text-xs leading-relaxed mb-2 border border-slate-800 rounded-lg p-2 bg-slate-950/80">
        {lines.join("\n")}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
      >
        <span className="text-slate-500 py-2 shrink-0">&gt;</span>
        <input
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-emerald-100 min-h-[44px]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="help"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="btn text-xs px-3">
          Run
        </button>
      </form>
      <p className="text-[10px] text-slate-500 mt-2">Outputs are fake — safe for class. Real work only on your own machine per lab text.</p>
    </div>
  );
}
