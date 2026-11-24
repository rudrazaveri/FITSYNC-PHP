with open('js/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's see the save() method and init() method in FitSyncStore
import re

m = re.search(r'class FitSyncStore\s*\{(.*?)(?=const MUSCLE_BIOMECHANICS)', content, re.DOTALL)
if m:
    print("FitSyncStore class methods preview:")
    methods = re.findall(r'(\w+)\s*\([^)]*\)\s*\{', m.group(1))
    print("Methods:", methods)
