import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HelpModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="help"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-8"
          aria-label="Help"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close help"
            onClick={onClose}
            className="absolute inset-0 bg-black/70"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.99 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-5xl"
          >
            <div className="max-h-[calc(100vh-24px)] md:max-h-[calc(100vh-64px)] overflow-hidden rounded-3xl border border-white/10 bg-[#0A0F1F]/95 backdrop-blur shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
              <div className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-r from-sky-500/15 via-fuchsia-500/10 to-emerald-500/15 px-5 py-4 md:px-7 md:py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-2xl md:text-3xl font-semibold tracking-tight">
                      Help: Escape the Mitochondrion
                    </div>
                    <div className="text-sm text-white/75">
                      A playable metabolism sandbox. Numbers are stylized, but the relationships are real.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 text-xs"
                  >
                    Close (Esc)
                  </button>
                </div>
              </div>

              <div className="p-5 md:p-7 overflow-y-auto max-h-[calc(100vh-120px)] md:max-h-[calc(100vh-180px)]">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-white/0 to-indigo-500/10 p-4">
                    <h2 className="text-sm font-semibold text-white/90">What’s the goal?</h2>
                  <ul className="mt-2 space-y-2 text-sm text-white/75 list-disc pl-5">
                    <li>
                      Reach the <span className="text-white/90">Nucleus Exit</span> and successfully escape.
                    </li>
                    <li>
                      Build enough energy: <span className="text-white/90">ATP ≥ 32</span>.
                    </li>
                    <li>
                      Stay “metabolically stable”: <span className="text-white/90">NAD⁺ &gt; 0</span> and lactate below severe levels.
                    </li>
                    <li>
                      Do it before the time limit: <span className="text-white/90">12 turns</span>.
                    </li>
                  </ul>
                </section>

                  <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/0 to-fuchsia-500/10 p-4">
                    <h2 className="text-sm font-semibold text-white/90">How the game works</h2>
                  <ul className="mt-2 space-y-2 text-sm text-white/75 list-disc pl-5">
                    <li>
                      Each turn you get <span className="text-white/90">2 actions</span> (sometimes 3 if an Exercise card triggers).
                    </li>
                    <li>
                      Actions depend on your current compartment (Cytosol / Matrix / Inner Membrane / Nucleus).
                    </li>
                    <li>
                      Click <span className="text-white/90">End Turn → Draw Card</span> to start the next turn and apply a random condition.
                    </li>
                    <li>
                      Cards can create constraints (Hypoxia, Cyanide) or bonuses (Exercise) that change your best move.
                    </li>
                  </ul>
                </section>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <h2 className="text-sm font-semibold text-white/90">Map / compartments</h2>
                  <div className="mt-2 space-y-3 text-sm text-white/75">
                    <div>
                      <div className="font-semibold text-sky-200">Cytosol</div>
                      <div>
                        Use <span className="text-white/90">Glycolysis</span> for fast ATP and to generate NADH (but it consumes NAD⁺).
                        Use the <span className="text-white/90">Lactate Route</span> as an emergency NAD⁺ recycler (at the cost of lactate).
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-200">Mito Matrix</div>
                      <div>
                        Run <span className="text-white/90">PDH</span> to make acetyl‑CoA, then the <span className="text-white/90">TCA</span> to charge up NADH/FADH₂.
                        PDH is sensitive to redox (too much NADH) and thiamine risk.
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-orange-200">Inner Membrane</div>
                      <div>
                        Run the <span className="text-white/90">ETC</span> to convert NADH/FADH₂ + O₂ into lots of ATP and regenerate NAD⁺.
                        Hypoxia or cyanide can stall this.
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-fuchsia-200">Nucleus Exit</div>
                      <div>
                        When the exit is ready (ATP and stability), use <span className="text-white/90">Attempt Escape</span>.
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <h2 className="text-sm font-semibold text-white/90">Common failure modes (what to avoid)</h2>
                  <ul className="mt-2 space-y-2 text-sm text-white/75 list-disc pl-5">
                    <li>
                      <span className="text-white/90">NAD⁺ depletion</span>: glycolysis and many dehydrogenases stall.
                    </li>
                    <li>
                      <span className="text-white/90">Severe lactate accumulation</span>: the lactate route is helpful, but overuse can end the run.
                    </li>
                    <li>
                      <span className="text-white/90">ATP debt</span>: if ATP drops below zero, the cell “collapses”.
                    </li>
                    <li>
                      <span className="text-white/90">No fuel left</span>: glucose + glycogen exhausted.
                    </li>
                  </ul>
                </section>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <h2 className="text-sm font-semibold text-white/90">Example strategies</h2>
                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3 text-sm text-white/75">
                  <div className="space-y-2">
                    <div className="font-semibold text-sky-200">1) Open the mito door early</div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Run Glycolysis 1–2 times to generate NADH.</li>
                      <li>Don’t spend NAD⁺ down to zero; keep a buffer.</li>
                      <li>If you get stuck, use Lactate Route once to restore NAD⁺.</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-emerald-200">2) Charge the batteries (Matrix)</div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>PDH to generate acetyl‑CoA.</li>
                      <li>TCA laps to build NADH/FADH₂.</li>
                      <li>If NADH gets high and gates PDH, pivot to ETC.</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-orange-200">3) Cash out (ETC)</div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>ETC converts NADH/FADH₂ into ATP and regenerates NAD⁺.</li>
                      <li>If hypoxic, use Oxygen Rescue; if cyanide, ETC will remain blocked.</li>
                      <li>Use Lactate Route only as a temporary bridge.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <h2 className="text-sm font-semibold text-white/90">How you learn biochemistry while playing</h2>
                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 text-sm text-white/75">
                  <div className="space-y-2">
                    <div className="font-semibold text-fuchsia-200">Learn by watching constraints</div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Glycolysis isn’t “just ATP” — it also depends on <span className="text-white/90">NAD⁺ availability</span>.
                      </li>
                      <li>
                        When O₂/ETC is blocked, NADH tends to pile up and NAD⁺ becomes scarce (redox pressure).
                      </li>
                      <li>
                        Lactate formation is a tradeoff: it restores NAD⁺ but increases acid load.
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-emerald-200">Try mini-experiments</div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Play one run where you avoid Lactate Route unless NAD⁺ is near zero.</li>
                      <li>Play one run where you push TCA hard, then see how ETC “cashes out” the reducing equivalents.</li>
                      <li>When Hypoxia/Cyanide hits, compare how your strategy must change.</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-3 text-xs text-white/60">
                  Tip: Use the log panel like a lab notebook—each message is a mechanistic hint.
                </div>
              </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-gradient-to-r from-sky-500/30 via-fuchsia-500/25 to-emerald-500/30 hover:from-sky-500/40 hover:via-fuchsia-500/35 hover:to-emerald-500/40 border border-white/10 px-4 py-2 text-sm"
                  >
                    Back to game
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
