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
  and banter. **React, comment and post** — it's all interactive.
- **Organise a day out** — the **＋ New day** builder: name it, pick the course,
  date, host society, capacity and formats. It creates the event *and* posts
  the invite to your society's feed in one go.
- **Compose** — share a text update or a photo post to your feed.
- **Discover** — find **societies near you**, **open days** you can jump
  straight into, and **players** in your area to **follow**.
- **Courses** — a **real, pan/zoom map** (Leaflet + OpenStreetMap) of golf clubs
  near you, with a club directory: course type, holes/par, who already plays
  there, which societies use it and what days are on — plus one-tap **Organise a
  day here** to start a Ryder Cup day at that club. Built to push people to
  actually meet up and play. *(Falls back to an illustrated map if tiles can't
  load. Swappable for Google/Apple Maps if you add an API key.)*
- **Course booking** — every day has to be **booked with a real club** before
  it's on. Each event runs a booking lifecycle — **Planning → enquiry → date
  held & quoted → confirmed** — with the club's booking contact (coordinator,
  phone, email, society rate, deposit, lead time, catering), a one-tap **email
  the club** (pre-filled enquiry), an auto-calculated quote, and a deposit step
  to confirm. The **match sheet stays locked until the booking is confirmed**,
  so a day gets planned and confirmed before anyone tees off.
- **Captain's draft** — the Ryder Cup pairing engine. From everyone who's in, it
  **auto-builds two handicap-balanced teams** (snake draft), then **pairs players
  and seeds the match-ups** with **shot allocations** so every game stays close.
  It's modelled as a real society day — **played over one day**: a morning round
  (fourballs/foursomes) then **afternoon singles**, with morning and afternoon
  tee times. Reshuffle until you're happy, then **lock it in** to a live,
  playable scoreboard.
- **Society pages** — cover, members, upcoming days out and an **honours board**
  of past winners; one tap to join.
- **Profiles** — handicap, home club, win/loss record, recent form, follower
  counts and the societies a golfer belongs to.
- **Events** — RSVP to a day out, see who's going, and follow the **live Ryder
  Cup scoreboard**:
  - The three classic formats — **Fourballs**, **Foursomes**, **Singles**
  - Big team totals, the "magic number" to win, and a cup race
  - Tap any match result to update it on the day; everything recalculates live
- **My days** — your live and upcoming events in one place.

Everything you do — created days, posts, comments, joins, RSVPs, follows and
reactions — persists locally in the browser (`localStorage`).

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

- A backend so it's genuinely multiplayer — shared events, a real-time
  scoreboard everyone watches together, and accounts/auth
- Real invites & notifications (WhatsApp/email) and direct messages
- Auto-balanced, handicap-fair pairings generated from the team sheets
- Photo uploads (today's "photo" posts use a colour vibe placeholder)
- Hole-by-hole live scoring entered from the course
- Maps & location search for societies and open days near you

---

*Built as a preview to explore the idea — happy to take it in whatever
direction is most useful.*
