<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db.php';

$db = getDbConnection(true);

$tables = [
    'users', 'user_profiles', 'user_settings', 'meals', 'meal_items',
    'foods', 'food_servings', 'water_logs', 'trainer_profiles',
    'trainer_assignments', 'conversations', 'messages', 'notifications', 'user_sessions'
];

$existingTables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

echo "=== EXISTING MYSQL TABLES ===" . PHP_EOL;
print_r($existingTables);

echo PHP_EOL . "=== AUDIT OF REQUESTED TABLES ===" . PHP_EOL;
foreach ($tables as $t) {
    if (in_array($t, $existingTables)) {
        echo "TABLE: $t" . PHP_EOL;
        $cols = $db->query("DESCRIBE $t")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $c) {
            echo "  - {$c['Field']} ({$c['Type']}) " . ($c['Null'] === 'NO' ? 'NOT NULL' : 'NULL') . " Key: {$c['Key']} Default: " . var_export($c['Default'], true) . PHP_EOL;
        }
    } else {
        echo "TABLE: $t => [DOES NOT EXIST]" . PHP_EOL;
    }
    echo PHP_EOL;
}
