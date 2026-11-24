with open('js/data.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'save()' in l:
        print("".join(lines[i-2:i+15]))
        break
