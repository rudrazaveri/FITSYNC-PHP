with open('trainer/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re
matches = re.findall(r'<[^>]+id=[\"\']view-[^>]+>', c)
for m in matches:
    print(m)
