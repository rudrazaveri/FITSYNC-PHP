<?php
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
