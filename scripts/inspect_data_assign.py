with open('js/data.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'assignCoach' in l:
        print("".join(lines[i-5:i+60]))
        break
