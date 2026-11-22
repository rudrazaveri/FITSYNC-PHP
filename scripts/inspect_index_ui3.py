import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script[^>]*>.*?</script>', html, re.DOTALL)
print("--- SCRIPTS FOUND IN index.html ---")
for s in scripts:
    src_match = re.search(r'src=["\']([^"\']+)["\']', s)
    if src_match:
        print("Script src:", src_match.group(1))
    else:
        print("Inline script:", s[:150], "...")

# Also let's inspect the main content layout and dashboard view in index.html
view_dash = re.search(r'(<div[^>]*id="view-dashboard"[^>]*>.*?</div>\s*<!--\s*END\s*VIEW\s*-->)', html, re.DOTALL | re.I)
if not view_dash:
    # Look for view-dashboard
    idx = html.find('id="view-dashboard"')
    if idx != -1:
        print("\n--- VIEW DASHBOARD (first 2500 chars) ---")
        print(html[idx:idx+2500])
