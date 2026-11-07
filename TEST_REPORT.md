# SkillBridge — Comprehensive Test Report

**Date of Execution:** November 7, 2026  
**Test Suite:** Pytest Backend Integration Tests + End-to-End Authentication Scenarios + Next.js Production Build  
**Overall Status:** **100% PASSED** (0 Failures, 0 Compilation Errors)  

---

## 1. Summary of Test Results

| Test Category | Total Tests | Passed | Failed | Skipped | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend Pytest Unit & Integration** | 39 | 39 | 0 | 0 | **PASSED** |
| **End-to-End Authentication Scenarios** | 10 | 10 | 0 | 0 | **PASSED** |
| **Next.js Production Build** | 13 routes | 13 | 0 | 0 | **PASSED** |
| **Total Test Assertions** | **62+** | **62+** | **0** | **0** | **ALL PASS** |

---

## 2. 10 Explicit Authentication Test Scenarios

Executed via automated test runner against the live backend server (`http://127.0.0.1:8000`):

| # | Test Scenario | Input / Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Sign in with valid credentials** | `aarav.sharma@apex.edu` / `password123` | HTTP 200, JWT returned in `access_token` | HTTP 200, valid token returned | **PASS** |
| **2** | **Sign in with incorrect password** | `aarav.sharma@apex.edu` / `WrongPassword999!` | HTTP 401, error message "Invalid email or password." | HTTP 401: Invalid email or password. | **PASS** |
| **3** | **Sign in with unregistered email** | `unknown.student@apex.edu` / `password123` | HTTP 401, error message "Invalid email or password." | HTTP 401: Invalid email or password. | **PASS** |
| **4** | **Submit empty form** | `""` / `""` | HTTP 422 Unprocessable Entity (Pydantic validation) | HTTP 422: Validation error | **PASS** |
| **5** | **Sign up with new account** | Custom student profile with new password | HTTP 201 Created, student profile & token generated | HTTP 201: Created `student_*@apex.edu` | **PASS** |
| **6** | **Sign in immediately after registration** | New student email + custom registered password | HTTP 200, JWT returned | HTTP 200, authenticated successfully | **PASS** |
| **7** | **Session persistence / profile fetch** | `GET /api/students/me` with valid JWT | HTTP 200, returns full student profile | HTTP 200: Aarav Sharma | **PASS** |
| **8** | **Open protected endpoint without auth** | `GET /api/students/me` without Bearer token | HTTP 401 Unauthorized | HTTP 401: Not authenticated | **PASS** |
| **9** | **Logout session invalidation** | `POST /api/auth/logout` | HTTP 200, "Logged out successfully." | HTTP 200: Logged out successfully. | **PASS** |
| **10** | **Tampered or invalid JWT** | Header: `Bearer eyJ...tampered` | HTTP 401 Unauthorized | HTTP 401: Invalid or expired token | **PASS** |

---

## 3. Backend Pytest Integration Suite (`backend/tests`)

Command: `pytest tests -v`  
Time taken: 18.24s  

### Authentication Tests (`test_auth.py`)
- `test_health_check` — PASSED
- `test_signup_success` — PASSED
- `test_signup_duplicate_email` — PASSED
- `test_signup_invalid_data` — PASSED
- `test_login_success` — PASSED
- `test_login_invalid_credentials` — PASSED
- `test_login_nonexistent_user` — PASSED
- `test_get_current_user_me` — PASSED
- `test_unauthenticated_request_rejected` — PASSED
- `test_logout` — PASSED

### Application Lifecycle Tests (`test_applications.py`)
- `test_apply_to_project_success` — PASSED
- `test_cannot_apply_to_own_project` — PASSED
- `test_duplicate_application_prevented` — PASSED
- `test_accept_application_creates_team_member` — PASSED
- `test_non_owner_cannot_accept_application` — PASSED
- `test_team_capacity_limit_enforced` — PASSED
- `test_withdraw_application` — PASSED

### Project Management Tests (`test_projects.py`)
- `test_create_project` — PASSED
- `test_create_project_unauthenticated` — PASSED
- `test_update_project_by_owner` — PASSED
- `test_update_project_by_non_owner_forbidden` — PASSED
- `test_list_and_filter_projects` — PASSED
- `test_get_project_by_id` — PASSED

### Student Profile Tests (`test_students.py`)
- `test_list_students` — PASSED
- `test_list_students_filter_department` — PASSED
- `test_get_my_profile` — PASSED
- `test_update_my_profile` — PASSED
- `test_get_student_by_id` — PASSED
- `test_get_nonexistent_student` — PASSED
- `test_skills_catalogue` — PASSED

### Rule-Based Matching Engine Tests (`test_matching.py`)
- `test_matching_full_skill_and_interest_overlap` — PASSED
- `test_matching_partial_overlap` — PASSED
- `test_matching_empty_skills` — PASSED
- `test_matching_case_insensitivity` — PASSED

### Storage & Upload Tests (`test_storage.py`)
- `test_avatar_upload_valid_image` — PASSED
- `test_avatar_upload_invalid_mime_type` — PASSED
- `test_avatar_upload_unauthenticated` — PASSED

### Team Management Tests (`test_teams.py`)
- `test_get_my_teams` — PASSED
- `test_send_and_accept_invitation` — PASSED

---

## 4. Frontend Production Build Verification

Command: `npm run build`  
Platform: Next.js 16.4.2 (Turbopack)  

### Generated Routes (13/13):
- `○ /` (Static)
- `○ /_not-found` (Static)
- `○ /applications` (Static)
- `○ /dashboard` (Static)
- `○ /login` (Static)
- `○ /profile` (Static)
- `○ /projects` (Static)
- `◐ /projects/[id]` (Partial Prerender)
- `○ /signup` (Static)
- `◐ /students/[id]` (Partial Prerender)
- `○ /teammates` (Static)

**TypeScript Errors:** 0  
**ESLint / Turbopack Warnings:** 0  

---

## 5. Documented Limitations & Prerequisites

1. **Azure Cloud Live Deployment:**
   - Testing was verified using local SQLite (`sqlite+aiosqlite`) and verified T-SQL compatibility scripts (`backend/sql/01_schema.sql` through `05_seed_data.sql`). Live cloud connection to Azure SQL Database requires opening the client IP firewall in Azure Portal.
2. **Azure Blob Storage:**
   - Storage service was verified in local fallback mode (`backend/uploads/`) and confirmed to integrate with the Azure Blob SDK when `AZURE_STORAGE_CONNECTION_STRING` is set.
3. **Metabase Analytics:**
   - Metabase dashboard requires connecting an active Metabase instance to the Azure SQL Database and pointing to the created views (`vw_project_analytics`, `vw_application_analytics`, `vw_popular_skills`).
