with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

m = re.search(r'<div[^>]*id="dataStorageModal"[^>]*>.*?</div>\s*</div>\s*</div>', c, re.DOTALL)
if m:
    print("dataStorageModal:\n", m.group(0)[:1500])
else:
    print("modal not found with regex, searching by id:")
    idx = c.find('id="dataStorageModal"')
    if idx != -1:
        print(c[idx:idx+1200])
