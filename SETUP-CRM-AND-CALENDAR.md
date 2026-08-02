# Two links to fill in

Everything is built and tested. It needs two values from your GoHighLevel account, and then
the whole path works end to end: **scan → page → CRM → calendar.**

---

## 1. The CRM webhook

This is where leads land. In GoHighLevel:

**Automation → Workflows → Create Workflow → Start from Scratch → add trigger "Inbound
Webhook".** It gives you a URL that looks like
`https://services.leadconnectorhq.com/hooks/…`. Copy it.

Then in Vercel: **your project → Settings → Environment Variables → Add**

| Name | Value |
|---|---|
| `CRM_WEBHOOK_URL` | the webhook URL you just copied |

Redeploy after adding it (Vercel → Deployments → ⋯ → Redeploy).

**It goes in Vercel, not in the code, on purpose.** The form posts to `/api/lead` on your own
domain, and the server forwards it to GoHighLevel. That keeps the webhook URL out of the page
source where anyone could read it and spam your pipeline, and it means a browser never makes a
cross-origin request that could be silently blocked.

### What GoHighLevel will receive

```json
{
  "first": "Dana",
  "company": "Ruiz Barber Co",
  "email": "dana@ruizbarber.com",
  "phone": "(813) 555-0142",
  "industry": "trades",
  "bottleneck": "reviews",
  "system": "AI Review Engine",
  "source": "handout-qr",
  "submitted_at": "2026-08-02T23:13:21.113Z"
}
```

In the workflow, map `first`, `email`, `phone`, `company` to the contact, and keep
`industry`, `bottleneck`, and `system` as custom fields — that's your segmentation, captured
without anyone typing it. `source` tells you which path they came in on:

- `booth-qr` — scanned the kiosk screen after finishing the audit
- `handout-qr` — scanned the printed checklist
- `landing` — found the page some other way

---

## 2. The calendar

Get your booking link from GoHighLevel (**Calendars → your calendar → Share → copy the
link**), or use Calendly — anything that loads in a browser.

Open `index.html`, find the CONFIG block near the bottom, and set it:

```js
calendarUrl: "https://api.leadconnectorhq.com/widget/booking/YOURID",
```

Leave it as `""` and the page still works — it just says "Victor will be in touch shortly"
instead of showing a calendar. So nothing breaks while you're deciding.

---

## How the two entry points differ

**From the booth QR** (`?src=booth`): the kiosk already took their name, company and email
before the audit, so the page **skips the form entirely** and goes straight to the calendar.
Asking a second time reads as broken and costs you the booking.

**From the handout QR** (no `src`): they never touched the kiosk, so they get the form first,
then the calendar.

Both carry `?i=` and `?b=`, so the page greets them with what they told the coach — the
industry, the bottleneck, and the system to look at first.

Personal details are never put in the URL. Only the two answer codes and the source flag.

---

## Test it before the event

1. Set both values above and redeploy.
2. Open `https://aiemployee.victornegron.com/?i=trades&b=reviews` on your phone — you should see
   the recap, the form, and then the calendar after submitting.
3. Check the contact actually arrived in GoHighLevel.
4. Open `https://aiemployee.victornegron.com/?i=trades&b=reviews&src=booth` — it should skip
   straight to the calendar with no form.
5. Scan the real QR off the booth screen and off the printed handout.

If a lead doesn't show up in GHL, check Vercel's function logs — every submission logs a line
with `"event":"lead"` and a `delivered` true/false, so you can tell instantly whether the
problem is your webhook or the page.

**A CRM outage never blocks a booking.** If the webhook fails, the visitor still gets the
calendar and the failure is logged. Losing a lead silently would be worse than the outage.
