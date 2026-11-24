import os
import re

print("=== 1. SEARCH FOR DEV/RESET/DEVICE KEYWORDS ===")
keywords = ['reset database', 'resetdatabase', 'registered on this device', 'registered on this', 'demo account', 'test account', 'demo login', 'demo-card']
files_to_check = []
for root, dirs, files in os.walk('.'):
    if '.git' in root or '__pycache__' in root or 'scripts' in root:
        continue
    for f in files:
        if f.endswith(('.html', '.php', '.js', '.css')):
            files_to_check.append(os.path.join(root, f))

for fpath in files_to_check:
    try:
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        for kw in keywords:
            matches = list(re.finditer(re.escape(kw), content, re.IGNORECASE))
            if matches:
                print(f"{fpath}: {len(matches)} matches for '{kw}'")
                for m in matches[:2]:
                    start = max(0, m.start() - 50)
                    end = min(len(content), m.end() + 50)
                    snippet = ' '.join(content[start:end].split())
                    print(f"   [{snippet}]")
    except Exception as e:
        pass

print("\n=== 2. SEARCH FOR ALL IMAGE REFERENCES ===")
img_refs = set()
# patterns for images in html/php/js/css
patterns = [
    r'src=[\'"]([^\'"]+\.(?:png|jpg|jpeg|svg|webp|gif))[\'"]',
    r'url\([\'"]?([^\'")\s]+\.(?:png|jpg|jpeg|svg|webp|gif))[\'"]?\)',
    r'[\'"]([^\'"]*assets/[^\'"]+\.(?:png|jpg|jpeg|svg|webp|gif))[\'"]',
    r'[\'"]([^\'"]*images/[^\'"]+\.(?:png|jpg|jpeg|svg|webp|gif))[\'"]',
]

for fpath in files_to_check:
    try:
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        for p in patterns:
            found = re.findall(p, content, re.IGNORECASE)
            for img in found:
                # filter out external urls like http...
                if not img.startswith('http') and not img.startswith('//'):
                    img_refs.add((img.strip(), fpath))
    except Exception as e:
        pass

print(f"Total unique image references found: {len(img_refs)}")
missing_images = []
existing_images = []

for img, ref_file in sorted(img_refs):
    # Normalize path
    # If the ref_file is in a subfolder like trainer/ or gym_owner/ or css/, handle relative paths
    clean_img = img.split('?')[0].split('#')[0]
    
    # Try multiple resolution paths
    possible_paths = [
        clean_img,
        os.path.join(os.path.dirname(ref_file), clean_img),
        os.path.join('.', clean_img.lstrip('/')),
        os.path.join('.', clean_img.replace('../', '')),
    ]
    exists = any(os.path.isfile(p) for p in possible_paths)
    if exists:
        existing_images.append(clean_img)
    else:
        missing_images.append((clean_img, ref_file))

print(f"Existing images: {len(set(existing_images))}")
print(f"Missing images: {len(missing_images)}")
if missing_images:
    print("MISSING IMAGE LIST:")
    for m, src in missing_images[:30]:
        print(f"  ❌ {m} (referenced in {src})")
