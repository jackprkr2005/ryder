/* ------------------------------------------------------------------
   Ryder — social front-end
   Dependency-free SPA: state -> router -> render -> delegated events.
------------------------------------------------------------------ */
(function () {
  "use strict";

  const STORE = "ryder.social.v1";
  const data = structuredClone(window.RYDER_SEED);
  const ME = data.me;

  // UI state that the user can change (persisted)
  const ui = Object.assign(
    { joined: [], going: [], react: {}, follows: [], posts: [], events: [], comments: {}, sheets: {} },
    (() => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } })()
  );
  ui.joined = new Set(ui.joined);
  ui.going = new Set(ui.going);
  ui.follows = new Set(ui.follows);
  ui.comments = ui.comments || {};
  ui.sheets = ui.sheets || {};
  const persist = () =>
    localStorage.setItem(STORE, JSON.stringify({
      joined: [...ui.joined], going: [...ui.going], react: ui.react,
      follows: [...ui.follows], posts: ui.posts, events: ui.events, comments: ui.comments, sheets: ui.sheets,
    }));

  // merge any user-created content back into the working data set
  (ui.events || []).forEach((e) => { if (!data.events.some((x) => x.id === e.id)) data.events.push(e); });
  data.feed = [...(ui.posts || []), ...data.feed];
  // re-apply any locked-in match sheets (captain's draft) onto their events
  Object.entries(ui.sheets).forEach(([eid, sheet]) => {
    const e = data.events.find((x) => x.id === eid);
    if (e) { e.teams = sheet.teams; e.sessions = sheet.sessions; e.status = "live"; e.when = "Live now"; }
  });

  let route = { view: "feed", id: null, tab: null };

  // ---- lookups -----------------------------------------------------
  const golfer  = (id) => data.golfers.find((g) => g.id === id);
  const society = (id) => data.societies.find((s) => s.id === id);
  const event   = (id) => data.events.find((e) => e.id === id);
  const course  = (id) => data.courses.find((c) => c.id === id);
  const me = () => golfer(ME);

  // muted, club-blazer avatar palette [lighter, base]
  const COLOURS = {
    green:["#2f7d57","#1a4a33"], blue:["#41619e","#293f63"], red:["#b04c57","#7c2a34"],
    amber:["#c2954a","#896325"], violet:["#7a68ac","#4d3f7e"], teal:["#3b988f","#1c6960"],
    pink:["#c0738e","#8a4361"], slate:["#6a7585","#454e5d"], orange:["#c5854c","#915626"],
    cyan:["#4791a4","#266b78"], lime:["#7f9a4b","#566b29"], indigo:["#6168a8","#3c4080"],
  };
  const grad  = (c) => { const p = COLOURS[c] || COLOURS.slate; return `linear-gradient(150deg,${p[0]},${p[1]})`; };
  const solid = (c) => (COLOURS[c] || COLOURS.slate)[1];
  const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  // society monogram: skip a leading "The", take first letters of next two words
  const mono = (name) => name.replace(/^the\s+/i, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const fmtPts = (n) => (n % 1 === 0 ? String(n) : (Math.floor(n) || "") + "½");

  // social avatar for a golfer
  function av(id, size = 38) {
    const g = golfer(id);
    return `<button class="uavatar" data-nav="profile" data-id="${id}" title="${g.name}"
      style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.34)}px;background:${solid(g.colour)}">${initials(g.name)}</button>`;
  }
  function avatarStack(ids, max = 5, size = 30) {
    const shown = ids.slice(0, max);
    const extra = ids.length - shown.length;
    return `<span class="stack">
      ${shown.map((id) => `<span class="stack-av" style="width:${size}px;height:${size}px;background:${solid(golfer(id).colour)}" title="${golfer(id).name}">${initials(golfer(id).name)}</span>`).join("")}
      ${extra > 0 ? `<span class="stack-more" style="width:${size}px;height:${size}px">+${extra}</span>` : ""}
    </span>`;
  }

  // ---- membership / rsvp / reactions ------------------------------
  const isMember = (sid) => society(sid).members.includes(ME) || ui.joined.has(sid);
  const memberCount = (s) => s.members.length + (s.members.includes(ME) ? 0 : (ui.joined.has(s.id) ? 1 : 0));
  const isGoing = (eid) => event(eid).attendees.includes(ME) || ui.going.has(eid);
  const goingCount = (e) => e.attendees.length + (e.attendees.includes(ME) ? 0 : (ui.going.has(e.id) ? 1 : 0));

  function reactCount(post, emoji) {
    const base = post.reactions[emoji] || 0;
    return base + (ui.react[post.id] === emoji ? 1 : 0);
  }

  // follow graph (seed has none, so fabricate a stable follower base per golfer)
  const isFollowing = (id) => ui.follows.has(id);
  const followerBase = (g) => 20 + g.rec.p * 3 + g.rec.w * 2;
  function postComments(post) {
    return [...(post.comments || []), ...(ui.comments[post.id] || [])];
  }
  const now = () => "just now";

  // ===================================================================
  //  FEED
  // ===================================================================
  function postHead(opts) {
    // opts: { avatar, title, sub, time }
    return `<div class="post-head">
      ${opts.avatar}
      <div class="ph-text">
        <div class="ph-title">${opts.title}</div>
        <div class="ph-sub">${opts.sub} · ${opts.time}</div>
      </div>
    </div>`;
  }
  function socAvatar(sid, size = 40) {
    const s = society(sid);
    return `<button class="soc-avatar" data-nav="society" data-id="${sid}" title="${s.name}"
      style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.36)}px;background:${solid(s.colour)}">${mono(s.name)}</button>`;
  }
  function reactionBar(post) {
    let emojis = Object.keys(post.reactions);
    if (ui.react[post.id] && !emojis.includes(ui.react[post.id])) emojis = [...emojis, ui.react[post.id]];
    if (!emojis.length) emojis = ["👍", "🔥", "⛳"]; // user posts start with a default set
    const total = emojis.reduce((n, e) => n + reactCount(post, e), 0);
    const nComments = postComments(post).length;
    return `<div class="react-bar">
      <div class="reacts">
        ${emojis.map((e) => `<button class="react ${ui.react[post.id] === e ? "on" : ""}" data-act="react" data-post="${post.id}" data-emoji="${e}">${e} <b>${reactCount(post, e)}</b></button>`).join("")}
      </div>
      <div class="react-meta">${total} reactions · ${nComments} comment${nComments === 1 ? "" : "s"}</div>
    </div>`;
  }
  function comments(post) {
    const list = postComments(post);
    return `<div class="comments">
      ${list.map((c) => `<div class="comment">${av(c.by, 28)}
        <div><b>${golfer(c.by).name}</b> <span class="muted">${c.time}</span><br/>${c.text}</div></div>`).join("")}
      <div class="comment add"><span class="uavatar" style="width:28px;height:28px;font-size:10px;background:${grad(me().colour)}">${initials(me().name)}</span>
        <input placeholder="Add a comment…" data-comment="${post.id}" /></div>
    </div>`;
  }

  function eventMini(eid) {
    const e = event(eid);
    const s = society(e.societyId);
    const filled = goingCount(e), pct = Math.round((filled / e.capacity) * 100);
    const going = isGoing(eid);
    const tags = (e.formats || []).map((f) => `<span class="chip">${f}</span>`).join("");
    return `<div class="event-mini" data-nav="event" data-id="${eid}">
      <div class="em-top">
        <div>
          <div class="em-title">${e.title}</div>
          <div class="em-meta">${e.date} · ${e.venue}</div>
        </div>
        <span class="em-status ${e.status}">${e.status === "open" ? "Open day" : e.when}</span>
      </div>
      ${tags ? `<div class="chips">${tags}</div>` : ""}
      <div class="em-fill"><span style="width:${pct}%;background:${grad(s.colour)}"></span></div>
      <div class="em-foot">
        ${avatarStack(e.attendees, 6, 28)}
        <span class="em-count">${filled} of ${e.capacity} going</span>
        <button class="btn ${going ? "ghost" : "primary"} sm" data-act="rsvp" data-id="${eid}">${going ? "✓ Going" : "Join day"}</button>
      </div>
    </div>`;
  }

  function feedCard(post) {
    let head = "", body = "";
    if (post.type === "event") {
      head = postHead({ avatar: socAvatar(post.authorSociety), title: society(post.authorSociety).name, sub: "hosting a day out", time: post.time });
      body = `<p class="post-text">${post.text}</p>${eventMini(post.eventId)}`;
    } else if (post.type === "result") {
      const r = post.result;
      head = postHead({ avatar: socAvatar(post.authorSociety), title: society(post.authorSociety).name, sub: "final result", time: post.time });
      body = `<p class="post-text">${post.text}</p>
        <div class="scoreline">
          <div class="sl-side ${r.blue >= r.red ? "win" : ""}"><span class="sl-name"><span class="team-chip blue"></span>Team Azure</span><span class="sl-score">${fmtPts(r.blue)}</span></div>
          <div class="sl-cup"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v4a6 6 0 0 1-12 0V4Z"/><path d="M6 6H4a2 2 0 0 0 0 4h2M18 6h2a2 2 0 0 1 0 4h-2"/><path d="M10 14.5V17m4-2.5V17M8 20h8M9 20a3 3 0 0 1 6 0"/></svg><div class="sl-sub">${r.event}</div></div>
          <div class="sl-side right ${r.red > r.blue ? "win" : ""}"><span class="sl-name">Team Crimson<span class="team-chip red"></span></span><span class="sl-score">${fmtPts(r.red)}</span></div>
        </div>`;
    } else if (post.type === "photo") {
      head = postHead({ avatar: av(post.authorGolfer, 40), title: golfer(post.authorGolfer).name, sub: "@" + golfer(post.authorGolfer).handle, time: post.time });
      body = `<p class="post-text">${post.text}</p>
        <div class="photo" style="background:${grad(post.tint)}"><span class="photo-cap">${post.caption || "On the course"}</span></div>`;
    } else if (post.type === "text") {
      head = postHead({ avatar: av(post.authorGolfer, 40), title: golfer(post.authorGolfer).name, sub: "@" + golfer(post.authorGolfer).handle, time: post.time });
      body = `<p class="post-text">${post.text}</p>`;
    } else if (post.type === "join") {
      head = postHead({ avatar: av(post.authorGolfer, 40), title: golfer(post.authorGolfer).name, sub: "@" + golfer(post.authorGolfer).handle, time: post.time });
      body = `<p class="post-text">${post.text.replace(/The [^.]+/, (m) => `<a data-nav="society" data-id="${post.societyId}" class="link">${m}</a>`)}</p>`;
    }
    return `<article class="card post">${head}${body}${reactionBar(post)}${comments(post)}</article>`;
  }

  function viewFeed() {
    const myNext = data.events.find((e) => isGoing(e.id) && e.status !== "complete");
    const suggestions = data.societies.filter((s) => !isMember(s.id)).slice(0, 3);
    const feed = data.feed.map(feedCard).join("");

    return `<div class="view feed-wrap">
      <div class="feed-col">
        <div class="composer card">
          <span class="uavatar" style="width:40px;height:40px;background:${grad(me().colour)}">${initials(me().name)}</span>
          <button class="composer-fake" data-act="compose">Share a result, post a photo, or start a day out…</button>
          <button class="btn primary sm" data-act="compose">Post</button>
        </div>
        ${feed}
      </div>

      <aside class="rail">
        ${myNext ? `<div class="card rail-card next-day" data-nav="event" data-id="${myNext.id}">
          <div class="rail-eyebrow">Your next day out</div>
          <div class="nd-title">${myNext.title}</div>
          <div class="nd-meta">${myNext.date}</div>
          <div class="nd-meta">${myNext.venue}</div>
          <div class="nd-foot">${avatarStack(myNext.attendees, 5, 26)}<span class="muted">${goingCount(myNext)} going · ${myNext.when}</span></div>
        </div>` : ""}

        <div class="card rail-card">
          <div class="rail-eyebrow">Societies near you</div>
          ${suggestions.map((s) => `<div class="sug">
            ${socAvatar(s.id, 36)}
            <div class="sug-text" data-nav="society" data-id="${s.id}">
              <div class="sug-name">${s.name}</div>
              <div class="sug-meta">${s.loc} · ${memberCount(s)} members</div>
            </div>
            <button class="btn ${isMember(s.id) ? "ghost" : "outline"} xs" data-act="join" data-id="${s.id}">${isMember(s.id) ? "Joined" : "Join"}</button>
          </div>`).join("")}
          <button class="rail-link" data-nav="discover">Discover more →</button>
        </div>
      </aside>
    </div>`;
  }

  // ===================================================================
  //  DISCOVER
  // ===================================================================
  function societyCard(s) {
    const upcoming = data.events.filter((e) => e.societyId === s.id && e.status !== "complete").length;
    return `<div class="card disc-card">
      <div class="disc-cover" style="background:${grad(s.colour)}"><span>${mono(s.name)}</span></div>
      <div class="disc-body">
        <div class="disc-name" data-nav="society" data-id="${s.id}">${s.name}</div>
        <div class="disc-meta">${s.loc} · ${memberCount(s)} members${upcoming ? ` · ${upcoming} upcoming` : ""}</div>
        <p class="disc-about">${s.about}</p>
        <div class="disc-foot">
          ${avatarStack(s.members, 5, 28)}
          <button class="btn ${isMember(s.id) ? "ghost" : "primary"} sm" data-act="join" data-id="${s.id}">${isMember(s.id) ? "✓ Member" : "Join society"}</button>
        </div>
      </div>
    </div>`;
  }
  function openDayCard(e) {
    return eventMini(e.id);
  }
  function viewDiscover() {
    const openDays = data.events.filter((e) => e.status === "open" || (e.status === "upcoming" && goingCount(e) < e.capacity));
    const near = data.golfers.filter((g) => g.id !== ME).slice(0, 6);
    return `<div class="view">
      <div class="disc-hero card">
        <h2>Find your next round</h2>
        <p>Golf is better with a crew. Discover societies and open days near <b>North Devon</b>, or follow players to organise your own Ryder Cup.</p>
        <label class="search big">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
          <input type="text" placeholder="Try a town, club or society…" value="North Devon" />
        </label>
      </div>

      <p class="section-title">Societies near you</p>
      <div class="disc-grid">${data.societies.map(societyCard).join("")}</div>

      <p class="section-title">Open days — jump straight in</p>
      <div class="open-grid">${openDays.map(openDayCard).join("")}</div>

      <p class="section-title">Players near you</p>
      <div class="people-grid">
        ${near.map((g) => `<div class="person card" data-nav="profile" data-id="${g.id}">
          ${av(g.id, 46)}
          <div class="person-name">${g.name}</div>
          <div class="person-meta">${g.club}</div>
          <div class="person-stats"><span>hcp <b>${g.hcp}</b></span><span>${g.rec.w}W</span></div>
          <button class="btn ${isFollowing(g.id) ? "ghost" : "outline"} xs" data-act="follow" data-id="${g.id}">${isFollowing(g.id) ? "✓ Following" : "Follow"}</button>
        </div>`).join("")}
      </div>
    </div>`;
  }

  // ===================================================================
  //  SOCIETY PAGE
  // ===================================================================
  function viewSociety() {
    const s = society(route.id);
    const tab = route.tab || "events";
    const events = data.events.filter((e) => e.societyId === s.id);
    const member = isMember(s.id);

    let panel = "";
    if (tab === "events") {
      panel = events.length
        ? `<div class="match-list">${events.map((e) => eventMini(e.id)).join("")}</div>`
        : `<p class="muted pad">No days out scheduled yet — be the first to organise one.</p>`;
    } else if (tab === "members") {
      panel = `<div class="people-grid">${s.members.map((id) => {
        const g = golfer(id);
        return `<div class="person card" data-nav="profile" data-id="${id}">
          ${av(id, 46)}<div class="person-name">${g.name}${id === s.members[0] ? " ©" : ""}</div>
          <div class="person-meta">${g.club}</div>
          <div class="person-stats"><span>hcp <b>${g.hcp}</b></span></div>
        </div>`;
      }).join("")}</div>`;
    } else {
      panel = s.honours.length ? `<table class="honours"><thead><tr><th>Year</th><th>Event</th><th>Winner</th><th>Score</th></tr></thead>
        <tbody>${s.honours.map((h) => `<tr><td>${h.year}</td><td>${h.event}</td><td><b>${h.winner}</b></td><td>${h.score}</td></tr>`).join("")}</tbody></table>`
        : `<p class="muted pad">No honours on the board yet.</p>`;
    }

    return `<div class="view">
      <div class="card profile-head">
        <div class="cover" style="background:${grad(s.colour)}"></div>
        <div class="ph-row">
          <div class="big-avatar soc" style="background:${solid(s.colour)}">${mono(s.name)}</div>
          <div class="ph-main">
            <h2>${s.name}</h2>
            <div class="muted">@${s.handle} · ${s.loc} · ${memberCount(s)} members · est. ${s.founded}</div>
            <p class="bio">${s.about}</p>
          </div>
          <button class="btn ${member ? "ghost" : "primary"}" data-act="join" data-id="${s.id}">${member ? "✓ Member" : "Join society"}</button>
        </div>
        <div class="subtabs">
          <button class="subtab ${tab === "events" ? "on" : ""}" data-nav="society" data-id="${s.id}" data-tab="events">Days out</button>
          <button class="subtab ${tab === "members" ? "on" : ""}" data-nav="society" data-id="${s.id}" data-tab="members">Members</button>
          <button class="subtab ${tab === "honours" ? "on" : ""}" data-nav="society" data-id="${s.id}" data-tab="honours">Honours</button>
        </div>
      </div>
      ${panel}
    </div>`;
  }

  // ===================================================================
  //  PROFILE
  // ===================================================================
  function formPills(rec) {
    // derive a believable recent-form streak by spreading W/H/L by ratio
    const counts = { W: rec.w, H: rec.h, L: rec.l };
    const total = rec.w + rec.h + rec.l;
    const remaining = { ...counts }, taken = { W: 0, H: 0, L: 0 }, seq = [];
    for (let i = 0; i < Math.min(5, total); i++) {
      let best = null, bestScore = -Infinity;
      for (const k of ["W", "H", "L"]) {
        if (remaining[k] <= 0) continue;
        const score = (counts[k] / total) * (i + 1) - taken[k];
        if (score > bestScore) { bestScore = score; best = k; }
      }
      seq.push(best); taken[best]++; remaining[best]--;
    }
    return seq.map((r) => `<span class="form ${r}">${r}</span>`).join("");
  }
  function viewProfile() {
    const g = golfer(route.id || ME);
    const isMe = g.id === ME;
    const socs = data.societies.filter((s) => s.members.includes(g.id) || (isMe && ui.joined.has(s.id)));
    const winPct = g.rec.p ? Math.round((g.rec.w / g.rec.p) * 100) : 0;
    return `<div class="view">
      <div class="card profile-head">
        <div class="cover" style="background:${grad(g.colour)}"></div>
        <div class="ph-row">
          <div class="big-avatar" style="background:${grad(g.colour)}">${initials(g.name)}</div>
          <div class="ph-main">
            <h2>${g.name}</h2>
            <div class="muted">@${g.handle} · ${g.loc} · ${g.club}</div>
            <div class="profile-meta">
              <span class="hcp-badge">Handicap <b>${g.hcp}</b></span>
              <span class="conn"><b>${followerBase(g) + (isFollowing(g.id) ? 1 : 0)}</b> followers</span>
              ${isMe ? `<span class="conn"><b>${ui.follows.size}</b> following</span>` : ""}
            </div>
          </div>
          ${isMe
            ? `<button class="btn outline">Edit profile</button>`
            : `<div class="profile-actions">
                 <button class="btn ${isFollowing(g.id) ? "ghost" : "primary"}" data-act="follow" data-id="${g.id}">${isFollowing(g.id) ? "✓ Following" : "Follow"}</button>
                 <button class="btn outline" data-act="message" data-id="${g.id}">Message</button>
               </div>`}
        </div>
      </div>

      <div class="statgrid">
        <div class="card stat"><div class="k">Played</div><div class="v">${g.rec.p}</div></div>
        <div class="card stat"><div class="k">Won</div><div class="v" style="color:var(--fairway)">${g.rec.w}</div></div>
        <div class="card stat"><div class="k">Halved</div><div class="v">${g.rec.h}</div></div>
        <div class="card stat"><div class="k">Win rate</div><div class="v">${winPct}<small>%</small></div></div>
      </div>

      <div class="card pad form-card-2">
        <div class="row-between"><span class="section-title flat">Recent form</span><span class="form-row">${formPills(g.rec)}</span></div>
      </div>

      <p class="section-title">Societies</p>
      <div class="disc-grid">${socs.length ? socs.map(societyCard).join("") : '<p class="muted pad">Not in any societies yet.</p>'}</div>
    </div>`;
  }

  // ===================================================================
  //  EVENT DETAIL  (RSVP + live Ryder Cup scoreboard)
  // ===================================================================
  function playerRowTeam(id, colour) {
    const g = golfer(id);
    return `<div class="player">
      <span class="avatar ${colour}">${initials(g.name)}</span>
      <span><span class="pname">${g.name}${g.captain ? " ©" : ""}</span><br/><span class="ph">hcp ${g.hcp}</span></span>
    </div>`;
  }
  function pairCell(ids, colour, side, win) {
    return `<div class="pair ${side} ${win ? "win" : ""}">${ids.map((id) => playerRowTeam(id, colour)).join("")}</div>`;
  }
  function midCell(m, idx) {
    let inner;
    if (m.status === "final") {
      const cls = m.winner === "blue" ? "blue" : m.winner === "red" ? "red" : "halved";
      inner = `<span class="badge final">Final</span><span class="res ${cls}">${m.margin}</span>`;
    } else if (m.status === "live") {
      inner = `<span class="badge live">Live</span><span class="res halved">${m.state || ""}</span><span class="thru">thru ${m.thru}</span>`;
    } else {
      inner = `<span class="badge soon">Tee</span><span class="thru">${m.tee || "TBC"}</span>`;
    }
    return `<div class="mid" data-act="cycle" data-mi="${idx}" title="Click to set the result">${inner}</div>`;
  }
  function matchCard(m, idx) {
    return `<div class="match">${pairCell(m.blue, "blue", "left", m.winner === "blue")}${midCell(m, idx)}${pairCell(m.red, "red", "right", m.winner === "red")}</div>`;
  }
  function pointsFor(ev, team) {
    let p = 0;
    ev.sessions.forEach((s) => s.matches.forEach((m) => {
      if (m.winner === team) p += 1; else if (m.winner === "halved") p += 0.5;
    }));
    return p;
  }
  function sessionPoints(s) {
    let b = 0, r = 0;
    s.matches.forEach((m) => {
      if (m.winner === "blue") b++; else if (m.winner === "red") r++;
      else if (m.winner === "halved") { b += 0.5; r += 0.5; }
    });
    return { b, r };
  }

  function viewEvent() {
    const e = event(route.id);
    const s = society(e.societyId);
    const going = isGoing(e.id);

    // --- upcoming / open: RSVP-focused layout (no match sheet yet) ---
    if (!e.sessions) {
      const filled = goingCount(e), pct = Math.round((filled / e.capacity) * 100);
      const canBuild = filled >= 4;
      return `<div class="view">
        <div class="card profile-head">
          <div class="cover" style="background:${grad(s.colour)}"></div>
          <div class="ph-row">
            <div class="big-avatar soc" style="background:${solid(s.colour)}">${mono(s.name)}</div>
            <div class="ph-main">
              <h2>${e.title}</h2>
              <div class="muted">${e.date} · ${e.venue}</div>
              <div class="muted">Hosted by <a class="link" data-nav="society" data-id="${s.id}">${s.name}</a></div>
            </div>
            <button class="btn ${going ? "ghost" : "primary"}" data-act="rsvp" data-id="${e.id}">${going ? "✓ You're going" : "Join this day"}</button>
          </div>
        </div>

        <div class="card pad">
          <p class="post-text">${e.note || ""}</p>
          <div class="chips">${(e.formats || []).map((f) => `<span class="chip">${f}</span>`).join("")}</div>
          <div class="em-fill big"><span style="width:${pct}%;background:${grad(s.colour)}"></span></div>
          <div class="muted" style="margin-top:8px">${filled} of ${e.capacity} spots filled — ${e.capacity - filled} left</div>
        </div>

        <div class="card captain-cta">
          <div>
            <div class="cc-eyebrow">Captain's room</div>
            <div class="cc-line">Auto-build two balanced teams and a full Ryder Cup match sheet from who's in.</div>
          </div>
          <button class="btn primary" data-act="build-sheet" data-id="${e.id}" ${canBuild ? "" : "disabled"}>Build the match sheet</button>
        </div>

        <p class="section-title">Who's going (${filled})</p>
        <div class="people-grid">${attendeesOf(e).map((id) => `<div class="person card" data-nav="profile" data-id="${id}">
          ${av(id, 46)}<div class="person-name">${golfer(id).name}</div><div class="person-meta">hcp ${golfer(id).hcp}</div></div>`).join("")}
        </div>
      </div>`;
    }

    // --- live: full scoreboard ---
    const b = pointsFor(e, "blue"), r = pointsFor(e, "red");
    const total = e.sessions.reduce((n, x) => n + x.matches.length, 0);
    const target = total / 2 + 0.5;
    const blueW = (b / total) * 100, redW = (r / total) * 100, targetPct = (target / total) * 100;
    const T = e.teams;
    let idx = -1;
    const sessions = e.sessions.map((sn) => {
      const sp = sessionPoints(sn);
      const cards = sn.matches.map((m) => { idx++; return matchCard(m, idx); }).join("");
      return `<section class="session">
        <div class="session-head"><h3>${sn.name}</h3><span class="fmt">${sn.format}</span>
          <span class="pts"><span class="b">${fmtPts(sp.b)}</span> – <span class="r">${fmtPts(sp.r)}</span></span></div>
        <div class="match-list">${cards}</div>
      </section>`;
    }).join("");

    return `<div class="view">
      <section class="hero">
        <div class="event-meta"><a class="link2" data-nav="society" data-id="${s.id}">${s.name}</a><span class="sep">•</span>${e.venue}<span class="sep">•</span>${e.date}</div>
        <div class="score-row">
          <div class="team-side left"><span class="team-name"><span class="team-chip blue"></span>${T.blue.name}</span><span class="team-captain">Captain · ${T.blue.captain}</span><span class="team-score">${fmtPts(b)}</span></div>
          <div class="score-mid"><div class="vs">VS</div><div class="target"><b>${fmtPts(target)}</b><br/>to lift the cup</div></div>
          <div class="team-side right"><span class="team-name"><span class="team-chip red"></span>${T.red.name}</span><span class="team-captain">Captain · ${T.red.captain}</span><span class="team-score">${fmtPts(r)}</span></div>
        </div>
        <div class="progress">
          <div class="progress-track"><span class="target-line" style="left:${targetPct}%"></span><span class="target-flag" style="left:${targetPct}%">${fmtPts(target)} to win</span><span class="fill fill-blue" style="width:${blueW}%"></span><span class="fill fill-red" style="width:${redW}%"></span></div>
          <div class="progress-legend"><span>${T.blue.name} — ${fmtPts(b)} pts</span><span>${T.red.name} — ${fmtPts(r)} pts</span></div>
        </div>
      </section>
      <div class="going-strip card">
        <span class="muted">${goingCount(e)} playing today</span>${avatarStack(e.attendees, 10, 30)}
        <button class="btn ${going ? "ghost" : "primary"} sm" data-act="rsvp" data-id="${e.id}">${going ? "✓ Going" : "Join"}</button>
      </div>
      <p class="muted pad-x">Tap any result to update it on the day — the scoreboard recalculates instantly.</p>
      ${sessions}
    </div>`;
  }

  // ===================================================================
  //  MY DAYS
  // ===================================================================
  function viewEvents() {
    const mine = data.events.filter((e) => isGoing(e.id));
    const live = mine.filter((e) => e.status === "live");
    const up = mine.filter((e) => e.status === "upcoming" || e.status === "open");
    return `<div class="view">
      ${live.length ? `<p class="section-title">Live now</p><div class="match-list">${live.map((e) => eventMini(e.id)).join("")}</div>` : ""}
      <p class="section-title">Your upcoming days</p>
      <div class="match-list">${up.length ? up.map((e) => eventMini(e.id)).join("") : '<p class="muted pad">Nothing booked — head to Discover to find a day out.</p>'}</div>
    </div>`;
  }

  // ===================================================================
  //  COURSES + MAP
  // ===================================================================
  const playersAtCourse = (c) => data.golfers.filter((g) => g.club.includes(c.match));
  const societiesAtCourse = (c) =>
    data.societies.filter((s) => s.members.some((id) => golfer(id).club.includes(c.match)));
  const daysAtCourse = (c) => data.events.filter((e) => (e.venue || "").includes(c.match));

  const MAP_SVG = `<svg class="map-svg" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="100" height="80" fill="#cfe0e9"/>
    <path d="M0,33 C12,27 20,14 38,9 C58,3 80,7 100,3 L100,80 L0,80 Z" fill="#e7eed7"/>
    <path d="M0,33 C12,27 20,14 38,9 C58,3 80,7 100,3" fill="none" stroke="#b9cdc9" stroke-width=".5"/>
    <path d="M20,80 C22,64 18,52 26,44 C31,39 33,34 33,30" fill="none" stroke="#cfe0e9" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M33,30 C36,34 40,37 47,40" fill="none" stroke="#cfe0e9" stroke-width="2.4" stroke-linecap="round"/>
    <g fill="none" stroke="#d8e0c4" stroke-width=".5" opacity=".7">
      <path d="M44,20 C58,24 70,30 86,34"/><path d="M40,32 C56,38 70,46 88,50"/><path d="M52,60 C64,64 74,68 90,70"/>
    </g>
  </svg>`;

  function coursePin(c) {
    return `<button class="pin" style="left:${c.x}%;top:${c.y}%" data-act="focus-course" data-id="${c.id}" title="${c.name}">
      <span class="pin-dot" style="background:${solid(c.colour)}"></span>
      <span class="pin-label">${c.name.replace(/ Golf Club| Golf$/, "")}</span>
    </button>`;
  }

  function courseCard(c) {
    const players = playersAtCourse(c);
    const socs = societiesAtCourse(c);
    const days = daysAtCourse(c);
    const firsts = players.slice(0, 2).map((p) => p.name.split(" ")[0]).join(", ");
    return `<div class="card course-card" id="course-${c.id}" data-act="focus-course" data-id="${c.id}">
      <div class="cc-head">
        <span class="cc-marker" style="background:${solid(c.colour)}">${mono(c.name)}</span>
        <div class="cc-id">
          <div class="cc-name">${c.name}</div>
          <div class="cc-meta">${c.town} · ${c.holes} holes · par ${c.par} · est. ${c.est}</div>
        </div>
        <span class="cc-type">${c.type}</span>
      </div>
      <p class="cc-blurb">${c.blurb}</p>
      <div class="chips">${c.facilities.map((f) => `<span class="chip">${f}</span>`).join("")}</div>
      <div class="cc-stats">
        <div><b>${players.length}</b><span>play here</span></div>
        <div><b>${socs.length}</b><span>societ${socs.length === 1 ? "y" : "ies"}</span></div>
        <div><b>${days.length}</b><span>day${days.length === 1 ? "" : "s"} on</span></div>
      </div>
      ${players.length
        ? `<div class="cc-players">${avatarStack(players.map((p) => p.id), 8, 28)}<span class="muted">${firsts}${players.length > 2 ? ` +${players.length - 2} more play here` : " play here"}</span></div>`
        : `<div class="cc-players"><span class="muted">No one from your network plays here yet — be the first.</span></div>`}
      <div class="cc-actions">
        <button class="btn primary sm" data-act="organise-here" data-id="${c.id}">Organise a day here</button>
        ${days.length ? `<button class="btn outline sm" data-nav="event" data-id="${days[0].id}">See the day on</button>` : ""}
      </div>
    </div>`;
  }

  function viewCourses() {
    const cards = data.courses.map((c) => courseCard(c)).join("");
    return `<div class="view">
      <div class="card disc-hero">
        <h2>Find a course to play</h2>
        <p>Browse the clubs near you, see who already plays where, and start a Ryder Cup day at any of them. Tap a marker to jump to a club.</p>
      </div>
      <div id="coursemap" class="coursemap card"></div>
      <p class="section-title">Clubs near you · ${data.courses.length}</p>
      <div class="course-list">${cards}</div>
    </div>`;
  }

  // ---- real (Leaflet/OSM) map with illustrated fallback ----
  let leafletMap = null, courseMarkers = {};
  function renderFallbackMap(el) {
    if (leafletMap) { try { leafletMap.remove(); } catch (e) {} leafletMap = null; }
    el.className = "coursemap card is-illustrated";
    el.innerHTML = `${MAP_SVG}<div class="map-pins">${data.courses.map(coursePin).join("")}</div><span class="map-badge">North Devon</span>`;
  }
  function coursePopup(c) {
    const players = playersAtCourse(c).length;
    return `<div class="cmpop">
      <div class="cmpop-type">${c.type} · ${c.holes} holes · par ${c.par}</div>
      <div class="cmpop-name">${c.name}</div>
      <div class="cmpop-meta">${c.town} · ${players} of your network play here</div>
      <button class="btn primary xs" data-act="organise-here" data-id="${c.id}">Organise a day here</button>
    </div>`;
  }
  function initCourseMap() {
    const el = document.getElementById("coursemap");
    if (!el) return;
    if (!window.L) { renderFallbackMap(el); return; }
    if (leafletMap) { try { leafletMap.remove(); } catch (e) {} leafletMap = null; }
    courseMarkers = {};
    el.innerHTML = "";
    const map = L.map(el, { scrollWheelZoom: false });
    leafletMap = map;
    map.fitBounds(data.courses.map((c) => [c.lat, c.lng]), { padding: [38, 38] });
    let loaded = 0;
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: "&copy; OpenStreetMap",
    });
    tiles.on("tileload", () => { loaded++; });
    tiles.addTo(map);
    data.courses.forEach((c) => {
      const icon = L.divIcon({ className: "leaf-pin-wrap", html: `<span class="leaf-pin" style="background:${solid(c.colour)}"></span>`, iconSize: [20, 20], iconAnchor: [10, 10] });
      const mk = L.marker([c.lat, c.lng], { icon }).addTo(map);
      mk.bindPopup(coursePopup(c), { className: "course-popup", closeButton: false });
      mk.on("click", () => focusCourse(c.id, { fromMap: true }));
      courseMarkers[c.id] = mk;
    });
    setTimeout(() => map.invalidateSize(), 60);
    // if no tiles arrive (offline / blocked network), drop back to the illustrated map
    setTimeout(() => { if (loaded === 0 && leafletMap === map) renderFallbackMap(el); }, 2600);
  }
  function focusCourse(id, opts = {}) {
    document.querySelectorAll(".course-card").forEach((el) => el.classList.toggle("selected", el.id === "course-" + id));
    const card = document.getElementById("course-" + id);
    if (card && !opts.fromCard) card.scrollIntoView({ behavior: "smooth", block: "center" });
    const c = course(id);
    if (leafletMap && courseMarkers[id] && !opts.fromMap) {
      leafletMap.panTo([c.lat, c.lng]);
      courseMarkers[id].openPopup();
    }
  }

  // ===================================================================
  //  CAPTAIN'S DRAFT — pairing & match-up logic (the "Ryder Cup" engine)
  // ===================================================================
  let draftSeed = 1;
  const byHcp = (a, b) => golfer(a).hcp - golfer(b).hcp;
  const attendeesOf = (e) => [...new Set([...(e.attendees || []), ...(ui.going.has(e.id) ? [ME] : [])])];

  function rng(seed) { let s = (seed * 2654435761) % 2147483647 || 7; return () => (s = (s * 48271) % 2147483647) / 2147483647; }
  function teeTime(baseMin, i) { const t = baseMin + i * 10; return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; }
  // a society day is played over ONE day: a morning round then afternoon singles
  function dayBlocks(total) {
    if (total <= 1) return [{ name: "Afternoon", base: 13 * 60 + 30 }];
    if (total === 2) return [{ name: "Morning", base: 8 * 60 }, { name: "Afternoon", base: 13 * 60 + 30 }];
    return [{ name: "Morning", base: 8 * 60 }, { name: "Midday", base: 11 * 60 + 30 }, { name: "Afternoon", base: 14 * 60 }];
  }

  // balanced two-team split: snake draft by handicap, lightly varied by seed
  function snakeDraft(ids, rnd) {
    const s = [...ids].sort(byHcp);
    // only swap adjacent players of similar ability, so teams stay balanced but vary on reshuffle
    for (let i = 0; i < s.length - 1; i++)
      if (rnd() < 0.5 && Math.abs(golfer(s[i]).hcp - golfer(s[i + 1]).hcp) <= 2) { const t = s[i]; s[i] = s[i + 1]; s[i + 1] = t; }
    const blue = [], red = [], pat = [0, 1, 1, 0];
    s.forEach((id, i) => (pat[i % 4] === 0 ? blue : red).push(id));
    return { blue, red };
  }
  // pair players within a team: "anchor" = strongest+weakest, "adjacent" = similar ability
  function pairTeam(ids, strategy) {
    const s = [...ids].sort(byHcp), pairs = [];
    if (strategy === "anchor") { let i = 0, j = s.length - 1; while (i < j) { pairs.push([s[i], s[j]]); i++; j--; } }
    else { for (let i = 0; i + 1 < s.length; i += 2) pairs.push([s[i], s[i + 1]]); }
    const reserve = s.length % 2 ? [s[(s.length - 1) / 2 | 0]] : [];
    // a clean reserve for odd teams = the middle player
    return { pairs, reserve: s.length % 2 ? [s[s.length - 1]] : [] };
  }
  const pairRating = (ids, format) => {
    const h = ids.map((id) => golfer(id).hcp);
    if (ids.length === 1) return h[0];
    return format === "Foursomes" ? 0.5 * (h[0] + h[1]) : Math.min(...h); // fourball ≈ low ball
  };
  function matchStrokes(blueIds, redIds, format) {
    const allow = format === "Fourball" ? 0.9 : 1; // foursomes rating already halved
    const bR = pairRating(blueIds, format), rR = pairRating(redIds, format);
    const diff = Math.round(Math.abs(bR - rR) * allow);
    return { diff, recv: bR > rR ? "blue" : rR > bR ? "red" : null };
  }

  function buildMatchSheet(playerIds, formats, seed) {
    const rnd = rng(seed);
    const { blue, red } = snakeDraft(playerIds, rnd);
    const capOf = (t) => golfer([...t].sort(byHcp)[0]).name;
    const teams = {
      blue: { id: "blue", name: "Team Azure", colour: "blue", captain: capOf(blue) },
      red:  { id: "red",  name: "Team Crimson", colour: "red", captain: capOf(red) },
    };
    // one day: pairs rounds in the morning, singles in the afternoon
    const ordered = [...formats.filter((f) => f !== "Singles"), ...formats.filter((f) => f === "Singles")];
    const blocks = dayBlocks(ordered.length);
    const sessions = [];
    ordered.forEach((f, si) => {
      const blk = blocks[si] || blocks[blocks.length - 1];
      if (f === "Singles") {
        const bs = [...blue].sort(byHcp), rs = [...red].sort(byHcp), n = Math.min(bs.length, rs.length), matches = [];
        for (let i = 0; i < n; i++) matches.push({ blue: [bs[i]], red: [rs[i]], status: "soon", winner: null, tee: teeTime(blk.base, i), strokes: matchStrokes([bs[i]], [rs[i]], "Singles") });
        const reserve = [...bs.slice(n), ...rs.slice(n)];
        sessions.push({ id: "g" + si, name: `${blk.name} Singles`, format: "Singles match play", blurb: "Everyone out — one point each.", matches, reserve });
      } else {
        const fmt = f === "Foursomes" ? "Foursomes" : "Fourball";
        const label = f === "Foursomes" ? "Foursomes (alternate shot)" : "Fourball (better ball)";
        const strat = f === "Foursomes" ? "adjacent" : "anchor";
        const bp = pairTeam(blue, strat), rp = pairTeam(red, strat);
        const bSorted = bp.pairs.sort((a, b) => pairRating(a, fmt) - pairRating(b, fmt));
        const rSorted = rp.pairs.sort((a, b) => pairRating(a, fmt) - pairRating(b, fmt));
        const n = Math.min(bSorted.length, rSorted.length), matches = [];
        for (let i = 0; i < n; i++) matches.push({ blue: bSorted[i], red: rSorted[i], status: "soon", winner: null, tee: teeTime(blk.base, i), strokes: matchStrokes(bSorted[i], rSorted[i], fmt) });
        sessions.push({ id: "g" + si, name: `${blk.name} ${f}`, format: label, blurb: f === "Foursomes" ? "One ball per pair, alternate shots." : "Pairs, better ball.", matches, reserve: [...bp.reserve, ...rp.reserve] });
      }
    });
    const sumB = blue.reduce((n, id) => n + golfer(id).hcp, 0);
    const sumR = red.reduce((n, id) => n + golfer(id).hcp, 0);
    const avgB = blue.length ? sumB / blue.length : 0;
    const avgR = red.length ? sumR / red.length : 0;
    return { teams, sessions, blue, red, sumB, sumR, avgB, avgR };
  }

  function balanceLabel(diff) {
    if (diff <= 1) return { txt: "Dead even", pct: 97 };
    if (diff <= 2.5) return { txt: "Well balanced", pct: 84 };
    if (diff <= 4) return { txt: "Competitive", pct: 66 };
    return { txt: "A bit lopsided — reshuffle?", pct: 44 };
  }
  function draftPlayer(id) {
    const g = golfer(id);
    return `<span class="dp"><span class="dp-name">${g.name}</span><span class="dp-h">${g.hcp}</span></span>`;
  }
  function draftMatch(m) {
    const s = m.strokes;
    const note = !s || !s.recv ? "Off scratch" : `${s.recv === "blue" ? "Azure" : "Crimson"} +${s.diff}`;
    return `<div class="dmatch">
      <div class="dm-side ${s && s.recv === "blue" ? "rec" : ""}">${m.blue.map(draftPlayer).join("")}</div>
      <div class="dm-mid"><span class="dm-tee">${m.tee}</span><span class="dm-strokes">${note}</span></div>
      <div class="dm-side right ${s && s.recv === "red" ? "rec" : ""}">${m.red.map(draftPlayer).join("")}</div>
    </div>`;
  }
  function viewDraft() {
    const e = event(route.id);
    const players = attendeesOf(e);
    const formats = e.formats && e.formats.length ? e.formats : ["Fourballs", "Foursomes", "Singles"];
    const sheet = buildMatchSheet(players, formats, draftSeed);
    const bal = balanceLabel(Math.abs(sheet.avgB - sheet.avgR));
    const roster = (ids, cls) => [...ids].sort(byHcp).map((id) =>
      `<li>${av(id, 30)}<span class="dr-name">${golfer(id).name}</span><span class="dr-h">hcp ${golfer(id).hcp}</span></li>`).join("");

    const sessions = sheet.sessions.map((s) => `<section class="dsession">
      <div class="dsession-head"><h3>${s.name}</h3><span class="fmt">${s.format}</span></div>
      <div class="dmatch-list">${s.matches.map(draftMatch).join("")}</div>
      ${s.reserve && s.reserve.length ? `<div class="dreserve">Sitting out: ${s.reserve.map((id) => golfer(id).name).join(", ")}</div>` : ""}
    </section>`).join("");

    return `<div class="view">
      <div class="draft-top">
        <div>
          <p class="crumb" data-nav="event" data-id="${e.id}">← ${e.title}</p>
          <h2 class="draft-h">Captain's draft</h2>
          <p class="muted">${players.length} players, two handicap-balanced teams, one day — a morning round then afternoon singles. Paired up for a fair, competitive match, just like the real thing.</p>
        </div>
        <div class="draft-actions">
          <button class="btn outline" data-act="reshuffle">↻ Reshuffle</button>
          <button class="btn primary" data-act="lock-sheet" data-id="${e.id}">Lock in &amp; open scoreboard</button>
        </div>
      </div>

      <div class="draft-teams">
        <div class="card dteam blue"><div class="dteam-head"><span class="team-chip blue"></span><b>${sheet.teams.blue.name}</b><span class="dteam-sum">avg ${sheet.avgB.toFixed(1)} · c. ${sheet.teams.blue.captain.split(" ")[0]}</span></div><ul class="droster">${roster(sheet.blue)}</ul></div>
        <div class="card dteam red"><div class="dteam-head"><span class="team-chip red"></span><b>${sheet.teams.red.name}</b><span class="dteam-sum">avg ${sheet.avgR.toFixed(1)} · c. ${sheet.teams.red.captain.split(" ")[0]}</span></div><ul class="droster">${roster(sheet.red)}</ul></div>
      </div>

      <div class="card balance"><div class="bal-row"><span class="bal-label">Match balance</span><span class="bal-val">${bal.txt}</span></div>
        <div class="bal-track"><span style="width:${bal.pct}%"></span></div>
        <div class="bal-note">Average handicap — Azure ${sheet.avgB.toFixed(1)} · Crimson ${sheet.avgR.toFixed(1)}. In each match the lower-handicap side gives shots to the higher one, so every game stays close.</div>
      </div>

      ${sessions}
    </div>`;
  }
  function lockSheet(eid) {
    const e = event(eid);
    const players = attendeesOf(e);
    const formats = e.formats && e.formats.length ? e.formats : ["Fourballs", "Foursomes", "Singles"];
    const sheet = buildMatchSheet(players, formats, draftSeed);
    e.teams = sheet.teams; e.sessions = sheet.sessions; e.status = "live"; e.when = "Live now";
    ui.sheets[eid] = { teams: sheet.teams, sessions: sheet.sessions };
    persist();
    nav("event", eid);
    toast("Match sheet locked in — let battle commence.");
  }

  // ===================================================================
  //  ROUTER + RENDER
  // ===================================================================
  const VIEWS = {
    feed: viewFeed, discover: viewDiscover, events: viewEvents, courses: viewCourses,
    profile: viewProfile, society: viewSociety, event: viewEvent, draft: viewDraft,
  };
  function navTab() {
    return { feed: "feed", discover: "discover", events: "events", courses: "courses", profile: "feed", society: "feed", event: "feed", draft: "events" }[route.view];
  }
  function render() {
    document.querySelector("#main").innerHTML = (VIEWS[route.view] || viewFeed)();
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.nav === navTab()));
    const m = me();
    const a = document.querySelector("#meAvatar");
    a.style.background = grad(m.colour); a.textContent = initials(m.name);
    document.querySelector("#footMeta").textContent = `Signed in as ${m.name} · @${m.handle}`;
    window.scrollTo({ top: 0 });
    if (route.view === "courses") initCourseMap();
  }
  function nav(view, id, tab) { route = { view, id: id || null, tab: tab || null }; render(); }

  // ---- delegated events -------------------------------------------
  document.addEventListener("click", (ev) => {
    const navEl = ev.target.closest("[data-nav]");
    const actEl = ev.target.closest("[data-act]");

    if (actEl) {
      const act = actEl.dataset.act;
      if (act === "join") {
        const id = actEl.dataset.id;
        if (society(id).members.includes(ME)) return; // already a core member
        ui.joined.has(id) ? ui.joined.delete(id) : ui.joined.add(id);
        persist(); render(); return;
      }
      if (act === "rsvp") {
        const id = actEl.dataset.id;
        if (event(id).attendees.includes(ME)) return;
        ui.going.has(id) ? ui.going.delete(id) : ui.going.add(id);
        persist(); render(); return;
      }
      if (act === "react") {
        const p = actEl.dataset.post, e = actEl.dataset.emoji;
        ui.react[p] = ui.react[p] === e ? null : e;
        persist(); render(); return;
      }
      if (act === "cycle") {
        cycleResult(+actEl.dataset.mi); return;
      }
      if (act === "follow") {
        const id = actEl.dataset.id;
        ui.follows.has(id) ? ui.follows.delete(id) : ui.follows.add(id);
        persist(); render(); return;
      }
      if (act === "message") { toast(`Direct messages are coming soon — you'll be able to chat with ${golfer(actEl.dataset.id).name} to sort a game.`); return; }
      if (act === "organise-here") { openModal("newday", { venue: course(actEl.dataset.id).name }); return; }
      if (act === "focus-course") { focusCourse(actEl.dataset.id, { fromCard: true }); return; }
      if (act === "build-sheet") { nav("draft", actEl.dataset.id); return; }
      if (act === "reshuffle") { draftSeed = (draftSeed + 1) % 9973; render(); return; }
      if (act === "lock-sheet") { lockSheet(actEl.dataset.id); return; }
      if (act === "compose") { openModal("compose"); return; }
      if (act === "modal-close" || act === "modal-cancel") { closeModal(); return; }
      if (act === "create-day") { createDay(); return; }
      if (act === "create-post") { createPost(); return; }
      if (act === "fmt-toggle") { actEl.classList.toggle("on"); return; }
      if (act === "tint-pick") {
        document.querySelectorAll("[data-act='tint-pick']").forEach((b) => b.classList.remove("on"));
        actEl.classList.add("on"); return;
      }
    }

    if (navEl) {
      ev.preventDefault();
      nav(navEl.dataset.nav, navEl.dataset.id, navEl.dataset.tab);
    }
  });

  // submit a comment with Enter
  document.addEventListener("keydown", (ev) => {
    const input = ev.target.closest("[data-comment]");
    if (input && ev.key === "Enter") {
      ev.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const pid = input.dataset.comment;
      (ui.comments[pid] = ui.comments[pid] || []).push({ by: ME, text, time: now() });
      persist(); render();
    }
  });

  document.querySelector("#newDay").addEventListener("click", () => openModal("newday"));

  // ---- on-the-day result editing for the live event ---------------
  function liveEventMatches() {
    const e = event(route.id);
    const out = [];
    e.sessions.forEach((s) => s.matches.forEach((m) => out.push(m)));
    return out;
  }
  function cycleResult(idx) {
    const m = liveEventMatches()[idx];
    const order = [
      { status: "final", winner: "blue", margin: "2 & 1" },
      { status: "final", winner: "red", margin: "2 & 1" },
      { status: "final", winner: "halved", margin: "AS" },
      { status: "soon", winner: null, tee: "—" },
    ];
    const cur = order.findIndex((o) => o.status === m.status && o.winner === m.winner);
    Object.assign(m, { thru: undefined, state: undefined }, order[(cur + 1) % order.length]);
    render();
  }

  // ===================================================================
  //  MODALS — compose a post & build a new day out
  // ===================================================================
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.hidden = true;
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);

  function closeModal() { overlay.hidden = true; overlay.innerHTML = ""; }
  function openModal(type, opts = {}) {
    overlay.innerHTML = type === "compose" ? composeModal() : newDayModal(opts.venue);
    overlay.hidden = false;
    const first = overlay.querySelector("input, textarea, select");
    if (first) first.focus();
  }

  function composeModal() {
    const tints = ["green", "blue", "amber", "violet", "teal"];
    return `<div class="modal">
      <div class="modal-head">
        <div class="composer-id">${av(ME, 40)}<div><b>${me().name}</b><div class="muted" style="font-size:12.5px">Posting to your feed</div></div></div>
        <button class="icon-btn" data-act="modal-close" aria-label="Close">✕</button>
      </div>
      <textarea id="postText" class="post-input" rows="4" placeholder="Share a result, a photo from the day, or rally a fourball…"></textarea>
      <div class="tint-row">
        <span class="muted" style="font-size:12.5px">Add a photo vibe:</span>
        ${tints.map((t, i) => `<button class="tint ${i === 0 ? "on" : ""}" data-act="tint-pick" data-tint="${t}" style="background:${grad(t)}" title="${t}"></button>`).join("")}
        <button class="tint none" data-act="tint-pick" data-tint="" title="No photo">∅</button>
      </div>
      <div class="modal-foot">
        <button class="btn ghost" data-act="modal-cancel">Cancel</button>
        <button class="btn primary" data-act="create-post">Post</button>
      </div>
    </div>`;
  }

  function newDayModal(venue) {
    const mySocs = data.societies.filter((s) => isMember(s.id));
    const fmts = ["Fourballs", "Foursomes", "Singles"];
    const venueVal = venue || "Saunton GC — East";
    return `<div class="modal wide">
      <div class="modal-head">
        <div><h3 style="margin:0">Organise a day out</h3><div class="muted" style="font-size:13px">Set it up and your society gets the invite in their feed.</div></div>
        <button class="icon-btn" data-act="modal-close" aria-label="Close">✕</button>
      </div>
      <div class="form-grid">
        <label class="fld span2"><span>Event name</span><input id="ndTitle" type="text" placeholder="e.g. The Heathland Cup" value="The Autumn Clash" /></label>
        <label class="fld"><span>Course / venue</span><input id="ndVenue" type="text" placeholder="Which course?" value="${venueVal}" /></label>
        <label class="fld"><span>Date</span><input id="ndDate" type="text" placeholder="e.g. Sat 12 Sept 2026" value="Sat 26 Sept 2026" /></label>
        <label class="fld"><span>Host society</span><select id="ndSoc">${mySocs.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}</select></label>
        <label class="fld"><span>Total spots</span><input id="ndCap" type="number" min="2" value="12" /></label>
        <div class="fld span2"><span>The day's format <em>· one day — a morning round, then afternoon singles</em></span>
          <div class="fmt-grid">${fmts.map((f) => `<button type="button" class="fmt-pill ${f === "Foursomes" ? "" : "on"}" data-act="fmt-toggle" data-fmt="${f}">${f === "Singles" ? "Afternoon Singles" : "Morning " + f}</button>`).join("")}</div>
        </div>
        <label class="fld span2"><span>A note for your players</span><input id="ndNote" type="text" placeholder="Cost, format, plans for after…" value="Two-team matchplay then food in the clubhouse. All welcome!" /></label>
      </div>
      <div class="modal-foot">
        <button class="btn ghost" data-act="modal-cancel">Cancel</button>
        <button class="btn primary" data-act="create-day">Create day &amp; post invite</button>
      </div>
    </div>`;
  }

  function createPost() {
    const text = (document.querySelector("#postText").value || "").trim();
    const tintBtn = overlay.querySelector("[data-act='tint-pick'].on");
    const tint = tintBtn ? tintBtn.dataset.tint : "";
    if (!text && !tint) { closeModal(); return; }
    const post = tint
      ? { id: "u" + Date.now(), type: "photo", authorGolfer: ME, time: now(), tint, caption: "On the course", text: text || "A cracking day out ⛳", reactions: {}, comments: [] }
      : { id: "u" + Date.now(), type: "text", authorGolfer: ME, time: now(), text, reactions: {}, comments: [] };
    ui.posts.unshift(post);
    data.feed.unshift(post);
    persist(); closeModal(); nav("feed");
    toast("Posted to your feed.");
  }

  function createDay() {
    const v = (id) => document.querySelector(id).value.trim();
    const title = v("#ndTitle") || "New day out";
    const venue = v("#ndVenue") || "TBC";
    const date = v("#ndDate") || "Date TBC";
    const socId = document.querySelector("#ndSoc").value;
    const cap = Math.max(2, parseInt(document.querySelector("#ndCap").value, 10) || 12);
    const formats = [...overlay.querySelectorAll(".fmt-pill.on")].map((b) => b.dataset.fmt);
    const eid = "u" + Date.now();

    data.events.push({
      id: eid, title, societyId: socId, venue, date, when: "upcoming", status: "upcoming",
      capacity: cap, attendees: [ME], formats: formats.length ? formats : ["Singles"],
      note: v("#ndNote"),
    });
    ui.events.push(data.events[data.events.length - 1]);

    const post = {
      id: "p" + eid, type: "event", authorSociety: socId, eventId: eid, time: now(),
      text: `New day out just dropped — ${title} at ${venue} on ${date}. ${cap} spots up for grabs, who's in? ⛳`,
      reactions: {}, comments: [],
    };
    ui.posts.unshift(post);
    data.feed.unshift(post);
    persist(); closeModal(); nav("event", eid);
    toast("Your day out is live — invite posted to the feed.");
  }

  // ---- lightweight toast -----------------------------------------
  let toastTimer;
  function toast(msg) {
    let el = document.querySelector("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  // close modal on Escape
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) closeModal(); });

  render();
})();
