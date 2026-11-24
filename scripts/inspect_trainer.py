import re

with open('trainer/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

print('Length of trainer/index.html:', len(c))
views = re.findall(r'id=[\"\']view-([a-zA-Z0-9_-]+)[\"\']', c)
print('Views found:', views)

# Check script tags
script_tags = re.findall(r'<script.*?</script>', c, re.DOTALL)
print('Number of scripts:', len(script_tags))
for idx, s in enumerate(script_tags):
    print(f'Script {idx} length: {len(s)}')
    if len(s) > 100:
        print(s[:300] + '...')

# Check references to athlete names
hardcoded_names = ['Aarav', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Ananya']
for name in hardcoded_names:
    count = len(re.findall(name, c, re.IGNORECASE))
    print(f'Count of {name}: {count}')
