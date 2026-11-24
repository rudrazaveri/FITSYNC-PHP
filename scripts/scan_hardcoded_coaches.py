import re

files = ['index.html', 'trainer/index.html', 'gym_owner/index.html']
coaches = ['Raj Malhotra', 'Rajesh', 'Priya', 'Marcus', 'Vikram Shinde', 'Simran Kaur']

for f_path in files:
    with open(f_path, 'r', encoding='utf-8') as f:
        c = f.read()
    print(f"=== {f_path} ===")
    for coach in coaches:
        matches = len(re.findall(coach, c, re.IGNORECASE))
        print(f"  {coach}: {matches}")
