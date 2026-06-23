# Shipping Ryder to the iOS App Store

Ryder is a web app. This wraps it as a **native iOS app** with
[Capacitor](https://capacitorjs.com) so you can put it on the App Store. You've
only done web before — that's fine, this is mostly running a few commands and
clicking through Xcode. Follow it top to bottom.

---

## What you need (one-time)

| Thing | Why | Cost |
|---|---|---|
| A **Mac** | Apple only lets you build iOS apps on macOS | — |
| **Xcode** (Mac App Store) | builds and uploads the app | free |
| **CocoaPods** — `sudo gem install cocoapods` | Capacitor iOS uses it | free |
| **Node.js** (nodejs.org) | runs the build commands | free |
| **Apple Developer Program** | required to publish to the App Store | **$99/yr** |

Enrol here: https://developer.apple.com/programs/ — approval can take a day.

---

## Step 1 — get the code and install

```bash
git clone https://github.com/jackprkr2005/ryder.git
cd ryder
npm install
```

## Step 2 — decide: demo or real accounts

- **Demo** (works offline, single device): do nothing — skip to Step 3.
- **Real accounts + shared data**: first deploy the backend (see
  `server/README.md` → Render is one click), then add this line inside the
  `<head>` of `index.html`, using your backend's URL:

  ```html
  <meta name="ryder-api" content="https://your-app.onrender.com">
  ```

  The phone can't reach `localhost`, so a hosted URL is required for the real
  app on a device.

## Step 3 — create the iOS project

```bash
npm run ios:setup   # one-time: installs Capacitor (kept out of the web build)
npm run ios:add      # builds www/ and adds the native iOS project
npm run ios:icons    # generates the app icon + splash from resources/icon.png
```

## Step 4 — open it in Xcode

```bash
npm run ios:open
```

In Xcode:
1. Select the **App** target → **Signing & Capabilities**.
2. Set **Team** to your Apple Developer account (Xcode → Settings → Accounts to
   add it). Xcode fills in signing automatically.
3. The **Bundle Identifier** is `app.ryder.golf` (from `capacitor.config.json`).
   Change it to something you own if you like — it must be unique on the store.
4. Pick a simulator (e.g. iPhone 15) and press **▶ Run** to see it boot.

## Step 5 — submit to the App Store

1. In [App Store Connect](https://appstoreconnect.apple.com) → **Apps → +** →
   create the app, matching the Bundle Identifier from Step 4.
2. In Xcode: top menu **Product → Archive**. When it finishes, **Distribute
   App → App Store Connect → Upload**.
3. Back in App Store Connect, fill in the listing — screenshots, description,
   privacy answers, an App Privacy section, and an icon (auto from the build).
4. **Submit for Review.** Apple usually reviews within 1–3 days.

---

## Important: don't get rejected as "just a website"

Apple's **Guideline 4.2** rejects apps that are only a wrapped website. Ryder
already has real app substance (accounts, realtime, offline demo), but to be
safe add at least one native capability before submitting — the easiest is
**push notifications** for chat and booking updates:

```bash
npm install @capacitor/push-notifications
npm run ios:sync
```

Then enable the **Push Notifications** capability in Xcode and wire a few
notifications (new chat message, booking confirmed, payment received). Ask me
and I'll add the front-end hooks for these.

## Enabling accurate location (course map)

The web Geolocation API is blocked inside iOS's web view, so the native app uses
Capacitor's Geolocation plugin (the web/Base44 version falls back to the browser
automatically). To turn it on for iOS:

```bash
npm i @capacitor/geolocation
npm run ios:sync
```

Then add a usage string so iOS can ask permission — **required**, or the app
crashes when it requests location:

- In Xcode open `App/App/Info.plist` → add key
  **Privacy - Location When In Use Usage Description**
  (`NSLocationWhenInUseUsageDescription`), value e.g.:

  > Ryder uses your location to show golf courses and societies near you.

The "Use my location" button on the Courses tab then centres the map on you,
drops a "you're here" pin, and sorts courses by real distance.

## Updating the app after web changes

Whenever the web app changes, refresh the native build and re-archive:

```bash
git pull
npm run ios:sync
npm run ios:open
```

---

### TL;DR
`npm install` → (optional backend URL) → `npm run ios:add` → `npm run ios:icons`
→ `npm run ios:open` → Run in Xcode → **Archive → Upload** → submit in App Store
Connect. You need a Mac, Xcode, and a $99/yr Apple Developer account.
