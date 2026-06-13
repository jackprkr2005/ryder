// Vite config so the project presents the dev/build/preview scripts that
// app-builder pipelines (e.g. Base44) expect. The app is plain HTML/JS, so
// the dev server just serves it from the project root and the build is a
// straight copy of the static files into dist/.
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: false,
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
