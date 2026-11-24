import re

with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

print('Length of index.html:', len(c))

# Find occurrences of Aarav
matches = [m.start() for m in re.finditer(r'Aarav', c, re.IGNORECASE)]
print(f'Occurrences of Aarav in index.html: {len(matches)}')
for idx in matches[:5]:
    start = max(0, idx - 80)
    end = min(len(c), idx + 80)
    print("---")
    print(c[start:end])

# Check for hardcoded coach names
for coach in ['Rajesh', 'Raj Sharma', 'Priya', 'Marcus', 'Vikram']:
    cnt = len(re.findall(coach, c, re.IGNORECASE))
    print(f'Occurrences of {coach}: {cnt}')
