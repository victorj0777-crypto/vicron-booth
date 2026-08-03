# Scaling Systems with AI — booth kit

| File | What it is |
|---|---|
| `index.html` | **Root kiosk page.** Same live AI employee booth experience as `booth.html`, so the custom domain opens the booth. |
| `booth.html` | **Legacy backup URL.** Redirects visitors to `/` so the home page is the single AI agent experience. |
| `snapshot.html` | **Public snapshot landing page.** What prospects see when they scan a QR. Form → CRM → calendar. |
| `handout.html` | The one-page AI Systems Checklist. Open it and print / save as PDF. |
| `api/lead.js` | Receives the landing-page form and forwards it to your CRM. |
| `SETUP-CRM-AND-CALENDAR.md` | **Start here.** The two links you still need to fill in. |
| `assets/` | Legacy avatar media and local voice lines used by the tap-through fallback. |
| `SWAP-IN-TERESA-AND-BRIONY.md` | Step-by-step for dropping in your HeyGen avatar and ElevenLabs voice. |
| `README.md` | This file. |

---

## Run it

```bash
cd ~/Downloads/vicron-booth && npm start
```

Then:
- **http://localhost:8731/** — the root kiosk, matching the custom domain.
- **http://localhost:8731/booth.html** — backup kiosk URL.
- **http://localhost:8731/snapshot.html** — the public snapshot page prospects land on from QR.

Serve it over localhost rather than double-clicking the file — `file://` can block media,
microphone, and embedded widgets. The tap-through fallback has no build step, no npm, and
no API keys. Once loaded it can run from cache; the GHL live voice embed will still need
network access when you add it.

---

## Hosting it (GitHub + Vercel)

The repo is private. Two audiences share one domain:

- **`/` — the root kiosk.** Public custom-domain booth entry. It opens with the glowing orb,
  starts the GHL voice-agent screen, and keeps the tap-through audit as fallback.
- **`/snapshot.html` — the landing page.** Prospects scan a QR and land here. Its form posts
  to `/api/lead`, which forwards to your CRM, then shows your calendar. See
  `SETUP-CRM-AND-CALENDAR.md` for the two links that still need filling in.
- **`/booth.html` — the kiosk.** Runs on *your* device at the booth. Its leads stay in that
  device's `localStorage` and export to CSV, which is deliberate: a local-first capture
  can't be lost to bad venue wifi.

A hosted URL normally means "no internet, no booth." A service worker (`sw.js`) fixes that:
after one successful load on the booth device, everything runs from cache and the venue wifi
can die without the kiosk noticing. Verified by killing the server and reloading — the page,
the avatar video, and every voice line still served.

**One rule:** if you change kiosk HTML/CSS, swap media, or add the voice embed, bump `CACHE`
in `sw.js` (currently `vicron-booth-v9`). Otherwise booth devices can keep serving stale
cached files. The service worker deliberately never caches `/api/`, so the lead endpoint is
always live.

Deploy steps, once `gh auth login` is done:

```bash
gh repo create vicron-booth --private --source=. --push
```

Then in the Vercel dashboard: **Add New → Project → import `vicron-booth`**. No build settings
needed — `vercel.json` marks it as a static site and sets long cache headers on `/assets` plus
forced revalidation on `sw.js`. Every push to `main` redeploys.

**Running it locally** — same server semantics, no Python needed:

```bash
cd ~/Downloads/vicron-booth && npm start
```

`server.js` is a zero-dependency Node static server (correct MIME types, HEAD, byte ranges for
video seeking, no path traversal). Vercel doesn't use it — it serves the files directly — but
it makes local runs one command, and it's what any container host would need. To deploy on
Railway or similar instead, add a `railway.json` with `"startCommand": "npm start"`; the
server is already written for it and reads `PORT` from the environment.

Before the event, load the URL once on the booth device and let it sit ten seconds so the
service worker finishes caching. Then put the laptop in airplane mode and confirm it still
runs. If it does, the venue's wifi is no longer your problem.

---

## The flow

1. **Attract** — the home page centers **Scaling your business with AI** and launches the GHL voice agent.
2. **Live voice** — GHL Voice AI embed slot asks the visitor what business they run and where they feel stuck.
3. **Fallback** — if the room is loud or the embed is not ready, **Room too loud? Tap instead** starts the guided audit.
4. **Question 1** — what kind of business (8 options). No lead form before value.
5. **Question 2** — biggest bottleneck (6 options).
6. **Result** — the recommended system, where their money leaks, what to measure, and a QR
   tagged with their answers. She names the system out loud and sends them to you.
7. **Handoff capture** — after the result, the visitor can leave first name, company, email,
   and optional mobile so Victor can send the AI Systems Snapshot.

Roughly 40 seconds to the recommendation, plus about 20 seconds if they choose to save it.

**The tradeoff worth knowing:** asking for details after the audit means more people will try
the booth because they get value first. The lead is captured only when they ask Victor to send
the snapshot, so the interaction feels like a conversation first and a form second.

---

## The avatar and the voice

She's the "executive assistant" option — young brunette, navy blazer, dark background. The
other three candidates are still in `assets/avatar-options/` if you change your mind; swapping
means re-rendering her greeting video (~23 credits).

