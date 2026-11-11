# DEPLOYMENT_RENDER_VERCEL.md Reading Summary

## Project Deployment Architecture
- **Backend (FastAPI):** Render.com (Free Web Service)
- **Frontend (Next.js 16):** Vercel.com (Free Next.js Hosting)

## Key Configuration Points

### 1. Backend on Render.com
- Your FastAPI backend is deployed on Render
- Render provides a URL like: `https://skillbridge-api.onrender.com`
- This is where your API runs

### 2. Frontend on Vercel
- Your Next.js frontend is deployed on Vercel
- Vercel automatically provides `NEXT_PUBLIC_API_URL` or you set it

### 3. Critical: Environment Variable Setup
**You MUST set `NEXT_PUBLIC_API_URL` to your Render backend URL**

The `.env` file I created earlier points to `https://skillbridge.azurewebsites.net` (placeholder), but you need it to point to your actual Render backend.

**Required:** Set `NEXT_PUBLIC_API_URL` in one of these places:
- Render dashboard → Service → Environment Variables
- Or create `.env.local` on your local machine
- Or set it in Vercel dashboard → Project → Settings → Environment Variables

**Format:**
```
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
```

### 4. Azure SQL Database
Your backend uses Azure SQL Database (`skillbridge-sql-server.database.windows.net`)
- Ensure user accounts exist in the `Users` table
- The backend auth.py checks for existing emails before signup
- Password hashing uses bcrypt

### 4-Step Checklist to Make It Work

#### Step 1: Get your Render backend URL
- Go to Render.com dashboard
- Find your FastAPI service URL (e.g., `https://skillbridge-api.onrender.com`)
- This is what `NEXT_PUBLIC_API_URL` should point to

#### Step 2: Update .env
Update your `.env` file (or set in Render/Vercel dashboard):
```
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
```

#### Step 2: Ensure Azure SQL has users
Run in Azure SQL Studio:
```sql
-- Create a test user:
CREATE LOGIN testuser WITH PASSWORD = 'SkillBridge2026!';
GO
CREATE USER testuser FOR LOGIN testuser;
GO
ALTER ROLE db_datareader, db_datawriter ADD MEMBER testuser;
GO

-- Or insert existing user:
INSERT INTO Users (email, password_hash, role, is_active) 
VALUES ('your-email@apex.edu', 'hashed-password', 'student', 1)
ON CONFLICT (email) DO NOTHING;
```

#### Step 3: Deploy frontend to Vercel
- Vercel should pick up the `NEXT_PUBLIC_API_URL` from environment
- Or add it in Vercel dashboard → Settings → Environment Variables

#### Step 4: Test the full flow
1. Visit your Vercel deployment
2. Sign in with credentials
3. Upload profile photo → logout → login → verify photo persists
4. Make profile changes → logout → login → changes retain

## Quick troubleshooting
- **Sign-in fails:** Check `NEXT_PUBLIC_API_URL` points to correct Render URL
- **Avatar doesn't persist:** Ensure `STORAGE_KEYS.currentUser` is used consistently (fixed in code)
- **Duplicate email error:** User already exists in Azure SQL - sign in instead of signing up
- **404 or connection errors:** Backend not running or wrong API URL