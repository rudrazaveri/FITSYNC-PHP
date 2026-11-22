with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

import re

tables_to_check = [
    'users',
    'user_profiles',
    'user_settings',
    'auth_tokens',
    'user_sessions',
    'notification_preferences',
    'gyms',
    'memberships',
    'trainer_assignments'
]

for t in tables_to_check:
    m = re.search(r'CREATE TABLE `' + t + r'` \((.*?)\) ENGINE=InnoDB', sql, re.DOTALL)
    if m:
        print(f"=== TABLE `{t}` ===")
        for line in m.group(1).splitlines():
            line = line.strip()
            if line and not line.startswith('--'):
                print("  ", line)
        print()
    else:
        print(f"Table `{t}` not found!")
