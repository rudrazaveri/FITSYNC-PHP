with open('trainer/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Find all occurrences of Aarav with surrounding lines
for match in re.finditer(r'Aarav', c):
    start = max(0, match.start() - 100)
    end = min(len(c), match.end() + 100)
    print("--- MATCH ---")
    print(c[start:end])

# Print Script 2 in full
scripts = re.findall(r'<script.*?</script>', c, re.DOTALL)
if len(scripts) >= 3:
    print("=== SCRIPT 2 ===")
    print(scripts[2])
