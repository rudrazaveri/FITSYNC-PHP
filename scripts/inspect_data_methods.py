with open('js/data.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'getTrainers()' in l:
        print("".join(lines[i-5:i+100]))
        break
