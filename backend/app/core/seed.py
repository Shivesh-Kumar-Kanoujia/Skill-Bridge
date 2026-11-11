"""SkillBridge Database Seeder — populates canonical skills, mock users, projects, and applications."""

from __future__ import annotations

import json
import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models import (
    User,
    StudentProfile,
    Skill,
    StudentSkill,
    Project,
    ProjectSkill,
    Application,
    TeamMember,
    Invitation,
    AuditLog,
)

logger = logging.getLogger("skillbridge.seed")

DEFAULT_PASSWORD = "password123"

# Canonical Skills
SKILLS_DATA = [
    ("React", "Frontend"),
    ("TypeScript", "Frontend"),
    ("Next.js", "Frontend"),
    ("Tailwind CSS", "Frontend"),
    ("HTML/CSS", "Frontend"),
    ("Node.js", "Backend"),
    ("FastAPI", "Backend"),
    ("Go (Golang)", "Backend"),
    ("REST APIs", "Backend"),
    ("Firebase", "Backend"),
    ("Redis", "Backend"),
    ("MQTT / LoRaWAN", "Backend"),
    ("WebSockets", "Backend"),
    ("Python", "Core"),
    ("C/C++", "Core"),
    ("Git", "Core"),
    ("Embedded C", "Core"),
    ("PostgreSQL", "Data"),
    ("Pandas", "Data"),
    ("PyTorch", "AI/ML"),
    ("scikit-learn", "AI/ML"),
    ("Flutter", "Mobile"),
    ("Dart", "Mobile"),
    ("Swift", "Mobile"),
    ("Figma", "Design"),
    ("UI/UX Design", "Design"),
    ("Design Systems", "Design"),
    ("User Research", "Design"),
    ("Prototyping", "Design"),
    ("PCB Design (KiCad)", "Design"),
    ("Docker", "DevOps"),
    ("Kubernetes", "DevOps"),
    ("Linux Systems", "DevOps"),
    ("ESP32 / Arduino", "DevOps"),
]

