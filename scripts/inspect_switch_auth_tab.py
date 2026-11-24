with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'function switchAuthTab' in line:
        print("".join(lines[idx:idx+45]))
        break
