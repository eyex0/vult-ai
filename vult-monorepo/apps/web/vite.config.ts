import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: { react: ["react", "react-dom", "wouter"], motion: ["framer-motion"], charts: ["recharts"] },
      },
    },
  },
  server: { port: 3000 },
  test: { environment: "node", include: ["src/**/*.test.{ts,tsx}"] },
});
