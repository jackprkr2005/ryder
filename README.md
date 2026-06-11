# ⛳ Ryder

**Bring golfers together to organise Ryder Cup–style days out.**

Ryder takes a group of mates (or a whole society), splits them into two teams
with captains, builds the classic Ryder Cup match schedule, and runs a **live
scoreboard** that tracks the race to lift the cup.

> This is an early, self-contained prototype — a single-page web app with no
> build step and no external dependencies, seeded with a sample event so you
> can see exactly how a day plays out.

## What it does today

- **Live scoreboard** — big team totals, the "magic number" to win, and a
  progress bar racing each side toward the cup.
- **Match schedule** across the three classic formats:
  - **Fourballs** (pairs, better ball)
  - **Foursomes** (pairs, alternate shot)
  - **Singles** (one-on-one)
- **Teams & line-ups** — rosters with captains, playing handicaps and team
  handicap averages.
- **On-the-day scoring** — on the *Matches* tab, click any result to set it;
  the scoreboard and cup race recalculate instantly.
- **New event flow** — a guided form to set the course, teams and formats.
- Everything persists locally in the browser (`localStorage`).

## Run it

No install needed — it's plain HTML/CSS/JS.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

## Project layout

| File | Purpose |
|------|---------|
| `index.html` | App shell + top navigation |
| `styles.css` | Design system and all styling |
| `app.js` | State, rendering and interactions |
| `data.js` | Sample event (a half-played day out) |

## Where it could go next

- Accounts, real invites (WhatsApp / email) and RSVPs
- Automatic, handicap-balanced pairings and a captain's draft
- Hole-by-hole live scoring entered from the course
- Course/handicap database and society history with past results
- A backend + shared real-time scoreboard so everyone watches the same screen

---

*Built as a preview to explore the idea — happy to take it in whatever
direction is most useful.*
