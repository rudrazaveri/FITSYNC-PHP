import re

with open('gym_owner/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

scripts = re.findall(r'<script.*?</script>', c, re.DOTALL)
for i, s in enumerate(scripts):
    print(f"=== Script {i} ({len(s)} bytes) ===")
    if len(s) > 200:
        print(s[:1000] + "\n...\n" + s[-500:])
    else:
        print(s)
