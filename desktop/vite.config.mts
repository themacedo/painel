// A tela do app: React + Tailwind, reaproveitando os componentes do site (@ → ../src).
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(__dirname, "renderer"),
  base: "./", // carregado por file:// no Electron
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": resolve(__dirname, "../src"), "next/link": resolve(__dirname, "shims/next-link.tsx") },
    // os componentes do site estão em ../src e achariam o React de ../node_modules: duas cópias quebram os hooks
    dedupe: ["react", "react-dom", "recharts", "lucide-react"],
  },
  define: { "process.env": "{}" }, // os componentes do site leem process.env só no servidor; aqui fica vazio
  // app local: um arquivo só de ~580 kB carrega do disco na hora, não precisa dividir
  build: { outDir: resolve(__dirname, "dist/renderer"), emptyOutDir: true, chunkSizeWarningLimit: 1500 },
});
