import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HelpModal from "./HelpModal";
import ImageLightbox from "./ImageLightbox";

/**
 * ESCAPE THE MITOCHONDRION — Prototype (Option A: Map Escape Room)
 *
 * How to run (quick):
 * - Create a React app (Vite recommended), add tailwind + framer-motion
 * - Paste this component into App.jsx and render <MetabolicEscapePrototype />
 *
 * This is a playable MVP: click rooms, spend actions, respond to events, unlock doors, escape.
 */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const START = {
  turn: 1,
  maxTurns: 12,
  actionsLeft: 2,
  escaped: false,
  failed: false,
  failureFlags: 0,

  // Resources (intentionally simplified but med-reasoning aligned)
  ATP: 2,
  NAD: 10,
  NADH: 0,
  FADH2: 0,
  O2: 1, // 1 = present, 0 = absent
  Lactate: 0,
  Glucose: 6,
  Glycogen: 6,
  AcetylCoA: 0,

  // Locks / states
  locks: {
    mitoDoor: false, // Cytosol -> Mito access
    pdhGate: false, // PDH usable
    tcaOnline: false,
    etcOnline: false,
    nucleusExit: false,
  },

  // Simple physiological/regulatory flags
  flags: {
    hypoxia: false,
    fasting: false,
    exercise: false,
    cyanide: false,
    thiamineLow: false,
  },
};

const EVENT_DECK = [
  {
    id: "fed",
    title: "Fed state",
    desc: "High insulin: glycolysis and glycogen synthesis favored. O₂ normal.",
    apply: (s) => ({
      ...s,
      flags: { ...s.flags, fasting: false, exercise: false, hypoxia: false },
      O2: 1,
    }),
  },
  {
    id: "fasting",
    title: "Fasting (24h)",
    desc: "Low insulin, high glucagon: glycogen use favored; acetyl-CoA tends to rise if running β-oxidation (not modeled yet).",
    apply: (s) => ({
      ...s,
      flags: { ...s.flags, fasting: true, exercise: false },
      // mild pressure toward low glucose
      Glucose: clamp(s.Glucose - 1, 0, 99),
    }),
  },
  {
    id: "exercise",
    title: "Exercise burst",
    desc: "↑AMP and ↑Ca²⁺: PFK-1 + isocitrate DH activation. You gain +1 action this turn.",
    apply: (s) => ({
      ...s,
      flags: { ...s.flags, exercise: true, fasting: s.flags.fasting },
      actionsLeft: s.actionsLeft + 1,
    }),
  },
  {
    id: "hypoxia",
    title: "Hypoxia",
    desc: "O₂ limited → ETC stalls, NADH accumulates, NAD⁺ becomes precious.",
    apply: (s) => ({
      ...s,
      flags: { ...s.flags, hypoxia: true },
      O2: 0,
    }),
  },
  {
    id: "cyanide",
    title: "Cyanide exposure",
    desc: "Complex IV inhibited → ETC offline even if O₂ present.",
    apply: (s) => ({
      ...s,
      flags: { ...s.flags, cyanide: true },
    }),
  },
  {
    id: "thiamine",
    title: "Thiamine deficiency risk",
    desc: "PDH becomes unreliable. PDH gate may lock unless you compensate (via lactate route).",
    apply: (s) => ({
      ...s,
      flags: { ...s.flags, thiamineLow: true },
    }),
  },
];

const ROOMS = [
  {
    id: "cytosol",
    name: "Cytosol",
    subtitle: "Glycolysis + Glycogen",
    color: "from-sky-500/30 to-indigo-500/10",
    hint: "Make ATP fast; manage NAD⁺. Unlock the mitochondrial door.",
  },
  {
    id: "matrix",
    name: "Mito Matrix",
    subtitle: "PDH + TCA",
    color: "from-emerald-500/30 to-lime-500/10",
    hint: "Convert pyruvate to acetyl-CoA (PDH), then run TCA to charge NADH/FADH₂.",
  },
  {
    id: "imm",
    name: "Inner Membrane",
    subtitle: "ETC / OxPhos",
    color: "from-rose-500/30 to-orange-500/10",
    hint: "Use NADH/FADH₂ + O₂ to generate lots of ATP. Beware hypoxia/cyanide.",
  },
  {
    id: "nucleus",
    name: "Nucleus Exit",
    subtitle: "Final Lock",
    color: "from-fuchsia-500/30 to-violet-500/10",
    hint: "Escape requires ATP + stable metabolism (no collapse).",
  },
];

