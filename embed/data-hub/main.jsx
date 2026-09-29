import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
// Same global styling pipeline the real app boots with, so the embed matches:
// Tailwind utilities + design tokens + Poppins reset.
import "@/index.css";
import "@/ui/tokens/tokens.css";
import { DataHub } from "@/pages/standalone/data-hub";

/**
 * Standalone, dependency-light embed of the Data Hub page.
 *
 * Fully interactive off local React state — no backend, no router, no MSW.
 * Nav clicks are inert (this is the Data Hub in isolation); the three tabs
 * (Dictionary / Definitions / Sync Activity) and the source/metric drill-downs
 * all work. Built into a single self-contained data-hub.html via
 * vite.embed.config.js for dropping into an <iframe> on any site.
 */
function DataHubEmbed() {
  // Sidebar starts open so the product reads as the full page; the toggle works.
  const [menuOpen, setMenuOpen] = useState(true);
  return (
    <DataHub
      onNavigate={() => {}}
      menuOpen={menuOpen}
      onMenuToggle={() => setMenuOpen((o) => !o)}
      definitionsClickable={false}
    />
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DataHubEmbed />
  </StrictMode>
);
