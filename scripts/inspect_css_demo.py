with open('css/style.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'auth-demo-card' in line or 'btn-auth-reset-db' in line or 'cleanDbBanner' in line:
        print(f"Line {idx}: {line.strip()}")
