import re, hashlib, sys

schema_file = 'database/fitsync_mysql_schema.sql'
root_file = 'fitsync_mysql_schema.sql'

with open(schema_file, 'r', encoding='utf-8') as f:
    sql = f.read()

with open(schema_file, 'rb') as f:
    b1 = f.read()
with open(root_file, 'rb') as f:
    b2 = f.read()

sha1 = hashlib.sha256(b1).hexdigest()
sha2 = hashlib.sha256(b2).hexdigest()

print("=== 1. FILE INTEGRITY & CONSISTENCY ===")
print(f"database/fitsync_mysql_schema.sql: {len(b1)} bytes, SHA-256: {sha1}")
print(f"fitsync_mysql_schema.sql:          {len(b2)} bytes, SHA-256: {sha2}")
print(f"Byte-for-byte identical: {sha1 == sha2}")

# 2. Table counts and categorization
print("\n=== 2. TABLE COUNT & CATEGORIZATION ===")
create_table_matches = re.findall(r'CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+`?([a-zA-Z0-9_]+)`?\s*\((.*?)\)\s*ENGINE\s*=\s*InnoDB', sql, re.DOTALL | re.IGNORECASE)
tables = [m[0] for m in create_table_matches]
print(f"Total CREATE TABLE statements found: {len(tables)}")

# Categorize tables based on sections in the SQL
sections = re.findall(r'(-- =+\n-- SECTION \d+: ([^\n]+)\n-- =+)(.*?)(?=(?:-- =+\n-- SECTION \d+:|\Z))', sql, re.DOTALL)
print(f"Number of sections found in SQL: {len(sections)}")

categorized_tables = {}
for header_block, sec_name, sec_body in sections:
    sec_tables = re.findall(r'CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+`?([a-zA-Z0-9_]+)`?', sec_body, re.IGNORECASE)
    categorized_tables[sec_name.strip()] = sec_tables

total_in_sections = 0
for sec_name, t_list in categorized_tables.items():
    print(f"  {sec_name}: {len(t_list)} tables -> {t_list}")
    total_in_sections += len(t_list)

print(f"Total tables categorized across sections: {total_in_sections}")

# 3. Check Demo Accounts and Auth Seed Data
print("\n=== 3. DEMO ACCOUNTS & AUTHENTICATION ===")
import bcrypt

users_match = re.search(r'INSERT\s+INTO\s+`users`\s*\((.*?)\)\s*VALUES\s*(.*?);', sql, re.DOTALL | re.IGNORECASE)
if users_match:
    cols = [c.strip(' `\n') for c in users_match.group(1).split(',')]
    val_rows = re.findall(r'\((.*?)\)(?:,\s*\n|\s*;)', users_match.group(2) + ';', re.DOTALL)
    print(f"Columns in users table insert: {cols}")
    print(f"Rows in users table insert: {len(val_rows)}")
    
    id_idx = cols.index('id')
    email_idx = cols.index('email')
    pwd_idx = cols.index('password_hash')
    role_idx = cols.index('role')
    name_idx = cols.index('full_name')
    
    for r in val_rows:
        parts = [p.strip(" '\t\n") for p in re.split(r",\s*(?=(?:[^']*'[^']*')*[^']*$)", r)]
        user_id = parts[id_idx]
        email = parts[email_idx]
        phash = parts[pwd_idx]
        role = parts[role_idx]
        name = parts[name_idx]
        is_valid = bcrypt.checkpw(b'password123', phash.encode('utf-8'))
        print(f"  User {user_id} ({email}) | Role: {role} | Name: {name}")
        print(f"    Hash: {phash} | password_verify('password123') -> {is_valid}")

# 4. Check Demo Relationships: Gyms, Gym Trainers, Memberships, Trainer Assignments
print("\n=== 4. DEMO RELATIONSHIPS VERIFICATION ===")
def inspect_inserts(table_name):
    m = re.search(r'INSERT\s+INTO\s+`' + table_name + r'`\s*\((.*?)\)\s*VALUES\s*(.*?);', sql, re.DOTALL | re.IGNORECASE)
    if m:
        cols = [c.strip(' `\n') for c in m.group(1).split(',')]
        val_rows = re.findall(r'\((.*?)\)(?:,\s*\n|\s*;)', m.group(2) + ';', re.DOTALL)
        print(f"Table `{table_name}` ({len(val_rows)} rows):")
        for r in val_rows:
            parts = [p.strip(" '\t\n") for p in re.split(r",\s*(?=(?:[^']*'[^']*')*[^']*$)", r)]
            d = dict(zip(cols, parts))
            print(f"  Row: {d}")
    else:
        print(f"Table `{table_name}` has no INSERT statement.")

inspect_inserts('gyms')
inspect_inserts('gym_trainers')
inspect_inserts('memberships')
inspect_inserts('trainer_assignments')

# 5. Fitness Document Functionality (health_reports & report_categories)
print("\n=== 5. FITNESS DOCUMENT FUNCTIONALITY INSPECTION ===")
for tname in ['health_reports', 'report_categories']:
    m = re.search(r'CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+`?' + tname + r'`?\s*\((.*?)\)\s*ENGINE', sql, re.DOTALL | re.IGNORECASE)
    if m:
        print(f"Structure of `{tname}`:")
        for line in m.group(1).splitlines():
            line = line.strip()
            if line and not line.startswith('--'):
                print(f"    {line}")
    m_ins = re.search(r'INSERT\s+INTO\s+`?' + tname + r'`?\s*\((.*?)\)\s*VALUES\s*(.*?);', sql, re.DOTALL | re.IGNORECASE)
    if m_ins:
        print(f"  Seed data in `{tname}` found:")
        print(f"    {m_ins.group(2).strip()[:200]}...")

# 6. Scheduling Functionality Inspection
print("\n=== 6. SCHEDULING FUNCTIONALITY INSPECTION ===")
for tname in ['gym_operating_hours', 'scheduled_workouts', 'trainer_assignments']:
    m = re.search(r'CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+`?' + tname + r'`?\s*\((.*?)\)\s*ENGINE', sql, re.DOTALL | re.IGNORECASE)
    if m:
        print(f"Structure of `{tname}`:")
        for line in m.group(1).splitlines():
            line = line.strip()
            if line and not line.startswith('--'):
                print(f"    {line}")
