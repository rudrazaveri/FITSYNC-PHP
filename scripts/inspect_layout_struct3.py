with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx_aside_end = html.find('</aside>')
print("--- AFTER ASIDE (MAIN CONTENT AREA) ---")
print(html[idx_aside_end:idx_aside_end+1500])
