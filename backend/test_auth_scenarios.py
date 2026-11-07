import urllib.request
import json
import urllib.error
import time

BASE = "http://127.0.0.1:8000"

def req(method, path, body=None, token=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode("utf-8"))
        except Exception:
            err_body = {"detail": str(e)}
        return e.code, err_body
    except Exception as e:
        return 0, {"detail": str(e)}

def run_all():
    print("==================================================")
    print("SKILLBRIDGE 10 AUTHENTICATION TEST SCENARIOS")
    print("==================================================")
    all_passed = True

    # 1. Sign in with valid credentials
    status, body = req("POST", "/api/auth/login", {"email": "aarav.sharma@apex.edu", "password": "password123"})
    p1 = (status == 200 and "access_token" in body)
    all_passed = all_passed and p1
    print(f"Scenario 1: Sign in with valid credentials -> {'PASS' if p1 else 'FAIL'} (HTTP {status})")
    valid_token = body.get("access_token")

    # 2. Sign in with incorrect password
    status, body = req("POST", "/api/auth/login", {"email": "aarav.sharma@apex.edu", "password": "WrongPassword999!"})
    p2 = (status == 401 and "detail" in body)
    all_passed = all_passed and p2
    print(f"Scenario 2: Sign in with incorrect password -> {'PASS' if p2 else 'FAIL'} (HTTP {status}: {body.get('detail')})")

    # 3. Sign in with unregistered email
    status, body = req("POST", "/api/auth/login", {"email": "unknown.student@apex.edu", "password": "password123"})
    p3 = (status == 401 and "detail" in body)
    all_passed = all_passed and p3
    print(f"Scenario 3: Sign in with unregistered email -> {'PASS' if p3 else 'FAIL'} (HTTP {status}: {body.get('detail')})")

    # 4. Submit empty form
    status, body = req("POST", "/api/auth/login", {"email": "", "password": ""})
    p4 = (status == 422)
    all_passed = all_passed and p4
    print(f"Scenario 4: Submit empty form validation -> {'PASS' if p4 else 'FAIL'} (HTTP {status})")

    # 5. Sign up with new account
    unique_email = f"student_{int(time.time())}@apex.edu"
    status, body = req("POST", "/api/auth/signup", {
        "name": "Integration Test Student",
        "email": unique_email,
        "password": "CustomPassword2026!",
        "department": "Computer Science & Engineering",
        "semester": 4
    })
    p5 = (status == 201 and "access_token" in body and body.get("user", {}).get("email") == unique_email)
    all_passed = all_passed and p5
    print(f"Scenario 5: Sign up with new account -> {'PASS' if p5 else 'FAIL'} (HTTP {status}, created {unique_email})")

    # 6. Sign in immediately after registration with custom password
    status, body = req("POST", "/api/auth/login", {"email": unique_email, "password": "CustomPassword2026!"})
    p6 = (status == 200 and "access_token" in body)
    all_passed = all_passed and p6
    print(f"Scenario 6: Sign in immediately with registered credentials -> {'PASS' if p6 else 'FAIL'} (HTTP {status})")

    # 7. Refresh / fetch current profile using token (persistence)
    status, body = req("GET", "/api/students/me", token=valid_token)
    p7 = (status == 200 and body.get("name") == "Aarav Sharma")
    all_passed = all_passed and p7
    print(f"Scenario 7: Session token persistence (/api/students/me) -> {'PASS' if p7 else 'FAIL'} (HTTP {status}, user={body.get('name')})")

    # 8. Open protected endpoint without logging in
    status, body = req("GET", "/api/students/me")
    p8 = (status == 401)
    all_passed = all_passed and p8
    print(f"Scenario 8: Open protected endpoint without auth token -> {'PASS' if p8 else 'FAIL'} (HTTP {status}: {body.get('detail')})")

    # 9. Logout
    status, body = req("POST", "/api/auth/logout", token=valid_token)
    p9 = (status == 200 and "message" in body)
    all_passed = all_passed and p9
    print(f"Scenario 9: Logout endpoint invalidation -> {'PASS' if p9 else 'FAIL'} (HTTP {status}: {body.get('message')})")

    # 10. Tampered or expired token
    status, body = req("GET", "/api/students/me", token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature")
    p10 = (status == 401)
    all_passed = all_passed and p10
    print(f"Scenario 10: Tampered or invalid JWT rejected -> {'PASS' if p10 else 'FAIL'} (HTTP {status}: {body.get('detail')})")

    print("==================================================")
    print(f"OVERALL RESULT: {'ALL 10 SCENARIOS PASSED' if all_passed else 'SOME SCENARIOS FAILED'}")
    print("==================================================")
    return all_passed

if __name__ == "__main__":
    success = run_all()
    exit(0 if success else 1)
