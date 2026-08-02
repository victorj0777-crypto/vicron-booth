/* Lead intake. Runs as a Vercel serverless function at POST /api/lead, and
   server.js requires this same file so local runs behave identically.

   The form posts here, not straight to the CRM, for three reasons: the webhook
   URL stays out of the page source, the browser never makes a cross-origin
   request that CORS can silently kill, and a failure is something we can
   actually see and report instead of a fire-and-forget that looks fine.

   Set CRM_WEBHOOK_URL in the host's environment (Vercel: Settings ->
   Environment Variables). With it unset the endpoint still accepts the lead
   and reports delivered:false, so nothing 500s while you're wiring it up. */

const FIELDS = ["first", "company", "email", "phone", "industry", "bottleneck", "system", "source"];

function readBody(req) {
  // Vercel usually parses JSON for us; plain Node does not.
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 1e5) { raw = ""; req.destroy(); }   // no reason for a lead to be 100KB
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
  }

  const body = await readBody(req);
  const lead = {};
  FIELDS.forEach((k) => {
    lead[k] = typeof body[k] === "string" ? body[k].trim().slice(0, 300) : "";
  });

  if (!lead.first || !lead.company || !EMAIL.test(lead.email)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ ok: false, error: "Name, company and a valid email are required." }));
  }

  lead.submitted_at = new Date().toISOString();
  lead.source = lead.source || "landing";

  const hook = process.env.CRM_WEBHOOK_URL;
  let delivered = false;
  let note = "CRM_WEBHOOK_URL is not set; lead was accepted but not forwarded.";

  if (hook) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
        signal: ctrl.signal
      });
      clearTimeout(timer);
      delivered = r.ok;
      note = r.ok ? "Forwarded to CRM." : `CRM responded ${r.status}.`;
    } catch (e) {
      note = `CRM request failed: ${e.name === "AbortError" ? "timed out" : e.message}`;
    }
  }

  // Always 200 to the browser when the lead itself is valid. A CRM outage
  // must not cost you the booking -- the calendar still needs to appear.
  // `delivered` is logged so a silent failure is greppable in the host logs.
  console.log(JSON.stringify({ event: "lead", delivered, note, email: lead.email, source: lead.source }));

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, delivered }));
};
