with open('gym_owner/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# find handleAddCoachSubmit
m1 = re.search(r'function handleAddCoachSubmit\(.*?\)\s*\{.*?\}', c, re.DOTALL)
if m1:
    print("handleAddCoachSubmit:\n", m1.group(0))

m2 = re.search(r'function handleAddMemberSubmit\(.*?\)\s*\{.*?\}', c, re.DOTALL)
if m2:
    print("handleAddMemberSubmit:\n", m2.group(0))
