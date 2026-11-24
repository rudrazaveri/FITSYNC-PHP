<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

$catalogueTables = ['muscle_groups', 'body_regions', 'exercises', 'exercise_equipment', 'food_categories', 'foods', 'recipe_categories', 'recipes'];
foreach ($catalogueTables as $tbl) {
    try {
        $count = $pdo->query("SELECT COUNT(*) FROM `$tbl`")->fetchColumn();
        echo "$tbl: $count rows\n";
    } catch (Exception $e) {
        echo "$tbl: ERROR (" . $e->getMessage() . ")\n";
    }
}
