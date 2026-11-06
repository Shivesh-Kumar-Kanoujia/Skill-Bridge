-- ============================================================
-- SkillBridge — Stored Procedure & Trigger
-- Compatible with Azure SQL Database
-- ============================================================

-- ── STORED PROCEDURE: Accept Application with Atomic Team Membership ──
-- Demonstrates: Transaction, capacity check, status update, membership creation
-- all within a single atomic unit of work.
IF OBJECT_ID('sp_accept_application', 'P') IS NOT NULL DROP PROCEDURE sp_accept_application;
GO

CREATE PROCEDURE sp_accept_application
    @application_id INT,
    @owner_user_id  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;  -- Auto-rollback on any error

    DECLARE @project_id     INT;
    DECLARE @applicant_id   INT;
    DECLARE @role_applied   NVARCHAR(100);
    DECLARE @app_status     NVARCHAR(20);
    DECLARE @project_owner  INT;
    DECLARE @max_size       INT;
    DECLARE @current_count  INT;

    -- Validate application exists and is pending
    SELECT
        @project_id   = a.project_id,
        @applicant_id = a.applicant_id,
        @role_applied = a.role_applied,
        @app_status   = a.status
    FROM applications a
    WHERE a.id = @application_id;

    IF @project_id IS NULL
    BEGIN
        RAISERROR('Application not found.', 16, 1);
        RETURN;
    END

    IF @app_status <> 'Pending'
    BEGIN
        RAISERROR('Application is not in Pending status.', 16, 1);
        RETURN;
    END

    -- Validate project ownership
    SELECT @project_owner = owner_id, @max_size = max_team_size
    FROM projects
    WHERE id = @project_id;

    IF @project_owner <> @owner_user_id
    BEGIN
        RAISERROR('Only the project owner can accept applications.', 16, 1);
        RETURN;
    END

    -- ─── BEGIN TRANSACTION ───
    BEGIN TRANSACTION;

        -- Lock-safe capacity check (prevents concurrent over-acceptance)
        SELECT @current_count = COUNT(*)
        FROM team_members WITH (UPDLOCK, HOLDLOCK)
        WHERE project_id = @project_id;

        IF @current_count >= @max_size
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('Team is full. Cannot accept more members.', 16, 1);
            RETURN;
        END

        -- Check not already a member
        IF EXISTS (SELECT 1 FROM team_members WHERE project_id = @project_id AND user_id = @applicant_id)
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('Applicant is already a team member.', 16, 1);
            RETURN;
        END

        -- Update application status
        UPDATE applications
        SET status = 'Accepted', updated_at = SYSUTCDATETIME()
        WHERE id = @application_id;

        -- Create team membership
        INSERT INTO team_members (project_id, user_id, role, is_owner, joined_at)
        VALUES (@project_id, @applicant_id, @role_applied, 0, SYSUTCDATETIME());

        -- Log the action
        INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, created_at)
        VALUES (
            @owner_user_id,
            'ACCEPT_APPLICATION',
            'application',
            @application_id,
            CONCAT('Accepted applicant ', @applicant_id, ' for project ', @project_id),
            SYSUTCDATETIME()
        );

    COMMIT TRANSACTION;
    -- ─── END TRANSACTION ───

    -- Return the accepted application
    SELECT a.id, a.project_id, a.applicant_id, a.role_applied, a.status,
           a.match_score, a.applied_at, a.updated_at
    FROM applications a
    WHERE a.id = @application_id;
END;
GO


-- ── TRIGGER: Auto-log application status changes ──
-- Fires AFTER UPDATE on applications to record status transitions
IF OBJECT_ID('trg_application_status_change', 'TR') IS NOT NULL DROP TRIGGER trg_application_status_change;
GO

CREATE TRIGGER trg_application_status_change
ON applications
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Only fire when status actually changed
    IF UPDATE(status)
    BEGIN
        INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, created_at)
        SELECT
            i.applicant_id,
            CASE i.status
                WHEN 'Accepted'  THEN 'APPLICATION_ACCEPTED'
                WHEN 'Rejected'  THEN 'APPLICATION_REJECTED'
                WHEN 'Withdrawn' THEN 'APPLICATION_WITHDRAWN'
                ELSE 'APPLICATION_STATUS_CHANGE'
            END,
            'application',
            i.id,
            CONCAT('Status changed from ', d.status, ' to ', i.status,
                   ' for project ', i.project_id),
            SYSUTCDATETIME()
        FROM inserted i
        INNER JOIN deleted d ON i.id = d.id
        WHERE i.status <> d.status;
    END
END;
GO


PRINT 'Stored procedure and trigger created successfully.';
GO

