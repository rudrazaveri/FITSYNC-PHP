with open('js/data.js', 'r', encoding='utf-8') as f:
    c = f.read()

print('Has getMemberByEmail:', 'getMemberByEmail' in c)
print('Has getTrainerById:', 'getTrainerById' in c)
