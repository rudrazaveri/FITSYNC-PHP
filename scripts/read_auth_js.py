with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'function handleSignInSubmit' in l:
        print(f"handleSignInSubmit starts at line {i+1}")
        for j in range(i, min(i + 150, len(lines))):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
