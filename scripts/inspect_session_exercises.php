<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();
echo "=== session_exercises ===\n";
print_r($pdo->query("DESCRIBE session_exercises")->fetchAll(PDO::FETCH_ASSOC));
