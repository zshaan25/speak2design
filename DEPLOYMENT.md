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
   FRONTEND_URL=https://d1khpu1t6zzts5.cloudfront.net
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

## Step 4: Deploy Frontend to AWS S3 & CloudFront

### 1. Build the Vite Frontend
1. Create a `.env` file in the project root:
   ```
   VITE_API_URL=https://speak2design-backend.onrender.com
   VITE_STRIPE_PK=<optional Stripe TEST publishable key>
   ```
2. Build the project:
   ```bash
   npm run build
   ```
   This generates the production-ready assets in the `dist/` directory.

### 2. Configure AWS S3 Bucket
1. Log into your **AWS Console** and navigate to **S3**.
2. Click **Create Bucket**:
   - **Bucket Name:** e.g., `speak2design-frontend`
   - **Region:** Choose your preferred AWS region.
   - Keep **Block all public access** checked (we will access the bucket securely using CloudFront OAC).
3. Once created, keep the bucket ARN handy.

### 3. Configure Amazon CloudFront (CDN, HTTPS & SPA Routing)
1. Go to the **CloudFront** console and click **Create Distribution**.
2. **Origin Settings:**
   - **Origin Domain:** Select your S3 bucket (e.g., `speak2design-frontend.s3.amazonaws.com`).
   - **Origin Access:** Select **Origin access control settings (recommended)**.
   - Click **Create OAC** and select your control settings (keep defaults).
   - Under **S3 bucket policy**, copy the policy statement shown (you will paste this in the S3 bucket permissions next).
3. **Default Cache Behavior:**
   - **Viewer Protocol Policy:** Select **Redirect HTTP to HTTPS**.
   - **Allowed HTTP Methods:** Select `GET, HEAD`.
4. **Settings:**
   - **Default Root Object:** Type `index.html`.
5. Click **Create Distribution**.
6. **Apply S3 Bucket Policy:**
   - Go back to your S3 bucket → **Permissions** tab → **Bucket policy** → Click **Edit**.
   - Paste the policy copied from CloudFront (allows CloudFront to retrieve objects from the bucket).
   - Save changes.
7. **Configure SPA Routing (Custom Error Responses):**
   - In CloudFront, open your newly created distribution.
   - Navigate to the **Error pages** tab.
   - Click **Create custom error response**:
     - **HTTP error code:** `404: Not Found`
     - **Customize error response:** Select **Yes**
     - **Response page path:** `/index.html`
     - **HTTP response code:** `200: OK`
     - Click **Save**.
   - (Optional but recommended) Repeat the same custom error response setup for `403: Forbidden`.

### 4. Deploy Files to S3
1. Install and configure the AWS CLI on your local machine (`aws configure`).
2. Sync the built folder to your S3 bucket:
   ```bash
   aws s3 sync dist/ s3://speak2design-frontend --delete
   ```
3. Invalidate CloudFront cache to serve the latest files immediately:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

---

## Step 5: Verify Deployment

Run these checks:

| Check | URL | Expected |
|-------|-----|----------|
| Backend health | `https://speak2design-backend.onrender.com/health` | `{"status":"active"}` |
| Frontend loads | `https://d1khpu1t6zzts5.cloudfront.net` | Login page visible |
| Register user | POST `/api/auth/register` | 201 with token |
| Voice command | POST `/api/voice/process-text-intent` | Canvas updates |

---

## Evaluation Checklist

- ✅ Live URL accessible via HTTPS (CloudFront provides SSL/TLS automatically)
- ✅ SSL/TLS configured (CloudFront SSL certificate setup)
- ✅ Database on cloud (MongoDB Atlas)
- ✅ Environment variables secured (configured inside S3 build environment and Render backend variables)
- ✅ Git repository with meaningful commits
- ✅ Production-grade infrastructure (AWS S3 + CloudFront for frontend, Render for backend)

---

## Troubleshooting

**Backend not starting:** Check Render logs. Most common cause is missing env variable.

**CORS error on frontend:** The backend `server.js` allows `localhost:5173`. For production, 
update the CORS origin to include your CloudFront URL:
```js
app.use(cors({ 
  origin: [
    'http://localhost:5173',
    'https://d1khpu1t6zzts5.cloudfront.net',  // ← add this
    'https://YOUR-CUSTOM-DOMAIN.com'          // ← if you have one
  ], 
  credentials: true 
}));
```

**Render free tier cold start:** First request after 15 mins may take 30-60 seconds. This is normal.
Show examiner the health endpoint first to wake it up before demo.
