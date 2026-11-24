<?php
require_once __DIR__ . '/../config/bootstrap.php';

$db = getDbConnection();
echo "=== MEALS IN DB ===\n";
$stmt = $db->query("SELECT * FROM meals");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "=== WATER LOGS IN DB ===\n";
$stmt = $db->query("SELECT * FROM water_logs");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
