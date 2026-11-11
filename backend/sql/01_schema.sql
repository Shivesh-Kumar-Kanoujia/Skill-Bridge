-- ============================================================
-- SkillBridge — Azure SQL Database Schema (DDL)
-- Compatible with Azure SQL Database and SQL Server
-- Demonstrates: PKs, FKs, NOT NULL, UNIQUE, CHECK, Indexes
-- Normalized to Third Normal Form (3NF)
-- 100% Idempotent (safe to re-run multiple times)
-- ============================================================

-- ── 1. USERS — authentication credentials ──
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    email           NVARCHAR(255)   NOT NULL,
    password_hash   NVARCHAR(255)   NOT NULL,
    role            NVARCHAR(20)    NOT NULL DEFAULT 'student',
    is_active       BIT             NOT NULL DEFAULT 1,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT uq_users_email       UNIQUE (email),
    CONSTRAINT ck_users_role        CHECK (role IN ('student', 'admin'))
);
GO

IF COL_LENGTH('users', 'email_normalized') IS NULL
BEGIN
    ALTER TABLE users
    ADD email_normalized AS LOWER(LTRIM(RTRIM(email))) PERSISTED;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'uq_users_email_normalized' AND object_id = OBJECT_ID('users')
)
BEGIN
    CREATE UNIQUE INDEX uq_users_email_normalized ON users (email_normalized);
END
GO

-- ── 2. STUDENT_PROFILES — public profile data (1:1 with users) ──
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'student_profiles')
CREATE TABLE student_profiles (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    user_id             INT             NOT NULL,
    name                NVARCHAR(100)   NOT NULL,
    avatar_url          NVARCHAR(500)   NULL,
    department          NVARCHAR(100)   NOT NULL,
    semester            INT             NOT NULL,
    college             NVARCHAR(200)   NOT NULL DEFAULT 'Apex Institute of Technology',
    headline            NVARCHAR(200)   NULL,
    bio                 NVARCHAR(MAX)   NULL,
    interests           NVARCHAR(MAX)   NULL,          -- JSON array
    preferred_roles     NVARCHAR(MAX)   NULL,          -- JSON array
    availability_hours  INT             NOT NULL DEFAULT 10,
    availability_status NVARCHAR(30)    NOT NULL DEFAULT 'Actively Looking',
    availability_note   NVARCHAR(300)   NULL,
    github_url          NVARCHAR(300)   NULL,
    linkedin_url        NVARCHAR(300)   NULL,
    portfolio_url       NVARCHAR(300)   NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_profiles_user     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_profiles_user     UNIQUE (user_id),
    CONSTRAINT ck_semester_range    CHECK (semester >= 1 AND semester <= 10),
    CONSTRAINT ck_availability_status CHECK (
        availability_status IN ('Actively Looking','Open to Offers','Limited Availability','Unavailable')
    )
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_profiles_department' AND object_id = OBJECT_ID('student_profiles'))
CREATE NONCLUSTERED INDEX ix_profiles_department ON student_profiles(department);
GO

-- ── 3. SKILLS — canonical skill catalogue ──
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'skills')
CREATE TABLE skills (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(100)   NOT NULL,
    category    NVARCHAR(30)    NOT NULL DEFAULT 'Core',

    CONSTRAINT uq_skills_name       UNIQUE (name),
    CONSTRAINT ck_skill_category    CHECK (
        category IN ('Frontend','Backend','AI/ML','Mobile','Design','Data','DevOps','Core')
    )
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_skills_name' AND object_id = OBJECT_ID('skills'))
CREATE NONCLUSTERED INDEX ix_skills_name ON skills(name);
GO

-- ── 4. STUDENT_SKILLS — M:N junction (students ↔ skills) ──
--    3NF: Avoids repeating multi-valued skill data in profiles.
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'student_skills')
CREATE TABLE student_skills (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    profile_id  INT             NOT NULL,
    skill_id    INT             NOT NULL,
    level       NVARCHAR(20)    NOT NULL DEFAULT 'Intermediate',

    CONSTRAINT fk_ss_profile    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ss_skill      FOREIGN KEY (skill_id)   REFERENCES skills(id)           ON DELETE CASCADE,
    CONSTRAINT uq_profile_skill UNIQUE (profile_id, skill_id),
    CONSTRAINT ck_skill_level   CHECK (level IN ('Beginner','Intermediate','Advanced'))
);
GO

