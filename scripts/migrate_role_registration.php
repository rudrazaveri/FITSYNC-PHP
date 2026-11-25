<?php
/**
 * FitSync AI — Role-Specific Registration Schema Migration
 * Safely adds role-registration columns & catalog lookups on an existing database.
 */
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

$db = getDbConnection(true);
echo "Running Role-Specific Registration Schema Migration...\n";

function addColumnIfMissing(PDO $db, string $table, string $column, string $definition): void {
    $stmt = $db->prepare("
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tbl AND COLUMN_NAME = :col
    ");
    $stmt->execute([':tbl' => $table, ':col' => $column]);
    if ((int)$stmt->fetchColumn() === 0) {
        $db->exec("ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}");
        echo "[OK] Added {$table}.{$column}\n";
    }
}

addColumnIfMissing($db, 'trainer_profiles', 'qualifications', 'VARCHAR(255) DEFAULT NULL AFTER `specializations_summary`');
addColumnIfMissing($db, 'trainer_profiles', 'areas_of_expertise', 'VARCHAR(255) DEFAULT NULL AFTER `qualifications`');
addColumnIfMissing($db, 'trainer_profiles', 'training_approach', 'TEXT DEFAULT NULL AFTER `areas_of_expertise`');

addColumnIfMissing($db, 'gyms', 'country', "VARCHAR(100) NOT NULL DEFAULT 'India' AFTER `postal_code`");
addColumnIfMissing($db, 'gyms', 'description', 'TEXT DEFAULT NULL AFTER `country`');
addColumnIfMissing($db, 'gyms', 'logo_file_id', 'BIGINT UNSIGNED DEFAULT NULL AFTER `longitude`');
addColumnIfMissing($db, 'gyms', 'capacity', 'INT UNSIGNED NOT NULL DEFAULT 50 AFTER `rating`');

addColumnIfMissing($db, 'gym_trainers', 'status', "ENUM('pending','active','rejected','inactive') NOT NULL DEFAULT 'active' AFTER `employment_type`");
$db->exec("UPDATE `gym_trainers` SET `status` = IF(`is_active` = 1, 'active', 'inactive') WHERE `status` = ''");

// Ensure foreign key for logo_file_id if missing
$fkCheck = $db->query("
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'gyms' AND CONSTRAINT_NAME = 'fk_gyms_logo'
")->fetchColumn();
if ((int)$fkCheck === 0) {
    $db->exec("ALTER TABLE `gyms` ADD CONSTRAINT `fk_gyms_logo` FOREIGN KEY (`logo_file_id`) REFERENCES `files` (`id`) ON DELETE SET NULL");
    echo "[OK] Added fk_gyms_logo constraint\n";
}

// Seed catalog reference lookups (never creates demo users/trainers/owners)
$db->exec("
    INSERT IGNORE INTO `specializations` (`name`, `slug`, `description`) VALUES
    ('Strength Training', 'strength-training', 'Barbell, powerlifting, and maximal force development'),
    ('Weight Loss', 'weight-loss', 'Caloric expenditure, metabolic conditioning, and sustainable fat loss'),
    ('Muscle Building', 'muscle-building', 'Hypertrophy programming and progressive overload splits'),
    ('Functional Fitness', 'functional-fitness', 'Athletic movement, kettlebells, core bracing, and mobility'),
    ('Cardio and Endurance', 'cardio-endurance', 'Aerobic capacity, HIIT intervals, and cardiovascular conditioning'),
    ('Yoga', 'yoga', 'Flexibility, breathwork, balance, and recovery flow'),
    ('General Fitness', 'general-fitness', 'Balanced health, strength, and lifestyle wellness')
");

$db->exec("
    INSERT IGNORE INTO `facilities` (`name`, `icon`) VALUES
    ('Locker Room & Showers', 'lock'),
    ('Steam & Sauna', 'flame'),
    ('Olympic Lifting Platforms', 'dumbbell'),
    ('Cardio Theater', 'heart-pulse'),
    ('Personal Training Studio', 'users'),
    ('24/7 Turnstile Access', 'clock'),
    ('Parking Available', 'car'),
    ('Nutrition & Recovery Bar', 'coffee')
");

$db->exec("
    INSERT IGNORE INTO `equipment` (`name`, `category`, `icon`) VALUES
    ('Barbells & Squat Racks', 'Free Weights', 'dumbbell'),
    ('Dumbbells & Kettlebells', 'Free Weights', 'dumbbell'),
    ('Cable & Pulley Stations', 'Machines', 'activity'),
    ('Treadmills & Rowers', 'Cardio', 'zap'),
    ('Spin & Assault Bikes', 'Cardio', 'wind'),
    ('Bench Press & Plate Loaded', 'Strength', 'shield'),
    ('Turf Track & Sleds', 'Functional', 'flame'),
    ('Yoga Mats & Mobility Tools', 'Recovery', 'heart')
");

echo "[OK] Catalog lookups ensured and migration complete.\n";

$db->exec("
    CREATE TABLE IF NOT EXISTS `user_roles` (
        `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        `user_id` BIGINT UNSIGNED NOT NULL,
        `role` ENUM('user','trainer','gym_owner','admin') NOT NULL,
        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `uq_user_role` (`user_id`, `role`),
        CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");
$db->exec("INSERT IGNORE INTO `user_roles` (`user_id`, `role`) SELECT `id`, `role` FROM `users`");
echo "[OK] Ensured user_roles multi-role table and backfilled existing accounts.\n";

addColumnIfMissing($db, 'user_profiles', 'preferred_gym_id', 'BIGINT UNSIGNED DEFAULT NULL AFTER `fitness_experience`');
addColumnIfMissing($db, 'gym_trainers', 'initiated_by', "ENUM('trainer','gym_owner') NOT NULL DEFAULT 'trainer' AFTER `status`");
$db->exec("ALTER TABLE `gym_trainers` MODIFY COLUMN `status` ENUM('pending','invited','active','rejected','inactive') NOT NULL DEFAULT 'active'");

$db->exec("
    CREATE TABLE IF NOT EXISTS `member_trainer_requests` (
        `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        `member_user_id` BIGINT UNSIGNED NOT NULL,
        `trainer_user_id` BIGINT UNSIGNED NOT NULL,
        `gym_id` BIGINT UNSIGNED DEFAULT NULL,
        `notes` TEXT DEFAULT NULL,
        `status` ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
        `reviewed_by_user_id` BIGINT UNSIGNED DEFAULT NULL,
        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_mtr_member` (`member_user_id`),
        INDEX `idx_mtr_trainer` (`trainer_user_id`),
        INDEX `idx_mtr_gym` (`gym_id`),
        CONSTRAINT `fk_mtr_member` FOREIGN KEY (`member_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_mtr_trainer` FOREIGN KEY (`trainer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_mtr_gym` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE SET NULL,
        CONSTRAINT `fk_mtr_reviewer` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");
$db->exec("ALTER TABLE `gyms` MODIFY COLUMN `status` ENUM('active','inactive','pending_approval','suspended') NOT NULL DEFAULT 'active'");
echo "[OK] Ensured user_profiles.preferred_gym_id, gym_trainers invitation fields, gyms.status enum, and member_trainer_requests.\n";