STUDENTS_DATA = [
    {
        "email": "aarav.sharma@apex.edu",
        "name": "Aarav Sharma",
        "department": "Computer Science & Engineering",
        "semester": 5,
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "headline": "Full-Stack Developer & Design-Oriented Engineer",
        "bio": "Passionate about crafting intuitive web interfaces and scalable backend services. Previously built a peer tutoring platform and led frontend development for the 2025 Inter-College Hackathon winning team.",
        "availability_hours": 15,
        "availability_status": "Actively Looking",
        "availability_note": "Available weekday evenings and full weekends for high-impact projects.",
        "preferred_roles": ["Frontend Lead", "Full-Stack Developer", "UI Designer"],
        "interests": ["Web Development", "UI/UX Design", "Hackathons", "EdTech", "Open Source"],
        "github_url": "https://github.com/aaravsharma-dev",
        "linkedin_url": "https://linkedin.com/in/aaravsharma",
        "portfolio_url": "https://aaravsharma.me",
        "skills": [
            ("React", "Advanced"),
            ("TypeScript", "Advanced"),
            ("Next.js", "Intermediate"),
            ("Node.js", "Intermediate"),
            ("PostgreSQL", "Intermediate"),
            ("Tailwind CSS", "Advanced"),
            ("Figma", "Intermediate"),
            ("Git", "Advanced"),
        ],
    },
    {
        "email": "priya.n@apex.edu",
        "name": "Priya Nandakumar",
        "department": "Artificial Intelligence & Data Science",
        "semester": 6,
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        "headline": "Machine Learning Researcher & Python Developer",
        "bio": "Specializing in computer vision and natural language processing. Looking for teammates to compete in national AI hackathons and develop semester capstone systems.",
        "availability_hours": 18,
        "availability_status": "Actively Looking",
        "availability_note": "Excited for intensive hackathon sprints and research prototypes.",
        "preferred_roles": ["ML Engineer", "Data Scientist", "Backend Developer"],
        "interests": ["AI/ML", "Computer Vision", "Healthcare Tech", "Research", "Hackathons"],
        "github_url": "https://github.com/priyan-ai",
        "linkedin_url": "https://linkedin.com/in/priyanandakumar",
        "skills": [
            ("Python", "Advanced"),
            ("PyTorch", "Advanced"),
            ("scikit-learn", "Advanced"),
            ("FastAPI", "Intermediate"),
            ("Pandas", "Advanced"),
            ("Docker", "Intermediate"),
        ],
    },
    {
        "email": "rohan.d@apex.edu",
        "name": "Rohan Deshmukh",
        "department": "Electronics & Communication",
        "semester": 6,
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "headline": "Embedded Systems & IoT Hardware Engineer",
        "bio": "Firmware enthusiast working on ESP32, STM32, and sensor networks. Seeking software teammates who can build sleek web dashboards for physical hardware integrations.",
        "availability_hours": 12,
        "availability_status": "Open to Offers",
        "availability_note": "Hardware lab access available during weekdays.",
        "preferred_roles": ["Hardware Lead", "IoT Firmware Engineer", "Systems Architect"],
        "interests": ["IoT", "Robotics", "Hardware", "Smart Campus", "CleanTech"],
        "github_url": "https://github.com/rohan-embed",
        "skills": [
            ("C/C++", "Advanced"),
            ("Embedded C", "Advanced"),
            ("ESP32 / Arduino", "Advanced"),
            ("MQTT / LoRaWAN", "Intermediate"),
            ("Python", "Intermediate"),
            ("PCB Design (KiCad)", "Intermediate"),
        ],
    },
    {
        "email": "ananya.v@apex.edu",
        "name": "Ananya Verma",
        "department": "Design & Human-Computer Interaction",
        "semester": 4,
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        "headline": "Product Designer, Design Systems & Usability Researcher",
        "bio": "Bridging engineering and user empathy. I design clean typographic systems, design tokens, and conduct user testing sessions for student and startup projects.",
        "availability_hours": 14,
        "availability_status": "Actively Looking",
        "availability_note": "Ready to design user journeys, high-fidelity prototypes, and design systems.",
        "preferred_roles": ["Product Designer", "UI/UX Lead", "User Researcher"],
        "interests": ["UI/UX Design", "Design Systems", "Accessibility", "Mobile Apps", "EdTech"],
        "portfolio_url": "https://ananyaverma.design",
        "linkedin_url": "https://linkedin.com/in/ananyaverma-design",
        "skills": [
            ("Figma", "Advanced"),
            ("UI/UX Design", "Advanced"),
            ("Design Systems", "Advanced"),
            ("User Research", "Intermediate"),
            ("HTML/CSS", "Intermediate"),
            ("Prototyping", "Advanced"),
        ],
    },
    {
        "email": "kabir.m@apex.edu",
        "name": "Kabir Mehta",
        "department": "Computer Science & Engineering",
        "semester": 7,
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        "headline": "Distributed Systems & Cloud Infrastructure Enthusiast",
        "bio": "Backend specialist focused on high-throughput microservices, Kubernetes clusters, and relational databases. Final year student preparing for production capstone deployment.",
        "availability_hours": 10,
        "availability_status": "Limited Availability",
        "availability_note": "Open for advisory roles or focused backend architecture consulting.",
        "preferred_roles": ["Backend Lead", "DevOps Engineer", "Database Architect"],
        "interests": ["Distributed Systems", "Cloud Native", "DevOps", "Open Source", "Fintech"],
        "github_url": "https://github.com/kabirmehta-sys",
        "skills": [
            ("Go (Golang)", "Advanced"),
            ("PostgreSQL", "Advanced"),
            ("Docker", "Advanced"),
            ("Kubernetes", "Intermediate"),
            ("Redis", "Intermediate"),
            ("Linux Systems", "Advanced"),
        ],
    },
    {
        "email": "sanya.k@apex.edu",
        "name": "Sanya Kapoor",
        "department": "Information Science & Engineering",
        "semester": 5,
        "avatar_url": "https://images.unsplash.com/photo-1534751516642-a171ed28a0e5?w=150&auto=format&fit=crop&q=80",
        "headline": "Mobile App Developer (Flutter & Swift)",
        "bio": "Building cross-platform mobile experiences that feel native. Strong interest in location-based services, peer-to-peer applications, and interactive campus utilities.",
        "availability_hours": 16,
        "availability_status": "Actively Looking",
        "availability_note": "Looking for a hackathon team for the upcoming National Smart Campus challenge.",
        "preferred_roles": ["Mobile Developer", "Frontend Engineer", "App Architect"],
        "interests": ["Mobile Apps", "Fintech", "Campus Utilities", "Hackathons"],
        "github_url": "https://github.com/sanyakapoor-dev",
        "skills": [
            ("Flutter", "Advanced"),
            ("Dart", "Advanced"),
            ("Firebase", "Intermediate"),
            ("REST APIs", "Advanced"),
            ("Swift", "Beginner"),
            ("Git", "Intermediate"),
        ],
    },
]