function Meter({ label, value, max = 20, unit = "" }) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-white/80">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-white/70"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/80 border border-white/10">
      {children}
    </span>
  );
}

function Log({ items }) {
  return (
    <div className="h-44 overflow-auto rounded-2xl bg-black/20 border border-white/10 p-3 space-y-2">
      {items.length === 0 ? (
        <div className="text-sm text-white/60">No log entries yet.</div>
      ) : (
        items.map((it, idx) => (
          <div key={idx} className="text-sm text-white/80">
            <span className="text-white/60 mr-2">•</span>
            {it}
          </div>
        ))
      )}
    </div>
  );
}

function RoomNode({ active, room, onClick, locked, statusText }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={[
        "relative w-full text-left rounded-3xl p-4 border",
        "bg-gradient-to-br",
        room.color,
        active ? "border-white/40" : "border-white/10",
        locked ? "opacity-70" : "opacity-100",
      ].join(" ")}
      title={locked ? "Locked (meet requirements)" : "Open"}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{room.name}</div>
          <div className="text-sm text-white/70">{room.subtitle}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {locked ? <Badge>Locked</Badge> : <Badge>Accessible</Badge>}
          <Badge>{statusText}</Badge>
        </div>
      </div>
      <div className="mt-3 text-sm text-white/70">{room.hint}</div>
      <div className="absolute inset-0 rounded-3xl pointer-events-none shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" />
    </motion.button>
  );
}

