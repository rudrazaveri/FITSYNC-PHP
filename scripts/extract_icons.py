import os, re

pattern = re.compile(r'data-lucide=[\"\']([^\"\']+)[\"\']')
icons = set()
icon_locations = {}

for root, dirs, files in os.walk('.'):
    if any(x in root for x in ['.git', 'node_modules', 'vendor', 'brain', '.system_generated']):
        continue
    for f in files:
        if f.endswith(('.html', '.js', '.php')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    for m in pattern.finditer(content):
                        name = m.group(1)
                        icons.add(name)
                        icon_locations.setdefault(name, []).append(path)
            except Exception as e:
                pass

print(f"Total unique icons: {len(icons)}")
print("Icons list:")
for ic in sorted(icons):
    print(f"  {ic} ({len(icon_locations[ic])} occurrences)")
