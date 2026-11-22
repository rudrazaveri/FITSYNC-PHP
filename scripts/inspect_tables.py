import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

tables = re.findall(r'(<table[^>]*>.*?</table>)', html, re.DOTALL)
print(f"Total <table> elements in index.html: {len(tables)}")
for i, t in enumerate(tables):
    print(f"\n--- TABLE {i+1} (first 400 chars) ---")
    print(t[:400])
