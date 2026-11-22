<?php
/**
 * FitSync AI — API: Add Trainer Note for Assigned Member
 *
 * STRICT PRIVACY: Validates trainer assignment before inserting.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/trainer_data.php';

requireRole('trainer');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method Not Allowed.'], 405);
}

$input = [];
if (!empty($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
} else {
    $input = $_POST;
}

$trainerUserId = (int)$_SESSION['user_id'];
$memberUserId  = (int)($input['member_id'] ?? 0);
$noteText      = (string)($input['note_text'] ?? '');
$noteType      = (string)($input['note_type'] ?? 'workout_feedback');
$isVisible     = !empty($input['is_visible']);

if ($memberUserId <= 0 || empty(trim($noteText))) {
    jsonResponse(['success' => false, 'message' => 'Invalid member ID or empty note content.'], 400);
}

$result = saveTrainerNote($trainerUserId, $memberUserId, $noteText, $noteType, $isVisible);

$statusCode = $result['success'] ? 200 : 403;
jsonResponse($result, $statusCode);
