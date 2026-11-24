<?php
require_once __DIR__ . '/../config/bootstrap.php';
$db = getDbConnection();
$stmt = $db->query("SELECT id, email, full_name, role, status FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total users: " . count($users) . "\n";
foreach ($users as $u) {
    echo "ID: {$u['id']} | Email: {$u['email']} | Name: {$u['full_name']} | Role: {$u['role']} | Status: {$u['status']}\n";
}
