import re

with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# Extract table names
table_matches = re.findall(r'CREATE TABLE `(\w+)`', sql)
print(f"Total tables: {len(table_matches)}")

# Extract foreign keys
fk_matches = re.findall(r'FOREIGN KEY \(`(\w+)`\) REFERENCES `(\w+)` \(`(\w+)`\)', sql)
print(f"Total foreign keys: {len(fk_matches)}")

missing = [ref for _, ref, _ in fk_matches if ref not in table_matches]
if missing:
    print(f"Error: Missing tables referenced in FK: {set(missing)}")
else:
    print("SUCCESS: Every single foreign key references an existing table in the schema!")

# Check for banned tables
banned = ['appointments', 'physio_sessions', 'availability_rules', 'consultation_notes']
found_banned = [t for t in banned if t in table_matches]
if found_banned:
    print(f"Error: Found excluded tables: {found_banned}")
else:
    print("SUCCESS: All excluded Doctor & Physiotherapist tables are completely removed.")
