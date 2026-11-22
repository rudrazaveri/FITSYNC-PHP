with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

import re
m = re.search(r'CREATE TABLE `fitness_goals` \((.*?)\) ENGINE=InnoDB', sql, re.DOTALL)
if m:
    for line in m.group(1).splitlines():
        line = line.strip()
        if line and not line.startswith('--'):
            print(line)
