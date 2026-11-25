<?php
/**
 * FitSync AI — Meals API Endpoint (Authoritative MySQL CRUD)
 * Strictly enforces session identity, ownership checks, and CSRF protection.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=UTF-8');

$authUser = requireApiAuth(['user', 'admin']);
$userId = (int)$authUser['id'];

try {
    $db = getDbConnection(true);
} catch (Exception $e) {
    apiResponse(false, 'Database connection unavailable', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $date = $_GET['date'] ?? date('Y-m-d');
    $stmt = $db->prepare("
        SELECT m.id, m.user_id, m.meal_type, m.meal_date, m.total_calories, m.total_protein_g, m.total_carbs_g, m.total_fat_g, m.logged_at,
               mi.id AS item_id, mi.quantity, mi.unit, mi.calories AS item_cal, mi.protein_g AS item_prot, mi.carbs_g AS item_carbs, mi.fat_g AS item_fat
        FROM meals m
        LEFT JOIN meal_items mi ON mi.meal_id = m.id
        WHERE m.user_id = :uid AND m.meal_date = :mdate
        ORDER BY m.logged_at DESC
    ");
    $stmt->execute([':uid' => $userId, ':mdate' => $date]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $meals = [];
    $totalCal = 0;
    $totalP = 0.0;
    $totalC = 0.0;
    $totalF = 0.0;

    foreach ($rows as $r) {
        $mid = (int)$r['id'];
        if (!isset($meals[$mid])) {
            $meals[$mid] = [
                'id'        => $mid,
                'user_id'   => (int)$r['user_id'],
                'category'  => ucfirst(str_replace('_', ' ', $r['meal_type'])),
                'meal_type' => $r['meal_type'],
                'food_name' => $r['unit'] ?? ucfirst(str_replace('_', ' ', $r['meal_type'])),
                'date'      => $r['meal_date'],
                'calories'  => (int)$r['total_calories'],
                'protein'   => (float)$r['total_protein_g'],
                'carbs'     => (float)$r['total_carbs_g'],
                'fat'       => (float)$r['total_fat_g'],
                'logged_at' => $r['logged_at'],
                'time'      => date('h:i A', strtotime($r['logged_at'])),
                'items'     => []
            ];
            $totalCal += (int)$r['total_calories'];
            $totalP += (float)$r['total_protein_g'];
            $totalC += (float)$r['total_carbs_g'];
            $totalF += (float)$r['total_fat_g'];
        }
        if (!empty($r['item_id'])) {
            $meals[$mid]['items'][] = [
                'id'       => (int)$r['item_id'],
                'name'     => $r['unit'],
                'calories' => (int)$r['item_cal'],
                'protein'  => (float)$r['item_prot'],
                'carbs'    => (float)$r['item_carbs'],
                'fat'      => (float)$r['item_fat']
            ];
        }
    }

    apiResponse(true, 'Meals retrieved.', [
        'meals'  => array_values($meals),
        'totals' => [
            'calories' => $totalCal,
            'protein'  => round($totalP, 1),
            'carbs'    => round($totalC, 1),
            'fat'      => round($totalF, 1),
            'count'    => count($meals)
        ]
    ]);
}

if ($method === 'POST' || $method === 'PUT') {
    requireCsrfToken();

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;

    $editMealId = (int)($input['id'] ?? $input['meal_id'] ?? 0);
    $action = (string)($input['action'] ?? '');

    $rawTiming = strtolower(trim((string)($input['category'] ?? $input['meal_type'] ?? 'lunch')));
    $validTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];
    $mealType = 'lunch';
    if (in_array($rawTiming, $validTypes, true)) {
        $mealType = $rawTiming;
    } elseif (strpos($rawTiming, 'break') !== false) {
        $mealType = 'breakfast';
    } elseif (strpos($rawTiming, 'din') !== false) {
        $mealType = 'dinner';
    } elseif (strpos($rawTiming, 'post') !== false) {
        $mealType = 'post_workout';
    } elseif (strpos($rawTiming, 'pre') !== false) {
        $mealType = 'pre_workout';
    } elseif (strpos($rawTiming, 'snack') !== false) {
        $mealType = 'snack';
    }

    $foodName = trim((string)($input['food_name'] ?? $input['name'] ?? 'Balanced Meal'));
    if (empty($foodName)) {
        apiResponse(false, 'Food name cannot be empty.', null, 400);
    }

    $protein = max(0.0, (float)($input['protein'] ?? $input['protein_g'] ?? 0));
    $carbs   = max(0.0, (float)($input['carbs'] ?? $input['carbs_g'] ?? 0));
    $fat     = max(0.0, (float)($input['fat'] ?? $input['fat_g'] ?? 0));

    $calculatedCalories = (int)round(($protein * 4) + ($carbs * 4) + ($fat * 9));
    $calories = isset($input['calories']) && (int)$input['calories'] > 0 ? (int)$input['calories'] : $calculatedCalories;
    if ($calories === 0 && $calculatedCalories > 0) {
        $calories = $calculatedCalories;
    }

    $mealDate = !empty($input['meal_date']) ? (string)$input['meal_date'] : date('Y-m-d');
    $now = date('Y-m-d H:i:s');

    if (($method === 'PUT' || $action === 'edit') && $editMealId > 0) {
        $db->beginTransaction();
        try {
            $chk = $db->prepare("SELECT id FROM meals WHERE id = :mid AND user_id = :uid LIMIT 1");
            $chk->execute([':mid' => $editMealId, ':uid' => $userId]);
            if (!$chk->fetchColumn()) {
                $db->rollBack();
                apiResponse(false, 'Forbidden: Meal not found or belongs to another user.', null, 403);
            }

            $stmt = $db->prepare("
                UPDATE meals 
                SET meal_type = :mtype, total_calories = :cal, total_protein_g = :prot, total_carbs_g = :carbs, total_fat_g = :fat
                WHERE id = :mid AND user_id = :uid
            ");
            $stmt->execute([
                ':mtype' => $mealType, ':cal' => $calories, ':prot' => $protein,
                ':carbs' => $carbs, ':fat' => $fat, ':mid' => $editMealId, ':uid' => $userId
            ]);

            $stmtItem = $db->prepare("
                UPDATE meal_items 
                SET unit = :unit, calories = :cal, protein_g = :prot, carbs_g = :carbs, fat_g = :fat
                WHERE meal_id = :mid
            ");
            $stmtItem->execute([
                ':unit' => $foodName, ':cal' => $calories, ':prot' => $protein,
                ':carbs' => $carbs, ':fat' => $fat, ':mid' => $editMealId
            ]);

            $db->commit();

            $mealObj = [
                'id' => $editMealId, 'user_id' => $userId,
                'category' => ucfirst(str_replace('_', ' ', $mealType)),
                'food_name' => $foodName, 'calories' => $calories,
                'protein_g' => $protein, 'carbs_g' => $carbs, 'fat_g' => $fat,
                'time' => date('h:i A', strtotime($now)), 'logged_at' => $now
            ];
            jsonResponse([
                'success' => true,
                'message' => 'Meal successfully updated in database.',
                'data'    => $mealObj,
                'meal'    => $mealObj
            ]);
        } catch (Throwable $e) {
            $db->rollBack();
            error_log('[FitSync meals.php PUT] ' . $e->getMessage());
            apiResponse(false, 'Unable to update meal.', null, 500);
        }
    }

    $db->beginTransaction();
    try {
        $stmt = $db->prepare("
            INSERT INTO meals (user_id, meal_type, meal_date, total_calories, total_protein_g, total_carbs_g, total_fat_g, logged_at)
            VALUES (:uid, :mtype, :mdate, :cal, :prot, :carbs, :fat, :logged_at)
        ");
        $stmt->execute([
            ':uid' => $userId, ':mtype' => $mealType, ':mdate' => $mealDate,
            ':cal' => $calories, ':prot' => $protein, ':carbs' => $carbs,
            ':fat' => $fat, ':logged_at' => $now
        ]);
        $mealId = (int)$db->lastInsertId();

        $stmtItem = $db->prepare("
            INSERT INTO meal_items (meal_id, food_id, quantity, unit, calories, protein_g, carbs_g, fat_g)
            VALUES (:mid, NULL, 1.0, :unit, :cal, :prot, :carbs, :fat)
        ");
        $stmtItem->execute([
            ':mid' => $mealId, ':unit' => $foodName, ':cal' => $calories,
            ':prot' => $protein, ':carbs' => $carbs, ':fat' => $fat
        ]);

        $db->commit();

        $mealObj = [
            'id' => $mealId, 'user_id' => $userId,
            'category' => ucfirst(str_replace('_', ' ', $mealType)),
            'food_name' => $foodName, 'calories' => $calories,
            'protein_g' => $protein, 'carbs_g' => $carbs, 'fat_g' => $fat,
            'time' => date('h:i A', strtotime($now)), 'logged_at' => $now
        ];
        jsonResponse([
            'success' => true,
            'message' => 'Meal successfully logged into database.',
            'data'    => $mealObj,
            'meal'    => $mealObj
        ]);
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('[FitSync meals.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to record meal.', null, 500);
    }
}

if ($method === 'DELETE') {
    requireCsrfToken();

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_GET;
    $mealId = (int)($input['id'] ?? 0);

    if ($mealId <= 0) {
        apiResponse(false, 'Invalid meal ID.', null, 400);
    }

    $db->beginTransaction();
    try {
        $chk = $db->prepare("SELECT id FROM meals WHERE id = :mid AND user_id = :uid LIMIT 1");
        $chk->execute([':mid' => $mealId, ':uid' => $userId]);
        if (!$chk->fetchColumn()) {
            $db->rollBack();
            apiResponse(false, 'Forbidden: Meal not found or unauthorized.', null, 403);
        }

        $db->prepare("DELETE FROM meal_items WHERE meal_id = :mid")->execute([':mid' => $mealId]);
        $db->prepare("DELETE FROM meals WHERE id = :mid AND user_id = :uid")->execute([':mid' => $mealId, ':uid' => $userId]);

        $db->commit();
        apiResponse(true, 'Meal deleted from database.');
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('[FitSync meals.php DELETE] ' . $e->getMessage());
        apiResponse(false, 'Unable to delete meal.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
