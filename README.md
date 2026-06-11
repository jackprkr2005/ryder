# ⛳ Ryder

**The social home for golf societies & clubs — where golfers meet, organise and play.**

Ryder is a social network built around organising **Ryder Cup–style days out**.
Find golfers and societies near you, join up, organise a day, RSVP, then play —
with a live team scoreboard and a feed full of results, photos and banter.

> This is an early, self-contained prototype — a single-page web app with no
> build step and no external dependencies, seeded with sample golfers,
> societies and a half-played event so you can feel how the whole thing works.

## The loop

**Discover → Join → Organise → Meet up & play → Share**

## What it does today

- **Feed** — a social timeline of event invites, final results, course photos
  and banter, with emoji reactions and comments.
- **Discover** — find **societies near you**, **open days** you can jump
  straight into, and **players** in your area to follow.
- **Society pages** — cover, members, upcoming days out and an **honours board**
  of past winners; one tap to join.
- **Profiles** — handicap, home club, win/loss record, recent form and the
  societies a golfer belongs to.
- **Events** — RSVP to a day out, see who's going, and follow the **live Ryder
  Cup scoreboard**:
  - The three classic formats — **Fourballs**, **Foursomes**, **Singles**
  - Big team totals, the "magic number" to win, and a cup race
  - Tap any match result to update it on the day; everything recalculates live
- **My days** — your live and upcoming events in one place.

Joins, RSVPs and reactions persist locally in the browser (`localStorage`).

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
| `index.html` | App shell, top bar, search & navigation |
| `styles.css` | Design system and all styling |
| `app.js` | State, client-side router, views and interactions |
| `data.js` | Sample golfers, societies, events and feed |

## Where it goes next

- Accounts, real invites (WhatsApp/email) and notifications
- A proper composer: post results, upload photos, spin up a day out
- A day-out builder: pick a course, invite the society, auto-balance pairings
- Hole-by-hole live scoring entered from the course
- Maps & location search for societies and open days near you
- A backend with a shared real-time scoreboard everyone watches together

---

*Built as a preview to explore the idea — happy to take it in whatever
direction is most useful.*
