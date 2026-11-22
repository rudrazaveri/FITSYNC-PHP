import os

endpoints = {
    'user/index.php': 'dashboard',
    'user/dashboard.php': 'dashboard',
    'user/workouts.php': 'workouts',
    'user/exercise_library.php': 'exercise-library',
    'user/progress.php': 'progress',
    'user/nutrition.php': 'nutrition',
    'user/attendance.php': 'attendance',
    'user/trainer.php': 'trainer',
    'user/messages.php': 'messages',
    'user/notifications.php': 'notifications',
    'user/profile.php': 'settings',
    'user/settings.php': 'settings'
}

template = """<?php
/**
 * FitSync AI — Member Portal: {view_cap}
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

// Strict server-side role check
requireRole('user');

$initialView = '{view}';
require __DIR__ . '/portal_template.php';
"""

for path, view in endpoints.items():
    code = template.format(view=view, view_cap=view.replace('-', ' ').title())
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Created {path} (initialView: {view})")

print("All user portal route endpoints generated successfully!")
