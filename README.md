# Vaishali & Sumit

Wedding site — React (Vite) front end with Node serverless API routes, ready to deploy on Vercel.

## Run locally

```bash
npm install
npm run dev
```

The front end runs on `http://localhost:5173` and talks to the live Supabase project, so the
wishing wall and playlist work in development exactly as they do in production. Anything you post
locally is real data on the shared wall.

## Deploy

### 1. Push to GitHub

The repo is initialised with one commit and nothing secret in it. Create an empty repo on GitHub,
then:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

### 2. Import into Vercel

On vercel.com choose **Add New -> Project** and pick the repo. Vercel reads `vercel.json` and
needs no manual build settings (framework Vite, build `npm run build`, output `dist`).

**Before the first deploy**, add the two variables from `.env.example` under
**Settings -> Environment Variables**, for Production, Preview and Development:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

They are baked in at build time, so adding them later means redeploying. Without them the site
still loads and the wall just reports "The wall is offline".

### 3. After the domain is live

Open `index.html` and make the two `og:image` / `twitter:image` URLs absolute
(`https://yourdomain/og-image.jpg`). Some link scrapers will not resolve a relative image, and
this link mostly travels by WhatsApp.

## Backend (Supabase)

Project **sumo-x-vaish** (`rprmzxlwrrhqjcdcxcwd`, region `ap-south-1`, free plan). Two tables:
`wishes` and `songs`.

The browser talks to Supabase **directly** -- there are no serverless functions. Guests are never
asked to sign in, so row level security is what protects the data:

- **select** and **insert** are open to anyone.
- There is **no update or delete policy**, so a guest cannot edit or remove entries. PostgREST
  answers such a request `204` with zero rows affected rather than an error. The couple moderates
  from the Supabase dashboard, which bypasses RLS.
- Length and not-blank rules are **database CHECK constraints**, not just `maxlength` attributes,
  so they hold even if someone calls the REST API directly.

Both tables are in the `supabase_realtime` publication, so a wish pinned on one guest's phone
appears on every open wall without a reload.

Still worth knowing: **there is no rate limiting**. Anyone with the link can insert as fast as they
like. For a wedding site shared with invited guests that is usually fine, but if the link spreads
further, add a Postgres rate limit or put Cloudflare Turnstile in front of the insert.

### Removing an entry

Each browser keeps a random token in `localStorage`; only its SHA-256 is stored on the row. A
cross appears on entries that browser posted, and removal goes through the `delete_wish` /
`delete_song` functions, which re-check the hash.

There is still **no DELETE policy** on either table. An open one would let any visitor wipe the
wall, so the functions are the only route and they refuse without the matching token (verified:
wrong token and short token both return false and leave the row).

Two consequences worth knowing:

- Clearing site data, or switching browser or device, loses the token -- and with it the ability
  to remove an earlier entry. The couple can still delete anything from the dashboard.
- Wishes posted **before** this was added have no owner, so no cross shows on them at all.
- Supabase's linter flags these two functions as "SECURITY DEFINER callable by anon". That is
  deliberate: `SECURITY DEFINER` is what lets them delete without an open policy, and the token
  check inside is the guard. Switching them to `SECURITY INVOKER`, as the linter suggests, would
  simply stop deletion working.

### Music

The envelope click starts `src/assets/background-music.mp3` and a Pause/Play pill appears top
right. The filename is generic so swapping the track needs no code change.
Browsers only allow audio after a user gesture, which is why playback starts on the envelope
click. The intro is only shown once a session, so on a reload there is no gesture and the browser
refuses. When that happens the player arms a one-shot listener and starts on the guest's next tap,
click or key press, so it still feels automatic rather than leaving a Play button they must find.

An explicit Pause is different: it is remembered in `localStorage` and honoured, and it also
cancels any pending auto-start. If the music seems not to start at all, that preference is the
first thing to check -- clear `sumoxvaish:music-off`.

The track is a 1m05s loop at 320kbps stereo (2.5MB). It is only fetched when playback starts
(`preload="none"`) and streams progressively, so it begins well before the whole file arrives.
Re-encoding to ~128kbps would cut it to roughly 1MB with no audible difference at background
volume, which is worth doing if guests on mobile data are a concern.

### Environment variables

Copy `.env.example` to `.env.local` for local work, and set the same two in the Vercel project
under **Settings -> Environment Variables**:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Both are safe in client code -- the publishable key is meant to ship to browsers, and RLS is what
guards the tables. Never put the **service role** key in this project; it bypasses RLS entirely.

