# SkillBridge — Premium Student Collaboration Platform

SkillBridge is an editorial, university-tech collaboration platform connecting college students with suitable teammates for hackathons, semester capstones, and technical initiatives.

## 🎨 Visual Identity & Design System
Designed specifically with a distinctive, human, academic aesthetic:
- **Canvas / Background**: `#F7F6F2` (Warm Ivory)
- **Primary Forest Green**: `#183C35` (Primary actions, active states, branding)
- **Secondary Sage**: `#DDE8D8` (Supportive badges, secondary buttons)
- **Muted Amber Accent**: `#D99A62` (Subtle highlights, stars, pending invitations)
- **Main Text**: `#292D2A`
- **Muted Text**: `#636C66`
- **Card Surfaces**: `#FFFFFF` with thin neutral borders (`#E2E0D8`) and restrained corner radii.

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router with Partial Prerendering & Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Icons**: Lucide icons & custom brand SVGs
- **State & Persistence**: React Context + `localStorage` for interactive prototype persistence
- **Architecture**: Modular Monolith ready for FastAPI REST API and Supabase/PostgreSQL backend integration

## 📂 Routes Implemented
| Route | Page | Key Features |
|---|---|---|
| `/` | Landing Page | Hero with primary & secondary CTAs, live project opportunities, 3-step workflow, and student preview |
| `/login` | Authentication | Accessible password visibility toggle, institutional email validation, demo autofill |
| `/signup` | Student Registration | Full Name, University Email, Department, and Semester selectors with field validation |
| `/dashboard` | Student Dashboard | Welcome header, profile completion gauge, preview mode toggle (new user empty states vs active), rule-based match recommendations |
| `/projects` | Discover Projects | Full-text search, category filter pills, required skills dropdown, multi-sort, and clear filters |
| `/projects/[id]` | Project Detail | Requirements, open roles with spot counters, coordinator profile, rule-based compatibility score breakdown, interactive Apply modal |
| `/teammates` | Find Teammates | Searchable student directory, department, semester, availability, and skill filters, complementary match score |
| `/students/[id]` | Student Profile Detail | Academic background, verified skills with proficiency badges, portfolio & GitHub links, interactive Invite modal |
| `/profile` | Profile Editor | Clean toggle between View and Edit modes, add/remove skills with categories, availability hours and scheduling notes |
| `/applications` | Applications & Teams | 4-tab interface (Received Applications, Submitted Applications, Team Invitations, My Teams) with confirmation dialogs |

## 🧮 Explainable Rule-Based Compatibility Engine (`src/lib/matching.ts`)
Instead of claiming opaque machine learning, SkillBridge uses a transparent, deterministic matching algorithm:
- **50% Skill Overlap**: Direct comparison between student skills and project requirements
- **25% Interest Alignment**: Overlap between project domains and student interests
- **15% Availability Fit**: Weekly hours commitment and availability status
- **10% Academic Fit**: Coursework and semester alignment

Scores are labeled as transparent estimates (e.g., *92% Match Estimate — 3/3 required skills matched directly*).

## 🚀 Running the Project
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production build
npm run build
npm start
```
The app will be accessible at `http://localhost:3000`.
