import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find the body and wrapper tags
idx_body = html.find('<body')
print("--- BODY & LAYOUT STRUCTURE ---")
print(html[idx_body:idx_body+1800])
