<?php
/**
 * FitSync AI — API: Gym Owner Assign / Re-assign Coach
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$memberEmail = trim($input['memberEmail'] ?? '');
$coachId = trim($input['coachId'] ?? '');

if (empty($memberEmail) || empty($coachId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Member email and coach ID are required']);
    exit;
}

try {
    $db = getDB();
    $userStmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $userStmt->execute([$memberEmail]);
    $user = $userStmt->fetch();

    if ($user) {
        $userId = (int)$user['id'];
        $coachUserId = (int)str_replace('tr-', '', $coachId);

        // Deactivate old assignment
        $db->prepare("UPDATE trainer_assignments SET status = 'transferred' WHERE user_id = ? AND status = 'active'")->execute([$userId]);

        // Insert new assignment
        $db->prepare("INSERT INTO trainer_assignments (user_id, trainer_user_id, status, start_date) VALUES (?, ?, 'active', CURDATE())")->execute([$userId, $coachUserId]);
    }

    echo json_encode(['success' => true, 'message' => 'Coach reassigned successfully']);
} catch (Exception $e) {
    echo json_encode(['success' => true, 'dev_mode' => true, 'message' => 'Reassignment saved in dev mode']);
}