**She is pre-rendered, not conversational.** She speaks a fixed greeting with real lip sync;
she does not hear or answer the visitor. For a 15-second booth interaction almost nobody can
tell, and the tradeoff is that she cannot lag, mishear a noisy room, or fail on bad wifi.
Genuinely interactive avatars (HeyGen/D-ID streaming) need a paid API, solid network, and a
live session that can stall in front of a prospect.

The voice is **cloned from your Briony preview clip** (`assets/briony-voice-reference.mp3`),
not Briony herself — see the caveat below. Every line is pre-generated into MP3s rather than
called live, which means zero latency, zero cost per visitor, no API key in the page, and it
keeps working with the wifi down. If a clip goes missing, the browser's built-in voice reads
that line, so the booth never goes silent.

**The voice is an approximation.** The file you sent was ElevenLabs' 8-second voice *preview*,
which speaks their sample text — not your script — so it couldn't be used as the greeting
directly. I used it as a cloning reference instead. It's close, but it is not Briony's actual
engine output. For the real thing, generate the nine lines in your own ElevenLabs account with
voice `hv8WzBOrsvuSUeIQGOCM` and drop them in — `SWAP-IN-TERESA-AND-BRIONY.md` has the exact
script and filenames. Only the greeting requires a re-render, because its audio is baked into
the video.

| Asset | What it says |
|---|---|
| `assets/avatar.mp4` | "Hi — I'm your AI Systems Coach. Drop your first name, your company, and your email, and I'll show you the one system your business should automate next." |
| `assets/q-industry.mp3` | "Perfect. Now, what kind of business do you run?" |
| `assets/q-bottleneck.mp3` | "Got it. And if you had to pick one headache right now, which one is it?" |
| `assets/r-*.mp3` | One per bottleneck: names the system, then sends them to Victor. |
| `assets/briony-voice-reference.mp3` | The preview clip the voice was cloned from. Keep it — it's the source. |
| `assets/_previous/` | The first avatar and voice set, in case you want to compare. Delete when you're sure. |

**Her name is baked into the audio.** The result clips say "Victor" out loud, so changing
`coachName` in the config only changes the on-screen text — the MP3s would need regenerating.

Tapping her portrait replays the greeting, and a **Replay** button appears once she finishes —
useful when someone walks up halfway through.

---

## Leads

Stored **on that device only**, in browser `localStorage`. Nothing is transmitted anywhere.

Press `A` (or triple-tap the top-left corner) → **Export CSV**. Columns: captured_at,
first_name, company, email, industry, bottleneck, recommended_system, finished_audit.

That panel also ends with a **Media** table — every avatar/voice file with a ✅ or ❌ and its
size. Use it to confirm a media swap actually took before the doors open.

**Export before you close the laptop.** Clearing Chrome's site data for `localhost` wipes them.

That's the **kiosk's** capture. Leads from the **landing page** take the other path — straight
into your CRM via `/api/lead`. Two paths on purpose: the kiosk can't depend on the network,
and the landing page has no device to fall back on.

---

## Config

The kiosk's `CONFIG` block sits at the top of the `<script>` in `booth.html`
(the landing page has its own, smaller one in `index.html`):

| Key | Notes |
|---|---|
| `snapshotUrl` | Set to `https://aiemployee.victornegron.com`. Drives every QR code — keep it in sync with the copy in `handout.html`. |
| `tagQrWithAnswers` | Appends `?i=<industry>&b=<bottleneck>` so a scan tells you what they picked. |
| `avatarVideo`, `audio` | Paths to the media. Swap files here to change her or her voice. |
| `avatarAspect` | Shape of the avatar frame — `"1/1"`, `"16/9"`, or `"9/16"`. Match your clip or she gets cropped. |
| `brandName`, `cohost`, `coachName` | Header and copy text. |
| `voice` | Master on/off for the spoken lines. |
| `idleResetSeconds` | Currently 75. |

The five CSS variables at the top (`--accent`, `--accent-2`, `--bg`, `--panel`, `--ink`)
rebrand the whole booth. Content lives in `INDUSTRIES`, `BOTTLENECKS`, `SYSTEMS`, and `LEAKS`
— 8 × 6 = 48 tailored results, all plain text.

**No invented statistics anywhere.** The results name where money leaks and what to measure,
and leave the numbers to you. A real number from a Tampa client will beat any generic stat.

---

## Failure modes

| If this happens | The booth does this |
|---|---|
| Wifi drops | Everything keeps working — all media is local. |
| Autoplay-with-sound blocked | Still frame shows with a Replay button; the flow is unaffected. |
| An MP3 is missing | The browser's own voice reads the line instead. |
| Visitor walks away mid-audit | Resets after 75s. Their contact details are already saved. |
| Laptop restarts | Leads survive — they're in `localStorage`. |

---

## Pre-event checklist

- [ ] **Publish a page at `https://aiemployee.victornegron.com`** — DNS and SSL are live, but it
      returns 404 today, so every QR is a dead end until something is there
- [ ] Scan every QR with your own phone — result screen and the printed handout
- [ ] Play one full pass at booth volume; confirm she's audible over room noise
- [ ] External speaker if the room is loud — laptop speakers will lose
- [ ] Handout printed (letter, one page, background graphics ON)
- [ ] Do Not Disturb on, sleep disabled, fullscreen, one tab
- [ ] Phone hotspot as backup, power strip, battery pack
- [ ] Export leads at every lull, not just at the end
