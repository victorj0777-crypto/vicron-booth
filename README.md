# Scaling Systems with AI — booth kit

| File | What it is |
|---|---|
| `index.html` | The kiosk app. Attract → avatar asks who you are → 2 questions → tailored result + QR. |
| `handout.html` | The one-page AI Systems Checklist. Open it and print / save as PDF. |
| `assets/` | The avatar video and the voice lines. |
| `SWAP-IN-TERESA-AND-BRIONY.md` | Step-by-step for dropping in your HeyGen avatar and ElevenLabs voice. |
| `README.md` | This file. |

---

## Run it

```bash
cd ~/Downloads/vicron-booth && python3 -m http.server 8731
```

Open **http://localhost:8731** in Chrome, then `Cmd`+`Ctrl`+`F` for fullscreen.

Serve it over localhost rather than double-clicking the file — `file://` blocks media
autoplay and the microphone. No build step, no npm, no API keys. Once loaded it runs
fully offline: the avatar and every voice line are local files.

---

## Hosting it (GitHub + Vercel)

The repo is private and the site is meant for **your booth device**, not visitor phones —
lead capture is per-device `localStorage`, so a visitor running it on their own phone would
strand their lead in their own browser.

A hosted URL normally means "no internet, no booth." A service worker (`sw.js`) fixes that:
after one successful load on the booth device, everything runs from cache and the venue wifi
can die without the kiosk noticing. Verified by killing the server and reloading — the page,
the avatar video, and every voice line still served.

**One rule:** if you swap the avatar or any voice line, bump `CACHE` in `sw.js`
(`vicron-booth-v1` → `-v2`). Otherwise booth devices keep serving the old media forever.

Deploy steps, once `gh auth login` is done:

```bash
gh repo create vicron-booth --private --source=. --push
```

Then in the Vercel dashboard: **Add New → Project → import `vicron-booth`**. No build settings
needed — it's a static site, and `vercel.json` already sets long cache headers on `/assets`
and forces revalidation on `sw.js`. Every push to `main` redeploys.

Before the event, load the URL once on the booth device and let it sit ten seconds so the
service worker finishes caching. Then put the laptop in airplane mode and confirm it still
runs. If it does, the venue's wifi is no longer your problem.

---

## The flow

1. **Attract** — big headline, one button.
2. **Meet the coach** — the avatar plays her greeting out loud and asks for **first name,
   company, email**. All three required; the email is format-checked.
3. **Question 1** — what kind of business (8 options).
4. **Question 2** — biggest bottleneck (6 options).
5. **Result** — the recommended system, where their money leaks, what to measure, and a QR
   tagged with their answers. She names the system out loud and sends them to you.

Roughly 40 seconds end to end.

**The tradeoff worth knowing:** asking for details before the audit means fewer people finish,
but everyone who starts is captured. That's the right trade for a lead-gen booth — and the
app now writes the lead **the moment they submit the form**, not at the end, so someone who
wanders off mid-audit is still in your list, flagged `didn't finish`.

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

If you'd rather leads post straight into a CRM, that's a change to `captureLead()` — but on
venue wifi, a local-first capture that never drops a lead is the safer default.

---

## Config

One `CONFIG` block at the top of the `<script>` in `index.html`:

| Key | Notes |
|---|---|
| `snapshotUrl` | **Set this before the event.** Drives every QR code. |
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

- [ ] `snapshotUrl` set to a real, tested link
- [ ] Scan every QR with your own phone — result screen and the printed handout
- [ ] Play one full pass at booth volume; confirm she's audible over room noise
- [ ] External speaker if the room is loud — laptop speakers will lose
- [ ] Handout printed (letter, one page, background graphics ON)
- [ ] Do Not Disturb on, sleep disabled, fullscreen, one tab
- [ ] Phone hotspot as backup, power strip, battery pack
- [ ] Export leads at every lull, not just at the end
