with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"index.html has {len(lines)} lines.")
print("First 30 lines:")
for l in lines[:30]:
    print(l.rstrip())
