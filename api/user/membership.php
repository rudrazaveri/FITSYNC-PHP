<?php
/**
 * FitSync AI — API: User Membership & Public Active Gyms Discovery Directory
 * Retrieves authoritative active gyms (with hours, facilities, equipment, photos, plans)
 * from central MySQL database and processes membership requests/renewals/cancellations.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'admin']);
$userId = (int)$authUser['id'];

$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database unavailable.', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $service->expireEndedMemberships();

        // User's memberships (all statuses so history, owner response, and assigned coach stay synced)
        $mStmt = $db->prepare("
            SELECT m.*, mp.name AS plan_name, mp.price, mp.duration_months, mp.access_type,
                   g.name AS gym_name, g.city AS gym_city, g.address_line1 AS gym_address, g.phone AS gym_phone, g.status AS gym_status,
                   app_u.full_name AS approved_by_name,
                   rej_u.full_name AS rejected_by_name,
                   ta.trainer_user_id AS assigned_coach_id,
                   coach_u.full_name AS assigned_coach_name,
                   tp.specializations_summary AS assigned_coach_spec
            FROM memberships m
            LEFT JOIN membership_plans mp ON mp.id = m.plan_id
            LEFT JOIN gyms g ON g.id = m.gym_id
            LEFT JOIN users app_u ON app_u.id = m.approved_by_user_id
            LEFT JOIN users rej_u ON rej_u.id = m.rejected_by_user_id
            LEFT JOIN trainer_assignments ta ON ta.user_id = m.user_id AND ta.gym_id = m.gym_id AND ta.status = 'active'
            LEFT JOIN users coach_u ON coach_u.id = ta.trainer_user_id AND coach_u.status = 'active'
            LEFT JOIN trainer_profiles tp ON tp.user_id = coach_u.id
            WHERE m.user_id = :uid
            ORDER BY FIELD(m.status, 'active', 'pending', 'frozen', 'expired', 'cancelled', 'rejected'), m.id DESC
        ");
        $mStmt->execute([':uid' => $userId]);
        $memberships = $mStmt->fetchAll(PDO::FETCH_ASSOC);

        $search   = trim((string)($_GET['search'] ?? ''));
        $city     = trim((string)($_GET['city'] ?? ''));
        $facility = trim((string)($_GET['facility'] ?? ''));
        $maxPrice = isset($_GET['max_price']) && is_numeric($_GET['max_price']) ? (float)$_GET['max_price'] : null;
        $gyms     = $service->getGymsPublicCatalog($search, $city, $facility, $maxPrice);

        apiResponse(true, 'Membership details loaded.', [
            'current_membership' => $memberships[0] ?? null,
            'history'            => $memberships,
            'gyms'               => $gyms
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync user/membership.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load membership details.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = trim((string)($input['action'] ?? ''));

    try {
        if ($action === 'request' || $action === 'renew') {
            $gymId  = (int)($input['gym_id'] ?? 0);
            $planId = (int)($input['plan_id'] ?? 0);
            if ($gymId <= 0 || $planId <= 0) {
                apiResponse(false, 'Valid gym and plan selection required.', null, 400);
            }
            $res = $service->requestOrRenewMembership($userId, $gymId, $planId, $action === 'renew');
            $msg = !empty($res['duplicate_prevented'])
                ? 'A matching membership request or active membership already exists.'
                : 'Membership request submitted! Awaiting Gym Owner approval.';
            apiResponse(true, $msg, $res);
        }

        if ($action === 'cancel') {
            $membershipId = (int)($input['membership_id'] ?? 0);
            $res = $service->cancelUserMembership($userId, $membershipId);
            apiResponse(true, 'Membership has been cancelled.', $res);
        }

        apiResponse(false, 'Invalid membership action.', null, 400);
    } catch (InvalidArgumentException $e) {
        apiResponse(false, $e->getMessage(), null, 400);
    } catch (Throwable $e) {
        error_log('[FitSync user/membership.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to process membership request.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