PROJECTS_DATA = [
    {
        "owner_email": "rohan.d@apex.edu",
        "title": "EcoTrack: Campus Energy & Waste Analytics",
        "tagline": "IoT-connected campus sustainability dashboard tracking kilowatt hours, solar yield, and waste segregation.",
        "description": "EcoTrack is a multidisciplinary capstone project collaborating with the Campus Facilities Office to install wireless sub-metering hardware across student hostels, academic blocks, and dining halls. We are building a responsive web portal where students can compare energy conservation across residences, while administrators analyze peak load patterns and solar generation ROI.",
        "category": "Capstone",
        "max_team_size": 5,
        "duration": "14 Weeks (Semester-long)",
        "deadline": "Oct 28, 2026",
        "required_skills": ["React", "TypeScript", "Tailwind CSS", "FastAPI", "PostgreSQL", "MQTT / LoRaWAN"],
        "preferred_interests": ["CleanTech", "IoT", "Smart Campus", "Web Development"],
        "open_roles": [
            {
                "id": "role-101",
                "title": "Frontend Lead Engineer",
                "spots": 1,
                "filled": 0,
                "skills": ["React", "TypeScript", "Tailwind CSS"],
                "description": "Design and implement responsive live data charts, dorm leaderboards, and administrative controls.",
            },
            {
                "id": "role-102",
                "title": "Backend & Timeseries Specialist",
                "spots": 1,
                "filled": 0,
                "skills": ["FastAPI", "PostgreSQL", "MQTT / LoRaWAN"],
                "description": "Set up ingestion pipelines for sensor packets, calculate hourly rolling averages, and build REST APIs.",
            },
        ],
        "status": "Recruiting",
        "featured": True,
    },
    {
        "owner_email": "priya.n@apex.edu",
        "title": "MedAssist AI: Low-Resource Clinical Voice Transcriber",
        "tagline": "Edge-capable multilingual speech recognition converting doctor-patient dialogues into structured SOAP notes.",
        "description": "Addressing healthcare accessibility in rural primary health centers. Doctors often spend 40% of consultation time typing notes in English while patients speak regional dialects. We are fine-tuning Whisper and local small language models to transcribe bilingual clinical conversations and extract structured prescriptions and vitals.",
        "category": "Hackathon",
        "max_team_size": 4,
        "duration": "48-hour National AI Sprint",
        "deadline": "Nov 04, 2026",
        "required_skills": ["Python", "PyTorch", "React", "FastAPI", "Tailwind CSS"],
        "preferred_interests": ["AI/ML", "Healthcare Tech", "Research", "Hackathons"],
        "open_roles": [
            {
                "id": "role-201",
                "title": "Full-Stack UI Engineer",
                "spots": 1,
                "filled": 0,
                "skills": ["React", "TypeScript", "Tailwind CSS", "FastAPI"],
                "description": "Build audio recording controls, real-time streaming transcript viewer, and editable SOAP note exporter.",
            },
            {
                "id": "role-202",
                "title": "ML Quantization Specialist",
                "spots": 1,
                "filled": 0,
                "skills": ["Python", "PyTorch", "Docker"],
                "description": "Benchmark ONNX runtime latency and test regional language pronunciation tokens.",
            },
        ],
        "status": "Recruiting",
        "featured": True,
    },
    {
        "owner_email": "kabir.m@apex.edu",
        "title": "AuraRover: Open Source Ground Control Station",
        "tagline": "Telemetry visualizer and trajectory planner for autonomous campus rovers and drone competitions.",
        "description": "AuraRover is the student robotics club flagship software system. The rover participates in the University Rover Challenge, requiring robust real-time video feed latency under 120ms, waypoint plotting, and sensor diagnostics. We are rewriting our desktop ground station using web technologies (React + WebSockets + WebGL) to allow collaborative control across multiple laptops during field trials.",
        "category": "Open Source",
        "max_team_size": 6,
        "duration": "Ongoing (Club Project)",
        "deadline": "Nov 15, 2026",
        "required_skills": ["React", "TypeScript", "WebSockets", "Go (Golang)", "Docker"],
        "preferred_interests": ["Robotics", "Open Source", "Distributed Systems"],
        "open_roles": [
            {
                "id": "role-301",
                "title": "WebGL / Map Visualizer Developer",
                "spots": 1,
                "filled": 0,
                "skills": ["React", "TypeScript"],
                "description": "Implement 3D rover orientation compass and GPS waypoint mission planning layer.",
            },
            {
                "id": "role-302",
                "title": "Go Systems Networking Engineer",
                "spots": 1,
                "filled": 0,
                "skills": ["Go (Golang)", "WebSockets", "Linux Systems"],
                "description": "Manage peer-to-peer radio packet framing and bridge ROS2 topic data to client sockets.",
            },
        ],
        "status": "Recruiting",
        "featured": False,
    },
    {
        "owner_email": "sanya.k@apex.edu",
        "title": "CampusRide: Peer-to-Peer Carpooling & Auto Pooling",
        "tagline": "Verified college student commuting network reducing metro shuttle costs and travel times.",
        "description": "Every day over 3,000 day scholars commute between metro stations and the outer campus. Current options involve crowded buses or expensive solo auto rides. CampusRide matches students traveling the same route at similar timetable slots, using college email verification and mutual class schedules to ensure safety and affordability.",
        "category": "Startup",
        "max_team_size": 4,
        "duration": "10 Weeks",
        "deadline": "Oct 30, 2026",
        "required_skills": ["Flutter", "Node.js", "PostgreSQL", "Figma", "REST APIs"],
        "preferred_interests": ["Mobile Apps", "Campus Utilities", "Fintech"],
        "open_roles": [
            {
                "id": "role-401",
                "title": "Backend API Engineer",
                "spots": 1,
                "filled": 0,
                "skills": ["Node.js", "PostgreSQL", "REST APIs"],
                "description": "Design route matching algorithms, ride creation, and student ID token authentication.",
            },
            {
                "id": "role-402",
                "title": "Product UI Designer",
                "spots": 1,
                "filled": 0,
                "skills": ["Figma", "UI/UX Design", "Design Systems"],
                "description": "Create mobile screen workflows for ride booking, safety verification, and profile management.",
            },
        ],
        "status": "Recruiting",
        "featured": False,
    },
    {
        "owner_email": "aarav.sharma@apex.edu",
        "title": "CodeReviewer: Automated Feedback on Student Lab Submissions",
        "tagline": "Pedagogical linter providing contextual hints and style recommendations for Data Structures labs.",
        "description": "Teaching assistants currently spend hundreds of hours manually grading weekly C++ and Java coding assignments. CodeReviewer analyzes AST structures to detect common logic pitfalls, memory leaks, and algorithmic complexity issues without revealing direct answers.",
        "category": "Coursework",
        "max_team_size": 4,
        "duration": "8 Weeks",
        "deadline": "Nov 12, 2026",
        "required_skills": ["React", "TypeScript", "Python", "Docker", "PostgreSQL"],
        "preferred_interests": ["EdTech", "Web Development", "Open Source"],
        "open_roles": [
            {
                "id": "role-501",
                "title": "Backend & Sandbox Engineer",
                "spots": 1,
                "filled": 0,
                "skills": ["Python", "Docker", "PostgreSQL"],
                "description": "Build isolated gVisor/Docker runner containers for student code execution and test pass verification.",
            },
            {
                "id": "role-502",
                "title": "Frontend Code Editor Developer",
                "spots": 1,
                "filled": 0,
                "skills": ["React", "TypeScript"],
                "description": "Integrate Monaco editor with inline lint annotations, test diff view, and hint drawer.",
            },
        ],
        "status": "Recruiting",
        "featured": True,
    },
]


