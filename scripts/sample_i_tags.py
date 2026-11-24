import re

for filename in ['index.html', 'gym_owner/index.html', 'trainer/index.html']:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    matches = re.findall(r'<i[^>]*data-lucide[^>]*>.*?</i>', content, re.DOTALL)
    print(f"=== {filename} (Sample matches) ===")
    for m in matches[:5]:
        print(" ", m.strip())
