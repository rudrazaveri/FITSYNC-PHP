<?php
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
