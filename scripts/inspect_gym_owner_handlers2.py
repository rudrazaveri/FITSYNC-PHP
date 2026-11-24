with open('gym_owner/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'function handleAddCoachSubmit' in line or 'function handleAddMemberSubmit' in line:
        print("".join(lines[i:i+40]))
        print("="*40)
