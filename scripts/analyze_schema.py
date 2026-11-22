import re

with open('fitsync_schema.sql', 'r', encoding='utf-8', errors='ignore') as f:
    sql = f.read()

medical_words = ['appointment', 'physio', 'doctor', 'availability', 'consultation']
tables = re.findall(r'CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?([a-zA-Z0-9_]+)`?\s*\((.*?)\);', sql, re.DOTALL | re.IGNORECASE)

medical_tables = [
    'availability_rules', 'availability_blocks', 'appointments', 'reschedule_requests',
    'consultation_notes', 'physio_sessions', 'physio_exercise_assignments', 'physio_exercise_logs',
    'report_shares', 'assessment_shares'
]

print(f"Total tables: {len(tables)}")
for t_name, t_body in tables:
    if t_name in medical_tables:
        continue
    for w in medical_words:
        if w in t_body.lower():
            matches = [line.strip() for line in t_body.split('\n') if w in line.lower()]
            print(f"Table [{t_name}] contains '{w}':")
            for m in matches:
                print('   ', m)
