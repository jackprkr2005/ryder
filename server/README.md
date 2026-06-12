# Ryder backend

A real multiplayer backend for Ryder — accounts, shared data and live updates —
so bookings, posts, chat and the scoreboard can be shared between actual people
instead of living in one browser.

Built to be dependency-light and easy to run:

- **Express** for the REST API
- **`node:sqlite`** (Node's built-in SQLite — no native module to compile) for
  storage, in `server/ryder.db`
- **`ws`** for WebSocket realtime — any change broadcasts a `refresh` to all
  connected clients
- Auth via bearer tokens; passwords hashed with `crypto.scrypt` (no bcrypt)

## Run it

Requires Node 22+ (for `node:sqlite`).

```bash
cd server
npm install
npm start          # → http://localhost:3000  (serves the app + API + /ws)
```

On first run it seeds the database from `seed.js`.
**Demo login:** handle `jackp`, password `golf` (any seed golfer works).

## API

All `/api/*` writes need `Authorization: Bearer <token>`.

| Method & path | Body | Purpose |
|---|---|---|
| `POST /api/register` | `{name, handle, password, club?, loc?, hcp?}` | Create an account → `{token, user}` |
| `POST /api/login` | `{handle, password}` | Sign in → `{token, user}` |
| `GET  /api/bootstrap` | — | Everything the client needs: `me`, `golfers`, `societies`, `events`, `feed`, `chats` |
| `POST /api/rsvp` | `{eventId}` | Toggle attendance |
| `POST /api/follow` | `{id}` | Toggle following a golfer |
| `POST /api/react` | `{postId, emoji}` | Set/clear your reaction |
| `POST /api/comment` | `{postId, text}` | Comment on a post |
| `POST /api/post` | `{text, tint?}` | Post to the feed |
| `POST /api/chat` | `{eventId, text}` | Message a day's group chat |
| `GET  /api/health` | — | Liveness check |

Realtime: connect a WebSocket to `ws://<host>/ws`; you'll get `{type:"refresh"}`
whenever anyone changes shared state — the client then re-fetches `/api/bootstrap`.

## Schema

`users`, `societies` + `society_members`, `events` + `event_attendees`, `posts`,
`comments`, `reactions`, `follows`, `chats`, `tokens`. (See `db.js`.)

## Status / next step

This is the **foundation**. The front-end in the repo root currently runs
stand-alone on `localStorage` (so it can be hosted as a static site). The next
step is to point it at this API + WebSocket — fetch `/api/bootstrap` on load,
send mutations to the endpoints above, and re-fetch on each `refresh` — with a
graceful fallback to local mode when no backend is present.

Once that's wired, booking enquiries, payments and chat become genuinely
shared and live between real people.
