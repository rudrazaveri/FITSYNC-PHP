<?php
require_once __DIR__ . '/../config/bootstrap.php';
$db = getDbConnection();
$db->exec('DELETE FROM meal_items');
$db->exec('DELETE FROM meals');
$db->exec('DELETE FROM water_logs');
echo 'Meals count: ' . $db->query('SELECT COUNT(*) FROM meals')->fetchColumn() . PHP_EOL;
echo 'Water logs count: ' . $db->query('SELECT COUNT(*) FROM water_logs')->fetchColumn() . PHP_EOL;
