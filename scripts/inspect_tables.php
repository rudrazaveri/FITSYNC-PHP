<?php
require_once __DIR__ . '/../config/bootstrap.php';
$db = getDbConnection();
$tables = ['water_logs', 'meals', 'meal_items', 'users', 'user_profiles', 'conversations', 'messages', 'trainer_profiles'];
foreach ($tables as $t) {
    echo "=== Table: {$t} ===\n";
    $stmt = $db->query("DESCRIBE `{$t}`");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  {$row['Field']} - {$row['Type']} - Null: {$row['Null']} - Key: {$row['Key']}\n";
    }
}
