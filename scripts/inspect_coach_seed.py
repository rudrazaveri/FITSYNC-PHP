import re

with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

m = re.search(r'INSERT INTO `trainer_assignments`.*?;', sql, re.DOTALL)
if m:
    print("=== trainer_assignments ===")
    print(m.group(0))

m2 = re.search(r'INSERT INTO `trainer_profiles`.*?;', sql, re.DOTALL)
if m2:
    print("\n=== trainer_profiles ===")
    print(m2.group(0))

m3 = re.search(r'INSERT INTO `trainer_sessions`.*?;', sql, re.DOTALL)
if m3:
    print("\n=== trainer_sessions ===")
    print(m3.group(0))

m4 = re.search(r'INSERT INTO `trainer_notes`.*?;', sql, re.DOTALL)
if m4:
    print("\n=== trainer_notes ===")
    print(m4.group(0))
