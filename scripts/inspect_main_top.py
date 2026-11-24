with open('trainer/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

m = re.search(r'<main class="main-content">(.*?)(?=<section id="view-dashboard")', c, re.DOTALL)
if m:
    print("Between main and view-dashboard:\n", m.group(1))
else:
    print("Not found")
