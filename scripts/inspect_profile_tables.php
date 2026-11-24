<?php
require_once __DIR__ . '/../config/bootstrap.php';
$pdo = getDbConnection();
$stmt = $pdo->query("SHOW TABLES");
$tables = [];
while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
    $tables[] = $row[0];
}
echo "All tables: " . implode(', ', $tables) . "\n\n";

$inspect = ['user_profiles', 'trainer_profiles', 'fitness_assessments', 'user_settings', 'notification_preferences'];
foreach ($inspect as $t) {
    if (in_array($t, $tables)) {
        echo "=== Table: $t ===\n";
        $stmt = $pdo->query("DESCRIBE $t");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "{$row['Field']} ({$row['Type']})\n";
        }
    } else {
        echo "Table $t does NOT exist.\n";
    }
}
