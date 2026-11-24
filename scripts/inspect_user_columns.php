<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

echo "--- USERS COLUMNS ---\n";
print_r($pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN));

echo "\n--- USER_PROFILES COLUMNS ---\n";
print_r($pdo->query("DESCRIBE user_profiles")->fetchAll(PDO::FETCH_COLUMN));

echo "\n--- TRAINER_PROFILES COLUMNS ---\n";
print_r($pdo->query("DESCRIBE trainer_profiles")->fetchAll(PDO::FETCH_COLUMN));
