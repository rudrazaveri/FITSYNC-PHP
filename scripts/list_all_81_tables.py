import re

with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

tables = re.findall(r'CREATE TABLE `([^`]+)`', sql)
print(f"Total tables: {len(tables)}")
for i, t in enumerate(tables, 1):
    print(f"{i:2d}. {t}")
