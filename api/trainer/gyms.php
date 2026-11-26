<?php
/**
 * FitSync AI — API: Trainer Gym Discovery & Association Requests
 * GET: List published active gyms with trainer's association status + current affiliations.
 * POST: Submit a trainer-to-gym association request (pending owner approval).
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/FitSyncDataService.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['trainer', 'admin']);
$trainerUserId = (int)$authUser['id'];

$service = FitSyncDataService::getInstance();
$db = $service->getDb();
if (!$db) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $search   = trim((string)($_GET['search'] ?? ''));
        $city     = trim((string)($_GET['city'] ?? ''));
        $facility = trim((string)($_GET['facility'] ?? ''));
        $gyms = $service->getGymsPublicCatalog($search, $city, $facility);

        $affStmt = $db->prepare("
            SELECT gt.gym_id, gt.status AS affiliation_status, gt.employment_type, gt.initiated_by, gt.is_active, gt.joined_at,
                   g.name AS gym_name, g.city AS gym_city, g.address_line1 AS gym_address, owner_u.full_name AS owner_name
            FROM gym_trainers gt
            INNER JOIN gyms g ON g.id = gt.gym_id
            LEFT JOIN users owner_u ON owner_u.id = g.owner_user_id
            WHERE gt.trainer_user_id = :tid
            ORDER BY FIELD(gt.status, 'active', 'invited', 'pending', 'rejected', 'inactive'), gt.joined_at DESC
        ");
        $affStmt->execute([':tid' => $trainerUserId]);
        $affiliations = $affStmt->fetchAll(PDO::FETCH_ASSOC);

        $affByGym = [];
        foreach ($affiliations as $aff) {
            $affByGym[(int)$aff['gym_id']] = $aff;
        }
        foreach ($gyms as &$g) {
            $gid = (int)$g['id'];
            $g['affiliation'] = $affByGym[$gid] ?? null;
            $g['affiliation_status'] = $affByGym[$gid]['affiliation_status'] ?? 'none';
        }
        unset($g);

        apiResponse(true, 'Published gyms loaded for trainer discovery.', [
            'gyms'         => $gyms,
            'affiliations' => $affiliations
        ]);
    } catch (Throwable $e) {
        error_log('[FitSync trainer/gyms.php GET] ' . $e->getMessage());
        apiResponse(false, 'Unable to load gym directory.', null, 500);
    }
}

if ($method === 'POST') {
    requireCsrfToken();

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action         = trim((string)($input['action'] ?? 'request'));
    $gymId          = (int)($input['gym_id'] ?? 0);
    $employmentType = trim((string)($input['employment_type'] ?? 'full_time'));

    if ($gymId <= 0) {
        apiResponse(false, 'Valid gym_id is required.', null, 400);
    }

    try {
        if ($action === 'request') {
            $res = $service->requestTrainerGymAssociation($trainerUserId, $gymId, $employmentType);
            $msg = !empty($res['duplicate_prevented'])
                ? ($res['message'] ?? 'An association or request already exists for this gym.')
                : 'Gym association request sent! Awaiting Gym Owner approval.';
            apiResponse(true, $msg, $res);
        }

        apiResponse(false, 'Invalid action.', null, 400);
    } catch (InvalidArgumentException $e) {
        apiResponse(false, $e->getMessage(), null, 400);
    } catch (Throwable $e) {
        error_log('[FitSync trainer/gyms.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to submit gym association request.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
