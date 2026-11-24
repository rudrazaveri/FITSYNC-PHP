with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('FS-PUN-9821')
print(c[idx:idx+2500])
