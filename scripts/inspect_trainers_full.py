with open('js/data.js', 'r', encoding='utf-8') as f:
    c = f.read()

import re

m = re.search(r'trainers:\s*\[(.*?)\]\s*,\s*registeredUsers', c, re.DOTALL)
if m:
    print(m.group(0))
