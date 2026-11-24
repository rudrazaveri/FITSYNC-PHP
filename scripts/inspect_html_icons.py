import re

for f in ['index.html', 'gym_owner/index.html', 'trainer/index.html']:
    with open(f, 'r', encoding='utf-8') as fp:
        c = fp.read()
    matches = re.findall(r'<i[^>]*data-lucide=[\"\']([^\"\']+)[\"\'][^>]*>', c)
    print(f"{f}: {len(matches)} data-lucide tags found")
