with open('js/app.js', 'r', encoding='utf-8') as f:
    c = f.read()

import re

m = re.search(r'function renderTrainersUI\(\)\s*\{.*?\}', c, re.DOTALL)
if m:
    print("renderTrainersUI:\n", m.group(0))
else:
    print("renderTrainersUI function not found")
