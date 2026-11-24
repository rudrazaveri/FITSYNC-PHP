<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

$tablesInDb = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

$sql = file_get_contents(__DIR__ . '/../fitsync_mysql_schema.sql');
preg_match_all('/CREATE TABLE (?:IF NOT EXISTS )?`?([a-zA-Z0-9_]+)`?/i', $sql, $matches);
$tablesInSql = array_unique($matches[1]);

echo "Tables in fitsync_mysql_schema.sql: " . count($tablesInSql) . "\n";
echo "Tables in MySQL DB: " . count($tablesInDb) . "\n\n";

$missingInDb = array_diff($tablesInSql, $tablesInDb);
echo "Missing in DB (" . count($missingInDb) . "):\n";
echo implode(", ", $missingInDb) . "\n\n";

// Check gyms table columns
$gymCols = $pdo->query("DESCRIBE gyms")->fetchAll(PDO::FETCH_COLUMN);
echo "Gyms columns: " . implode(", ", $gymCols) . "\n";
