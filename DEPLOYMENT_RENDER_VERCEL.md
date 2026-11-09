# Deploying SkillBridge to Render (Backend) and Vercel (Frontend)

This guide provides the exact step-by-step instructions to deploy SkillBridge using:
- **Backend (FastAPI):** [Render.com](https://render.com) (Free Web Service)
- **Frontend (Next.js 16):** [Vercel.com](https://vercel.com) (Free Next.js Hosting)

---

## Architecture in Production

```
┌─────────────────────────────────┐
│       Vercel (Frontend)         │
│   Next.js 16 + React 19 + TS    │
│  https://skillbridge.vercel.app │
└────────────────┬────────────────┘
                 │ HTTPS (REST API)
                 ▼
┌─────────────────────────────────┐
│        Render (Backend)         │
│         FastAPI + Uvicorn       │
│  https://...onrender.com        │
└─────────────────────────────────┘
```

---

## Part 1: Deploy Backend to Render

### Step 1: Create a Render Account
1. Go to [render.com](https://render.com) and sign in with your GitHub account.

### Step 2: Create a New Web Service
1. Click the **"New +"** button in the top right and select **"Web Service"**.
2. Select **"Build and deploy from a Git repository"** and choose your repository: `Skill-Bridge`.
3. Configure the service settings:
   - **Name:** `skillbridge-backend` (or any name you prefer)
   - **Region:** Choose the region closest to you (e.g., *Singapore* or *Frankfurt*)
   - **Branch:** `main`
   - **Root Directory:** `backend` *(⚠️ Critical: don't leave empty)*
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`

### Step 3: Add Environment Variables in Render
Scroll down to the **Environment Variables** section and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `APP_ENV` | `production` | Enables production mode |
| `SECRET_KEY` | *(Generate a 32+ character random string)* | E.g. run `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | 24-hour token validity |
| `DATABASE_URL` | `sqlite+aiosqlite:///./skillbridge.db` | Auto-creates and auto-seeds SQLite on startup |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Backend automatically allows all `*.vercel.app` domains |

> **Note on Database:**  
> When the service starts for the first time, SkillBridge automatically runs tables creation and seeds canonical skills, demo accounts, and projects.

### Step 4: Deploy and Copy Backend URL
1. Click **"Deploy Web Service"**.
2. Wait 2-3 minutes for the build and deployment logs to finish.
3. Once live, Render displays your service URL at the top (e.g., `https://skillbridge-backend.onrender.com`).
4. Test it by opening `https://<your-render-url>/api/health` in your browser. You should see:
   ```json
   {"status":"healthy","service":"SkillBridge API","version":"1.0.0"}
   ```
5. **Copy this URL** — you will need it for Vercel in Part 2.

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create a Vercel Account
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.

### Step 2: Import Git Repository
1. On your Vercel Dashboard, click **"Add New..."** → **"Project"**.
2. Locate and click **"Import"** next to `Skill-Bridge`.

### Step 3: Configure Project Settings
- **Project Name:** `skillbridge` (or custom name)
- **Framework Preset:** `Next.js` *(auto-detected)*
- **Root Directory:** `./` *(leave default root)*
- **Build and Output Settings:** Leave default (`npm run build`)

### Step 4: Add Environment Variables
Under the **Environment Variables** section, add:

| Name | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://<your-render-backend-url>.onrender.com` |

*(⚠️ Make sure there is NO trailing slash at the end of the URL)*

### Step 5: Deploy
1. Click **"Deploy"**.
2. Vercel will build the Next.js project and deploy it globally across the Edge network in ~1 minute.
3. Click the preview thumbnail to open your live application (e.g. `https://skillbridge.vercel.app`)!

---

## Part 3: Verification & Live Testing

1. Open your live Vercel URL in your browser.
2. Go to `/login` and sign in:
   - **Email:** `freakkyash67@gmail.com`
   - **Password:** `password123` *(or `SkillBridge2026!`)*
   - Or demo student: `aarav.sharma@apex.edu` / `password123`
3. Verify that the Dashboard loads your profile, skills, projects, and applications.
4. Test creating a new project or registering a new student account at `/signup`.

---

## Troubleshooting Tips

- **Render Cold Starts:** The free tier on Render spins down after 15 minutes of inactivity. When you open the website after inactivity, the first API request may take ~30-50 seconds while Render wakes up the service.
- **CORS Issues:** If you use a custom domain on Vercel (e.g., `https://mycollegename.org`), add it to the `CORS_ORIGINS` variable in your Render dashboard:
  ```json
  ["http://localhost:3000","https://mycollegename.org"]
  ```
  *(All `https://*.vercel.app` domains are automatically allowed by default)*

