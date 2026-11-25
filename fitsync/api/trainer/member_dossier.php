<?php
/**
 * FitSync AI — API: Athlete Dossier (Trainer View)
 * Strictly enforces trainer assignment authorization and trainer_data_permissions.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['trainer', 'gym_owner', 'admin']);
$trainerUserId = (int)$authUser['id'];

$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$memberUserId = isset($_GET['member_id']) ? (int)$_GET['member_id'] : (isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0);

if ($memberUserId <= 0 && !empty($_GET['email'])) {
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => trim((string)$_GET['email'])]);
    $found = $stmt->fetchColumn();
    if ($found) {
        $memberUserId = (int)$found;
    }
}

if ($memberUserId <= 0) {
    apiResponse(false, 'Valid member ID or email is required.', null, 400);
}

try {
    $dossier = $service->getAthleteDossier($trainerUserId, $memberUserId, $authUser['role']);
    apiResponse(true, 'Athlete dossier loaded.', $dossier);
} catch (RuntimeException $e) {
    apiResponse(false, $e->getMessage(), null, 403);
} catch (Throwable $e) {
    error_log('[FitSync member_dossier.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to load athlete dossier.', null, 500);
}
