with open('trainer/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# find top-bar or topbar or header
matches = re.findall(r'<div class="[^"]*top[^"]*"[^>]*>.*?(?=</div>)', c, re.DOTALL)
print("Top bar matches:", len(matches))
for m in matches[:3]:
    print("Match:", m[:300])

# check sidebar top and bottom
sidebar_match = re.search(r'<aside.*?</aside>', c, re.DOTALL)
if sidebar_match:
    print("Sidebar preview:\n", sidebar_match.group(0)[:800])
    print("Sidebar bottom:\n", sidebar_match.group(0)[-800:])
