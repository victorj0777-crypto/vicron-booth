# Swapping in Teresa (HeyGen) + Briony (ElevenLabs)

I can't reach HeyGen or ElevenLabs from here — no connector for either, and the media
generator I used rejects both of your IDs (it only accepts its own catalogue, which has no
Teresa and no Briony). Those IDs work in **your** accounts, so you generate the files and drop
them in. The app reads media by filename, so nothing in the code needs touching.

About 10 minutes. Everything currently in `assets/` keeps working until you overwrite it.

- **HeyGen avatar — Teresa:** `52545ef312c94ec7b1d3654affd46a54`
- **ElevenLabs voice — Briony:** `hv8WzBOrsvuSUeIQGOCM`

---

## Step 1 — The avatar video (HeyGen)

If your ElevenLabs account is connected inside HeyGen, pick **Briony** as the voice there and
you get Teresa and Briony in one shot. Otherwise use HeyGen's closest voice — this clip is the
only place the two need to match.

Script — paste exactly:

> Hi — I'm your AI Systems Coach. Drop your first name, your company, and your email, and I'll
> show you the one system your business should automate next.

Export the MP4 and save it as:

```
assets/avatar.mp4
```

**Then set the shape.** HeyGen usually exports 16:9. Open `index.html`, find `avatarAspect` in
the CONFIG block near the top, and set it to match, or she'll be center-cropped:

```js
avatarAspect: "16/9",   // "1/1" square · "16/9" landscape · "9/16" portrait
```

Optional: grab a still frame and save it as `assets/avatar-poster.png` so the frame looks right
before the video starts.

---

## Step 2 — The eight voice lines (ElevenLabs, Briony)

Generate each line with Briony and save it under the exact filename. The `A.I.` spelling is
deliberate — it makes the model say "ay-eye" instead of "aye".

| Save as | Text to paste |
|---|---|
| `assets/q-industry.mp3` | Perfect. Now, what kind of business do you run? |
| `assets/q-bottleneck.mp3` | Got it. And if you had to pick one headache right now, which one is it? |
| `assets/r-leads.mp3` | Based on that, your first A.I. system should probably be an A.I. lead response agent. Victor can map this into a full A.I. Systems Snapshot — go grab him. |
| `assets/r-followup.mp3` | Based on that, your first A.I. system should probably be an A.I. follow-up sequencer. Victor can map this into a full A.I. Systems Snapshot — go grab him. |
| `assets/r-scheduling.mp3` | Based on that, your first A.I. system should probably be an A.I. booking and reminder agent. Victor can map this into a full A.I. Systems Snapshot — go grab him. |
| `assets/r-admin.mp3` | Based on that, your first A.I. system should probably be an A.I. front desk assistant. Victor can map this into a full A.I. Systems Snapshot — go grab him. |
| `assets/r-reviews.mp3` | Based on that, your first A.I. system should probably be an A.I. review engine. Victor can map this into a full A.I. Systems Snapshot — go grab him. |
| `assets/r-retention.mp3` | Based on that, your first A.I. system should probably be an A.I. database reactivation campaign. Victor can map this into a full A.I. Systems Snapshot — go grab him. |

Filenames must match exactly, lowercase. A file that's missing or misnamed isn't fatal — the
browser's built-in voice reads that line instead — but you'll hear the mismatch immediately.

Change the word "Victor" in the script if you want a different name spoken, and update
`coachName` in the CONFIG block so the on-screen text agrees.

---

## Step 3 — Confirm it took

Reload the booth and press **`A`**. The admin panel now ends with a **Media** table listing
every file with a ✅ or ❌ and its size. All nine green means the swap is clean.

Then run one full pass out loud:

- [ ] Teresa speaks the greeting, lips in sync, not cropped weirdly
- [ ] Briony reads both questions
- [ ] Briony reads the result line, and it names the right system
- [ ] The Replay button appears when Teresa finishes

---

## If you'd rather I did more of it

I can't generate these, but I can take the files: put the MP4 and MP3s anywhere and tell me
where, and I'll wire them in, set the aspect ratio, and re-run the whole verification pass —
all 48 result combinations, media loading, QR decoding.
