<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

$sql = file_get_contents(__DIR__ . '/../fitsync_mysql_schema.sql');

// Extract muscle groups insert
if (preg_match('/INSERT INTO `muscle_groups`.*?;/s', $sql, $m)) {
    try {
        $pdo->exec($m[0]);
        echo "Muscle groups inserted: " . $pdo->query("SELECT COUNT(*) FROM muscle_groups")->fetchColumn() . "\n";
    } catch (Exception $e) {
        echo "Muscle groups error: " . $e->getMessage() . "\n";
    }
}

// Extract exercises insert
if (preg_match('/INSERT INTO `exercises`.*?;/s', $sql, $m)) {
    try {
        $pdo->exec($m[0]);
        echo "Exercises inserted: " . $pdo->query("SELECT COUNT(*) FROM exercises")->fetchColumn() . "\n";
    } catch (Exception $e) {
        echo "Exercises error: " . $e->getMessage() . "\n";
    }
}

// Extract workout_plans, plan_days, plan_day_exercises
$patterns = [
    'workout_plans' => '/INSERT INTO `workout_plans`.*?;/s',
    'plan_days' => '/INSERT INTO `plan_days`.*?;/s',
    'plan_day_exercises' => '/INSERT INTO `plan_day_exercises`.*?;/s'
];

foreach ($patterns as $table => $pattern) {
    if (preg_match_all($pattern, $sql, $matches)) {
        foreach ($matches[0] as $stmt) {
            try {
                $pdo->exec($stmt);
                echo "$table inserted, count: " . $pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn() . "\n";
            } catch (Exception $e) {
                echo "$table error: " . $e->getMessage() . "\n";
            }
        }
    }
}
