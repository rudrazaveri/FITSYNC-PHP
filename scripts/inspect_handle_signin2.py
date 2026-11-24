with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'function handleSignInSubmit' in line:
        print("".join(lines[idx+35:idx+75]))
        break
