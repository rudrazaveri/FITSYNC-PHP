with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(340, min(len(lines), 440)):
    print(f"{i}: {lines[i].strip()}")
