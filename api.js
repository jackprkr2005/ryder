/* ------------------------------------------------------------------
   Ryder — API client (online mode)
   When the app is served by the backend (same-origin /api responds),
   the front-end runs against real accounts + shared data + realtime.
   When there's no backend (e.g. GitHub Pages), it stays in demo mode.
------------------------------------------------------------------ */
window.RyderAPI = (function () {
  "use strict";
  const TOKEN_KEY = "ryder.token";
  // localStorage can throw in sandboxed/cross-origin iframes (e.g. an app
  // preview) — never let that break app start-up.
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  // Point the static site at a hosted backend by setting window.RYDER_API_BASE
  // or <meta name="ryder-api" content="https://your-backend">. Default: same-origin.
  const metaBase = (document.querySelector('meta[name="ryder-api"]') || {}).content;
  const base = (window.RYDER_API_BASE || metaBase || "").replace(/\/$/, "");
  let token = store.get(TOKEN_KEY) || null;
  let online = false;
  let ws = null, onRefresh = null;

  const headers = () => Object.assign({ "content-type": "application/json" }, token ? { authorization: "Bearer " + token } : {});
  const setToken = (t) => { token = t; store.set(TOKEN_KEY, t); };

  async function detect() {
    // Only treat the backend as present if /api/health returns real JSON
    // ({ok:true}). Static hosts (GitHub Pages, Base44) often return 200 +
    // index.html for unknown paths, which must NOT count as a backend —
    // otherwise the app would show a login gate with nothing behind it.
    // A short timeout keeps app start-up snappy if the probe hangs.
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2000);
      const r = await fetch(base + "/api/health", { cache: "no-store", signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) { online = false; return online; }
      if (!(r.headers.get("content-type") || "").includes("application/json")) { online = false; return online; }
      const d = await r.json().catch(() => null);
      online = !!(d && d.ok === true);
    } catch { online = false; }
    return online;
  }

  async function post(path, body) {
    const r = await fetch(base + "/api" + path, { method: "POST", headers: headers(), body: JSON.stringify(body || {}) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Something went wrong");
    return d;
  }

  async function login(handle, password) { const d = await post("/login", { handle, password }); setToken(d.token); return d; }
  async function register(body) { const d = await post("/register", body); setToken(d.token); return d; }
  function logout() { token = null; store.del(TOKEN_KEY); if (ws) { try { ws.close(); } catch {} } }

  async function bootstrap() {
    const r = await fetch(base + "/api/bootstrap", { headers: headers() });
    if (r.status === 401) { logout(); throw new Error("unauthorized"); }
    if (!r.ok) throw new Error("Could not load your data");
    return r.json();
  }

  const mutate = (path, body) => post(path, body);

  function wsURL() {
    if (base) return base.replace(/^http/, "ws") + "/ws";
    return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
  }
  function connectWS(cb) {
    onRefresh = cb;
    try {
      ws = new WebSocket(wsURL());
      ws.onmessage = (e) => { try { const m = JSON.parse(e.data); if (m.type === "refresh" && onRefresh) onRefresh(m); } catch {} };
      ws.onclose = () => { ws = null; setTimeout(() => connectWS(cb), 3000); };
    } catch {}
  }

  return { detect, login, register, logout, bootstrap, mutate, connectWS, hasToken: () => !!token, isOnline: () => online };
})();
