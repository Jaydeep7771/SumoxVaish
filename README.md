# Sumit & Vaishali

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

The track is `src/assets/background-music.mp3`; the filename is generic so swapping it needs no
code change.

**Playback starts inside the envelope's click handler**, not after the opening animation. That is
deliberate and not a detail to "tidy up": iOS Safari only honours `play()` when it is called in
the call stack of the gesture itself, so starting it from the animation's timer would be refused
there. It is also why the `<audio>` element mounts while the envelope is still closed, and why
`Intro` takes an `onOpen` callback that fires before anything else in `open()`. Measured gap from
click to sound: ~30ms.

There are three ways in, in order:

1. the envelope click, synchronous with the gesture;
2. `autoStart`, for a reload where the intro is skipped (it is shown once a session);
3. if the browser refuses that, a one-shot listener starts it on the guest's next tap or key press.

An explicit Pause outranks all three, is remembered in `localStorage`, and cancels any pending
auto-start. If the music seems not to start at all, check that preference first --
clear `sumoxvaish:music-off`.

The fade-in uses `requestAnimationFrame`, which browsers **pause entirely while the tab is
hidden**. A guest who switches apps during the 1.4s fade would otherwise return to music playing
at volume 0, silently, forever. A `setTimeout` lands the final volume regardless of whether a
single frame ever ran.

The track is a 1m05s loop at 320kbps stereo (2.5MB), `preload="auto"` so it is ready the instant
the envelope is clicked. Re-encoding to ~128kbps would cut it to roughly 1MB with no audible
difference at background volume.

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

## Which side are you from

The arrival sequence is **envelope -> question -> site**:

1. The envelope covers the page. Clicking it starts the music and plays the opening.
2. A full-screen card asks which side the guest is from. The page stays locked behind it.
3. On choosing, the card fades and the site appears, filtered to their celebrations.

Both answers are remembered in `localStorage`, so a returning guest goes **straight to the site** --
no envelope, no question. Someone who leaves at the question and comes back gets the question
again without the envelope, since it has already been seen this session.

Which events belong to which side is the `sides` field on each event in `src/data/events.js`, not
logic in a component. Today only the two Mehendis are side-specific:

| Event | Bride | Groom |
|---|---|---|
| Engagement | yes | yes |
| Groom Mehendi & Jago | -- | yes |
| Bride Mehendi & Dholki | yes | -- |
| Haldi Milan | yes | yes |
| Dawat-e-DJ | yes | yes |
| The Wedding | yes | yes |

Getting those values wrong sends people to the wrong house, so change them deliberately.

Notes on the pieces:

- `SideGate.jsx` is the full-screen question. Its z-index is 90, below the intro's 100, so the
  envelope always sits on top while it is still there.
- `SideNote.jsx` is the quiet "Showing the groom side celebrations. Change" line under the
  festivities -- not the question a second time. **Change** simply clears the saved side, which
  brings the gate back, so switching needs no interface of its own.
- `Events` with no side renders every event. That path is only reachable by clearing storage
  mid-session, but it fails open rather than showing someone an empty schedule.
- The music toggle is hidden while the question is up, then returns with the page. The track keeps
  playing through the transition -- it started on the envelope click.
- Choosing a side pushes a history entry, so the browser **Back** button returns to the question
  rather than leaving the site. A guest who taps the wrong family gets the obvious way back.
- The event grid is two columns, and the side filter changes how many cards there are. An odd
  count would strand the last ordinary card beside an empty cell, so
  `.event:nth-last-child(2):nth-child(odd)` lets it span the full width -- four cards read
  2 / 1 / 1. Check this rule if you add or remove an event.

To see the whole sequence again, clear `sumoxvaish:side` and `sumoxvaish:intro-seen`, or open the
site with `?intro` after clearing the side.

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
  data/events.js        event list, bride/groom sides, countdown target
  assets/               photos and monogram, imported as modules
  components/           Intro, SideGate, SideNote, Hero, Story, Proposal,
                        Events, WishingWall, Playlist, Footer, Reveal, SectionHead
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

The palette lives in the `:root` block at the top of `src/styles.css`. Five values define it:

```
--bg        #F2EEF8   page base, a lavender white
--tint      #E8E2F2   soft tint for bands and panels
--lavender  #7460A6   primary accent
--champagne #C6A85A   secondary, ornament
--ink       #3E3550   text
```

Notes for anyone changing it:

- **Both accents exist in two tones, and they are not interchangeable.** The display values are
  too pale to read as small type, so `--champagne-ink` (#7A5C1B) is used wherever gold is text,
  and `--lavender` is already darkened from the reference #8A76B8 to #7460A6 so that **white body
  text on a filled lavender panel clears AA** (5.29:1 rather than 3.91:1).
- Only pure white passes on the lavender panel. Labels there are `#F4F0FB`, which measures 4.72:1;
  anything softer fails.
- Surfaces go light to lighter: `--bg` < `--tint` < `--paper` (white). Depth is the 1px `--line`
  hairline plus a lavender-tinted shadow, never grey.
- `--ink-faint` is the small uppercase caption colour and the tightest in the set. Lightening it
  is the easiest way to fail accessibility here.
- Every text style is checked against its **computed** background in the browser, not against a
  table. All 20 pass WCAG AA; the tightest are the hero eyebrow and the panel labels, both ~4.6.
- `public/og-image.jpg` and the icons are pre-rendered **files**, not CSS -- a retheme means
  regenerating them too, or the WhatsApp card still shows the old colours.

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
