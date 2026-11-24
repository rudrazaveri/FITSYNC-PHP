with open('trainer/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Find sections in trainer/index.html
sections = re.findall(r'<div class="trainer-view-section[^"]*" id="([^"]+)">', c)
print('Trainer view sections:', sections)

# Check for where members are displayed in view-dashboard
dash_match = re.search(r'<div class="trainer-view-section active" id="view-dashboard">(.*?)<div class="trainer-view-section" id="view-members">', c, re.DOTALL)
if dash_match:
    dash_html = dash_match.group(1)
    print("Dashboard length:", len(dash_html))
    # look for table or cards
    tables = re.findall(r'<table.*?</table>', dash_html, re.DOTALL)
    print("Tables in dashboard:", len(tables))
    if tables:
        print("Table 0 preview:", tables[0][:400])

# Check view-members
mem_match = re.search(r'<div class="trainer-view-section" id="view-members">(.*?)<div class="trainer-view-section" id="view-workouts">', c, re.DOTALL)
if mem_match:
    mem_html = mem_match.group(1)
    print("Members view length:", len(mem_html))
    cards = re.findall(r'<div class="trainer-card member-item-card".*?</div>\s*</div>\s*</div>', mem_html, re.DOTALL)
    print("Member item cards found:", len(cards))
