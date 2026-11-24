<?php
require_once __DIR__ . '/../config/db.php';

try {
    $db = getDbConnection(true);
    echo "DB connected successfully.\n";

    // Operational tables to truncate
    $tablesToTruncate = [
        'attendance',
        'body_measurements',
        'conversations',
        'exercise_set_logs',
        'fitness_assessments',
        'fitness_goals',
        'gym_trainers',
        'meal_items',
        'meals',
        'memberships',
        'messages',
        'notification_preferences',
        'notifications',
        'plan_assignments',
        'plan_day_exercises',
        'plan_days',
        'session_exercises',
        'trainer_assignments',
        'trainer_availability_rules',
        'trainer_data_permissions',
        'trainer_notes',
        'trainer_profiles',
        'user_profiles',
        'water_logs',
        'workout_plans',
        'workout_sessions',
        'users'
    ];

    $db->exec("SET FOREIGN_KEY_CHECKS = 0");

    foreach ($tablesToTruncate as $tbl) {
        $check = $db->query("SHOW TABLES LIKE '$tbl'")->fetch();
        if ($check) {
            $db->exec("TRUNCATE TABLE `$tbl`");
            echo "Truncated table: $tbl\n";
        } else {
            echo "Table not found (skipped): $tbl\n";
        }
    }

    // Reset owner_user_id on gyms so facility definitions remain intact
    $gymCheck = $db->query("SHOW TABLES LIKE 'gyms'")->fetch();
    if ($gymCheck) {
        $db->exec("UPDATE gyms SET owner_user_id = NULL");
        echo "Updated gyms: owner_user_id reset to NULL.\n";
    }

    $db->exec("SET FOREIGN_KEY_CHECKS = 1");

    echo "\nOperational tables successfully reset to clean state (0 records)!\n";

    // Count checks
    $uCount = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $exCount = $db->query("SELECT COUNT(*) FROM exercises")->fetchColumn();
    $mgCount = $db->query("SELECT COUNT(*) FROM muscle_groups")->fetchColumn();
    $gymCount = $db->query("SELECT COUNT(*) FROM gyms")->fetchColumn();
    echo "Verification counts:\n";
    echo "Users: $uCount\n";
    echo "Permanent Exercises: $exCount\n";
    echo "Permanent Muscle Groups: $mgCount\n";
    echo "Gym Facilities: $gymCount\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
