with open('js/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# find start of renderTrainersUI and print next 60 lines
lines = c.splitlines()
for idx, line in enumerate(lines):
    if 'function renderTrainersUI()' in line:
        print('\n'.join(lines[idx:idx+70]))
        break
