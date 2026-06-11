/* ------------------------------------------------------------------
   Ryder — front-end app
   A small dependency-free SPA: state -> render -> events.
------------------------------------------------------------------ */
(function () {
  "use strict";

  const STORE_KEY = "ryder.state.v1";

  // ---- state -------------------------------------------------------
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; }
  })();
  const state = saved || structuredClone(window.RYDER_SEED);
  state.view = "scoreboard";

  function persist() {
    const { view, ...rest } = state;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(rest)); } catch {}
  }

  // ---- helpers -----------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const playerById = (id) => state.players.find((p) => p.id === id);
  const initials = (name) =>
    name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const fmtPts = (n) => (n % 1 === 0 ? String(n) : Math.floor(n) + "½").replace(/^0½/, "½");

  function pointsFor(team) {
    let pts = 0;
    state.sessions.forEach((s) =>
      s.matches.forEach((m) => {
        if (m.winner === team) pts += 1;
        else if (m.winner === "halved") pts += 0.5;
      })
    );
    return pts;
  }
  function totalMatches() {
    return state.sessions.reduce((n, s) => n + s.matches.length, 0);
  }
  function sessionPoints(s) {
    let b = 0, r = 0;
    s.matches.forEach((m) => {
      if (m.winner === "blue") b += 1;
      else if (m.winner === "red") r += 1;
      else if (m.winner === "halved") { b += 0.5; r += 0.5; }
    });
    return { b, r };
  }
  const countBy = (status) =>
    state.sessions.reduce(
      (n, s) => n + s.matches.filter((m) => m.status === status).length, 0);

  // ---- player / pairing markup ------------------------------------
  function playerRow(id, colour) {
    const p = playerById(id);
    return `<div class="player">
      <span class="avatar ${colour}">${initials(p.name)}</span>
      <span>
        <span class="pname">${p.name}${p.captain ? " ©" : ""}</span><br/>
        <span class="ph">hcp ${p.hcp}</span>
      </span>
    </div>`;
  }
  function pairCell(ids, colour, side, isWinner) {
    return `<div class="pair ${side} ${isWinner ? "win" : ""}">
      ${ids.map((id) => playerRow(id, colour)).join("")}
    </div>`;
  }
  function midCell(m) {
    if (m.status === "final") {
      const cls = m.winner === "blue" ? "blue" : m.winner === "red" ? "red" : "halved";
      return `<div class="mid">
        <span class="badge final">Final</span>
        <span class="res ${cls}">${m.margin}</span>
      </div>`;
    }
    if (m.status === "live") {
      return `<div class="mid">
        <span class="badge live">Live</span>
        <span class="res halved">${m.state || ""}</span>
        <span class="thru">thru ${m.thru}</span>
      </div>`;
    }
    return `<div class="mid">
      <span class="badge soon">Tee</span>
      <span class="thru">${m.tee || "TBC"}</span>
    </div>`;
  }
  function matchCard(m) {
    return `<div class="match">
      ${pairCell(m.blue, "blue", "left", m.winner === "blue")}
      ${midCell(m)}
      ${pairCell(m.red, "red", "right", m.winner === "red")}
    </div>`;
  }

  // ---- views -------------------------------------------------------
  function viewScoreboard() {
    const b = pointsFor("blue"), r = pointsFor("red");
    const total = totalMatches();
    const target = total / 2 + 0.5;
    const blueW = (b / total) * 100, redW = (r / total) * 100;
    const targetPct = (target / total) * 100;
    const { blue, red } = state.teams;

    const sessions = state.sessions.map((s) => {
      const sp = sessionPoints(s);
      return `<section class="session">
        <div class="session-head">
          <h3>${s.name}</h3>
          <span class="fmt">${s.format}</span>
          <span class="pts"><span class="b">${fmtPts(sp.b)}</span> – <span class="r">${fmtPts(sp.r)}</span></span>
        </div>
        <div class="match-list">${s.matches.map(matchCard).join("")}</div>
      </section>`;
    }).join("");

    return `<div class="view">
      <section class="hero">
        <div class="event-meta">
          <b>${state.event.name}</b><span class="sep">•</span>
          ${state.event.venue}<span class="sep">•</span>
          ${state.event.date}
        </div>
        <div class="score-row">
          <div class="team-side left">
            <span class="team-name"><span class="team-chip blue"></span>${blue.name}</span>
            <span class="team-captain">Captain · ${blue.captain}</span>
            <span class="team-score">${fmtPts(b)}</span>
          </div>
          <div class="score-mid">
            <div class="vs">VS</div>
            <div class="target"><b>${fmtPts(target)}</b><br/>to lift the cup</div>
          </div>
          <div class="team-side right">
            <span class="team-name"><span class="team-chip red"></span>${red.name}</span>
            <span class="team-captain">Captain · ${red.captain}</span>
            <span class="team-score">${fmtPts(r)}</span>
          </div>
        </div>
        <div class="progress">
          <div class="progress-track">
            <span class="target-line" style="left:${targetPct}%"></span>
            <span class="target-flag" style="left:${targetPct}%">⛳ ${fmtPts(target)}</span>
            <span class="fill fill-blue" style="width:${blueW}%"></span>
            <span class="fill fill-red" style="width:${redW}%"></span>
          </div>
          <div class="progress-legend">
            <span>${blue.name} — ${fmtPts(b)} pts</span>
            <span>${red.name} — ${fmtPts(r)} pts</span>
          </div>
        </div>
      </section>

      <div class="statgrid">
        <div class="card stat"><div class="k">Matches played</div><div class="v">${countBy("final")}<small> / ${total}</small></div></div>
        <div class="card stat"><div class="k">Out on course</div><div class="v">${countBy("live")}<small> live</small></div></div>
        <div class="card stat"><div class="k">Still to tee</div><div class="v">${countBy("soon")}<small> matches</small></div></div>
        <div class="card stat"><div class="k">Points to win</div><div class="v">${fmtPts(Math.max(0, target - Math.max(b, r)))}<small> needed</small></div></div>
      </div>

      ${sessions}
    </div>`;
  }

  function viewMatches() {
    const blocks = state.sessions.map((s) => {
      const sp = sessionPoints(s);
      return `<section class="session">
        <div class="session-head">
          <h3>${s.name}</h3>
          <span class="fmt">${s.format} · ${s.blurb}</span>
          <span class="pts"><span class="b">${fmtPts(sp.b)}</span> – <span class="r">${fmtPts(sp.r)}</span></span>
        </div>
        <div class="match-list">${s.matches.map(matchCard).join("")}</div>
      </section>`;
    }).join("");
    return `<div class="view">
      <p class="section-title">Match schedule</p>
      <p class="muted" style="margin:-6px 2px 0;max-width:60ch">Tap any result to update it on the day — the scoreboard and the cup race recalculate instantly.</p>
      ${blocks}
    </div>`;
  }

  function viewTeams() {
    const card = (teamId) => {
      const t = state.teams[teamId];
      const roster = state.players.filter((p) => p.team === teamId);
      const pts = pointsFor(teamId);
      const avg = (roster.reduce((n, p) => n + p.hcp, 0) / roster.length).toFixed(1);
      const rows = roster
        .sort((a, b) => a.hcp - b.hcp)
        .map((p, i) => `<li>
          <span class="num">${i + 1}</span>
          <span class="rname">${p.name}</span>
          ${p.captain ? '<span class="tag">Captain</span>' : ""}
          <span class="hcp">hcp <b>${p.hcp}</b></span>
        </li>`).join("");
      return `<div class="card team-card ${t.colour}">
        <div class="th">
          <div>
            <h3>${t.name}</h3>
            <div class="cap">Captain · ${t.captain} · avg hcp ${avg}</div>
          </div>
          <div class="pts">${fmtPts(pts)}</div>
        </div>
        <ul class="roster">${rows}</ul>
      </div>`;
    };
    return `<div class="view">
      <p class="section-title">The line-ups · ${state.players.length} golfers</p>
      <div class="teams-grid">${card("blue")}${card("red")}</div>
    </div>`;
  }

  function viewCreate() {
    return `<div class="view create-wrap">
      <form class="card form-card" id="createForm" onsubmit="return false">
        <h2>Start a new day out</h2>
        <p class="lead">Set the scene, pick your formats, and Ryder builds the match sheet and live scoreboard for you.</p>

        <div class="field">
          <label>Event name</label>
          <input type="text" value="The Heathland Cup" />
        </div>
        <div class="field-row">
          <div class="field"><label>Course</label><input type="text" value="Saunton — East" /></div>
          <div class="field"><label>Date</label><input type="text" value="13 June 2026" /></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Team A</label><input type="text" value="Team Azure" /></div>
          <div class="field"><label>Team B</label><input type="text" value="Team Crimson" /></div>
        </div>
        <div class="field"><label>Players per team</label>
          <select><option>4</option><option>5</option><option selected>6</option><option>8</option><option>12</option></select>
        </div>

        <label style="display:block;font-size:12.5px;font-weight:700;color:var(--ink-soft);margin:6px 0 8px">Sessions</label>
        <div class="fmt-options">
          <label class="fmt-opt"><input type="checkbox" checked />
            <span><span class="ft">Fourballs</span><br/><span class="fd">Pairs, better ball — a great opener.</span></span></label>
          <label class="fmt-opt"><input type="checkbox" checked />
            <span><span class="ft">Foursomes</span><br/><span class="fd">Alternate shot — the test of a partnership.</span></span></label>
          <label class="fmt-opt"><input type="checkbox" checked />
            <span><span class="ft">Singles</span><br/><span class="fd">Everyone out, one point each — the decider.</span></span></label>
        </div>

        <div style="margin-top:18px"><button class="btn primary" type="button" onclick="alert('In the full app this creates the event, generates pairings and invites the players.')">Create event &amp; generate match sheet</button></div>
      </form>

      <aside class="card preview-card">
        <h3>Your weekend at a glance</h3>
        <ul class="timeline">
          <li><div class="tl-t">Friday · Fourballs</div><div class="tl-d">3 matches · 3 points up for grabs</div></li>
          <li><div class="tl-t">Saturday · Foursomes</div><div class="tl-d">3 matches · 3 points up for grabs</div></li>
          <li><div class="tl-t">Sunday · Singles</div><div class="tl-d">6 matches · 6 points up for grabs</div></li>
          <li><div class="tl-t">12 total points · 6½ to win</div><div class="tl-d">Holders retain on a tie</div></li>
        </ul>
      </aside>
    </div>`;
  }

  // ---- render ------------------------------------------------------
  const VIEWS = {
    scoreboard: viewScoreboard,
    matches: viewMatches,
    teams: viewTeams,
    create: viewCreate,
  };

  function render() {
    $("#main").innerHTML = VIEWS[state.view]();
    document.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("is-active", t.dataset.view === state.view));
    $("#eventPillText").textContent =
      state.event.status === "live" ? "Live now" : state.event.name;
    $("#footMeta").textContent = `${state.event.society} · ${state.event.date}`;
    bindMatchEditing();
  }

  // ---- on-the-day result editing ----------------------------------
  // Cycle a match result by clicking it: blue win -> red win -> halved -> open
  function bindMatchEditing() {
    if (state.view !== "matches") return;
    const cards = document.querySelectorAll(".match .mid");
    cards.forEach((mid, idx) => {
      mid.style.cursor = "pointer";
      mid.title = "Click to set the result";
      mid.addEventListener("click", () => cycleResult(idx));
    });
  }
  function flatMatches() {
    const out = [];
    state.sessions.forEach((s) => s.matches.forEach((m) => out.push(m)));
    return out;
  }
  function cycleResult(idx) {
    const m = flatMatches()[idx];
    const order = [
      { status: "final", winner: "blue", margin: "2 & 1" },
      { status: "final", winner: "red", margin: "2 & 1" },
      { status: "final", winner: "halved", margin: "AS" },
      { status: "soon", winner: null, tee: "—" },
    ];
    const cur = order.findIndex(
      (o) => o.status === m.status && o.winner === m.winner);
    const next = order[(cur + 1) % order.length];
    Object.assign(m, { thru: undefined, state: undefined, tee: m.tee }, next);
    persist();
    render();
  }

  // ---- nav ---------------------------------------------------------
  $("#tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    state.view = btn.dataset.view;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  render();
})();
