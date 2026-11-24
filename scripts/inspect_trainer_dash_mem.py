with open('trainer/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

dash_match = re.search(r'<section id="view-dashboard".*?</section>', c, re.DOTALL)
if dash_match:
    print("Dashboard length:", len(dash_match.group(0)))
    print("Dashboard preview:\n", dash_match.group(0)[:1500])

mem_match = re.search(r'<section id="view-members".*?</section>', c, re.DOTALL)
if mem_match:
    print("Members length:", len(mem_match.group(0)))
    print("Members preview:\n", mem_match.group(0)[:1500])
