# CHOTU — a URL shortener that self-destructs in 10 minutes


This is a working starter project. Follow the steps below in order.

## What's already done for you
- `public/` — a split-screen frontend: left side shortens a URL into a 6-character code, right side takes a code and redirects you to the original URL in the same window
- `api/shorten.js` — creates a 6-character code and stores it in Redis with a 10-minute expiry
- `api/resolve.js` — looks up a code and returns its URL as JSON (used by the right-hand panel to redirect client-side)
- `api/[code].js` — a bonus route: visiting `yourdomain.com/CODE` directly also redirects (handy if you ever want to share a clickable link instead of a typed code)
- `lib/redis.js` — the Upstash Redis connection, shared by all three API routes

### How the two panels work
- **Left (Shorten)**: paste a URL → get back a 6-character code, shown inside a countdown ring that visually drains over 10 minutes. "Copy code" copies just the code (e.g. `AB3XQ9`) — that's what you hand to the other person.
- **Right (Redirect)**: the other person pastes that code into this site (any device, any browser) → clicks **GO** → the page calls `/api/resolve`, then navigates the current tab to the original URL.

You do **not** need to write any code to get this running — just connect your own free Upstash + Vercel accounts and deploy.

## Step 1 — Create your free Upstash Redis database
1. Go to https://upstash.com and sign up (no credit card required).
2. Click **Create Database**, give it any name, pick a region close to you.
3. Open the database, find the **REST API** section, and copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## Step 2 — Set up the project locally
```bash
# install dependencies
npm install

# create your local env file
cp .env.local.example .env.local
# now paste your Upstash URL + token into .env.local
```

## Step 3 — Run it locally
```bash
npm install -g vercel
vercel dev
```
Open `http://localhost:3000`, shorten a test URL, then open the short link from a different browser (or your phone) to confirm the redirect works across devices.

## Step 4 — Put it on GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/chotu.git
git push -u origin main
```
(`.env.local` is already in `.gitignore`, so your secret token won't be uploaded.)

## Step 5 — Deploy on Vercel
1. Go to https://vercel.com, sign up with your GitHub account.
2. Click **New Project**, import the repo you just pushed.
3. Before deploying, open **Environment Variables** and add the same two values from Step 1:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Click **Deploy**. You'll get a live URL like `https://chotu-yourname.vercel.app`.

## Step 6 — Test it for real
Shorten a link on your phone, open it on your laptop (or vice versa) — that's the "different computer or browser" requirement working over the live internet, not just localhost.

## Notes
- Every short link is deleted automatically by Redis after 10 minutes — there's nothing to clean up manually.
- Total cost: $0. No credit card was needed anywhere in this setup.
