with open('gym_owner/dashboard.php', 'r', encoding='utf-8') as f:
    c = f.read()

target = """require_once __DIR__ . '/../config/bootstrap.php';
requireRole('gym_owner');"""

replacement = """require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/gym_owner_data.php';
requireRole('gym_owner');"""

if target in c:
    c = c.replace(target, replacement)
    with open('gym_owner/dashboard.php', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated gym_owner/dashboard.php")
else:
    print("dashboard.php target not found")

files = ['coaches.php', 'members.php', 'attendance.php', 'settings.php']
for fname in files:
    path = f'gym_owner/{fname}'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if target in content:
        content = content.replace(target, replacement)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated gym_owner/{fname}")
