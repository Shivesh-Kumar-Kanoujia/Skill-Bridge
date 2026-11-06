-- ============================================================
-- SkillBridge — SQL Demonstrations
-- Compatible with Azure SQL Database
-- Demonstrates: JOINs, Transactions, Views, Indexes, Aggregates
-- ============================================================

-- ═══════════════════════════════════════════
-- DEMONSTRATION 1: Multi-table JOINs
-- ═══════════════════════════════════════════

-- JOIN Example 1: Get student profiles with their skills
-- Uses: INNER JOIN across 4 tables
SELECT
    u.email,
    sp.name             AS student_name,
    sp.department,
    sp.semester,
    s.name              AS skill_name,
    s.category          AS skill_category,
    ss.level            AS proficiency
FROM users u
INNER JOIN student_profiles sp ON sp.user_id = u.id
INNER JOIN student_skills ss   ON ss.profile_id = sp.id
INNER JOIN skills s            ON s.id = ss.skill_id
WHERE u.is_active = 1
ORDER BY sp.name, s.name;

-- JOIN Example 2: Projects with owner info, team size, and application count
-- Uses: LEFT JOIN + aggregate subqueries
SELECT
    p.title             AS project_title,
    p.category,
    p.status,
    sp.name             AS owner_name,
    sp.department       AS owner_department,
    p.max_team_size,
    COUNT(DISTINCT tm.id) AS current_members,
    (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) AS application_count
FROM projects p
INNER JOIN users u ON u.id = p.owner_id
LEFT JOIN student_profiles sp ON sp.user_id = u.id
LEFT JOIN team_members tm ON tm.project_id = p.id
GROUP BY p.id, p.title, p.category, p.status, sp.name, sp.department, p.max_team_size
ORDER BY application_count DESC;

-- JOIN Example 3: Applications with full student and project details
-- Uses: INNER JOIN across 4 tables
SELECT
    a.id                AS application_id,
    p.title             AS project_title,
    sp.name             AS applicant_name,
    sp.department       AS applicant_department,
    a.role_applied,
    a.status            AS application_status,
    a.match_score,
    a.applied_at
FROM applications a
INNER JOIN projects p ON p.id = a.project_id
INNER JOIN users u ON u.id = a.applicant_id
INNER JOIN student_profiles sp ON sp.user_id = u.id
ORDER BY a.applied_at DESC;

-- JOIN Example 4: Find skill overlap between students and projects
-- Uses: INNER JOIN on skill tables
SELECT
    sp.name             AS student_name,
    p.title             AS project_title,
    s.name              AS matching_skill,
    s.category,
    ss.level            AS student_proficiency
FROM student_skills ss
INNER JOIN skills s ON s.id = ss.skill_id
INNER JOIN project_skills ps ON ps.skill_id = s.id
INNER JOIN student_profiles sp ON sp.id = ss.profile_id
INNER JOIN projects p ON p.id = ps.project_id
ORDER BY sp.name, p.title;


-- ═══════════════════════════════════════════
-- DEMONSTRATION 2: Transaction — Atomic Application Acceptance
-- ═══════════════════════════════════════════

-- This demonstrates the critical transaction requirement:
-- Accept application + create team member + validate capacity atomically
/*
DECLARE @app_id INT = 1;  -- Replace with actual application ID

BEGIN TRANSACTION;

    -- Step 1: Validate capacity with locking
    DECLARE @max INT, @current INT, @proj INT, @user INT, @role NVARCHAR(100);

    SELECT @proj = project_id, @user = applicant_id, @role = role_applied
    FROM applications WHERE id = @app_id AND status = 'Pending';

    SELECT @max = max_team_size FROM projects WHERE id = @proj;

    SELECT @current = COUNT(*)
    FROM team_members WITH (UPDLOCK, HOLDLOCK)
    WHERE project_id = @proj;

    IF @current < @max
    BEGIN
        -- Step 2: Update application status
        UPDATE applications SET status = 'Accepted', updated_at = SYSUTCDATETIME()
        WHERE id = @app_id;

        -- Step 3: Create team membership
        INSERT INTO team_members (project_id, user_id, role, is_owner, joined_at)
        VALUES (@proj, @user, @role, 0, SYSUTCDATETIME());

        COMMIT TRANSACTION;
        PRINT 'Application accepted and team member added.';
    END
    ELSE
    BEGIN
        ROLLBACK TRANSACTION;
        PRINT 'Team is full — application not accepted.';
    END
*/


