<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

$sql = file_get_contents(__DIR__ . '/../fitsync_mysql_schema.sql');

// Split SQL by statements or execute batches
$statements = array_filter(array_map('trim', explode(';', $sql)));

$imported = 0;
$errors = [];

foreach ($statements as $stmt) {
    if (empty($stmt)) continue;
    try {
        $pdo->exec($stmt);
        $imported++;
    } catch (PDOException $e) {
        $errors[] = substr($stmt, 0, 80) . " => " . $e->getMessage();
    }
}

echo "Executed statements: $imported\n";
echo "Errors count: " . count($errors) . "\n";
if (!empty($errors)) {
    echo "First 5 errors:\n" . implode("\n", array_slice($errors, 0, 5)) . "\n";
}

$tablesInDb = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "Total tables in DB now: " . count($tablesInDb) . "\n";
