with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re
idx = js.find('mobileNavToggle')
if idx != -1:
    print("--- mobileNavToggle handler in app.js ---")
    print(js[idx-100:idx+400])
else:
    print("mobileNavToggle not found in app.js")
