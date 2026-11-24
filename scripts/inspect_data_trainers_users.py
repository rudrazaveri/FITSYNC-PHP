with open('js/data.js', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# find trainers
m = re.search(r'trainers:\s*\[(.*?)\],', c, re.DOTALL)
if m:
    print("Trainers in data.js:\n", m.group(1))

# find registeredUsers
m2 = re.search(r'registeredUsers:\s*\[(.*?)\],', c, re.DOTALL)
if m2:
    print("Registered users in data.js:\n", m2.group(1))