async def seed_database(db: AsyncSession) -> dict:
    """Populate full initial dataset into database. Safe to run multiple times."""
    counts = {"skills": 0, "users": 0, "projects": 0, "applications": 0, "invitations": 0}

    # 1. Skills
    skill_map: dict[str, Skill] = {}
    for name, category in SKILLS_DATA:
        result = await db.execute(select(Skill).where(func.lower(Skill.name) == name.lower()))
        skill = result.scalar_one_or_none()
        if not skill:
            skill = Skill(name=name, category=category)
            db.add(skill)
            await db.flush()
            counts["skills"] += 1
        skill_map[name.lower()] = skill

    # 2. Users & Profiles
    from sqlalchemy import func

    user_map: dict[str, User] = {}
    for s_data in STUDENTS_DATA:
        clean_email = s_data["email"].strip().lower()
        result = await db.execute(
            select(User)
            .where(func.lower(func.trim(User.email)) == clean_email)
            .order_by(User.id.asc())
        )
        user = result.scalars().first()
        if not user:
            user = User(
                email=clean_email,
                password_hash=hash_password(DEFAULT_PASSWORD),
                role="student",
            )
            db.add(user)
            await db.flush()

            profile = StudentProfile(
                user_id=user.id,
                name=s_data["name"],
                avatar_url=s_data.get("avatar_url"),
                department=s_data["department"],
                semester=s_data["semester"],
                college="Apex Institute of Technology",
                headline=s_data.get("headline"),
                bio=s_data.get("bio"),
                interests=json.dumps(s_data.get("interests", [])),
                preferred_roles=json.dumps(s_data.get("preferred_roles", [])),
                availability_hours=s_data.get("availability_hours", 10),
                availability_status=s_data.get("availability_status", "Actively Looking"),
                availability_note=s_data.get("availability_note"),
                github_url=s_data.get("github_url"),
                linkedin_url=s_data.get("linkedin_url"),
                portfolio_url=s_data.get("portfolio_url"),
            )
            db.add(profile)
            await db.flush()

            # Add skills
            for skill_name, level in s_data.get("skills", []):
                sk = skill_map.get(skill_name.lower())
                if sk:
                    db.add(StudentSkill(profile_id=profile.id, skill_id=sk.id, level=level))

            counts["users"] += 1
        user_map[s_data["email"]] = user

    await db.commit()

    # 3. Projects
    project_map: dict[str, Project] = {}
    for p_data in PROJECTS_DATA:
        owner = user_map.get(p_data["owner_email"])
        if not owner:
            continue

        result = await db.execute(
            select(Project).where(Project.title == p_data["title"])
        )
        proj = result.scalar_one_or_none()
        if not proj:
            proj = Project(
                owner_id=owner.id,
                title=p_data["title"],
                tagline=p_data.get("tagline"),
                description=p_data.get("description"),
                category=p_data["category"],
                max_team_size=p_data["max_team_size"],
                duration=p_data.get("duration"),
                deadline=p_data.get("deadline"),
                preferred_interests=json.dumps(p_data.get("preferred_interests", [])),
                open_roles=json.dumps(p_data.get("open_roles", [])),
                status=p_data["status"],
                featured=p_data.get("featured", False),
            )
            db.add(proj)
            await db.flush()

            # Add required skills
            for s_name in p_data.get("required_skills", []):
                sk = skill_map.get(s_name.lower())
                if sk:
                    db.add(ProjectSkill(project_id=proj.id, skill_id=sk.id))

            # Add owner as team member
            db.add(TeamMember(project_id=proj.id, user_id=owner.id, role="Project Owner", is_owner=True))
            counts["projects"] += 1

        project_map[p_data["title"]] = proj

    await db.commit()

    # 4. Sample Applications
    aarav = user_map.get("aarav.sharma@apex.edu")
    priya = user_map.get("priya.n@apex.edu")
    ecotrack = project_map.get("EcoTrack: Campus Energy & Waste Analytics")
    medassist = project_map.get("MedAssist AI: Low-Resource Clinical Voice Transcriber")
    codereviewer = project_map.get("CodeReviewer: Automated Feedback on Student Lab Submissions")

    if aarav and ecotrack:
        exists = await db.execute(
            select(Application).where(Application.project_id == ecotrack.id, Application.applicant_id == aarav.id)
        )
        if not exists.scalar_one_or_none():
            db.add(Application(
                project_id=ecotrack.id,
                applicant_id=aarav.id,
                role_applied="Frontend Lead Engineer",
                statement="I have deep experience with React, TypeScript, and live chart dashboards. Eager to help the campus reduce energy waste.",
                match_score=92.0,
                match_reasons=json.dumps(["3/3 role skills matched", "Active availability", "Direct React & design system experience"]),
                status="Pending",
            ))
            counts["applications"] += 1

    if aarav and medassist:
        exists = await db.execute(
            select(Application).where(Application.project_id == medassist.id, Application.applicant_id == aarav.id)
        )
        if not exists.scalar_one_or_none():
            db.add(Application(
                project_id=medassist.id,
                applicant_id=aarav.id,
                role_applied="Full-Stack UI Engineer",
                statement="Excited about the hackathon timeline. Can build a streamlined, keyboard-accessible web UI for medical audio review.",
                match_score=88.0,
                match_reasons=json.dumps(["React & Tailwind matched", "High reliability rating", "Prior hackathon wins"]),
                status="Pending",
            ))
            counts["applications"] += 1

    if priya and codereviewer:
        exists = await db.execute(
            select(Application).where(Application.project_id == codereviewer.id, Application.applicant_id == priya.id)
        )
        if not exists.scalar_one_or_none():
            db.add(Application(
                project_id=codereviewer.id,
                applicant_id=priya.id,
                role_applied="Backend & Sandbox Engineer",
                statement="I have worked with Docker containers and Python AST inspection in coursework. Can ensure fast, secure student code execution.",
                match_score=89.0,
                match_reasons=json.dumps(["Python & Docker proficiency", "Strong academic track record", "Available 18 hrs/week"]),
                status="Pending",
            ))
            counts["applications"] += 1

    # 5. Sample Invitation
    sanya = user_map.get("sanya.k@apex.edu")
    campusride = project_map.get("CampusRide: Peer-to-Peer Carpooling & Auto Pooling")
    if sanya and aarav and campusride:
        exists = await db.execute(
            select(Invitation).where(Invitation.project_id == campusride.id, Invitation.receiver_id == aarav.id)
        )
        if not exists.scalar_one_or_none():
            db.add(Invitation(
                project_id=campusride.id,
                sender_id=sanya.id,
                receiver_id=aarav.id,
                role="Backend API Engineer",
                message="Hey Aarav, noticed your work on PeerTutor! We need a rock-solid backend for our carpooling app.",
                status="Pending",
            ))
            counts["invitations"] += 1

    await db.commit()
    logger.info("Seed completed: %s", counts)
    return counts

