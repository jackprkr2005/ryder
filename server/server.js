/* ------------------------------------------------------------------
   Ryder backend — REST API + WebSocket realtime
   Start with:  npm start   (runs: node --experimental-sqlite server.js)
   Demo login:  handle "jackp"  password "golf"
------------------------------------------------------------------ */
const http = require("node:http");
const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const { WebSocketServer } = require("ws");
const { db, hashPassword } = require("./db");

const app = express();
app.use(express.json());
// allow a separately-hosted front-end to call the API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.static(path.join(__dirname, ".."))); // serve the front-end too

const PORT = process.env.PORT || 3000;
const id = (p) => p + crypto.randomBytes(6).toString("hex");
const verify = (pw, salt, hash) => crypto.scryptSync(pw, salt, 32).toString("hex") === hash;

function relTime(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

// ---- auth middleware ---------------------------------------------
function auth(req, res, next) {
  const tok = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const row = tok && db.prepare("SELECT user_id FROM tokens WHERE token=?").get(tok);
  if (!row) return res.status(401).json({ error: "unauthorized" });
  req.userId = row.user_id;
  next();
}
function issueToken(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  db.prepare("INSERT INTO tokens (token,user_id,created_at) VALUES (?,?,?)").run(token, userId, Date.now());
  return token;
}
const publicUser = (u) => ({ id: u.id, name: u.name, handle: u.handle, email: u.email, club: u.club, loc: u.loc, hcp: u.hcp, colour: u.colour, rec: { p: u.rec_p, w: u.rec_w, h: u.rec_h, l: u.rec_l } });

// ---- auth routes -------------------------------------------------
app.post("/api/register", (req, res) => {
  const { name, handle, email, password, club = "", loc = "", hcp = 18, colour = "green" } = req.body || {};
  if (!name || !handle || !password) return res.status(400).json({ error: "name, handle and password required" });
  if (db.prepare("SELECT 1 FROM users WHERE handle=?").get(handle)) return res.status(409).json({ error: "handle taken" });
  const uid = id("u");
  const { salt, hash } = hashPassword(password);
  db.prepare(`INSERT INTO users (id,name,handle,email,salt,hash,club,loc,hcp,colour,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(uid, name, handle, email || `${handle}@ryder.golf`, salt, hash, club, loc, hcp, colour, Date.now());
  res.json({ token: issueToken(uid), user: publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(uid)) });
});

app.post("/api/login", (req, res) => {
  const { handle, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE handle=? OR email=?").get(handle, handle);
  if (!u || !verify(password, u.salt, u.hash)) return res.status(401).json({ error: "wrong handle or password" });
  res.json({ token: issueToken(u.id), user: publicUser(u) });
});

// ---- read: everything the client needs ---------------------------
app.get("/api/bootstrap", auth, (req, res) => {
  const me = req.userId;
  const users = db.prepare("SELECT * FROM users").all();
  const followers = {};
  db.prepare("SELECT followee, COUNT(*) n FROM follows GROUP BY followee").all().forEach((r) => (followers[r.followee] = r.n));
  const following = db.prepare("SELECT followee FROM follows WHERE follower=?").all(me).map((r) => r.followee);

  const golfers = users.map((u) => ({ ...publicUser(u), followers: followers[u.id] || 0 }));

  const societies = db.prepare("SELECT * FROM societies").all().map((s) => ({
    ...s, memberIds: db.prepare("SELECT user_id FROM society_members WHERE society_id=?").all(s.id).map((r) => r.user_id),
  }));

  const events = db.prepare(`SELECT * FROM events`).all().map((e) => {
    const extra = JSON.parse(e.extra || "{}");
    const bk = db.prepare("SELECT * FROM bookings WHERE event_id=?").get(e.id);
    return {
      id: e.id, title: e.title, societyId: e.society_id, venue: e.venue, date: e.date, when: e.when,
      status: e.status, capacity: e.capacity, note: e.note,
      attendeeIds: db.prepare("SELECT user_id FROM event_attendees WHERE event_id=?").all(e.id).map((r) => r.user_id),
      paid: db.prepare("SELECT user_id FROM payments WHERE event_id=? AND paid=1").all(e.id).map((r) => r.user_id),
      booking: bk ? { status: bk.status, ref: bk.ref, teeWindow: bk.tee_window, players: bk.players, rate: bk.rate } : { status: "planning" },
      teams: extra.teams, sessions: extra.sessions, formats: extra.formats,
    };
  });

  const feed = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all().map((p) => {
    const reactions = {};
    db.prepare("SELECT emoji, COUNT(*) n FROM reactions WHERE post_id=? GROUP BY emoji").all(p.id).forEach((r) => (reactions[r.emoji] = r.n));
    const mine = db.prepare("SELECT emoji FROM reactions WHERE post_id=? AND user_id=?").get(p.id, me);
    const comments = db.prepare("SELECT * FROM comments WHERE post_id=? ORDER BY created_at").all(p.id).map((c) => ({ by: c.user_id, text: c.text, time: relTime(c.created_at) }));
    return {
      id: p.id, type: p.type, authorGolfer: p.author_user, authorSociety: p.author_society, eventId: p.event_id,
      text: p.text, tint: p.tint, caption: p.caption, result: p.result ? JSON.parse(p.result) : null,
      time: relTime(p.created_at), reactions, myReaction: mine ? mine.emoji : null, comments,
    };
  });

  const chats = {};
  db.prepare("SELECT * FROM chats ORDER BY created_at").all().forEach((c) => {
    (chats[c.event_id] = chats[c.event_id] || []).push({ by: c.user_id, text: c.text, time: relTime(c.created_at) });
  });

  res.json({ me: { ...publicUser(users.find((u) => u.id === me)), following }, golfers, societies, events, feed, chats });
});

// ---- writes: mutate + broadcast ----------------------------------
const mut = (fn) => [auth, (req, res) => { try { const out = fn(req) || {}; broadcast({ type: "refresh", by: req.userId }); res.json({ ok: true, ...out }); } catch (e) { res.status(400).json({ error: String(e.message || e) }); } }];

app.post("/api/rsvp", ...mut((req) => {
  const { eventId } = req.body, me = req.userId;
  const going = db.prepare("SELECT 1 FROM event_attendees WHERE event_id=? AND user_id=?").get(eventId, me);
  if (going) db.prepare("DELETE FROM event_attendees WHERE event_id=? AND user_id=?").run(eventId, me);
  else db.prepare("INSERT OR IGNORE INTO event_attendees (event_id,user_id) VALUES (?,?)").run(eventId, me);
}));

app.post("/api/join", ...mut((req) => {
  const { societyId } = req.body, me = req.userId;
  const has = db.prepare("SELECT 1 FROM society_members WHERE society_id=? AND user_id=?").get(societyId, me);
  if (has) db.prepare("DELETE FROM society_members WHERE society_id=? AND user_id=?").run(societyId, me);
  else db.prepare("INSERT OR IGNORE INTO society_members (society_id,user_id) VALUES (?,?)").run(societyId, me);
}));

app.post("/api/follow", ...mut((req) => {
  const { id: who } = req.body, me = req.userId;
  const has = db.prepare("SELECT 1 FROM follows WHERE follower=? AND followee=?").get(me, who);
  if (has) db.prepare("DELETE FROM follows WHERE follower=? AND followee=?").run(me, who);
  else db.prepare("INSERT OR IGNORE INTO follows (follower,followee) VALUES (?,?)").run(me, who);
}));

app.post("/api/react", ...mut((req) => {
  const { postId, emoji } = req.body, me = req.userId;
  const cur = db.prepare("SELECT emoji FROM reactions WHERE post_id=? AND user_id=?").get(postId, me);
  if (cur && cur.emoji === emoji) db.prepare("DELETE FROM reactions WHERE post_id=? AND user_id=?").run(postId, me);
  else db.prepare("INSERT INTO reactions (post_id,user_id,emoji) VALUES (?,?,?) ON CONFLICT(post_id,user_id) DO UPDATE SET emoji=excluded.emoji").run(postId, me, emoji);
}));

app.post("/api/comment", ...mut((req) => {
  const { postId, text } = req.body;
  db.prepare("INSERT INTO comments (id,post_id,user_id,text,created_at) VALUES (?,?,?,?,?)").run(id("c"), postId, req.userId, text, Date.now());
}));

app.post("/api/post", ...mut((req) => {
  const { text, tint } = req.body;
  db.prepare("INSERT INTO posts (id,type,author_user,text,tint,caption,created_at) VALUES (?,?,?,?,?,?,?)")
    .run(id("p"), tint ? "photo" : "text", req.userId, text, tint || null, tint ? "On the course" : null, Date.now());
}));

app.post("/api/chat", ...mut((req) => {
  const { eventId, text } = req.body;
  db.prepare("INSERT INTO chats (id,event_id,user_id,text,created_at) VALUES (?,?,?,?,?)").run(id("m"), eventId, req.userId, text, Date.now());
}));

app.post("/api/pay", ...mut((req) => {
  const { eventId } = req.body, who = req.body.userId || req.userId; // organiser may pass userId
  const cur = db.prepare("SELECT paid FROM payments WHERE event_id=? AND user_id=?").get(eventId, who);
  if (cur && cur.paid) db.prepare("DELETE FROM payments WHERE event_id=? AND user_id=?").run(eventId, who);
  else db.prepare("INSERT INTO payments (event_id,user_id,paid) VALUES (?,?,1) ON CONFLICT(event_id,user_id) DO UPDATE SET paid=1").run(eventId, who);
}));

app.post("/api/booking", ...mut((req) => {
  const { eventId, status, ref, teeWindow, players, rate } = req.body;
  db.prepare(`INSERT INTO bookings (event_id,status,ref,tee_window,players,rate,updated_at) VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(event_id) DO UPDATE SET status=excluded.status,
      ref=COALESCE(excluded.ref, bookings.ref), tee_window=COALESCE(excluded.tee_window, bookings.tee_window),
      players=COALESCE(excluded.players, bookings.players), rate=COALESCE(excluded.rate, bookings.rate),
      updated_at=excluded.updated_at`)
    .run(eventId, status || "planning", ref || null, teeWindow || null, players || null, rate || null, Date.now());
}));

app.post("/api/profile", ...mut((req) => {
  const { name, club, loc, hcp, colour } = req.body || {};
  const h = Number.parseInt(hcp, 10);
  db.prepare(`UPDATE users SET
      name = COALESCE(?, name), club = COALESCE(?, club), loc = COALESCE(?, loc),
      hcp = COALESCE(?, hcp), colour = COALESCE(?, colour) WHERE id = ?`)
    .run(name || null, club ?? null, loc ?? null, Number.isFinite(h) ? h : null, colour || null, req.userId);
}));

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ---- http + websocket --------------------------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
function broadcast(msg) { const s = JSON.stringify(msg); wss.clients.forEach((c) => { if (c.readyState === 1) c.send(s); }); }
wss.on("connection", (ws) => ws.send(JSON.stringify({ type: "hello" })));

server.listen(PORT, () => console.log(`Ryder backend on http://localhost:${PORT}  (API at /api, realtime at /ws)`));
