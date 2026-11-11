import os
import requests

# Read the env file
env_path = 'D:/Sem Projects/Skill Bridge/.env'
with open(env_path, 'r') as f:
    env_content = f.read()

# Extract NEXT_PUBLIC_API_URL
api_url = None
for line in env_content.split('\n'):
    if line.startswith('NEXT_PUBLIC_API_URL='):
        api_url = line.split('=', 1)[1].strip()
        break

print(f'API URL from .env: {api_url}')

if api_url:
    # Test the API health endpoint
    try:
        response = requests.get(f'{api_url}/api/auth/me', timeout=5)
        print(f'API status: {response.status_code}')
        if response.status_code == 401:
            print('API is running (401 means no token, but endpoint exists)')
        elif response.status_code == 200:
            print('API is running and returning user data')
        else:
            print(f'API returned status: {response.status_code}')
    except Exception as e:
        print(f'API connection error: {e}')

    # Try the auth signup/login endpoints
    print('\nTesting auth endpoints...')
    
    # Test signup
    try:
        signup_resp = requests.post(f'{api_url}/api/auth/signup', 
            json={'name': 'Test User', 'email': 'testuser@apex.edu', 'password': 'SkillBridge2026!', 'department': 'Computer Science', 'semester': 5},
            timeout=5)
        print(f'Signup status: {signup_resp.status_code}')
        if signup_resp.status_code == 201:
            print('Signup succeeded - user created')
        elif signup_resp.status_code == 409:
            print('Signup failed - user already exists (good!)')
        else:
            print(f'Signup response: {signup_resp.text[:200]}')
    except Exception as e:
        print(f'Signup error: {e}')
    
    # Test login with the same credentials
    try:
        login_resp = requests.post(f'{api_url}/api/auth/login', 
            json={'email': 'testuser@apex.edu', 'password': 'SkillBridge2026!'},
            timeout=5)
        print(f'Login status: {login_resp.status_code}')
        if login_resp.status_code == 200:
            data = login_resp.json()
            print(f'Login succeeded! Token: {data.get("access_token", "N/A")[:50]}...')
            print(f'User: {data.get("user", {})}')
        elif login_resp.status_code == 401:
            print('Login failed - invalid credentials')
        else:
            print(f'Login response: {login_resp.text[:200]}')
    except Exception as e:
        print(f'Login error: {e}')