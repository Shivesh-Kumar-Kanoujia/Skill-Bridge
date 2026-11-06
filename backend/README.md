# SkillBridge Backend — Student Skill & Project Collaboration Platform

FastAPI backend for **SkillBridge**, designed according to the approved Design Review Document for the Integrated Full-Stack Project.

---

## 1. System Architecture

SkillBridge adopts a **Modular Monolith** architecture with clear layered separation of responsibilities:

- **Presentation / API Layer**: FastAPI routers with typed Pydantic v2 schemas.
- **Service / Business Logic Layer**: Deterministic rule-based matching engine, transactional application acceptance, and Azure Blob storage service.
- **Data Access Layer**: Async SQLAlchemy 2.0 ORM with PostgreSQL/Azure SQL Database and SQLite (for local development).
- **Relational Storage**: Azure SQL Database (3NF schema with primary/foreign keys, check constraints, unique constraints, and indexes).
- **Object Storage**: Azure Blob Storage (private containers with authorized uploads).
- **Analytics**: Metabase connected directly to Azure SQL views.

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py         # Environment configuration (Pydantic BaseSettings)
│   │   ├── database.py       # Async SQLAlchemy engine & session factory
│   │   ├── security.py       # JWT creation/verification & bcrypt password hashing
│   │   └── seed.py           # Comprehensive database seeder
│   ├── models/
│   │   └── user.py           # 10 ORM models (8 core + invitations + audit_log)
│   ├── routers/
│   │   ├── auth.py           # Registration, login, logout, me
│   │   ├── students.py       # Profiles, skills, avatars
│   │   ├── projects.py       # Projects CRUD, search, filter, matching
│   │   ├── applications.py   # Applications, atomic acceptance, withdraw
│   │   ├── teams.py          # Team memberships, project members
│   │   ├── invitations.py    # Team invitations & acceptance
│   │   └── skills.py         # Canonical skills catalogue
│   ├── schemas/
│   │   └── schemas.py        # Pydantic v2 request/response models
│   ├── services/
│   │   ├── matching.py       # Deterministic rule-based compatibility engine
│   │   ├── storage.py        # Dual-mode Azure Blob Storage & local fallback
│   │   └── audit.py          # Activity and security audit logging
│   └── main.py               # FastAPI entry point, CORS, exception handlers
├── sql/
│   ├── 01_schema.sql         # Complete Azure SQL DDL (tables, FKs, constraints, indexes)
│   ├── 02_views.sql          # Metabase analytics views (projects, apps, skills, KPIs)
│   ├── 03_stored_procedures_triggers.sql # Stored procedure (atomic accept) & trigger (status log)
│   ├── 04_demonstrations.sql # RDBMS demonstrations (joins, transaction, views, indexes)
│   └── 05_seed_data.sql      # Canonical skills catalogue seed script
├── tests/
│   ├── conftest.py           # In-memory SQLite async test fixtures
│   ├── test_auth.py          # Auth, JWT, validation, logout tests
│   ├── test_students.py      # Profile retrieval, updates, skills tests
│   ├── test_projects.py      # Project CRUD, authorization, search/filter tests
│   ├── test_matching.py      # Rule-based scoring & edge case tests
│   ├── test_applications.py  # Apply, duplicate check, capacity enforcement, accept/reject
│   ├── test_teams.py         # Membership, invitations, team listing
│   └── test_storage.py       # File type & size validation tests
├── requirements.txt          # Python dependencies
├── pytest.ini                # Pytest configuration
├── .env.example              # Environment variables template
└── README.md
```

---

## 3. Getting Started (Local Development)

### Prerequisites
- Python 3.10+ (tested with Python 3.14)
- Node.js 18+ (for frontend)

### Installation Steps

1. **Create and activate a virtual environment**:
   ```bash
   cd backend
   python -m venv .venv
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1
   # macOS/Linux:
   source .venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Run the FastAPI development server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **Seed demonstration data**:
   Open your browser or run:
   ```bash
   curl -X POST http://localhost:8000/api/dev/seed
   ```
   Or access the interactive Swagger documentation at [http://localhost:8000/api/docs](http://localhost:8000/api/docs).

---

## 4. Environment Variables Reference

| Variable | Description | Default / Example |
|---|---|---|
| `APP_ENV` | Environment (`development`, `production`) | `development` |
| `SECRET_KEY` | JWT signing secret key | Random 32-byte hex string |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `1440` (24 hours) |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite+aiosqlite:///./skillbridge.db` (local) or `mssql+aioodbc://...` (Azure SQL) |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage connection string | Empty for local filesystem uploads |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container name | `skillbridge-uploads` |
| `CORS_ORIGINS` | Allowed frontend origins | `["http://localhost:3000","http://127.0.0.1:3000"]` |
| `MAX_FILE_SIZE_MB` | Maximum file upload size in MB | `5` |
| `ALLOWED_FILE_TYPES` | Comma-separated list of MIME types | `image/jpeg,image/png,image/webp,application/pdf` |

---

## 5. Relational Schema & 3NF Compliance

The database schema implements eight core tables in **Third Normal Form (3NF)** plus auxiliary tables:

1. `users`: Credentials, email, password hash, role (`student`, `admin`), active status.
2. `student_profiles`: Public profile attributes (1:1 with `users`).
3. `skills`: Canonical skills catalogue (name, category).
4. `student_skills`: M:N association table connecting students and skills with proficiency levels.
5. `projects`: Project listings, category, duration, deadline, max team size, status.
6. `project_skills`: M:N association table specifying skills required by projects.
7. `applications`: Student applications with role, statement, deterministic match score, and status (`Pending`, `Accepted`, `Rejected`, `Withdrawn`).
8. `team_members`: Project team memberships with roles and owner flag.
9. `invitations`: Project owner invitations sent to prospective student teammates.
10. `audit_log`: Security and administrative activity tracking.

### Normalization Highlights
- **1NF**: Atomic attributes. Multi-valued skill associations are decomposed into `student_skills` and `project_skills`.
- **2NF**: All non-key columns depend on the full primary key (composite keys in junction tables use unique constraints).
- **3NF**: Non-key columns depend strictly on the primary key without transitive dependencies. Student names and departments belong in `student_profiles`, skill attributes belong in `skills`, and project owner references point to `users.id`.

---

## 6. Azure Cloud Services Integration

### 6.1 Azure SQL Database
For production deployment, set `DATABASE_URL` in `.env`:
```env
DATABASE_URL=mssql+aioodbc://<username>:<password>@<server-name>.database.windows.net:1433/<database-name>?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no
```
Execute the DDL scripts in `backend/sql/`:
1. `01_schema.sql` — Tables, constraints, and indexes.
2. `02_views.sql` — Analytics views for Metabase.
3. `03_stored_procedures_triggers.sql` — Concurrency-safe application acceptance stored procedure and audit trigger.
4. `05_seed_data.sql` — Skill catalogue.

### 6.2 Azure Blob Storage
Set `AZURE_STORAGE_CONNECTION_STRING` in `.env`:
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=<account>;AccountKey=<key>;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=skillbridge-uploads
```
- Uploads are restricted by MIME type (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`) and size (<= 5MB).
- Files are saved with unique UUID-based paths: `{subfolder}/{user_id}/{uuid}.{ext}`.
- Containers are kept private by default with authorized backend retrieval.

