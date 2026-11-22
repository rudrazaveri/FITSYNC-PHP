import re

with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

m = re.search(r'CREATE TABLE `workout_sessions` \((.*?)\) ENGINE=InnoDB', sql, re.DOTALL)
if m:
    print('workout_sessions definition:\n', m.group(1))

with open('includes/trainer_data.php', 'r', encoding='utf-8') as f:
    code = f.read()

idx = code.find('workout_sessions')
while idx != -1:
    print("--- trainer_data query around workout_sessions ---")
    print(code[max(0, idx-100):min(len(code), idx+300)])
    idx = code.find('workout_sessions', idx+1)
