with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

import re
for t in ['body_measurements', 'fitness_assessments', 'workout_sessions', 'trainer_availability_rules']:
    m = re.search(r'CREATE TABLE `' + t + r'` \((.*?)\) ENGINE=InnoDB', sql, re.DOTALL)
    if m:
        print(f"=== {t} ===")
        for line in m.group(1).splitlines():
            line = line.strip()
            if line and not line.startswith('--'):
                print("  ", line)
        print()
