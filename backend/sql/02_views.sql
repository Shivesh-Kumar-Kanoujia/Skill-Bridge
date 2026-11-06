-- ============================================================
-- SkillBridge — SQL Views for Analytics & Metabase
-- Compatible with Azure SQL Database
-- ============================================================

-- ── VIEW 1: Project Analytics Summary ──
-- Used by Metabase dashboard: projects grouped by status/category
IF OBJECT_ID('vw_project_analytics', 'V') IS NOT NULL DROP VIEW vw_project_analytics;
GO

CREATE VIEW vw_project_analytics AS
SELECT
    p.id                AS project_id,
    p.title             AS project_title,
    p.category,
    p.status,
    p.max_team_size,
    p.featured,
    p.created_at,
    sp.name             AS owner_name,
    sp.department       AS owner_department,
    (SELECT COUNT(*) FROM team_members tm WHERE tm.project_id = p.id)
                        AS current_team_count,
    p.max_team_size - (SELECT COUNT(*) FROM team_members tm WHERE tm.project_id = p.id)
                        AS open_positions,
    (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id)
                        AS total_applications,
    (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id AND a.status = 'Pending')
                        AS pending_applications,
    (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id AND a.status = 'Accepted')
                        AS accepted_applications,
    (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id AND a.status = 'Rejected')
                        AS rejected_applications
FROM projects p
JOIN users u ON u.id = p.owner_id
LEFT JOIN student_profiles sp ON sp.user_id = u.id;
GO

-- ── VIEW 2: Application Analytics ──
-- Applications grouped by status, with acceptance rate
IF OBJECT_ID('vw_application_analytics', 'V') IS NOT NULL DROP VIEW vw_application_analytics;
GO

CREATE VIEW vw_application_analytics AS
SELECT
    a.id                AS application_id,
    a.project_id,
    p.title             AS project_title,
    p.category          AS project_category,
    a.applicant_id,
    sp.name             AS applicant_name,
    sp.department       AS applicant_department,
    a.role_applied,
    a.status,
    a.match_score,
    a.applied_at
FROM applications a
JOIN projects p ON p.id = a.project_id
JOIN users u ON u.id = a.applicant_id
LEFT JOIN student_profiles sp ON sp.user_id = u.id;
GO

-- ── VIEW 3: Popular Required Skills ──
-- Skills ranked by how often they are required across projects
IF OBJECT_ID('vw_popular_skills', 'V') IS NOT NULL DROP VIEW vw_popular_skills;
GO

CREATE VIEW vw_popular_skills AS
SELECT
    s.id                AS skill_id,
    s.name              AS skill_name,
    s.category          AS skill_category,
    COUNT(DISTINCT ps.project_id) AS project_demand_count,
    COUNT(DISTINCT ss.profile_id) AS student_supply_count
FROM skills s
LEFT JOIN project_skills ps ON ps.skill_id = s.id
LEFT JOIN student_skills ss ON ss.skill_id = s.id
GROUP BY s.id, s.name, s.category;
GO

-- ── VIEW 4: Platform Summary Metrics ──
-- Top-level KPIs for Metabase dashboard home
IF OBJECT_ID('vw_platform_summary', 'V') IS NOT NULL DROP VIEW vw_platform_summary;
GO

CREATE VIEW vw_platform_summary AS
SELECT
    (SELECT COUNT(*) FROM users WHERE is_active = 1) AS total_active_users,
    (SELECT COUNT(*) FROM projects)                  AS total_projects,
    (SELECT COUNT(*) FROM projects WHERE status = 'Recruiting') AS recruiting_projects,
    (SELECT COUNT(*) FROM applications)              AS total_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'Accepted') AS accepted_applications,
    CASE
        WHEN (SELECT COUNT(*) FROM applications WHERE status IN ('Accepted','Rejected')) > 0
        THEN CAST(
            (SELECT COUNT(*) FROM applications WHERE status = 'Accepted') * 100.0
            / (SELECT COUNT(*) FROM applications WHERE status IN ('Accepted','Rejected'))
        AS DECIMAL(5,2))
        ELSE 0
    END AS acceptance_rate_percent,
    (SELECT COUNT(*) FROM team_members)              AS total_team_memberships,
    (SELECT COUNT(DISTINCT skill_id) FROM project_skills) AS unique_required_skills;
GO

PRINT 'Views created successfully.';
GO

