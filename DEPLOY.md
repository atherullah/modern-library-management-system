# Deploying to Render (free) + MongoDB Atlas (free)

This repo is wired for a **zero-cost** deploy: Render hosts the app (free web
service), MongoDB Atlas hosts the database (free M0 cluster). Neither requires a
credit card. The app is configured by `render.yaml` (a Render *Blueprint*) — you
just sign up and paste **one** secret (the database URL); everything else is
auto-generated or optional.

> Free-tier notes: the app **sleeps after ~15 min idle** (first request after
> that takes ~50s to wake). Uploaded images (book covers / avatars) live on an
> **ephemeral disk** and are wiped on each redeploy — fine for a demo. Both are
> fixable later (paid disk, or Cloudinary) but cost nothing to ignore for now.

---

## Step 1 — Create the database (MongoDB Atlas, ~5 min)

1. Go to <https://www.mongodb.com/cloud/atlas/register> and sign up (Google login is fine).
2. Create a **free M0** cluster (pick the region nearest you, e.g. Singapore/Mumbai). Defaults are fine.
3. **Database Access** → *Add New Database User* → username + password (save these). Role: *Read and write to any database*.
4. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`). Render's IPs aren't fixed on the free tier, so this is required.
5. **Clusters → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/library-management-system?retryWrites=true&w=majority
   ```
   Replace `<user>`/`<password>` with the ones from step 3, and make sure
   `/library-management-system` is in the path (the DB name) before the `?`.

## Step 2 — Deploy the app (Render, ~3 min)

1. Go to <https://dashboard.render.com> and sign up **with GitHub** (one click).
2. **New + → Blueprint**.
3. Pick the repo **`atherullah/modern-library-management-system`** (authorize Render to read it if asked).
4. Render reads `render.yaml` and shows the service + a prompt for secrets.
   - **`DB_URL`** → paste the Atlas connection string from Step 1. *(required)*
   - `JWT_PRIVATE_KEY` → leave it; Render auto-generates it.
   - Everything else (`EMAIL_*`, `GROQ_API_KEY`, `GOOGLE_*`, `APP_URL`) → leave blank for now. *(optional — see Step 4)*
5. Click **Apply**. Render builds the Dockerfile and deploys. First build ~3–5 min.
6. When it's live you'll get a URL like `https://library-management-system.onrender.com`. Open it. 🎉

## Step 3 — Seed the database (optional, for demo data)

The app starts with an empty catalog. To load demo books/users, open the
service in Render → **Shell** tab and run:
```
node seed.js
```
(or `node seed-demo.js` for the richer demo dataset).

## Step 4 — Enable optional features later (any time)

Add these in Render → your service → **Environment**, then redeploy. The app
runs fine without them — each just unlocks a feature:

| Feature | Env vars | Where to get them (all free) |
|---|---|---|
| Email (verification, password reset, reminders) | `EMAIL_HOST=smtp-relay.brevo.com`, `EMAIL_PORT=587`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | [Brevo](https://www.brevo.com) → SMTP & API (300 emails/day) |
| AI chatbot | `GROQ_API_KEY` | <https://console.groq.com> |
| "Sign in with Google" | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com) → OAuth credentials. Set the redirect URI to `https://YOUR-APP.onrender.com/auth/google/callback` |

`APP_URL` is **not** needed — the app auto-detects its public URL from Render's
`RENDER_EXTERNAL_URL`. Only set `APP_URL` if you attach a custom domain.
