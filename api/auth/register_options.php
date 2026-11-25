<?php
/**
 * FitSync AI — API: Role Registration Catalog & Verified Gyms Options
 * Returns verified/active gyms with active plans, trainer specializations,
 * facility amenities, and gym equipment catalogs from MySQL.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

$db = getDbConnection();
if ($db === null) {
    apiResponse(false, 'Database connection unavailable.', null, 500);
}

try {
    $gymsStmt = $db->query("
        SELECT id, name, brand_name, city, state, address_line1, rating
        FROM gyms
        WHERE status = 'active'
        ORDER BY id ASC
    ");
    $gyms = $gymsStmt->fetchAll(PDO::FETCH_ASSOC);

    $planStmt = $db->prepare("
        SELECT id, name, description, duration_months, price, access_type
        FROM membership_plans
        WHERE gym_id = :gid AND is_active = 1
        ORDER BY price ASC
    ");
    foreach ($gyms as &$g) {
        $planStmt->execute([':gid' => (int)$g['id']]);
        $g['plans'] = $planStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    unset($g);

    $specs = $db->query("SELECT id, name, slug, description FROM specializations ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    $facilities = $db->query("SELECT id, name, icon FROM facilities ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    $equipment = $db->query("SELECT id, name, category, icon FROM equipment ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);

    apiResponse(true, 'Registration catalog loaded.', [
        'gyms'            => $gyms,
        'specializations' => $specs,
        'facilities'      => $facilities,
        'equipment'       => $equipment
    ]);
} catch (Throwable $e) {
    error_log('[FitSync register_options.php] ' . $e->getMessage());
    apiResponse(false, 'Unable to load registration options.', null, 500);
}
