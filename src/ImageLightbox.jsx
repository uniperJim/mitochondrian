import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function ImageLightbox({ open, title, src, onClose }) {
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
          key="img"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={title ?? "Image"}
        >
          <button
            type="button"
            aria-label="Close image"
            onClick={onClose}
            className="absolute inset-0 bg-black/80"
          />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-6xl"
          >
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-black/40 to-fuchsia-500/10 shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3">
                <div className="text-sm text-white/80 truncate">{title ?? ""}</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-1.5 text-xs"
                >
                  Close (Esc)
                </button>
              </div>

              <div className="max-h-[calc(100vh-140px)] md:max-h-[calc(100vh-180px)] overflow-auto bg-black/20">
                <img
                  src={src}
                  alt={title ?? ""}
                  className="block w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
