with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('id="dataStorageModal"')
end = c.find('</div>\n    </div>\n  </div>', idx)
print(c[idx:end+20])
