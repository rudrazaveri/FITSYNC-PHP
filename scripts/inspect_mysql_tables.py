with open('fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    c = f.read()

import re

tables = re.findall(r'CREATE TABLE [^`]*`?([a-zA-Z0-9_]+)`?', c)
print("Tables in fitsync_mysql_schema.sql:", tables[:20])

# Check for trainer tables
for t in ['users', 'trainers', 'trainer_profiles', 'trainer_assignments', 'gyms']:
    print(f"Table {t} present:", t in tables)
