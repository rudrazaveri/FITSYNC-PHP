import os

trainer_pages = [
    "trainer/dashboard.php",
    "trainer/members.php",
    "trainer/schedule.php",
    "trainer/workouts.php",
    "trainer/exercise_library.php",
    "trainer/attendance.php",
    "trainer/messages.php",
    "trainer/notifications.php",
    "trainer/profile.php",
    "trainer/settings.php"
]

auth_block = """require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');
"""

for page in trainer_pages:
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "requireRole('trainer')" in content:
        print(f"Already has requireRole: {page}")
        continue
    
    # Insert right after declare(strict_types=1);
    target = "declare(strict_types=1);\n"
    if target in content:
        content = content.replace(target, target + "\n" + auth_block + "\n", 1)
        with open(page, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added requireRole to {page}")
    else:
        print(f"Target declare(strict_types=1) not found in {page}")
