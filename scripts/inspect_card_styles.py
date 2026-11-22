with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re

for term in ['card-header-row', 'card-title', 'stat-icon-box', 'stat-icon-blue', 'stat-trend']:
    m = re.search(r'(\.' + term + r'[a-zA-Z0-9_-]*\s*\{.*?\})', css, re.DOTALL)
    if m:
        print(f"--- {term} ---")
        print(m.group(1))
