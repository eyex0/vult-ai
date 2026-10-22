import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { viteSingleFile } from "vite-plugin-singlefile";
import { defineConfig } from "vitest/config";

// VITE_SINGLEFILE=1 inlines all JS, CSS, fonts and images into one index.html (used for hosted previews).
const SINGLE_FILE = process.env.VITE_SINGLEFILE === "1";

export default defineConfig({
  // VITE_BASE=./ builds a copy that works from any folder (used with VITE_ROUTER=hash for static previews).
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tailwindcss(), ...(SINGLE_FILE ? [viteSingleFile()] : [])],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: SINGLE_FILE
        ? {}
        : { manualChunks: { react: ["react", "react-dom", "wouter"], motion: ["framer-motion"], charts: ["recharts"] } },
    },
  },
  server: { port: 3000 },
  test: { environment: "node", include: ["src/**/*.test.{ts,tsx}"] },
});
