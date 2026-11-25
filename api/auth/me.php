<?php
/**
 * FitSync AI — API: Current Authenticated User Session Profile & CSRF Token
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

initSecureSession();

if (!isLoggedIn()) {
    jsonResponse([
        'success'    => true,
        'isLoggedIn' => false,
        'user'       => null,
        'csrf_token' => getCsrfToken()
    ]);
}

$user = currentUser();
$extra = [];

try {
    $db = getDbConnection();
    if ($db && $user) {
        $roles = getUserAuthorizedRoles((int)$user['id'], (string)$user['role']);
        $_SESSION['authorized_roles'] = $roles;
        $extra['authorized_roles'] = $roles;
        $extra['active_portal'] = $_SESSION['active_portal'] ?? $user['role'];

        if (in_array('user', $roles, true)) {
            $tStmt = $db->prepare("
                SELECT u.id, u.full_name, u.email, tp.certification_name
                FROM trainer_assignments ta
                INNER JOIN users u ON u.id = ta.trainer_user_id AND u.status = 'active'
                LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
                WHERE ta.user_id = :uid AND ta.status = 'active'
                LIMIT 1
            ");
            $tStmt->execute([':uid' => $user['id']]);
            $extra['assigned_trainer'] = $tStmt->fetch(PDO::FETCH_ASSOC) ?: null;
        }
        if (in_array('gym_owner', $roles, true)) {
            $gStmt = $db->prepare("SELECT id, name, city, capacity FROM gyms WHERE owner_user_id = :oid LIMIT 1");
            $gStmt->execute([':oid' => $user['id']]);
            $extra['owned_gym'] = $gStmt->fetch(PDO::FETCH_ASSOC) ?: null;
        }
    }
} catch (Throwable $e) {
    error_log('[FitSync me.php] ' . $e->getMessage());
}

jsonResponse([
    'success'    => true,
    'isLoggedIn' => true,
    'user'       => array_merge($user, $extra),
    'csrf_token' => getCsrfToken()
]);
