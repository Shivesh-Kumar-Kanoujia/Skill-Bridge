-- ============================================================
-- SkillBridge — Seed Data for Development & Testing
-- Compatible with Azure SQL Database and SQL Server
-- 100% Idempotent (safe to re-run multiple times)
-- ============================================================

-- ── Seed Skills Catalogue (if empty) ──
IF NOT EXISTS (SELECT 1 FROM skills)
BEGIN
    INSERT INTO skills (name, category) VALUES
    ('React', 'Frontend'),
    ('TypeScript', 'Frontend'),
    ('Next.js', 'Frontend'),
    ('Tailwind CSS', 'Frontend'),
    ('HTML/CSS', 'Frontend'),
    ('Node.js', 'Backend'),
    ('FastAPI', 'Backend'),
    ('Go (Golang)', 'Backend'),
    ('REST APIs', 'Backend'),
    ('Python', 'Core'),
    ('C/C++', 'Core'),
    ('Git', 'Core'),
    ('PostgreSQL', 'Data'),
    ('Pandas', 'Data'),
    ('PyTorch', 'AI/ML'),
    ('scikit-learn', 'AI/ML'),
    ('Flutter', 'Mobile'),
    ('Dart', 'Mobile'),
    ('Swift', 'Mobile'),
    ('Figma', 'Design'),
    ('UI/UX Design', 'Design'),
    ('Design Systems', 'Design'),
    ('User Research', 'Design'),
    ('Prototyping', 'Design'),
    ('Docker', 'DevOps'),
    ('Kubernetes', 'DevOps'),
    ('Linux Systems', 'DevOps'),
    ('Firebase', 'Backend'),
    ('Redis', 'Backend'),
    ('MQTT / LoRaWAN', 'Backend'),
    ('ESP32 / Arduino', 'DevOps'),
    ('Embedded C', 'Core'),
    ('PCB Design (KiCad)', 'Design'),
    ('WebSockets', 'Backend');

    PRINT 'Default skills seeded successfully.';
END
ELSE
BEGIN
    PRINT 'Skills table already contains data — skipping seed.';
END
GO
