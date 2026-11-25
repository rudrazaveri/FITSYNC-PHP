<?php
/**
 * FitSync AI — Cross-Portal Synchronization Schema Migration
 * Ensures schema supports pending/rejected membership workflows,
 * repairs any empty ENUM status values, and links gym ownership cleanly.
 */
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

$db = getDbConnection(true);

echo "Starting FitSync Cross-Portal Schema Migration...\n";

// 1. Extend memberships.status ENUM to support pending & rejected requests
$db->exec("
    ALTER TABLE memberships
    MODIFY COLUMN status ENUM('pending','active','expired','cancelled','frozen','rejected') NOT NULL DEFAULT 'active'
");
echo "[OK] Extended memberships.status ENUM with 'pending' and 'rejected'.\n";

// 2. Repair corrupted empty users.status values caused by prior 'inactive' ENUM mismatch
$stmt = $db->query("SELECT id, email, role, status FROM users WHERE status = '' OR status IS NULL");
$badUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($badUsers as $u) {
    $uid = (int)$u['id'];
    // Check if they were deactivated (cancelled membership or inactive gym_trainer)
    $isDeactivated = false;
    if ($u['role'] === 'trainer') {
        $gt = $db->prepare("SELECT is_active FROM gym_trainers WHERE trainer_user_id = ? LIMIT 1");
        $gt->execute([$uid]);
        $val = $gt->fetchColumn();
        if ($val !== false && (int)$val === 0 && $uid !== 1) {
            $isDeactivated = true;
        }
    }
    $newStatus = $isDeactivated ? 'deactivated' : 'active';
    $up = $db->prepare("UPDATE users SET status = ? WHERE id = ?");
    $up->execute([$newStatus, $uid]);
    echo "[OK] Repaired user ID {$uid} ({$u['email']}) status -> '{$newStatus}'.\n";
}

// 3. Ensure a valid gym_owner account exists and owns gyms with owner_user_id = 0
$ownerId = (int)$db->query("SELECT id FROM users WHERE role = 'gym_owner' AND status = 'active' ORDER BY id ASC LIMIT 1")->fetchColumn();
if ($ownerId <= 0) {
    $hash = password_hash('password123', PASSWORD_BCRYPT);
    $ins = $db->prepare("
        INSERT INTO users (email, mobile, password_hash, role, full_name, status, created_at, updated_at)
        VALUES ('owner@fitzone.com', '+91 99000 11223', :phash, 'gym_owner', 'Vikram Singhania', 'active', NOW(), NOW())
    ");
    $ins->execute([':phash' => $hash]);
    $ownerId = (int)$db->lastInsertId();
    echo "[OK] Created Gym Owner account owner@fitzone.com (ID: {$ownerId}).\n";
}

$db->prepare("UPDATE gyms SET owner_user_id = ? WHERE owner_user_id = 0 OR owner_user_id IS NULL")->execute([$ownerId]);
echo "[OK] Linked unowned gyms to Gym Owner ID {$ownerId}.\n";

// 4. Ensure gym_trainers is_active=1 for Coach Kabir (ID 1) if role='trainer' and active
$db->exec("UPDATE gym_trainers SET is_active = 1 WHERE trainer_user_id = 1 AND is_active = 0");

// 5. Ensure trainer_data_permissions rows exist for all active trainer_assignments
$db->exec("
    INSERT IGNORE INTO trainer_data_permissions (assignment_id, can_view_measurements, can_view_nutrition, can_view_assessments, can_log_attendance)
    SELECT id, 1, 1, 1, 1 FROM trainer_assignments
");
echo "[OK] Ensured trainer_data_permissions defaults for existing assignments.\n";

echo "Migration complete.\n";
