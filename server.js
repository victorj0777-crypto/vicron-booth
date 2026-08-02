/* Static file server for the booth.
   Railway runs a container, not a static CDN, so the site needs a process to
   serve it. Node built-ins only — no dependencies, nothing to install, nothing
   to keep patched.

   Mirrors what vercel.json used to do: immutable caching on /assets, forced
   revalidation on /sw.js so a media swap actually reaches booth devices. */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 8731;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".md":   "text/markdown; charset=utf-8",
  ".txt":  "text/plain; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".ico":  "image/x-icon",
  ".mp3":  "audio/mpeg",
  ".mp4":  "video/mp4"
};

function cacheFor(pathname) {
  // sw.js must revalidate or booth devices never pick up a new cache version
  if (pathname === "/sw.js") return "public, max-age=0, must-revalidate";
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  return "public, max-age=0, must-revalidate";
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Allow": "GET, HEAD" });
    return res.end();
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  } catch {
    res.writeHead(400);
    return res.end("Bad request");
  }
  if (pathname.endsWith("/")) pathname += "index.html";

  // Resolve inside ROOT and verify — blocks ../ traversal out of the folder
  const filePath = path.resolve(ROOT, "." + pathname);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }

    const type = TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const headers = {
      "Content-Type": type,
      "Cache-Control": cacheFor(pathname),
      "Accept-Ranges": "bytes"
    };

    // <video> asks for byte ranges; without this, seeking misbehaves
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        let start = m[1] === "" ? null : parseInt(m[1], 10);
        let end = m[2] === "" ? null : parseInt(m[2], 10);
        if (start === null && end !== null) {          // suffix range: last N bytes
          start = Math.max(0, stat.size - end);
          end = stat.size - 1;
        } else {
          if (start === null) start = 0;
          if (end === null || end >= stat.size) end = stat.size - 1;
        }
        if (start > end || start >= stat.size) {
          res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
          return res.end();
        }
        headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
        headers["Content-Length"] = end - start + 1;
        res.writeHead(206, headers);
        if (req.method === "HEAD") return res.end();
        return fs.createReadStream(filePath, { start, end }).pipe(res);
      }
    }

    headers["Content-Length"] = stat.size;
    res.writeHead(200, headers);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Booth serving ${ROOT} on port ${PORT}`);
});
