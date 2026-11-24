import os
import glob
import re

search_files = (
    glob.glob('*.php') + 
    glob.glob('*.html') + 
    glob.glob('js/*.js') + 
    glob.glob('api/**/*.php', recursive=True) + 
    glob.glob('includes/*.php') + 
    glob.glob('config/*.php') + 
    glob.glob('user/*.php') + 
    glob.glob('trainer/*.php')
)

print(f"Searching {len(search_files)} files for redirects and role checks...")

for f in sorted(search_files):
    with open(f, 'r', encoding='utf-8', errors='ignore') as handle:
        content = handle.read()

    # Look for redirects
    redirects = re.findall(r'(?:header\([\'"]Location:[^\'"]*[\'"]|window\.location[^\n;]*|switchView\([^\)]*\))', content)
    if redirects:
        # Check if contains user or trainer or dashboard
        for r in redirects:
            if 'user' in r.lower() or 'trainer' in r.lower() or 'dashboard' in r.lower() or 'location' in r.lower():
                print(f"{f}: {r.strip()}")
