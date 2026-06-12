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

## Deploy it

The container serves the **front-end + API + WebSocket from one port**, so a
single web service is all you need.

**Render (one click):** New → Blueprint → pick this repo. `render.yaml` builds
and starts it, with a health check on `/api/health`. The app is then live at the
service URL with real logins. (On the free plan the SQLite disk is ephemeral, so
data reseeds on each deploy — uncomment the `disk:` block in `render.yaml` on a
paid plan to persist it.)

**Docker (Railway / Fly / anywhere):**

```bash
docker build -t ryder .
docker run -p 3000:3000 ryder    # → http://localhost:3000
```

**Pointing the static site at a hosted backend (optional):** the GitHub Pages
build is same-origin, so it stays in demo mode. To make it use a deployed
backend instead, set a base URL before `app.js` loads — either
`<meta name="ryder-api" content="https://your-backend.onrender.com">` in
`index.html`, or `window.RYDER_API_BASE = "https://…"`. CORS is already enabled.

## How the front-end uses it

On load the app probes `/api/health`. If a backend answers it runs in **online
mode**: a login / register screen, then `GET /api/bootstrap`, with every social
action (post, react, comment, follow, RSVP, society join, day chat) POSTed to the
API and re-synced live on each `refresh` from `/ws`. With no backend it falls
back to the stand-alone **demo** (localStorage), so GitHub Pages keeps working.

Shared & live today: accounts, profiles, feed, reactions, comments, follows,
society membership, event RSVPs and day chat. Course booking, the pot/payments
and the captain's match-sheet currently remain per-user client-side overlays —
the next step is backing those with their own tables here.
