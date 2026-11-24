with open('fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    c = f.read()

import re

for t in ['users', 'trainer_profiles', 'trainer_assignments']:
    m = re.search(r'CREATE TABLE [^`]*`?' + t + r'`?\s*\((.*?)\)\s*ENGINE', c, re.DOTALL)
    if m:
        print(f"=== TABLE {t} ===")
        print(m.group(1)[:600])
