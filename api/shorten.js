import { redis, TTL_SECONDS } from "../lib/redis.js";

const CODE_LENGTH = 6;
// CHANGED: Removed lowercase letters so it strictly generates uppercase codes
const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function isSafeUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return false;
  // Basic guard against pointing the shortener at itself or local addresses.
  const blocked = ["localhost", "127.0.0.1", "0.0.0.0"];
  if (blocked.includes(parsed.hostname)) return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body || {};

  if (!url || typeof url !== "string" || !isSafeUrl(url)) {
    return res.status(400).json({ error: "Please provide a valid http(s) URL." });
  }

  // Try a few times in the unlikely event of a code collision.
  let code;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCode();
    const exists = await redis.exists(candidate);
    if (!exists) {
      code = candidate;
      break;
    }
  }

  if (!code) {
    return res.status(500).json({ error: "Could not generate a unique code, try again." });
  }

  await redis.set(code, url, { ex: TTL_SECONDS });

  const origin = req.headers.origin || `https://${req.headers.host}`;

  return res.status(200).json({
    code,
    shortUrl: `${origin}/${code}`,
    expiresInSeconds: TTL_SECONDS,
  });
}