import { redis } from "../lib/redis.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Force the incoming code from the URL to be strictly uppercase
  const code = (req.query.code || "").toString().trim().toUpperCase();

  if (!code || code.length !== 6) {
    return res.status(400).json({ error: "Enter a valid 6-character code." });
  }

  try {
    // Look up the uppercase code in Upstash
    const longUrl = await redis.get(code);

    if (!longUrl) {
      return res.status(404).json({ error: "That code is invalid, already used, or expired." });
    }

    // --- NEW: BURN AFTER READING ---
    // Instantly delete the code from the database so it can never be used again.
    await redis.del(code);
    // -------------------------------

    return res.status(200).json({ url: longUrl });
  } catch (error) {
    console.error("Redis error:", error);
    return res.status(500).json({ error: "Failed to connect to database" });
  }
}