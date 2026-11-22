with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
m = re.search(r'(\.sidebar-nav-item\s*\{.*?\})', css, re.DOTALL)
if m:
    print("--- .sidebar-nav-item ---")
    print(m.group(1))

m2 = re.search(r'(\.sidebar-nav-item\.active\s*\{.*?\})', css, re.DOTALL)
if m2:
    print("--- .sidebar-nav-item.active ---")
    print(m2.group(1))

m3 = re.search(r'(\.sidebar-nav-item:hover\s*\{.*?\})', css, re.DOTALL)
if m3:
    print("--- .sidebar-nav-item:hover ---")
    print(m3.group(1))
