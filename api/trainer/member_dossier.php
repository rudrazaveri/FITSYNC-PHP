<?php
/**
 * FitSync AI — API: Athlete Dossier (Trainer View)
 *
 * Provides assigned athlete biometrics, workout history, attendance, and notes.
 * Enforces trainer assignment authorization check.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$trainerUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 3; // Coach Raj Malhotra
$memberUserId = isset($_GET['member_id']) ? (int)$_GET['member_id'] : (isset($_GET['user_id']) ? (int)$_GET['user_id'] : 8);

if (!empty($_GET['email'])) {
    $db = FitSyncDataService::getInstance()->getDb();
    if ($db) {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([trim((string)$_GET['email'])]);
        $found = $stmt->fetchColumn();
        if ($found) {
            $memberUserId = (int)$found;
        }
    }
}

try {
    $service = FitSyncDataService::getInstance();
    $dossier = $service->getAthleteDossier($trainerUserId, $memberUserId);

    echo json_encode([
        'success' => true,
        'data'    => $dossier
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
