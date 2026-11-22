with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
rules = ['.app-layout', '.sidebar', '.main-wrapper', '.dashboard-center', '.welcome-banner', '.stats-grid', '.fs-card', '.stat-card']

for r in rules:
    m = re.search(r'(' + re.escape(r) + r'\s*\{.*?\})', css, re.DOTALL)
    if m:
        print(f"--- Rule {r} ---")
        print(m.group(1)[:500])
