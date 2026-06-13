// Vite config so app-builder pipelines (e.g. Base44) can run and preview the
// app. The app is plain HTML/JS, so the dev server just serves it from the
// project root; the build is a straight copy of the static files into dist/.
//
// The permissive server settings matter for hosted previews: Base44 serves the
// dev server behind a proxy on its own hostname, and Vite blocks unknown Host
// headers by default ("Blocked request. This host is not allowed.").
import { defineConfig } from "vite";

const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  root: ".",
  publicDir: false,
  server: {
    host: true,
    port,
    strictPort: false,
    cors: true,
    allowedHosts: true, // accept proxied hostnames (Base44, Codespaces, etc.)
  },
  preview: {
    host: true,
    port,
    strictPort: false,
    cors: true,
    allowedHosts: true,
  },
});
