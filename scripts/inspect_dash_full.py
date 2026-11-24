with open('trainer/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Extract between <section id="view-dashboard" and <section id="view-members"
start = c.find('<section id="view-dashboard"')
end = c.find('<section id="view-members"')
dash_content = c[start:end]

print("Dashboard full length:", len(dash_content))
print("Dashboard preview:\n", dash_content[:2000])
print("\n--- Middle/End of Dashboard ---\n", dash_content[2000:4000])
