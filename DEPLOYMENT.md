# Speak2Design — Deployment Guide

## Step 1: Set Up MongoDB Atlas (Free)

1. Go to https://cloud.mongodb.com → Create free account
2. Create a new **Free Cluster** (M0)
3. Under **Database Access** → Add a new user with password
4. Under **Network Access** → Allow All IPs: `0.0.0.0/0`
5. Under **Databases** → Connect → Compass → copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/speak2design
   ```
6. Save this string — you'll need it for Render.

---

## Step 2: Push Code to GitHub

```bash
# In the project root (Speak2Design/)
git init
git add .
git commit -m "feat: initial production-ready Speak2Design implementation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/speak2design.git
git push -u origin main
```

**Important:** Make sure `.gitignore` is in place — `.env` files must NOT be pushed.

---

## Step 3: Deploy Backend to Render (Free)

1. Go to https://render.com → Sign in with GitHub
2. Click **New +** → **Web Service**
3. Connect your GitHub repo → Select `speak2design`
4. Configure:
   - **Name:** `speak2design-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
5. Add **Environment Variables** (under Advanced):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<your Atlas connection string>
   JWT_SECRET=<a long random string, 32+ chars>
   GEMINI_API_KEY=<your real Gemini key>
   FRONTEND_URL=https://speak2design.vercel.app
   STRIPE_SECRET_KEY=<optional Stripe TEST key; omit to use simulated payments>
   ```
6. Click **Create Web Service**
7. Wait for deploy — you'll get a URL like:
   ```
   https://speak2design-backend.onrender.com
   ```
8. Test: Visit `https://speak2design-backend.onrender.com/health`
   Should return: `{"status":"active","system":"Speak2Design Core Engine"}`

---

## Step 4: Deploy Frontend to Vercel (Free)

1. Go to https://vercel.com → Sign in with GitHub
2. Click **Add New** → **Project**
3. Import your `speak2design` repo
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `.` (project root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add **Environment Variable(s)**:
   ```
   VITE_API_URL = https://speak2design-backend.onrender.com
   VITE_STRIPE_PK = <optional Stripe TEST publishable key>
   ```
6. Click **Deploy**
7. You'll get a URL like: `https://speak2design.vercel.app`

---

## Step 5: Verify Deployment

Run these checks:

| Check | URL | Expected |
|-------|-----|----------|
| Backend health | `https://speak2design-backend.onrender.com/health` | `{"status":"active"}` |
| Frontend loads | `https://speak2design.vercel.app` | Login page visible |
| Register user | POST `/api/auth/register` | 201 with token |
| Voice command | POST `/api/voice/process-text-intent` | Canvas updates |

---

## Evaluation Checklist

- ✅ Live URL accessible (Vercel provides HTTPS automatically)
- ✅ SSL/TLS configured (Vercel handles this)
- ✅ Database on cloud (MongoDB Atlas)
- ✅ Environment variables secured (not in code)
- ✅ Git repository with meaningful commits
- ✅ Free tier hosting (Render free + Vercel free)

---

## Troubleshooting

**Backend not starting:** Check Render logs. Most common cause is missing env variable.

**CORS error on frontend:** The backend `server.js` allows `localhost:5173`. For production, 
update the CORS origin to include your Vercel URL:
```js
app.use(cors({ 
  origin: [
    'http://localhost:5173',
    'https://speak2design.vercel.app',  // ← add this
    'https://YOUR-CUSTOM-DOMAIN.com'    // ← if you have one
  ], 
  credentials: true 
}));
```

**Render free tier cold start:** First request after 15 mins may take 30-60 seconds. This is normal.
Show examiner the health endpoint first to wake it up before demo.
