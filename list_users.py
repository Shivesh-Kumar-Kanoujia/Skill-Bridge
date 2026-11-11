import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'backend', 'skillbridge.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("=== Tables ===")
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = c.fetchall()
print(tables)

print("\n=== Users ===")
c.execute("SELECT id, email, role FROM users ORDER BY id")
users = c.fetchall()
print(f"Total users: {len(users)}")
for u in users:
    print(f"  ID={u[0]}, email={u[1]}, role={u[2]}")

print("\n=== Student Profiles ===")
c.execute("SELECT * FROM student_profile ORDER BY user_id")
profiles = c.fetchall()
print(f"Total profiles: {len(profiles)}")
for p in profiles:
    print(f"  user_id={p[0]}, name={p[1]}, department={p[2]}, college={p[3]}, semester={p[4]}")

conn.close()