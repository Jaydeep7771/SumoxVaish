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

```bash
npx vercel
```

Vercel picks up `vercel.json`: Vite builds to `dist/` and everything is served as a static SPA.
Set the two environment variables above before the first deploy, or the wall will come up offline.

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
index.html           page shell, Google Fonts
src/App.jsx          section order
src/styles.css       all styling (theme tokens at the top)
src/useReveal.js     scroll-in animation
src/intro.css        the envelope intro
src/supabase.js      Supabase client + config guard
src/data/events.js   event list + countdown target
src/assets/          proposal photos
src/components/      Intro, Hero, Story, Proposal, Events, WishingWall, Playlist, Footer
```

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

The palette lives in the `:root` block at the top of `src/styles.css`. Five tokens are the
source of truth -- `--bg`, `--paper`, `--ink`, `--maroon`, `--gold` -- and everything else is
derived from them, so a retheme means editing those five and re-checking contrast.

Notes for anyone changing it:

- Surfaces are layered by **lightness** (`--bg` < `--paper` < `--panel`), not by shadow. On a dark
  ground a drop shadow barely reads, so depth comes from the `--line` hairline instead.
- `--maroon` is a pale blush, so anything sitting **on** it needs dark text. That is why the button
  label is `var(--bg)` rather than white.
- `--ink-faint` is the small uppercase caption colour and is the tightest contrast in the set.
  It is tuned to clear WCAG AA (4.5:1) against `--panel`, the lightest surface -- 4.88:1 today.
  Darkening it is the easiest way to fail accessibility here.
- The envelope has its own paper tones (`--env-paper`, `--env-shade`) in `src/intro.css`, since the
  folded panels need to separate from each other and from the page behind them.
- `index.html` carries a `theme-color` meta and paints the background before the stylesheet loads,
  so there is no white flash on first paint.

### Editing content

- **Events and countdown** — `src/data/events.js`.
- **Photos** — replace `src/assets/1.jpeg`–`3.jpeg`. They are imported as modules so Vite fingerprints them; never reference them by a relative path from the page.
- **Monogram** — `src/assets/monogram-{320,640}.{webp,jpg}`, shown by `Hero.jsx`. The master is
  `Monogram Final.png` (11126px square, ~17MB). It is an opaque illustration on cream paper, not a
  transparent mark, so it is framed as a square plate rather than cropped to a circle -- a circle
  would cut off the plane and the cat. To replace it, re-export the four sizes from the master at
  320px and 640px; WebP is what browsers actually use, the JPEGs are the fallback.
  The master itself is not referenced by the build, so keep it out of git if the repo matters.

`Vaishali & Sumit.html` is the original single-file version, kept for reference. It is not part of the build.
