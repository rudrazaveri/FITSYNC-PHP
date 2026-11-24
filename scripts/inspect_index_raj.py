with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

for m in re.finditer(r'Raj Malhotra', c, re.IGNORECASE):
    start = max(0, m.start() - 60)
    end = min(len(c), m.end() + 60)
    print("Match:\n", c[start:end])
