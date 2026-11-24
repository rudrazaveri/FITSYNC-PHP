with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('openDataStorageModal')
if idx != -1:
    print(c[idx-100:idx+1500])
else:
    print("openDataStorageModal not found")
