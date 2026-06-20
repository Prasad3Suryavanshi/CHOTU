import { redis } from "../lib/redis.js";

function expiredPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Code expired · CHOTU</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000000;
      color: #EDEDED;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      text-align: center;
      padding: 24px;
    }
    .box {
      max-width: 380px;
      background: #FFFFFF;
      color: #0A0A0A;
      border-radius: 28px;
      padding: 36px 28px;
    }
    h1 { font-size: 1.4rem; margin: 0 0 8px; }
    p { color: #6B6B6B; line-height: 1.5; margin: 0; }
    a {
      display: inline-block;
      margin-top: 20px;
      padding: 11px 22px;
      background: #0A0A0A;
      color: #FFFFFF;
      text-decoration: none;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>Code Expired or Used</h1>
    <p>Codes on CHOTU only last 10 minutes and can only be used once. This one is gone.</p>
    <a href="/">Make a new one</a>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    res.status(404).send(expiredPage());
    return;
  }

  // Force the code from the URL directly to uppercase
  const upperCode = code.trim().toUpperCase();

  const longUrl = await redis.get(upperCode);

  if (!longUrl) {
    res.status(404).send(expiredPage());
    return;
  }

  // --- NEW: BURN AFTER READING ---
  // Instantly delete the code from the database.
  await redis.del(upperCode);
  // -------------------------------

  // Successfully found it! Redirect the browser to the long URL.
  res.writeHead(302, { Location: longUrl });
  res.end();
}