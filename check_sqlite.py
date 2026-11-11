import os
import sqlite3

db_path = 'D:/Sem Projects/Skill Bridge/backend/skillbridge.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = c.fetchall()
    print('SQLite tables:', tables)
    c.execute("SELECT id, email, role FROM users ORDER BY id")
    users = c.fetchall()
    print(f'SQLite users ({len(users)}):')
    for u in users:
        print(f'  ID={u[0]}, email={u[1]}, role={u[2]}')
    conn.close()
else:
    print('SQLite not found at expected path')