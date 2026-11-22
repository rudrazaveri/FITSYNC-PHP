import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Font & Icon stylesheets linked in <head>
head_match = re.search(r'<head>(.*?)</head>', html, re.DOTALL)
if head_match:
    links = re.findall(r'<link[^>]+>', head_match.group(1))
    print("--- HEAD LINKS ---")
    for l in links:
        print(l)

# Sidebar structure
sidebar_match = re.search(r'(<aside[^>]*class="[^"]*sidebar[^"]*"[^>]*>.*?</aside>)', html, re.DOTALL)
if not sidebar_match:
    sidebar_match = re.search(r'(<nav[^>]*class="[^"]*sidebar[^"]*"[^>]*>.*?</nav>)', html, re.DOTALL)
if not sidebar_match:
    sidebar_match = re.search(r'(<div[^>]*class="[^"]*sidebar[^"]*"[^>]*>.*?</div>\s*<!--.*?sidebar.*?-->)', html, re.DOTALL | re.I)

print("\n--- SIDEBAR MATCH ---")
if sidebar_match:
    print(sidebar_match.group(0)[:1500])
else:
    # search for sidebar class
    sb = [line for line in html.splitlines() if 'sidebar' in line.lower()][:20]
    print("Sidebar lines:", sb)

# Topbar / Header structure
topbar_match = re.search(r'(<header[^>]*>.*?</header>)', html, re.DOTALL)
print("\n--- HEADER MATCH ---")
if topbar_match:
    print(topbar_match.group(0)[:1500])
else:
    print("No <header> tag found")
