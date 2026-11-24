with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

for kw in ['btn-auth-reset-db', 'authTabBtnDemo', 'authDemoPane', 'btn-settings-reset']:
    m = re.search(r'(.{0,100}' + kw + r'.{0,300})', c, re.DOTALL)
    if m:
        print(f"=== {kw} ===")
        print(m.group(0))
