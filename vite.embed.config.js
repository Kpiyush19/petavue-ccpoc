import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";
import fs from "fs";

// Standalone build for the portable Data Hub embed.
//   npm run build:embed
// Produces a SINGLE self-contained file at exports/embeds/data-hub.html
// (all JS/CSS/images inlined; only Google Fonts loads from CDN). Drop it into
// any site and point an <iframe> at it — see exports/embeds/README.md.
const OUT = path.resolve(__dirname, "exports/embeds");

const renameOutput = {
  name: "rename-index-to-data-hub",
  closeBundle() {
    const from = path.join(OUT, "index.html");
    const to = path.join(OUT, "data-hub.html");
    if (fs.existsSync(from)) fs.renameSync(from, to);
  },
};

export default defineConfig({
  root: path.resolve(__dirname, "embed/data-hub"),
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile(), renameOutput],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: OUT,
    // Never wipe the folder — sibling embeds (sage.html), demos + README live here.
    emptyOutDir: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
