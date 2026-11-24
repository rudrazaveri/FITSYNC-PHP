with open('gym_owner/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Find all buttons
buttons = re.findall(r'<button[^>]*>(.*?)</button>', c, re.DOTALL)
print("Total buttons in gym_owner/index.html:", len(buttons))
for b in buttons:
    text = re.sub(r'<[^>]+>', '', b).strip()
    if text:
        print(" Button:", text[:60])

# Find all modals
modals = re.findall(r'id=[\'"](modal[^\'"]+)[\'"]', c)
print("Modals found:", modals)
