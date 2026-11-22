with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
idx = css.find('.fs-table')
if idx != -1:
    print("--- .fs-table in css/style.css ---")
    print(css[idx:idx+800])
else:
    print(".fs-table not found in css/style.css")
