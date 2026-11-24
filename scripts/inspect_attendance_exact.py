with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

start = c.find('id="view-attendance"')
end = c.find('<div class="view-container"', start + 10)
print(c[start:end])
