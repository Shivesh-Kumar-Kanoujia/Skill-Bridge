import os

# Read the backend .env to see the SQL server name
backend_env = 'D:/Sem Projects/Skill Bridge/backend/.env'
with open(backend_env, 'r') as f:
    content = f.read()

# Extract the server name from DATABASE_URL
for line in content.split('\n'):
    if 'DATABASE_URL' in line and 'mssql' in line:
        print(f'Found DATABASE_URL line: {line.strip()}')
        # The server is after @ and before :1433
        if '@' in line:
            server_part = line.split('@')[1]
            server_name = server_part.split(':')[0]
            print(f'Azure SQL Server: {server_name}')
            break

# Also check AZURE_STORAGE for storage account
for line in content.split('\n'):
    if 'AZURE_STORAGE' in line and 'AccountName' in line:
        print(f'Found storage line: {line.strip()}')