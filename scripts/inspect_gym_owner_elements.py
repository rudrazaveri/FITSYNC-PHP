import re

with open('gym_owner/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Find all getElementById
get_el_ids = re.findall(r'document\.getElementById\([\'"]([^\'"]+)[\'"]\)', c)
print("getElementById targets:", set(get_el_ids))

# Check which ones exist in the HTML as id="..."
for target_id in set(get_el_ids):
    exists = f'id="{target_id}"' in c or f"id='{target_id}'" in c
    if not exists:
        print(f"MISSING ID in HTML: {target_id}")
