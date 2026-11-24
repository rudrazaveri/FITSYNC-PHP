with open('trainer/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

aside_end = c.find('</aside>')
print("After </aside>:\n", c[aside_end:aside_end+500])