If the variables are missing the site still renders and the wall reports "The wall is offline"
rather than crashing.

### Moderating

Open the project's Table Editor in the Supabase dashboard to edit or delete any row. Deletes there
are permanent.

## Layout

```
index.html              page shell, share meta, Google Fonts
vercel.json             static SPA rewrite
public/                 served at the site root, copied verbatim
  favicon.ico           "V&S" initials -- the illustration is unreadable at 32px
  apple-touch-icon.png
  og-image.jpg          1200x630 WhatsApp / social card
src/
  App.jsx               section order, intro gate
  styles.css            all styling (theme tokens at the top)
  intro.css             the envelope intro
  supabase.js           client + config guard
  useReveal.js          scroll-in animation
  data/events.js        event list + countdown target
  assets/               photos and monogram, imported as modules
  components/           Intro, Hero, Story, Proposal, Events,
                        WishingWall, Playlist, Footer, Reveal, SectionHead
supabase/migrations/    the schema, in the order it was applied
assets-source/          print-resolution masters -- gitignored, not built
docs/                   the original single-file version, for reference
```

Anything in `src/assets` is imported as a module so Vite fingerprints it; anything in `public/`
is served at a fixed path, which is why the favicon and share card live there.

## The envelope intro

A floating wax-sealed envelope covers the page on arrival. Click or press Enter and the seal
breaks, the flap swings open, the card rises out and expands into the site.

It is built from flat panels hinged with `rotateX` inside one `preserve-3d` space -- real paper
folds the same way -- rather than a WebGL scene. Text stays vector-crisp at any resolution, it
animates on the compositor, and there is no WebGL fallback to worry about.

- Timing lives in the `BEATS` map at the top of `src/components/Intro.jsx`.
- Depth order is held by `translateZ`, not `z-index`: back `0px` < card `1px` < front `20px` <
  flap `21px` < seal `26px`. Changing one means checking the others.
- It shows **once per browser session**, so a guest re-reading the page is not made to reopen it.
  Add `?intro` to the URL to force it. To show it on every load, drop the `sessionStorage` check in
  `shouldShowIntro()` in `src/App.jsx`.
- `prefers-reduced-motion` skips straight to the site, and there is a Skip button either way.

## Theme

The palette lives in the `:root` block at the top of `src/styles.css`. Two accents do all the
work -- `--lavender` and `--champagne` -- and the surface and type tokens are derived around them.

Notes for anyone changing it:

- **Champagne is a pale gold, so it fails contrast as small text on white.** That is why there are
  two tokens: `--champagne` for hairlines, pins and ornament, and `--champagne-ink` (a darkened
  version) wherever it appears as type. Do not swap one for the other.
- Surfaces go light to lighter: `--bg` (lavender mist) < `--panel` < `--paper` (white). Depth is a
  soft lavender-tinted shadow plus the 1px `--line` hairline, never a grey shadow.
- `--ink-faint` is the small uppercase caption colour and is the tightest contrast in the set, at
  4.94:1 against `--panel`, the surface where it does worst. Lightening it is the easiest way to
  fail accessibility here.
- The lavender button carries **white** type, not the page ground.
- The envelope has its own champagne paper tones (`--env-paper`, `--env-shade`) in `src/intro.css`,
  and a lavender wax seal; the panels need to separate from each other and from the page behind.
- `index.html` carries a `theme-color` meta and paints the background before the stylesheet loads,
  so there is no flash of the wrong colour on first paint.
- `public/og-image.jpg` and the icons are pre-rendered **files**, not CSS -- a retheme means
  regenerating them too, or the WhatsApp card will still show the old colours.

### Editing content

- **Events and countdown** — `src/data/events.js`.
- **Photos** — replace `src/assets/1.jpeg`–`3.jpeg`. They are imported as modules so Vite fingerprints them; never reference them by a relative path from the page.
- **Hero photo** — `src/assets/hero-couple-{210,420}.{webp,jpg}`, shown by `Hero.jsx`. The frame
  is 3:4 to match the photograph; a square would crop the sky and grass. Re-export both widths
  from the master in `assets-source/` to change it.
- **Monogram** — no longer on the page, but still used for `public/favicon.ico`,
  `apple-touch-icon.png` and `og-image.jpg`, which are pre-rendered files. The web sizes stay in
  `src/assets` unused, in case it comes back.

`docs/original-single-file.html` is the original single-file version, kept for reference. It is not part of the build.
