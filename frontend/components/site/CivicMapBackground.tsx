"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export function CivicMapBackground() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-label="Map of India highlighting Punjab"
      role="img"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#e9f9fc]"
    >
      <motion.div
        className="civic-map-zoom absolute inset-0"
        initial={{ scale: prefersReducedMotion ? 1.04 : 1 }}
        animate={{ scale: prefersReducedMotion ? 1.04 : [1.04, 1.08, 1.04] }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 24, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <Image
          src="/nagarsetu-civic-map.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-75 mix-blend-multiply"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/45 via-white/55 to-sky-50/40" />
      {[
        { name: "Punjab", className: "civic-map-punjab" },
        { name: "Haryana", className: "civic-map-haryana" },
      ].map((region) => (
        <motion.div
          key={region.name}
          aria-hidden="true"
          className={`${region.className} absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-700/70`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0.35, 0.95, 0.35], scale: [0.8, 1.25, 0.8] }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <span className="absolute inset-1 rounded-full bg-brand-700/20" />
        </motion.div>
      ))}
    </div>
  );
}
