import { useEffect } from "react";
import { create } from "zustand";
import { DEFAULT_DESIGN, designVars } from "../../mocks/library";

/* The workspace's design system. Every section preview reads it, so a change
   here shows everywhere at once. In memory: it resets on reload. */

const fresh = () => ({ ...DEFAULT_DESIGN, colors: { ...DEFAULT_DESIGN.colors } });

const useDesignStore = create((set) => ({
  design: fresh(),
  setDesign: (patch) => set((s) => ({ design: { ...s.design, ...patch } })),
  setColor: (key, value) => set((s) => ({ design: { ...s.design, colors: { ...s.design.colors, [key]: value } } })),
  reset: () => set({ design: fresh() }),
}));

// Google Fonts are fetched once per family, the first time one is needed.
const requested = new Set();
export function loadFont(name) {
  if (!name || requested.has(name)) return;
  requested.add(name);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css?family=${encodeURIComponent(name)}:400,500,600,700&display=swap`;
  document.head.appendChild(link);
}

// The section variables for the current design, with its fonts loaded.
export function useDesignVars() {
  const design = useDesignStore((s) => s.design);
  useEffect(() => {
    loadFont(design.headFont);
    loadFont(design.bodyFont);
  }, [design.headFont, design.bodyFont]);
  return designVars(design);
}

export default useDesignStore;
