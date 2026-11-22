with open('css/responsive.css', 'r', encoding='utf-8') as f:
    resp = f.read()

import re
print("--- RESPONSIVE.CSS BREAKPOINTS & SIDEBAR RULES ---")
for line in resp.splitlines():
    if '@media' in line or 'sidebar' in line or 'mobile' in line:
        print(line)
