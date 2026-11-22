import re

with open('database/fitsync_mysql_schema.sql', 'r', encoding='utf-8') as f:
    text = f.read()

# Pattern for section headers like "-- 1. FILES & MEDIA ASSET REGISTRY"
sec_pattern = r'--\s+(\d+\.\s+[A-Z0-9\s,&()*\-]+)\n'
splits = list(re.finditer(sec_pattern, text))

all_tables = []
print("="*60)
print("EXACT SECTION-BY-SECTION TABLE BREAKDOWN")
print("="*60)

for i, m in enumerate(splits):
    sec_title = m.group(1).strip()
    start_pos = m.end()
    end_pos = splits[i+1].start() if i + 1 < len(splits) else len(text)
    chunk = text[start_pos:end_pos]
    tables = re.findall(r'CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+[`"]?([a-zA-Z0-9_]+)[`"]?', chunk, re.IGNORECASE)
    all_tables.extend(tables)
    print(f"\n{sec_title} ({len(tables)} tables):")
    for t in tables:
        print(f"  - {t}")

print("\n" + "="*60)
print(f"TOTAL TABLES DISCOVERED: {len(all_tables)}")
print(f"UNIQUE TABLES: {len(set(all_tables))}")
print("="*60)
