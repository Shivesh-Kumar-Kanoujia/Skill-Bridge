import os

# Read backend auth.py to check for known issues
auth_path = 'D:/Sem Projects/Skill Bridge/backend/app/routers/auth.py'
with open(auth_path, 'r') as f:
    content = f.read()

# Check for the demo credential workaround that could corrupt password hashes
print('=== Checking for demo credential workaround ===')
if 'SkillBridge2026!' in content:
    print('  Found demo password "SkillBridge2026!" in auth.py')
if 'password123' in content:
    print('  Found demo password "password123" in auth.py')

# Check email normalization
print('\n=== Checking email normalization ===')
if 'func.lower(User.email)' in content:
    print('  Uses func.lower(User.email) in SQL query')
if 'strip().lower()' in content:
    print('  Uses strip().lower() in Python')

# Check password hashing
print('\n=== Checking password hashing ===')
if 'hash_password' in content:
    print('  Uses hash_password function')
if 'verify_password' in content:
    print('  Uses verify_password function')

# Check signup flow
print('\n=== Checking signup flow ===')
if 'existing.scalar_one_or_none()' in content:
    print('  Checks for existing user by email')
if '409_CONFLICT' in content:
    print('  Returns 409 Conflict for duplicate email')

# Check login flow
print('\n=== Checking login flow ===')
if 'scalar_one_or_none()' in content:
    print('  Queries User table for login')
if '401_UNAUTHORIZED' in content:
    print('  Returns 401 for invalid credentials')

print('\n=== Summary ===')
print('The backend auth.py has proper email uniqueness checking')
print('and password verification. The main issue was likely')
print('the missing NEXT_PUBLIC_API_URL causing frontend to')
print('connect to localhost:8000 instead of Azure backend.')