import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves a project site from /<repo>/. Override with BASE_PATH
// when deploying somewhere else (a custom domain wants "/").
const base = process.env.BASE_PATH ?? "/game/";

export default defineConfig({
  base,
  plugins: [react()],
  build: { target: "es2022", outDir: "dist", sourcemap: true },
});
