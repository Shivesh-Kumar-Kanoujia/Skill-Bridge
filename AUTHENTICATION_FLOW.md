# SkillBridge — Complete Authentication & Authorization Architecture

**Document Version:** 1.0.0  
**Target Architecture:** FastAPI Backend (JWT + Bcrypt) + Next.js 16 (App Router)  

---

## 1. Authentication Overview

SkillBridge uses a stateless **JSON Web Token (JWT)** authentication mechanism with **bcrypt** password hashing:
- **Hash Function:** `bcrypt.hashpw()` with direct salt generation (72-byte truncation for bcrypt specification compatibility).
- **Token Format:** Signed JSON Web Token (`HS256`), containing:
  - `sub`: User ID (`str(user.id)`)
  - `exp`: Expiration timestamp (default: 24 hours / 1440 minutes).
- **Transport:** HTTP Authorization header: `Authorization: Bearer <token>`.
- **Client Storage:** `localStorage` key `sb_token`, with accompanying profile metadata in `sb_current_user` and boolean flag `sb_auth`.

---

## 2. Authentication Flows

### Flow 1: Student Registration (Sign Up)

```
[Browser / User]
       │
       ▼  Enters Name, Email, Password, Department, Semester
[src/app/signup/page.tsx]
       │
       ▼  Calls signup({ name, email, password, department, semester })
[src/context/SkillBridgeContext.tsx]
       │
       ▼  POST /api/auth/signup (JSON payload)
[FastAPI: backend/app/routers/auth.py]
       │
       ├─► 1. Validate email format (@apex.edu or general email)
       ├─► 2. Check for duplicate email in User table (409 Conflict if exists)
       ├─► 3. Hash password using bcrypt.hashpw(password.encode('utf-8'))
       ├─► 4. Insert User record (role='student', is_active=True)
       ├─► 5. Insert StudentProfile record (linked by user_id)
       ├─► 6. Log audit action ('SIGNUP')
       ├─► 7. Generate JWT access_token with sub=str(user.id)
       │
       ▼  Returns HTTP 201 Created: { access_token, user: { id, email, role } }
[src/lib/api.ts]
       │
       ├─► Stores token: localStorage.setItem('sb_token', access_token)
       ├─► Fetches full profile: GET /api/students/me
       └─► Updates context state: setCurrentUser(profile), setIsAuthenticated(true)
       │
       ▼  Redirects
[Browser navigates to /dashboard]
```

---

### Flow 2: Student Sign In (Login)

```
[Browser / User]
       │
       ▼  Enters Email and Password (or clicks 'Autofill Demo')
[src/app/login/page.tsx]
       │
       ▼  Calls login(email, password)
[src/context/SkillBridgeContext.tsx]
       │
       ▼  POST /api/auth/login { email, password }
[FastAPI: backend/app/routers/auth.py]
       │
       ├─► 1. Query User by email
       ├─► 2. If not found -> HTTP 401: "Invalid email or password."
       ├─► 3. Verify password via bcrypt.checkpw(plain_bytes, hash_bytes)
       ├─► 4. If invalid -> HTTP 401: "Invalid email or password."
       ├─► 5. Check if user.is_active -> HTTP 403 if deactivated
       ├─► 6. Log audit action ('LOGIN')
       ├─► 7. Generate JWT access_token with sub=str(user.id)
       │
       ▼  Returns HTTP 200 OK: { access_token, token_type: "bearer", user: { id, email, role } }
[src/lib/api.ts]
       │
       ├─► setAuthToken(res.access_token) -> localStorage.setItem('sb_token', token)
       ├─► GET /api/students/me with Authorization: Bearer <token>
       ├─► Updates context: setCurrentUser(profile), setIsAuthenticated(true)
       ├─► Fetches user applications and invitations
       └─► Shows toast notification: "Welcome back, {name}!"
       │
       ▼  Redirects
[Browser navigates to /dashboard]
```

---

### Flow 3: Session Persistence & Page Refresh

1. On page load / initial render, `SkillBridgeContext.tsx` reads `localStorage`:
   - Checks if `sb_token` exists and `sb_auth === 'true'`.
   - If present, sets `isAuthenticated = true` and loads cached user from `sb_current_user`.
   - Signals `isAuthReady = true`.
2. Concurrently dispatches `GET /api/students/me` to the backend:
   - Validates the token against the backend.
   - If valid, syncs live profile, applications, and invitations.
   - If token expired or rejected (401), clears tokens and redirects to login.

---

### Flow 4: Sign Out (Logout)

```
[User clicks 'Logout' in Navbar or Sidebar]
       │
       ▼
[SkillBridgeContext.logout()]
       │
       ├─► 1. Dispatches POST /api/auth/logout to record audit log
       ├─► 2. Clears localStorage:
       │        - localStorage.removeItem('sb_token')
       │        - localStorage.setItem('sb_auth', 'false')
       │        - localStorage.removeItem('sb_current_user')
       ├─► 3. Resets state: setIsAuthenticated(false)
       ├─► 4. Protected route guard detects unauthenticated state
       │
       ▼  Redirects
[Browser navigates to /login]
```

---

## 3. Protected Route Architecture

SkillBridge protects sensitive student pages (`/dashboard`, `/profile`, `/applications`) via the `useProtectedRoute()` hook:

```typescript
export function useProtectedRoute() {
  const { isAuthenticated, isAuthReady } = useSkillBridge();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthReady, isAuthenticated, router]);

  return { isAuthenticated, isAuthReady };
}
```

### Protection Characteristics:
1. **No Flash of Protected Content:** Pages render a clean animated loading spinner (`Checking session...`) until `isAuthReady` resolves.
2. **Reverse Redirection:** Authenticated users visiting `/login` or `/signup` are automatically redirected to `/dashboard`.
3. **Double Verification:** Frontend route guard protects the UI, while FastAPI backend dependencies (`get_current_user_full`) reject unauthorized API calls with `HTTP 401 Unauthorized`.

---

## 4. Backend Authorization & Role-Based Access Controls

| Endpoint | Access Level | Enforcement Mechanism |
| :--- | :--- | :--- |
| `POST /api/auth/signup` | Public | None |
| `POST /api/auth/login` | Public | None |
| `POST /api/auth/logout` | Optional Auth | `get_current_user_optional` |
| `GET /api/auth/me` | Authenticated | `get_current_user_full` |
| `GET /api/students` | Public | None |
| `GET /api/students/me` | Authenticated | `get_current_user_full` |
| `PUT /api/students/me` | Authenticated | `get_current_user_full` (Only own profile) |
| `POST /api/students/me/avatar` | Authenticated | `get_current_user_full` |
| `GET /api/projects` | Public | None |
| `POST /api/projects` | Authenticated | `get_current_user_full` (Sets owner_id = user_id) |
| `PUT /api/projects/{id}` | Project Owner | Validates `project.owner_id == user_id` |
| `POST /api/applications` | Authenticated | Blocks owner from applying to own project |
| `POST /api/applications/{id}/action` | Project Owner | Validates `project.owner_id == user_id` |
| `POST /api/applications/{id}/withdraw` | Applicant | Validates `application.applicant_id == user_id` |
