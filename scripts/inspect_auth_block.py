with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('id="authCardContainer"')
start = c.rfind('<div', 0, idx)
# find end of this auth block
print(c[start-100:start+2500])
