with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Check if renderTrainersUI is present
print('Has renderTrainersUI in index.html?:', 'renderTrainersUI' in c)

# Check script tags in index.html
script_srcs = re.findall(r'<script[^>]*src=[\'"]([^\'"]+)[\'"]', c)
print('Script sources in index.html:', script_srcs)
