with open('js/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

import re

m = re.search(r'function switchAuthTab\(.*?\)\s*\{.*?\}', c, re.DOTALL)
if m:
    print("switchAuthTab:\n", m.group(0))

# Also search for handleResetDatabase, loginDemoAccount
for fn in ['handleResetDatabase', 'loginDemoAccount', 'dismissCleanBanner', 'openDataStorageModal']:
    m2 = re.search(r'function ' + fn + r'\(.*?\)\s*\{.*?\}', c, re.DOTALL)
    if m2:
        print(f"\n{fn}:\n", m2.group(0)[:300])
