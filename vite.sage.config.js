import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";
import fs from "fs";

// Standalone build for the Sage home → dashboard-creation flow embed.
//   npm run build:sage
// Produces a single self-contained file at exports/embeds/sage.html.
//
// Vite root stays the REPO ROOT (not embed/sage-flow) so Tailwind v4's content
// detection scans src/ and generates every utility the app pages use — a
// narrower root silently drops those utilities. The HTML entry is passed as an
// explicit input; the emitted file is then flattened to exports/embeds/sage.html.
const OUT = path.resolve(__dirname, "exports/embeds");

const flattenOutput = {
  name: "flatten-sage-output",
  closeBundle() {
    // Vite mirrors the input's path under outDir → exports/embeds/embed/sage-flow/index.html.
    const nested = path.join(OUT, "embed", "sage-flow", "index.html");
    const dest = path.join(OUT, "sage.html");
    if (fs.existsSync(nested)) {
      fs.renameSync(nested, dest);
      fs.rmSync(path.join(OUT, "embed"), { recursive: true, force: true });
    }
  },
};

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile(), flattenOutput],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Frontend-only: no-op Pusher client so the scripted stream runs sans socket.
      "pusher-js": path.resolve(__dirname, "./src/mocks/pusherBus.js"),
    },
  },
  build: {
    outDir: OUT,
    emptyOutDir: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000,
    rollupOptions: {
      input: path.resolve(__dirname, "embed/sage-flow/index.html"),
      output: { inlineDynamicImports: true },
    },
  },
});
