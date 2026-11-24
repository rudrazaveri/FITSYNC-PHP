with open('js/data.js', 'r', encoding='utf-8') as f:
    c = f.read()

import re
# check where registeredUsers is
idx = c.find('registeredUsers: [')
print(c[idx:idx+1500])
