# Deploying SiteForge to Render (Free)

This guide deploys the entire app — React frontend + Node.js backend + templates — as a **single Render web service**. One URL, no credit card required for the free tier.

> **Free tier note:** Render's free web services spin down after 15 minutes of inactivity. The first request after a sleep takes ~30 seconds to wake up. This is fine for testing. For always-on hosting, upgrade to the $7/month Starter plan.

---

## What you need

- A **GitHub account** (free)
- A **Render account** (free — sign up at render.com with GitHub)
- Git installed on your machine

---

## Step 1 — Push the project to GitHub

Open a terminal in the `siteforge/` folder and run:

```bash
git init
git add .
git commit -m "Initial SiteForge deploy"
```

Create a new repository on GitHub:
1. Go to https://github.com/new
2. Name it `siteforge` (or anything you like)
3. Set it to **Public** (free Render tier requires public repos, or upgrade for private)
4. **Do NOT** check "Add README" or any other options
5. Click **Create repository**

Then push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/siteforge.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy on Render

### Option A — Blueprint (automatic, one click)

1. Go to https://dashboard.render.com/new
2. Click **"Blueprint"**
3. Connect your GitHub account if prompted
4. Select your `siteforge` repository
5. Render reads `render.yaml` automatically and creates the service
6. Click **"Apply"**
7. Wait ~3-5 minutes for the build

### Option B — Manual setup

1. Go to https://dashboard.render.com/new
2. Click **"Web Service"**
3. Connect GitHub → select your `siteforge` repo
4. Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | siteforge |
| **Region** | Oregon (US West) |
| **Branch** | main |
| **Runtime** | Node |
| **Build Command** | `cd client && npm install && npm run build && cd ../server && npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

5. Scroll down to **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |

6. Click **"Create Web Service"**

---

## Step 3 — Get your live URL

Once the build completes (watch the build logs), Render gives you a URL like:

```
https://siteforge-xxxx.onrender.com
```

Click it and your app is live! 🎉

---

## Step 4 — Enable AI content generation (optional)

The app works fully without an API key — it uses smart demo content.
To enable real Claude-powered AI:

1. Get a key at https://console.anthropic.com
2. In your Render dashboard → your service → **Environment**
3. Add: `ANTHROPIC_API_KEY` = `sk-ant-...`
4. Click **Save** — Render automatically redeploys

---

## Automatic deploys

Once connected, every `git push` to `main` triggers a new build and deploy automatically. No manual steps needed.

```bash
# Make a change, then:
git add .
git commit -m "Update templates"
git push
# → Render auto-deploys in ~2-3 minutes
```

---

## Troubleshooting

### Build fails
Check the build logs in Render dashboard. Common issues:
- Node version mismatch → the `engines` field in `package.json` specifies `>=18`
- Missing dependency → run `npm run build:prod` locally first to reproduce

### "Cannot GET /" after deploy
The `client/dist/` folder must exist. Make sure `npm run build` ran during the build phase. Check build logs for Vite errors.

### API returns 404
Confirm `NODE_ENV=production` is set in Render environment variables. Without it, the Express server won't serve the frontend.

### App is slow to load (first visit)
This is the free tier cold start. The service wakes up on the first request after 15 minutes of sleep. Subsequent requests are fast. Upgrade to Starter ($7/mo) to eliminate this.

---

## Local development (unchanged)

```bash
npm run install:all
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

---

## Architecture in production

```
Browser → https://siteforge-xxxx.onrender.com
              │
              ▼
         Express (Node.js)
              │
     ┌────────┴────────┐
     │                 │
  /api/*          Everything else
  (API routes)    (serves client/dist/index.html)
     │
  templates/
  (read from filesystem)
```

The React app and the API both live on the same Express process, so there are no CORS issues, no separate frontend deploy, and no environment variables to manage on the client side.
