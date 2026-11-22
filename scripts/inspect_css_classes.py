with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re

for keyword in ['table', 'badge', 'btn', 'tabs', 'tab-btn', 'filter-search']:
    matches = re.findall(r'(\.' + keyword + r'[a-zA-Z0-9_-]*\s*\{.*?\})', css, re.DOTALL)
    print(f"--- Matches for {keyword} ({len(matches)}) ---")
    for m in matches[:3]:
        print(m[:250] + "\n")
