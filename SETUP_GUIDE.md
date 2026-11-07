# SkillBridge — Complete Installation & Setup Guide

This guide walks you through running SkillBridge locally for development and deploying it to production.

---

## 1. System Prerequisites

- **Node.js:** v18.18.0 or newer (v20+ recommended)
- **Python:** 3.10 to 3.14 (Python 3.14 supported)
- **Git**

---

## 2. Local Development Setup

### A. Clone and Open Project
```powershell
git clone https://github.com/Shivesh-Kumar-Kanoujia/Skill-Bridge.git
cd Skill-Bridge
```

---

### B. Backend Setup (FastAPI + SQLite)

1. **Navigate to the backend directory:**
   ```powershell
   cd backend
   ```

2. **Create and activate a Python virtual environment:**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Copy `backend/.env.example` to `backend/.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
   *(The default `.env.example` is pre-configured with local zero-config SQLite settings)*

5. **Start the FastAPI backend server:**
   ```powershell
   python -m uvicorn app.main:app --reload --port 8000
   ```
   The backend API will run at `http://127.0.0.1:8000`.  
   Interactive API documentation is available at `http://127.0.0.1:8000/api/docs`.

6. **Seed Initial Demo Data (First time only):**
   In a new terminal window or via browser:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8000/api/dev/seed" -Method POST
   ```
   This populates demo skills, student profiles, capstone/hackathon projects, and sample applications.

---

### C. Frontend Setup (Next.js 16)

1. **From the repository root (`Skill-Bridge`), install Node dependencies:**
   ```powershell
   npm install
   ```

2. **Configure environment variables (optional for local dev):**
   Copy `.env.example` to `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```
   Default: `NEXT_PUBLIC_API_URL=http://localhost:8000`

3. **Start the Next.js development server:**
   ```powershell
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

---

## 3. Demo Credentials

You can click the **"Autofill Demo"** button on the Login page (`/login`) or use:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Demo Student** | `aarav.sharma@apex.edu` | `password123` | Full-stack CSE student, project owner |
| **ML Researcher** | `priya.n@apex.edu` | `password123` | AI/DS student, hackathon project owner |
| **IoT Engineer** | `rohan.d@apex.edu` | `password123` | ECE student, EcoTrack project owner |

You can also register a brand-new student account at `/signup` with any custom password.

---

## 4. Running Automated Tests

### Run Backend Pytest Suite
```powershell
cd backend
.\.venv\Scripts\pytest tests -v
```

### Run 10 Authentication Scenarios
Ensure the backend server is running on port 8000, then execute:
```powershell
cd backend
.\.venv\Scripts\python test_auth_scenarios.py
```

### Run Frontend Production Build & Type Check
```powershell
npm run build
```

---

## 5. Production Cloud Deployment (Azure)

### A. Azure SQL Database
1. Create an Azure SQL Database resource (recommended region: `Central India` for Student subscriptions).
2. Set Firewall Rules in Azure Portal:
   - Allow Azure services and resources to access this server: **Yes**
   - Add your client IPv4 address to the firewall rules.
3. In Azure Portal Query Editor, execute the SQL scripts located in `backend/sql/` in sequence:
   - `01_schema.sql` (Creates all 8 relational tables, constraints, and indexes)
   - `02_views.sql` (Creates analytics views for Metabase)
   - `03_stored_procedures_triggers.sql`
   - `05_seed_data.sql` (Optional: seed baseline canonical skills and mock data)
4. Update `backend/.env` with the Azure connection string:
   ```env
   DATABASE_URL=mssql+pyodbc://<username>:<password>@<server>.database.windows.net:1433/<database>?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no
   ```

### B. Azure Blob Storage (Avatars and Attachments)
1. Create an Azure Storage Account.
2. Under **Blob Containers**, create a container named `skillbridge-uploads`.
3. In `backend/.env`, set:
   ```env
   AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=<name>;AccountKey=<key>;EndpointSuffix=core.windows.net"
   AZURE_STORAGE_CONTAINER_NAME="skillbridge-uploads"
   ```

### C. Metabase Analytics Dashboard
1. Deploy Metabase via Docker or Azure Container Apps:
   ```bash
   docker run -d -p 3001:3000 --name metabase metabase/metabase
   ```
2. In Metabase, connect to your Azure SQL Database using the SQL Server driver.
3. Build dashboards using the pre-configured views:
   - `vw_project_analytics`
   - `vw_application_analytics`
   - `vw_popular_skills`
   - `vw_project_discovery`
