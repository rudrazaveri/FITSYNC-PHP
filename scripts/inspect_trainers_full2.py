with open('js/data.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'trainers: [' in l:
        print("".join(lines[i:i+55]))
        break
