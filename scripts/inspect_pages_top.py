import glob

pages = [
    'trainer/schedule.php',
    'trainer/workouts.php',
    'trainer/exercise_library.php',
    'trainer/attendance.php',
    'trainer/messages.php',
    'trainer/notifications.php',
    'trainer/profile.php',
    'trainer/settings.php'
]

for p in pages:
    with open(p, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print(f"=== {p} ({len(lines)} lines) ===")
    print("".join(lines[:35]))
