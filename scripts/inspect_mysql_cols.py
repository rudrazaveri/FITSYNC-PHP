with open('fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    c = f.read()

import re

for t in ['user_profiles', 'gyms']:
    m = re.search(r'CREATE TABLE [^`]*`?' + t + r'`?\s*\((.*?)\)\s*ENGINE', c, re.DOTALL)
    if m:
        print(f"=== {t} ===")
        print(m.group(1))
