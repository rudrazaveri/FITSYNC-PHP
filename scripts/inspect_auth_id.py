with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

m = re.search(r'<div class="[^"]*auth[^"]*" id="([^"]+)"', c)
if m:
    print("Auth container match:", m.group(0))
else:
    print("No regex match, searching for authTabBtnSignIn:")
    idx = c.find('authTabBtnSignIn')
    if idx != -1:
        print(c[idx-300:idx+600])
