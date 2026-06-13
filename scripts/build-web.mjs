/* Assemble the front-end into www/ for Capacitor to bundle into the iOS app.
   Keeps the repo's web files where they are (so web hosting still works) and
   produces a clean web root for the native build. */
import { rmSync, mkdirSync, cpSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "www");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const files = ["index.html", "app.js", "api.js", "data.js", "styles.css", "manifest.webmanifest"];
for (const f of files) cpSync(resolve(root, f), resolve(out, f));
cpSync(resolve(root, "assets"), resolve(out, "assets"), { recursive: true });

console.log("Built www/ for Capacitor (" + (files.length + 1) + " entries).");
