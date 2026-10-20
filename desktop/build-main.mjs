// Processo principal e preload do Electron: TypeScript → CommonJS com esbuild (o Vite cuida só da tela).
import { build } from "esbuild";

await build({
  entryPoints: { main: "main/main.ts", preload: "main/preload.ts" },
  outdir: "dist/main", outExtension: { ".js": ".cjs" }, bundle: true, platform: "node", format: "cjs",
  target: "node22", external: ["electron"], sourcemap: true, logLevel: "warning",
});
