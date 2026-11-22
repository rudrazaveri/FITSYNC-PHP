import os

os.makedirs('api/trainer', exist_ok=True)

# 1. api/trainer/members.php
code_members = """<?php
/**
 * FitSync AI — API: Trainer Assigned Members List
 *
 * STRICT PRIVACY: Restricts results solely to members assigned to authenticated coach.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/trainer_data.php';

requireRole('trainer');

$search = trim($_GET['search'] ?? '');
$status = trim($_GET['status'] ?? 'all');
$goal   = trim($_GET['goal'] ?? 'all');

$filters = [
    'search' => $search,
    'status' => $status,
    'goal'   => $goal
];

$members = getTrainerAssignedMembers((int)$_SESSION['user_id'], $filters);

jsonResponse([
    'success' => true,
    'count'   => count($members),
    'members' => $members
]);
"""

with open('api/trainer/members.php', 'w', encoding='utf-8') as f:
    f.write(code_members)

# 2. api/trainer/member_details.php
code_details = """<?php
/**
 * FitSync AI — API: Assigned Member Details & Telemetry
 *
 * STRICT PRIVACY REQUIREMENT: Validates assignment relationship.
 * If member is NOT assigned to authenticated trainer, returns 403 Forbidden.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/trainer_data.php';

requireRole('trainer');

$trainerUserId = (int)$_SESSION['user_id'];
$memberUserId  = (int)($_GET['id'] ?? 0);

if ($memberUserId <= 0) {
    jsonResponse(['success' => false, 'message' => 'Invalid or missing member ID.'], 400);
}

$details = getAssignedMemberDetails($trainerUserId, $memberUserId);

if ($details === null) {
    jsonResponse([
        'success' => false,
        'message' => 'Access Denied: Member is not assigned to your coaching roster.'
    ], 403);
}

jsonResponse([
    'success' => true,
    'member'  => $details
]);
"""

with open('api/trainer/member_details.php', 'w', encoding='utf-8') as f:
    f.write(code_details)

# 3. api/trainer/schedule.php
code_schedule = """<?php
/**
 * FitSync AI — API: Trainer Schedule & Sessions
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/trainer_data.php';

requireRole('trainer');

$schedule = getTrainerSchedule((int)$_SESSION['user_id']);

jsonResponse([
    'success'  => true,
    'schedule' => $schedule
]);
"""

with open('api/trainer/schedule.php', 'w', encoding='utf-8') as f:
    f.write(code_schedule)

print("Created api/trainer/ endpoints successfully!")
