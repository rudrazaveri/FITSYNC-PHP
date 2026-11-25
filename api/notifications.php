<?php
/**
 * FitSync AI — API: User & Trainer Notifications
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'trainer', 'gym_owner', 'admin']);
$userId = (int)$authUser['id'];
$db = getDbConnection();
if (!$db) {
    apiResponse(false, 'Database unavailable.', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT id, title, body, entity_type, entity_id, is_read, created_at
            FROM notifications
            WHERE user_id = :uid
            ORDER BY created_at DESC, id DESC
            LIMIT 30
        ");
        $stmt->execute([':uid' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $unread = 0;
        foreach ($rows as $r) {
            if (!(int)$r['is_read']) $unread++;
        }

        apiResponse(true, 'Notifications retrieved.', [
            'unread_count'  => $unread,
            'notifications' => $rows
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync notifications.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load notifications.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $notifId = (int)($input['id'] ?? 0);

    try {
        if ($notifId > 0) {
            $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = :nid AND user_id = :uid")
                ->execute([':nid' => $notifId, ':uid' => $userId]);
        } else {
            $db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = :uid AND is_read = 0")
                ->execute([':uid' => $userId]);
        }
        apiResponse(true, 'Notifications marked as read.');
    } catch (Throwable $e) {
        error_log('[FitSync notifications.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to update notifications.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
