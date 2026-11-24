<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

$tables = [
    'body_measurements',
    'attendance',
    'conversations',
    'messages',
    'trainer_notes',
    'plan_assignments',
    'workout_sessions',
    'exercise_set_logs',
    'water_logs',
    'meals',
    'meal_items'
];

foreach ($tables as $t) {
    echo "=== $t ===\n";
    try {
        $cols = $pdo->query("DESCRIBE `$t`")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $c) {
            echo "  {$c['Field']} ({$c['Type']})\n";
        }
    } catch (Exception $e) {
        echo "  ERROR: " . $e->getMessage() . "\n";
    }
}
