with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx = html.find('id="sidebarNav"')
print(html[idx-400:idx])