-- ── 5. PROJECTS ──
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'projects')
CREATE TABLE projects (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    owner_id            INT             NOT NULL,
    title               NVARCHAR(200)   NOT NULL,
    tagline             NVARCHAR(300)   NULL,
    description         NVARCHAR(MAX)   NULL,
    category            NVARCHAR(30)    NOT NULL DEFAULT 'Coursework',
    max_team_size       INT             NOT NULL DEFAULT 4,
    duration            NVARCHAR(100)   NULL,
    deadline            NVARCHAR(50)    NULL,
    preferred_interests NVARCHAR(MAX)   NULL,          -- JSON array
    open_roles          NVARCHAR(MAX)   NULL,          -- JSON array
    status              NVARCHAR(20)    NOT NULL DEFAULT 'Recruiting',
    featured            BIT             NOT NULL DEFAULT 0,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_projects_owner    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT ck_project_category  CHECK (
        category IN ('Hackathon','Capstone','Coursework','Open Source','Research','Startup')
    ),
    CONSTRAINT ck_project_status    CHECK (status IN ('Recruiting','In Progress','Completed')),
    CONSTRAINT ck_team_size         CHECK (max_team_size >= 1 AND max_team_size <= 20)
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_projects_status' AND object_id = OBJECT_ID('projects'))
CREATE NONCLUSTERED INDEX ix_projects_status   ON projects(status);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_projects_category' AND object_id = OBJECT_ID('projects'))
CREATE NONCLUSTERED INDEX ix_projects_category ON projects(category);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_projects_owner' AND object_id = OBJECT_ID('projects'))
CREATE NONCLUSTERED INDEX ix_projects_owner    ON projects(owner_id);
GO

-- ── 6. PROJECT_SKILLS — M:N junction (projects ↔ skills) ──
--    3NF: Avoids repeating skill references inside the projects table.
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'project_skills')
CREATE TABLE project_skills (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    project_id  INT NOT NULL,
    skill_id    INT NOT NULL,

    CONSTRAINT fk_ps_project    FOREIGN KEY (project_id) REFERENCES projects(id)  ON DELETE CASCADE,
    CONSTRAINT fk_ps_skill      FOREIGN KEY (skill_id)   REFERENCES skills(id)    ON DELETE CASCADE,
    CONSTRAINT uq_project_skill UNIQUE (project_id, skill_id)
);
GO

-- ── 7. APPLICATIONS ──
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'applications')
CREATE TABLE applications (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    project_id      INT             NOT NULL,
    applicant_id    INT             NOT NULL,
    role_applied    NVARCHAR(100)   NOT NULL,
    statement       NVARCHAR(MAX)   NULL,
    status          NVARCHAR(20)    NOT NULL DEFAULT 'Pending',
    match_score     FLOAT           NULL,
    match_reasons   NVARCHAR(MAX)   NULL,          -- JSON array
    applied_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_app_project   FOREIGN KEY (project_id)   REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_applicant FOREIGN KEY (applicant_id) REFERENCES users(id)    ON DELETE NO ACTION,
    CONSTRAINT ck_application_status CHECK (status IN ('Pending','Accepted','Rejected','Withdrawn'))
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_app_project_applicant' AND object_id = OBJECT_ID('applications'))
CREATE NONCLUSTERED INDEX ix_app_project_applicant ON applications(project_id, applicant_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_app_status' AND object_id = OBJECT_ID('applications'))
CREATE NONCLUSTERED INDEX ix_app_status            ON applications(status);
GO

-- ── 8. TEAM_MEMBERS ──
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'team_members')
CREATE TABLE team_members (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    project_id  INT             NOT NULL,
    user_id     INT             NOT NULL,
    role        NVARCHAR(100)   NOT NULL,
    is_owner    BIT             NOT NULL DEFAULT 0,
    joined_at   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_tm_project    FOREIGN KEY (project_id) REFERENCES projects(id)  ON DELETE CASCADE,
    CONSTRAINT fk_tm_user       FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE NO ACTION,
    CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);
GO

-- ── 9. INVITATIONS ──
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'invitations')
CREATE TABLE invitations (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    project_id  INT             NOT NULL,
    sender_id   INT             NOT NULL,
    receiver_id INT             NOT NULL,
    role        NVARCHAR(100)   NOT NULL,
    message     NVARCHAR(MAX)   NULL,
    status      NVARCHAR(20)    NOT NULL DEFAULT 'Pending',
    sent_at     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_inv_project   FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_sender    FOREIGN KEY (sender_id)   REFERENCES users(id)    ON DELETE NO ACTION,
    CONSTRAINT fk_inv_receiver  FOREIGN KEY (receiver_id) REFERENCES users(id)    ON DELETE NO ACTION,
    CONSTRAINT ck_invitation_status CHECK (status IN ('Pending','Accepted','Declined'))
);
GO

-- ── 10. AUDIT_LOG — activity logging ──
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_log')
CREATE TABLE audit_log (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT             NULL,
    action      NVARCHAR(50)    NOT NULL,
    entity_type NVARCHAR(50)    NOT NULL,
    entity_id   INT             NULL,
    details     NVARCHAR(MAX)   NULL,
    ip_address  NVARCHAR(45)    NULL,
    created_at  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_audit_user' AND object_id = OBJECT_ID('audit_log'))
CREATE NONCLUSTERED INDEX ix_audit_user      ON audit_log(user_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_audit_action' AND object_id = OBJECT_ID('audit_log'))
CREATE NONCLUSTERED INDEX ix_audit_action    ON audit_log(action);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_audit_created' AND object_id = OBJECT_ID('audit_log'))
CREATE NONCLUSTERED INDEX ix_audit_created   ON audit_log(created_at);
GO

PRINT 'Schema creation complete.';
GO
