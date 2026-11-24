with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'function handleResetDatabase' in line:
        print("".join(lines[idx-10:idx+25]))
        break
