/* ------------------------------------------------------------------
   Ryder backend — database (node:sqlite, no native deps)
   Creates the schema and seeds it from seed.js on first run.
   Run the server with:  node --experimental-sqlite server.js
------------------------------------------------------------------ */
const { DatabaseSync } = require("node:sqlite");
const crypto = require("node:crypto");
const path = require("node:path");
const seed = require("./seed");

const db = new DatabaseSync(path.join(__dirname, "ryder.db"));
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT, handle TEXT UNIQUE, email TEXT UNIQUE,
    salt TEXT, hash TEXT, club TEXT, loc TEXT, hcp INTEGER, colour TEXT,
    rec_p INTEGER DEFAULT 0, rec_w INTEGER DEFAULT 0, rec_h INTEGER DEFAULT 0, rec_l INTEGER DEFAULT 0,
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS societies (
    id TEXT PRIMARY KEY, name TEXT, handle TEXT, loc TEXT, colour TEXT, about TEXT, founded TEXT
  );
  CREATE TABLE IF NOT EXISTS society_members ( society_id TEXT, user_id TEXT, PRIMARY KEY (society_id, user_id) );
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY, title TEXT, society_id TEXT, venue TEXT, date TEXT, "when" TEXT,
    status TEXT, capacity INTEGER, note TEXT, extra TEXT
  );
  CREATE TABLE IF NOT EXISTS event_attendees ( event_id TEXT, user_id TEXT, PRIMARY KEY (event_id, user_id) );
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY, type TEXT, author_user TEXT, author_society TEXT, event_id TEXT,
    text TEXT, tint TEXT, caption TEXT, result TEXT, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS comments ( id TEXT PRIMARY KEY, post_id TEXT, user_id TEXT, text TEXT, created_at INTEGER );
  CREATE TABLE IF NOT EXISTS reactions ( post_id TEXT, user_id TEXT, emoji TEXT, PRIMARY KEY (post_id, user_id) );
  CREATE TABLE IF NOT EXISTS follows ( follower TEXT, followee TEXT, PRIMARY KEY (follower, followee) );
  CREATE TABLE IF NOT EXISTS chats ( id TEXT PRIMARY KEY, event_id TEXT, user_id TEXT, text TEXT, created_at INTEGER );
  CREATE TABLE IF NOT EXISTS payments ( event_id TEXT, user_id TEXT, paid INTEGER DEFAULT 1, PRIMARY KEY (event_id, user_id) );
  CREATE TABLE IF NOT EXISTS bookings ( event_id TEXT PRIMARY KEY, status TEXT, ref TEXT, tee_window TEXT, players INTEGER, rate INTEGER, updated_at INTEGER );
  CREATE TABLE IF NOT EXISTS tokens ( token TEXT PRIMARY KEY, user_id TEXT, created_at INTEGER );
`);

function hashPassword(pw, salt = crypto.randomBytes(16).toString("hex")) {
  return { salt, hash: crypto.scryptSync(pw, salt, 32).toString("hex") };
}

// ---- seed on first run -------------------------------------------
const seeded = db.prepare("SELECT COUNT(*) n FROM users").get().n;
if (!seeded) {
  const now = Date.now();
  const insUser = db.prepare(`INSERT INTO users (id,name,handle,email,salt,hash,club,loc,hcp,colour,rec_p,rec_w,rec_h,rec_l,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const g of seed.golfers) {
    const { salt, hash } = hashPassword(seed.SEED_PASSWORD);
    insUser.run(g.id, g.name, g.handle, `${g.handle}@ryder.golf`, salt, hash, g.club, g.loc, g.hcp, g.colour, g.rec.p, g.rec.w, g.rec.h, g.rec.l, now);
  }
  const insSoc = db.prepare(`INSERT INTO societies (id,name,handle,loc,colour,about,founded) VALUES (?,?,?,?,?,?,?)`);
  const insMem = db.prepare(`INSERT OR IGNORE INTO society_members (society_id,user_id) VALUES (?,?)`);
  for (const s of seed.societies) {
    insSoc.run(s.id, s.name, s.handle, s.loc, s.colour, s.about, s.founded);
    s.members.forEach((uid) => insMem.run(s.id, uid));
    // seed an intra-society follow graph so profiles have followers
    s.members.forEach((a) => s.members.forEach((b) => { if (a !== b) db.prepare("INSERT OR IGNORE INTO follows (follower,followee) VALUES (?,?)").run(a, b); }));
  }
  const insEv = db.prepare(`INSERT INTO events (id,title,society_id,venue,date,"when",status,capacity,note,extra) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const insAtt = db.prepare(`INSERT OR IGNORE INTO event_attendees (event_id,user_id) VALUES (?,?)`);
  for (const e of seed.events) {
    const extra = JSON.stringify({ teams: e.teams, sessions: e.sessions, formats: e.formats });
    insEv.run(e.id, e.title, e.societyId, e.venue, e.date, e.when || "", e.status, e.capacity, e.note || "", extra);
    (e.attendees || []).forEach((uid) => insAtt.run(e.id, uid));
  }
  // course bookings + who's paid their share (per event)
  const insBooking = db.prepare(`INSERT OR REPLACE INTO bookings (event_id,status,ref,tee_window,players,rate,updated_at) VALUES (?,?,?,?,?,?,?)`);
  const insPay = db.prepare(`INSERT OR IGNORE INTO payments (event_id,user_id,paid) VALUES (?,?,1)`);
  insBooking.run("ev1", "confirmed", "RYD-7741", "08:00–08:40 & 13:00–13:50", 12, 78, now);
  ["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","p12"].forEach((u) => insPay.run("ev1", u));
  insBooking.run("ev2", "provisional", null, null, 9, 70, now);
  ["p1","p2","p7","p10"].forEach((u) => insPay.run("ev2", u));
  insBooking.run("ev3", "confirmed", "TC-2231", "09:00–09:40 & 13:30–14:10", 12, 38, now);
  ["p7","p10"].forEach((u) => insPay.run("ev3", u));

  const insPost = db.prepare(`INSERT INTO posts (id,type,author_user,author_society,event_id,text,tint,caption,result,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const insReact = db.prepare(`INSERT OR IGNORE INTO reactions (post_id,user_id,emoji) VALUES (?,?,?)`);
  const insCom = db.prepare(`INSERT INTO comments (id,post_id,user_id,text,created_at) VALUES (?,?,?,?,?)`);
  seed.feed.forEach((p, i) => {
    const ts = now - (p.agoMin || i * 60) * 60000;
    insPost.run(p.id, p.type, p.authorGolfer || null, p.authorSociety || null, p.eventId || null, p.text || "", p.tint || null, p.caption || null, p.result ? JSON.stringify(p.result) : null, ts);
    // turn seed reaction counts into rows from arbitrary seed users
    let ui = 0;
    Object.entries(p.reactions || {}).forEach(([emoji, count]) => {
      for (let k = 0; k < count && ui < seed.golfers.length; k++) insReact.run(p.id, seed.golfers[ui++ % seed.golfers.length].id, emoji);
    });
    (p.comments || []).forEach((c, ci) => insCom.run(`${p.id}c${ci}`, p.id, c.by, c.text, ts + ci * 60000));
  });
  console.log(`Seeded ${seed.golfers.length} golfers, ${seed.societies.length} societies, ${seed.events.length} events. Demo login: handle "jackp" / password "${seed.SEED_PASSWORD}".`);
}

module.exports = { db, hashPassword };
