<?php
/**
 * FitSync AI — API: Gym Owner Delete / Deactivate User or Coach
 * Performs authoritative soft-deletion, deactivating gym association while preserving historical audit records.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$email       = trim((string)($input['email'] ?? ''));
$userId      = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$coachId     = trim((string)($input['coach_id'] ?? ($input['id'] ?? '')));
$gymId       = isset($input['gym_id']) ? (int)$input['gym_id'] : 0;
$ownerUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 2;

$db = getDbConnection();
if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection unavailable.']);
    exit;
}

try {
    // Resolve Gym ID
    if ($gymId <= 0) {
        $stmt = $db->prepare("SELECT id FROM gyms WHERE owner_user_id = :oid LIMIT 1");
        $stmt->execute([':oid' => $ownerUserId]);
        $gymId = (int)$stmt->fetchColumn();
        if ($gymId <= 0) {
            $gymId = 1;
        }
    }

    // Resolve Target User ID
    if ($userId <= 0 && !empty($coachId)) {
        $cleanId = str_replace(['tr-', 'mem-'], '', $coachId);
        if (is_numeric($cleanId)) {
            $userId = (int)$cleanId;
        }
    }

    if ($userId <= 0 && !empty($email)) {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $userId = (int)$stmt->fetchColumn();
    }

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid user_id, coach_id, or email is required.']);
        exit;
    }

    // Check user role and verify gym ownership boundary
    $stmt = $db->prepare("SELECT id, role, full_name, status FROM users WHERE id = :uid LIMIT 1");
    $stmt->execute([':uid' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User record not found in system.']);
        exit;
    }

    $db->beginTransaction();

    if ($user['role'] === 'trainer') {
        // Security check: Verify coach is associated with owner's gym
        $chk = $db->prepare("SELECT 1 FROM gym_trainers WHERE gym_id = :gid AND trainer_user_id = :uid LIMIT 1");
        $chk->execute([':gid' => $gymId, ':uid' => $userId]);
        if (!$chk->fetchColumn()) {
            $db->rollBack();
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Unauthorized: Coach does not belong to your gym facility.']);
            exit;
        }

        // Deactivate gym_trainers
        $stmt = $db->prepare("UPDATE gym_trainers SET is_active = 0 WHERE gym_id = :gid AND trainer_user_id = :uid");
        $stmt->execute([':gid' => $gymId, ':uid' => $userId]);

        // Deactivate active member assignments for this coach
        $stmt = $db->prepare("UPDATE trainer_assignments SET status = 'inactive', updated_at = NOW() WHERE trainer_user_id = :uid AND status = 'active'");
        $stmt->execute([':uid' => $userId]);

        // Soft deactivate user
        $stmt = $db->prepare("UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = :uid");
        $stmt->execute([':uid' => $userId]);
    } else {
        // Member / Athlete deactivation
        $chk = $db->prepare("SELECT 1 FROM memberships WHERE gym_id = :gid AND user_id = :uid LIMIT 1");
        $chk->execute([':gid' => $gymId, ':uid' => $userId]);
        if (!$chk->fetchColumn()) {
            $db->rollBack();
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Unauthorized: Member does not belong to your gym facility.']);
            exit;
        }

        // Cancel membership
        $stmt = $db->prepare("UPDATE memberships SET status = 'cancelled', updated_at = NOW() WHERE gym_id = :gid AND user_id = :uid");
        $stmt->execute([':gid' => $gymId, ':uid' => $userId]);

        // Deactivate trainer assignment
        $stmt = $db->prepare("UPDATE trainer_assignments SET status = 'inactive', updated_at = NOW() WHERE user_id = :uid");
        $stmt->execute([':uid' => $userId]);

        // Soft deactivate user
        $stmt = $db->prepare("UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = :uid");
        $stmt->execute([':uid' => $userId]);
    }

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => "Successfully removed {$user['full_name']} from active facility roster.",
        'user_id' => $userId
    ]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