---

## 7. Metabase Analytics Integration

The approved architecture uses **Metabase** for interactive analytics dashboards. Metabase connects directly to Azure SQL Database using a read-only database user.

### Key Pre-Built Analytics Views
- `vw_platform_summary`: High-level KPIs (active users, recruiting projects, total applications, acceptance rate).
- `vw_project_analytics`: Projects breakdown by status, category, current members, open spots, and application counts.
- `vw_application_analytics`: Applications timeline, candidate departments, match scores, and outcomes.
- `vw_popular_skills`: Demand-versus-supply ranking of skills across projects and students.

### Metabase Dashboard Setup
1. Launch Metabase (Docker or Cloud):
   ```bash
   docker run -d -p 3001:3000 --name metabase metabase/metabase
   ```
2. In Metabase Setup:
   - **Database Type**: SQL Server
   - **Host**: `<your-server>.database.windows.net`
   - **Port**: `1433`
   - **Database Name**: `<your-db>`
   - **User**: Read-only reporting account
   - **Use SSL**: Yes
3. Create Dashboard Cards:
   - **Card 1 (Bar Chart)**: Projects Grouped by Category and Status (`SELECT * FROM vw_project_analytics`).
   - **Card 2 (Pie Chart)**: Applications by Status (`SELECT status, COUNT(*) FROM applications GROUP BY status`).
   - **Card 3 (Metric KPI)**: Application Acceptance Rate (`SELECT acceptance_rate_percent FROM vw_platform_summary`).
   - **Card 4 (Horizontal Bar Chart)**: Top 10 Most Demanded Skills (`SELECT TOP 10 skill_name, project_demand_count FROM vw_popular_skills ORDER BY project_demand_count DESC`).
   - **Card 5 (Table)**: Projects with Open Positions (`SELECT project_title, category, open_positions FROM vw_project_analytics WHERE open_positions > 0`).

