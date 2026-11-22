with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
matches = re.findall(r'(\.stat-icon-[a-zA-Z0-9_-]+\s*\{.*?\})', css, re.DOTALL)
for m in matches:
    print(m)

matches2 = re.findall(r'(\.stat-trend-[a-zA-Z0-9_-]+\s*\{.*?\})', css, re.DOTALL)
for m in matches2:
    print(m)
