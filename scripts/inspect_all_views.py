with open('trainer/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

views = ['view-dashboard', 'view-members', 'view-workouts', 'view-schedule', 'view-attendance', 'view-exercise_library', 'view-messages', 'view-notifications', 'view-settings']

for v in views:
    m = re.search(r'<section id="' + v + r'".*?</section>', c, re.DOTALL)
    if m:
        print(f"{v}: {len(m.group(0))} chars")
    else:
        # maybe doesn't close with </section> immediately
        idx = c.find(f'id="{v}"')
        print(f"{v} start at char {idx}")