-- ═══════════════════════════════════════════
-- DEMONSTRATION 3: Views (defined in 02_views.sql)
-- ═══════════════════════════════════════════

-- Query the analytics views
SELECT * FROM vw_platform_summary;

SELECT category, status, COUNT(*) AS project_count
FROM vw_project_analytics
GROUP BY category, status
ORDER BY category, status;

SELECT skill_name, skill_category, project_demand_count, student_supply_count
FROM vw_popular_skills
ORDER BY project_demand_count DESC;


-- ═══════════════════════════════════════════
-- DEMONSTRATION 4: Index Usage
-- ═══════════════════════════════════════════

-- These queries use the indexes defined in the schema:
-- ix_projects_status, ix_projects_category, ix_projects_owner,
-- ix_app_project_applicant, ix_app_status, ix_profiles_department, ix_skills_name

-- Fast lookup by project status (uses ix_projects_status)
SELECT id, title FROM projects WHERE status = 'Recruiting';

-- Fast lookup by skill name (uses ix_skills_name)
SELECT id, name, category FROM skills WHERE name = 'React';

-- Fast lookup by application status (uses ix_app_status)
SELECT COUNT(*) AS pending_count FROM applications WHERE status = 'Pending';

-- Fast lookup: find all applications for a specific project+user (uses ix_app_project_applicant)
-- SELECT * FROM applications WHERE project_id = 1 AND applicant_id = 1;


-- ═══════════════════════════════════════════
-- DEMONSTRATION 5: Aggregate Analytics for Metabase
-- ═══════════════════════════════════════════

-- Projects grouped by status
SELECT status, COUNT(*) AS count
FROM projects
GROUP BY status;

-- Applications grouped by status
SELECT status, COUNT(*) AS count
FROM applications
GROUP BY status;

-- Application acceptance rate
SELECT
    CAST(SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) AS FLOAT)
    / NULLIF(SUM(CASE WHEN status IN ('Accepted','Rejected') THEN 1 ELSE 0 END), 0) * 100
    AS acceptance_rate_percent
FROM applications;

-- Top 10 most requested skills
SELECT TOP 10
    s.name AS skill_name,
    COUNT(ps.project_id) AS demand_count
FROM skills s
INNER JOIN project_skills ps ON ps.skill_id = s.id
GROUP BY s.name
ORDER BY demand_count DESC;

-- Open positions across projects
SELECT
    p.title,
    p.category,
    p.max_team_size - COUNT(tm.id) AS open_spots
FROM projects p
LEFT JOIN team_members tm ON tm.project_id = p.id
WHERE p.status = 'Recruiting'
GROUP BY p.id, p.title, p.category, p.max_team_size
HAVING p.max_team_size - COUNT(tm.id) > 0
ORDER BY open_spots DESC;


-- ═══════════════════════════════════════════
-- NORMALIZATION EXPLANATION (3NF)
-- ═══════════════════════════════════════════
-- 
-- 1NF: All columns contain atomic values. Lists (interests, roles)
--      are stored as JSON strings — a pragmatic choice for flexibility.
--      Multi-valued skill associations use proper junction tables.
--
-- 2NF: Every non-key attribute depends on the FULL primary key.
--      In junction tables (student_skills, project_skills), the
--      composite unique constraint (profile_id, skill_id) defines the
--      logical key; additional attributes like 'level' depend on the
--      full combination.
--
-- 3NF: No transitive dependencies.
--      - Student name/department live in student_profiles, not in users.
--      - Skill names/categories live in the skills table, not repeated
--        in student_skills or project_skills.
--      - Project owner info is accessed via FK to users, not duplicated.
--      - Application and team member tables reference users and projects
--        by FK, never storing derived/denormalized copies.
--
-- Junction tables (student_skills, project_skills, team_members) exist
-- specifically to avoid storing multi-valued data in a single column,
-- which would violate 1NF and prevent efficient querying.

