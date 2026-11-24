with open('trainer/index.html', 'r', encoding='utf-8') as f:
    t = f.read()

with open('gym_owner/index.html', 'r', encoding='utf-8') as f:
    g = f.read()

import re

# Header in trainer
m1 = re.search(r'<header.*?</header>', t, re.DOTALL)
if m1:
    print("Trainer header:\n", m1.group(0)[:800])

# Header in gym_owner
m2 = re.search(r'<header.*?</header>', g, re.DOTALL)
if m2:
    print("\nGym Owner header:\n", m2.group(0)[:800])
