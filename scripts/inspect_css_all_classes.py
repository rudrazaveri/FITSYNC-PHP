with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
classes = sorted(list(set(re.findall(r'\.([a-zA-Z0-9_-]+)', css))))
print(f"Total CSS classes in css/style.css: {len(classes)}")
print("Sample classes:", classes[:60])

# Look for specific UI elements
print("\nCard classes:", [c for c in classes if 'card' in c])
print("\nButton classes:", [c for c in classes if 'btn' in c or 'button' in c])
print("\nNav classes:", [c for c in classes if 'nav' in c or 'sidebar' in c])
print("\nForm classes:", [c for c in classes if 'form' in c or 'input' in c or 'select' in c])
print("\nBadge classes:", [c for c in classes if 'badge' in c or 'tag' in c or 'pill' in c])
