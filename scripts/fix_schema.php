<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

echo "--- Checking gyms.capacity ---\n";
$cols = $pdo->query("SHOW COLUMNS FROM gyms LIKE 'capacity'")->fetchAll();
if (empty($cols)) {
    $pdo->exec("ALTER TABLE gyms ADD COLUMN capacity INT UNSIGNED NOT NULL DEFAULT 50 AFTER rating");
    echo "Added capacity column to gyms\n";
} else {
    echo "capacity column already exists in gyms\n";
}

echo "\n--- Checking trainer_sessions ---\n";
$tables = $pdo->query("SHOW TABLES LIKE 'trainer_sessions'")->fetchAll();
if (empty($tables)) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `trainer_sessions` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `trainer_id` BIGINT UNSIGNED NOT NULL,
                `user_id` BIGINT UNSIGNED NOT NULL,
                `gym_id` BIGINT UNSIGNED NULL,
                `title` VARCHAR(255) NOT NULL DEFAULT 'Personal Training Session',
                `session_type` ENUM('1-on-1 PT', 'Assessment', 'Group Class', 'Form Check', 'Nutrition Review') NOT NULL DEFAULT '1-on-1 PT',
                `scheduled_start` DATETIME NOT NULL,
                `scheduled_end` DATETIME NOT NULL,
                `duration_minutes` INT UNSIGNED NOT NULL DEFAULT 45,
                `status` ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'confirmed',
                `location` VARCHAR(255) NULL DEFAULT 'Gym Floor',
                `notes` TEXT NULL,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_tr_sessions_trainer` (`trainer_id`),
                KEY `idx_tr_sessions_user` (`user_id`),
                KEY `idx_tr_sessions_start` (`scheduled_start`),
                CONSTRAINT `fk_tr_sess_trainer_uniq` FOREIGN KEY (`trainer_id`) REFERENCES `trainer_profiles` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_tr_sess_user_uniq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        echo "Created trainer_sessions table successfully!\n";
    } catch (Exception $e) {
        echo "Error creating trainer_sessions: " . $e->getMessage() . "\n";
    }
} else {
    echo "trainer_sessions table exists\n";
}

echo "\n--- Checking payments table ---\n";
$tables = $pdo->query("SHOW TABLES LIKE 'payments'")->fetchAll();
if (empty($tables)) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `payments` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `user_id` BIGINT UNSIGNED NOT NULL,
                `gym_id` BIGINT UNSIGNED NOT NULL,
                `membership_id` BIGINT UNSIGNED NULL,
                `amount` DECIMAL(10,2) NOT NULL,
                `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
                `payment_status` ENUM('completed', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'completed',
                `payment_method` VARCHAR(50) DEFAULT 'Card',
                `provider_ref` VARCHAR(100) NULL,
                `transaction_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_payments_user` (`user_id`),
                KEY `idx_payments_gym` (`gym_id`),
                KEY `idx_payments_status_date` (`payment_status`, `transaction_date`),
                CONSTRAINT `fk_pay_user_uniq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_pay_gym_uniq` FOREIGN KEY (`gym_id`) REFERENCES `gyms` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        echo "Created payments table successfully!\n";
    } catch (Exception $e) {
        echo "Error creating payments: " . $e->getMessage() . "\n";
    }
} else {
    echo "payments table exists\n";
}

$allTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "\nTotal tables in DB now: " . count($allTables) . "\n";
