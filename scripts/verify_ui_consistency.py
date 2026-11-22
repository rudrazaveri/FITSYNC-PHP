import glob
import re

trainer_files = glob.glob('trainer/*.php') + glob.glob('trainer/includes/*.php')
found_bi = []
found_dark = []

for tf in trainer_files:
    with open(tf, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'bi bi-' in content or 'bootstrap-icons' in content:
        found_bi.append(tf)
    if '#0b0f17' in content or '#0f172a' in content or 'trainer-workspace' in content:
        found_dark.append(tf)

print("Files containing legacy Bootstrap Icons:", found_bi)
print("Files containing legacy dark theme classes:", found_dark)

with open('css/trainer.css', 'r', encoding='utf-8') as f:
    css = f.read()

print("Dark theme in css/trainer.css:", '#0b0f17' in css or '#0f172a' in css)