export default function MetabolicEscapePrototype() {
  const [s, setS] = useState(START);
  const [activeRoom, setActiveRoom] = useState("cytosol");
  const [log, setLog] = useState([
    "You awaken inside a cell with failing energy balance. Restore ATP and reach the nuclear exit.",
  ]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [cellImageOpen, setCellImageOpen] = useState(false);

  const cellImageUrl = useMemo(() => {
    // Works for both dev (/) and GitHub Pages (/mitochondrian/) via Vite base URL.
    return new URL("cell.png", import.meta.env.BASE_URL).toString();
  }, []);

  useEffect(() => {
    if (!helpOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen]);

  const derived = useMemo(() => {
    const etcBlocked = s.flags.hypoxia || s.flags.cyanide || s.O2 === 0;
    const pdhBlocked = s.flags.thiamineLow && s.NADH > 6; // simplified "PDH struggles when redox is bad + cofactor low"
    const nadCrisis = s.NAD <= 0;
    const acidosisRisk = s.Lactate >= 8;

    const failReasons = [];
    if (nadCrisis) failReasons.push("NAD⁺ depletion halted glycolysis and many dehydrogenases.");
    if (s.ATP < 0) failReasons.push("ATP debt: energy collapse.");
    if (acidosisRisk) failReasons.push("Severe lactic acidosis.");
    if (s.Glucose === 0 && s.Glycogen === 0) failReasons.push("No fuel left (glucose + glycogen exhausted).");

    const winReady =
      s.ATP >= 32 &&
      s.failureFlags < 3 &&
      s.locks.nucleusExit;

    return {
      etcBlocked,
      pdhBlocked,
      nadCrisis,
      acidosisRisk,
      failReasons,
      winReady,
    };
  }, [s]);

  const pushLog = (msg) => setLog((L) => [msg, ...L].slice(0, 60));

  const spendAction = () => {
    if (s.actionsLeft <= 0) return false;
    setS((prev) => ({ ...prev, actionsLeft: prev.actionsLeft - 1 }));
    return true;
  };

  const hardFailCheck = (ns) => {
    // Evaluate failure flags; if >=3 -> fail
    let flags = ns.failureFlags;

    if (ns.NAD <= 0) flags = Math.max(flags, 1); // treat as at least one flag source
    if (ns.Lactate >= 8) flags = Math.max(flags, 2);
    if (ns.ATP < 0) flags = Math.max(flags, 3);

    const failed = flags >= 3;
    return { ...ns, failureFlags: flags, failed };
  };

  const applyEndOfTurnRegulation = (state) => {
    let ns = { ...state };

    // If ETC blocked, NADH tends to accumulate / NAD⁺ harder to regenerate
    if (derived.etcBlocked) {
      // subtle pressure: if NADH already high, NAD⁺ drops (represents redox jam)
      if (ns.NADH >= 8) ns.NAD = clamp(ns.NAD - 1, 0, 99);
    } else {
      // If ETC online, slowly regenerate NAD⁺ from NADH "availability"
      if (ns.NADH > 0 && ns.locks.etcOnline) {
        const regen = Math.min(1, ns.NADH);
        ns.NADH -= regen;
        ns.NAD += regen;
      }
    }

    // If fasting and glycogen exists, passive glycogen use to maintain glucose (simplified)
    if (ns.flags.fasting && ns.Glycogen > 0 && ns.Glucose < 3) {
      ns.Glycogen -= 1;
      ns.Glucose += 1;
      pushLog("Fasting adaptation: liver glycogen supports glucose (+1 glucose, -1 glycogen).");
    }

    // Lock logic updates (based on state)
    ns.locks = { ...ns.locks };

    // Mito door unlock: must have done some glycolysis OR have acetyl-CoA >0
    if (!ns.locks.mitoDoor && (ns.NADH >= 2 || ns.AcetylCoA > 0)) {
      ns.locks.mitoDoor = true;
      pushLog("🔓 Mitochondrial access unlocked (you've generated reducing equivalents / entry substrate).");
    }

    // PDH gate: needs mitoDoor and not too much NADH; thiamineLow makes it stricter
    const pdhOk =
      ns.locks.mitoDoor &&
      ns.NADH <= (ns.flags.thiamineLow ? 4 : 6) &&
      ns.NAD >= 2;

    ns.locks.pdhGate = pdhOk;

    // TCA online if PDH gate ok and acetyl-CoA available
    ns.locks.tcaOnline = ns.locks.pdhGate && ns.AcetylCoA > 0;

    // ETC online if you have access and not blocked
    ns.locks.etcOnline = ns.locks.mitoDoor && !derived.etcBlocked;

    // Nucleus exit lock: require ATP >= 32 and stable (no severe lactate, NAD not zero)
    ns.locks.nucleusExit = ns.ATP >= 32 && ns.Lactate < 8 && ns.NAD > 0;

    return ns;
  };

  const nextTurn = () => {
    if (s.escaped || s.failed) return;

    // End-of-turn regulation + fail check
    setS((prev) => {
      let ns = { ...prev };
      ns = applyEndOfTurnRegulation(ns);
      ns.turn = prev.turn + 1;
      ns.actionsLeft = 2;

      ns = hardFailCheck(ns);

      // Turn limit
      if (ns.turn > ns.maxTurns && !ns.escaped) {
        ns.failed = true;
        pushLog("⏳ Time ran out: the cell decompensated before you could escape.");
      }

      // Win check
      if (!ns.failed && derived.winReady && activeRoom === "nucleus") {
        ns.escaped = true;
      }

      return ns;
    });

    // Draw new event and apply immediately
    const ev = EVENT_DECK[Math.floor(Math.random() * EVENT_DECK.length)];
    setCurrentEvent(ev);
    setS((prev) => {
      const applied = ev.apply(prev);
      pushLog(`🃏 Event: ${ev.title} — ${ev.desc}`);
      return applied;
    });
  };

  // Actions (room-specific)
  const doGlycolysis = () => {
    if (!spendAction()) return;

    setS((prev) => {
      let ns = { ...prev };

      if (ns.Glucose <= 0) {
        pushLog("No glucose available for glycolysis.");
        return ns;
      }
      if (ns.NAD <= 0) {
        pushLog("Glycolysis stalled: NAD⁺ is depleted. Consider lactate route to regenerate NAD⁺.");
        return ns;
      }

      // simplified yield: -1 glucose, +2 ATP, +2 NADH, -2 NAD⁺
      ns.Glucose -= 1;
      ns.ATP += 2;
      const used = Math.min(2, ns.NAD);
      ns.NAD -= used;
      ns.NADH += used;

      pushLog("Ran glycolysis: -1 glucose, +2 ATP, +2 NADH (consumed NAD⁺).");
      return ns;
    });
  };

  const doLactateRoute = () => {
    if (!spendAction()) return;

    setS((prev) => {
      let ns = { ...prev };
      if (ns.NADH <= 0) {
        pushLog("No NADH to reoxidize via lactate.");
        return ns;
      }
      // Reoxidize up to 2 NADH -> NAD⁺; increase lactate
      const k = Math.min(2, ns.NADH);
      ns.NADH -= k;
      ns.NAD += k;
      ns.Lactate += k;
      pushLog(`Converted pyruvate → lactate: regenerated ${k} NAD⁺ (+${k} lactate).`);
      return ns;
    });
  };

  const doGlycogenolysis = () => {
    if (!spendAction()) return;

    setS((prev) => {
      let ns = { ...prev };
      if (ns.Glycogen <= 0) {
        pushLog("No glycogen left to break down.");
        return ns;
      }
      ns.Glycogen -= 1;
      ns.Glucose += 1;
      pushLog("Glycogenolysis: -1 glycogen, +1 glucose.");
      return ns;
    });
  };

  const doPDH = () => {
    if (!spendAction()) return;

    setS((prev) => {
      let ns = { ...prev };

      if (!ns.locks.mitoDoor) {
        pushLog("PDH not accessible: mitochondrial door is locked.");
        return ns;
      }
      if (!ns.locks.pdhGate) {
        pushLog("PDH gate is closed (high NADH / low NAD⁺ / thiamine risk). Consider ETC or lactate route.");
        return ns;
      }
      if (ns.NAD <= 0) {
        pushLog("PDH requires NAD⁺; you have none.");
        return ns;
      }

      // PDH: consumes 1 NAD⁺ -> produces 1 NADH and 1 acetyl-CoA
      ns.NAD -= 1;
      ns.NADH += 1;
      ns.AcetylCoA += 1;
      pushLog("PDH: pyruvate → acetyl-CoA (+1 acetyl-CoA, +1 NADH, -1 NAD⁺).");
      return ns;
    });
  };

  const doTCA = () => {
    if (!spendAction()) return;

    setS((prev) => {
      let ns = { ...prev };

      if (!ns.locks.tcaOnline) {
        pushLog("TCA not ready: need acetyl-CoA and an open PDH gate.");
        return ns;
      }
      // simplified "one lap": -1 acetyl-CoA, +2 NADH, +1 FADH2, +1 ATP (GTP), uses NAD⁺
      if (ns.NAD < 2) {
        pushLog("TCA slowed: insufficient NAD⁺ to run key dehydrogenases.");
        return ns;
      }
      ns.AcetylCoA -= 1;
      ns.NAD -= 2;
      ns.NADH += 2;
      ns.FADH2 += 1;
      ns.ATP += 1;

      // Exercise bonus: represent activation
      if (ns.flags.exercise) {
        ns.ATP += 1;
        pushLog("Exercise activation: TCA flux increased (+1 extra ATP equivalent).");
      }

      pushLog("TCA lap: -1 acetyl-CoA, +1 ATP, +2 NADH, +1 FADH₂ (consumed NAD⁺).");
      return ns;
    });
  };

  const doETC = () => {
    if (!spendAction()) return;

    setS((prev) => {
      let ns = { ...prev };

      if (!ns.locks.etcOnline) {
        if (ns.flags.cyanide) pushLog("ETC offline: cyanide inhibits Complex IV.");
        else if (ns.O2 === 0) pushLog("ETC offline: no oxygen (hypoxia).");
        else pushLog("ETC not accessible yet (unlock mitochondrial access first).");
        return ns;
      }

      const n = Math.min(3, ns.NADH);
      const f = Math.min(2, ns.FADH2);

      if (n + f === 0) {
        pushLog("No NADH/FADH₂ available to feed ETC.");
        return ns;
      }

      // simplified ATP yields: NADH->2 ATP, FADH2->1 ATP
      ns.NADH -= n;
      ns.FADH2 -= f;
      ns.ATP += n * 2 + f * 1;

      // Regenerate NAD⁺ directly (represents reoxidation)
      ns.NAD += n;

      // O₂ present required; consume "oxygen capacity" lightly (stylized)
      ns.O2 = 1;

      pushLog(`ETC ran: used ${n} NADH & ${f} FADH₂ → +${n * 2 + f} ATP, regenerated NAD⁺.`);
      return ns;
    });
  };

  const doOxygenRescue = () => {
    if (!spendAction()) return;

    setS((prev) => {
      let ns = { ...prev };
      // "Open airway": restore oxygen unless cyanide
      if (ns.flags.cyanide) {
        pushLog("Oxygen restored, but cyanide still blocks Complex IV. Need detox (not implemented) or avoid ETC reliance.");
        ns.O2 = 1;
        return ns;
      }
      ns.flags = { ...ns.flags, hypoxia: false };
      ns.O2 = 1;
      pushLog("Oxygenation improved: hypoxia resolved (ETC can resume if not otherwise blocked).");
      return ns;
    });
  };

  const tryEscape = () => {
    if (!spendAction()) return;

    setS((prev) => {
      let ns = { ...prev };
      if (activeRoom !== "nucleus") {
        pushLog("You can only attempt escape from the Nucleus Exit room.");
        return ns;
      }
      if (!ns.locks.nucleusExit) {
        pushLog("Exit lock holds: need ATP ≥ 32 and metabolic stability (NAD⁺ present, lactate not severe).");
        return ns;
      }
      ns.escaped = true;
      pushLog("✅ Escape successful! Energy balance restored and exit unlocked.");
      return ns;
    });
  };

  const reset = () => {
    setS(START);
    setActiveRoom("cytosol");
    setLog(["You awaken inside a cell with failing energy balance. Restore ATP and reach the nuclear exit."]);
    setCurrentEvent(null);
  };

  // Room accessibility
  const roomLocked = (roomId) => {
    if (roomId === "cytosol") return false;
    if (roomId === "matrix") return !s.locks.mitoDoor;
    if (roomId === "imm") return !s.locks.mitoDoor;
    if (roomId === "nucleus") return false; // you can visit, but escape is locked by conditions
    return false;
  };

  const roomStatus = (roomId) => {
    if (roomId === "cytosol") return s.locks.mitoDoor ? "Door open" : "Door locked";
    if (roomId === "matrix") return s.locks.pdhGate ? "PDH ready" : "PDH gated";
    if (roomId === "imm") return s.locks.etcOnline ? "ETC online" : "ETC stalled";
    if (roomId === "nucleus") return s.locks.nucleusExit ? "Exit ready" : "Exit locked";
    return "—";
  };

  const availableActions = useMemo(() => {
    if (s.escaped || s.failed) return [];

    if (activeRoom === "cytosol") {
      return [
        { label: "Run Glycolysis", sub: "-1 glucose → +2 ATP, +NADH (uses NAD⁺)", onClick: doGlycolysis },
        { label: "Lactate Route", sub: "Regenerate NAD⁺ (+lactate)", onClick: doLactateRoute },
        { label: "Glycogenolysis", sub: "-1 glycogen → +1 glucose", onClick: doGlycogenolysis },
      ];
    }
    if (activeRoom === "matrix") {
      return [
        { label: "Run PDH", sub: "Make acetyl-CoA (+NADH)", onClick: doPDH },
        { label: "Run TCA Lap", sub: "Use acetyl-CoA → NADH/FADH₂/ATP", onClick: doTCA },
        { label: "Lactate Route", sub: "Regenerate NAD⁺ (+lactate)", onClick: doLactateRoute },
      ];
    }
    if (activeRoom === "imm") {
      return [
        { label: "Run ETC", sub: "Use NADH/FADH₂ → ATP (needs O₂, not cyanide)", onClick: doETC },
        { label: "Oxygen Rescue", sub: "Resolve hypoxia (if cyanide, still blocked)", onClick: doOxygenRescue },
        { label: "Lactate Route", sub: "Emergency NAD⁺ regen (+lactate)", onClick: doLactateRoute },
      ];
    }
    if (activeRoom === "nucleus") {
      return [
        { label: "Attempt Escape", sub: "Requires ATP ≥ 32 + stability", onClick: tryEscape },
        { label: "Plan Next Turn", sub: "End turn to draw a new condition", onClick: nextTurn },
      ];
    }
    return [];
  }, [activeRoom, s.escaped, s.failed]);

  const headerStatus = useMemo(() => {
    if (s.escaped) return { text: "ESCAPED", tone: "bg-emerald-500/20 border-emerald-200/20" };
    if (s.failed) return { text: "FAILED", tone: "bg-rose-500/20 border-rose-200/20" };
    return { text: "IN PROGRESS", tone: "bg-white/10 border-white/10" };
  }, [s.escaped, s.failed]);

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <ImageLightbox
        open={cellImageOpen}
        title="Cell diagram"
        src={cellImageUrl}
        onClose={() => setCellImageOpen(false)}
      />
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        cellImageUrl={cellImageUrl}
        onOpenCellImage={() => setCellImageOpen(true)}
      />
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl opacity-40 bg-gradient-to-r from-sky-500/40 via-fuchsia-500/30 to-emerald-500/30" />
        <div className="absolute bottom-[-220px] right-[-200px] h-[520px] w-[520px] rounded-full blur-3xl opacity-30 bg-gradient-to-r from-rose-500/40 to-orange-500/30" />
      </div>

      <div className="relative mx-auto max-w-6xl p-5 md:p-8">
        {/* Top bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-2xl md:text-3xl font-semibold tracking-tight">
              Escape the Mitochondrion
            </div>
            <div className="text-white/70 text-sm">
              Solo metabolic escape-room map • click rooms • manage ATP / NAD⁺ / NADH
            </div>
          </div>

          <div className={`rounded-2xl border px-4 py-3 ${headerStatus.tone}`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCellImageOpen(true)}
                className="rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10"
                title="Open cell diagram"
                aria-label="Open cell diagram"
              >
                <img src={cellImageUrl} alt="Cell diagram" className="h-8 w-8 object-cover" />
              </button>
              <Badge>Turn {s.turn}/{s.maxTurns}</Badge>
              <Badge>Actions {s.actionsLeft}</Badge>
              <Badge>Flags {s.failureFlags}/3</Badge>
              <span className="text-sm text-white/80">{headerStatus.text}</span>
              <button
                onClick={() => setHelpOpen(true)}
                className="ml-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-1.5 text-xs"
              >
                Help
              </button>
              <button
                onClick={reset}
                className="ml-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-1.5 text-xs"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left: Map + rooms */}
          <div className="lg:col-span-7 space-y-4">
            {/* Stylized map panel (SVG-ish look without assets) */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/80">
                  Cell Map (click a compartment)
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.flags.fasting && <Badge>Fasting</Badge>}
                  {s.flags.exercise && <Badge>Exercise</Badge>}
                  {s.flags.hypoxia && <Badge>Hypoxia</Badge>}
                  {s.flags.cyanide && <Badge>Cyanide</Badge>}
                  {s.flags.thiamineLow && <Badge>Thiamine low</Badge>}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {ROOMS.map((r) => {
                  const locked = roomLocked(r.id);
                  return (
                    <RoomNode
                      key={r.id}
                      room={r}
                      active={activeRoom === r.id}
                      locked={locked}
                      statusText={roomStatus(r.id)}
                      onClick={() => {
                        if (locked) {
                          pushLog("This compartment is currently inaccessible (unlock requirements not met).");
                          return;
                        }
                        setActiveRoom(r.id);
                        pushLog(`Moved to: ${r.name}.`);
                      }}
                    />
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Locks</Badge>
                  <span>Mit Door:</span>
                  <span className="text-white/90">{s.locks.mitoDoor ? "Open" : "Closed"}</span>
                  <span className="mx-2 text-white/30">|</span>
                  <span>PDH Gate:</span>
                  <span className="text-white/90">{s.locks.pdhGate ? "Open" : "Closed"}</span>
                  <span className="mx-2 text-white/30">|</span>
                  <span>ETC:</span>
                  <span className="text-white/90">{s.locks.etcOnline ? "Online" : "Stalled"}</span>
                  <span className="mx-2 text-white/30">|</span>
                  <span>Exit:</span>
                  <span className="text-white/90">{s.locks.nucleusExit ? "Ready" : "Locked"}</span>
                </div>

                {(derived.etcBlocked || derived.pdhBlocked) && (
                  <div className="mt-2 text-white/70">
                    {derived.etcBlocked && <div>⚠️ ETC is blocked (hypoxia/cyanide/O₂=0) → NADH may pile up.</div>}
                    {derived.pdhBlocked && <div>⚠️ PDH is struggling (thiamine low + high NADH) → consider lactate/ETC.</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Event card */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/80">Condition Card</div>
                <button
                  onClick={nextTurn}
                  disabled={s.escaped || s.failed}
                  className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 text-xs disabled:opacity-50"
                >
                  End Turn → Draw Card
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                <motion.div
                  key={currentEvent?.id ?? "none"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  {currentEvent ? (
                    <>
                      <div className="text-lg font-semibold">{currentEvent.title}</div>
                      <div className="mt-1 text-sm text-white/75">{currentEvent.desc}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-semibold">No card drawn yet</div>
                      <div className="mt-1 text-sm text-white/75">
                        Click <span className="text-white/90">End Turn → Draw Card</span> to start the loop.
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Dashboard + actions + log */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/80">Metabolic Dashboard</div>
                <Badge>Room: {ROOMS.find((r) => r.id === activeRoom)?.name}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Meter label="ATP" value={s.ATP} max={40} />
                <Meter label="NAD⁺" value={s.NAD} max={14} />
                <Meter label="NADH" value={s.NADH} max={14} />
                <Meter label="FADH₂" value={s.FADH2} max={10} />
                <Meter label="Glucose" value={s.Glucose} max={10} />
                <Meter label="Glycogen" value={s.Glycogen} max={10} />
                <Meter label="Lactate" value={s.Lactate} max={10} />
                <Meter label="O₂" value={s.O2} max={1} />
              </div>

              <div className="mt-4 text-xs text-white/60">
                Win: <span className="text-white/80">ATP ≥ 32</span> and{" "}
                <span className="text-white/80">Exit Ready</span>. Avoid metabolic collapse flags.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/80">Actions</div>
              <div className="mt-3 space-y-2">
                {availableActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={a.onClick}
                    disabled={s.actionsLeft <= 0 || s.escaped || s.failed}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 hover:bg-black/30 px-4 py-3 text-left disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{a.label}</div>
                      <Badge>-1 action</Badge>
                    </div>
                    <div className="mt-1 text-sm text-white/70">{a.sub}</div>
                  </button>
                ))}
              </div>

              {(s.escaped || s.failed) && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
                  {s.escaped ? (
                    <div>🎉 You escaped! Reset to play again or expand the content.</div>
                  ) : (
                    <div>
                      💥 Failure state reached. Reset to retry.
                      {derived.failReasons.length > 0 && (
                        <ul className="mt-2 list-disc pl-5 text-white/70">
                          {derived.failReasons.slice(0, 3).map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/80">Log</div>
              <div className="mt-3">
                <Log items={log} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-white/50">
          Prototype notes: simplified stoichiometry, but regulation logic is the "point." Expand by adding
          more rooms (β-oxidation, gluconeogenesis), toxins (rotenone, antimycin), and clinical states
          (alcohol binge → ↑NADH).
        </div>
      </div>
    </div>
  );
}