---

## 8. REST API Inventory

### Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register a student account and profile.
- `POST /api/auth/login` — Authenticate and receive JWT access token.
- `POST /api/auth/logout` — Logout session.
- `GET /api/auth/me` — Retrieve current authenticated user.

### Students (`/api/students`)
- `GET /api/students` — List students with filters (`department`, `semester`, `skill`, `search`).
- `GET /api/students/me` — Retrieve personal student profile and skills.
- `GET /api/students/{id}` — Retrieve public profile by user ID.
- `PUT /api/students/me` — Update personal profile attributes and skill associations.
- `POST /api/students/me/avatar` — Upload avatar image.

### Projects (`/api/projects`)
- `GET /api/projects` — List projects with search, category/status filters, and sorting.
- `GET /api/projects/{id}` — Retrieve project details with members and required skills.
- `POST /api/projects` — Create project (creator becomes owner and first team member).
- `PUT /api/projects/{id}` — Update project (restricted to project owner).
- `GET /api/projects/{id}/match` — Calculate deterministic match score for current user.

### Applications (`/api/applications`)
- `POST /api/applications` — Submit project application (duplicate prevention enforced).
- `GET /api/applications/my` — List applications submitted by current user.
- `GET /api/applications/received` — List applications received for user's owned projects.
- `POST /api/applications/{id}/action` — Accept or reject application (atomic transaction with capacity check).
- `POST /api/applications/{id}/withdraw` — Withdraw pending application.

### Teams (`/api/teams`)
- `GET /api/teams/my` — List all projects where current user is an active team member.
- `GET /api/teams/{project_id}/members` — List members of a specific project.

### Invitations (`/api/invitations`)
- `POST /api/invitations` — Send project invitation to a student.
- `GET /api/invitations/my` — List invitations received by current user.
- `GET /api/invitations/sent` — List invitations sent by current user.
- `POST /api/invitations/{id}/action` — Accept or decline invitation.

### Skills (`/api/skills`)
- `GET /api/skills` — List and search canonical skills catalogue.
- `POST /api/skills/seed` — Seed default skills.

---

## 9. Rule-Based Matching Algorithm

The matching engine computes a deterministic compatibility score between 0 and 100% using explainable weighted factors:

1. **Skill Overlap (50%)**: Proportion of project required skills possessed by the student.
2. **Interest Alignment (25%)**: Overlap between student interests and project categories/preferred interests.
3. **Availability (15%)**: Suitability score based on student availability status (`Actively Looking`: 15, `Open to Offers`: 12, `Limited Availability`: 7, `Unavailable`: 3).
4. **Experience Level (10%)**: Baseline academic maturity based on current semester.

Result labels:
- `85% - 100%`: **Outstanding Fit**
- `70% - 84%`: **Strong Fit**
- `50% - 69%`: **Moderate Fit**
- `< 50%`: **Growth Opportunity**

---

## 10. Concurrency & Transaction Safety

When an application is accepted:
1. An explicit transaction locks the team membership rows for the project (`UPDLOCK`, `HOLDLOCK`).
2. Current team count is verified against `max_team_size`. If full, the transaction is rolled back with HTTP 409.
3. The applicant is checked against existing members to prevent duplicate memberships.
4. Application status is updated to `Accepted`.
5. A `team_members` row is inserted.
6. An `audit_log` event is recorded.
7. The transaction commits atomically.

---

## 11. Testing & Verification

The backend includes a comprehensive automated test suite with **39 tests** covering all modules:

```bash
cd backend
.\.venv\Scripts\pytest -v
```

### Test Coverage Summary
- **Authentication**: Registration, login, logout, invalid credentials, unauthenticated rejection (10 tests).
- **Authorization**: Ownership verification, cross-user modification prevention (5 tests).
- **Projects**: Creation, update, search, category filters, single lookup (6 tests).
- **Matching Engine**: Overlap calculations, empty skills, case insensitivity (4 tests).
- **Applications**: Application submission, duplicate prevention, capacity enforcement, accept/reject, withdrawal (7 tests).
- **Teams & Invitations**: Member listing, sending and accepting invitations (3 tests).
- **File Storage**: MIME type validation, file size enforcement, auth checks (3 tests).
- **Skills Catalogue**: Listing, searching, seeding (1 test).

