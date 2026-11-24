<?php
/**
 * FitSync AI — Exercises API Endpoint (Authoritative MySQL Catalogue)
 *
 * Serves verified exercise directory joined with biomechanical muscle groups.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $db = getDbConnection(true);

    $muscle = isset($_GET['muscle']) ? trim($_GET['muscle']) : 'all';
    $search = isset($_GET['q']) ? trim($_GET['q']) : '';

    $sql = "
        SELECT 
            e.id, e.code, e.name, e.exercise_type, e.equipment_required, e.difficulty,
            e.form_cues, e.coaching_tips, e.default_target_sets, e.default_target_reps,
            e.default_rest_seconds, e.image_path,
            mg.code AS muscle_code, mg.name AS muscle_name, mg.latin_name, mg.view_aspect,
            mg.category AS muscle_category, mg.biomechanical_function, mg.synergist_muscles
        FROM exercises e
        LEFT JOIN muscle_groups mg ON mg.id = e.primary_muscle_id
        WHERE 1=1
    ";
    $params = [];

    if ($muscle !== 'all' && $muscle !== '') {
        $muscleNormalized = str_replace('-', '_', $muscle);
        if ($muscleNormalized === 'lowerback') $muscleNormalized = 'lower_back';
        $sql .= " AND (mg.code = :mcode OR mg.code = :mcode2)";
        $params[':mcode'] = $muscle;
        $params[':mcode2'] = $muscleNormalized;
    }

    if ($search !== '') {
        $sql .= " AND (e.name LIKE :search OR e.form_cues LIKE :search2 OR mg.name LIKE :search3)";
        $params[':search'] = '%' . $search . '%';
        $params[':search2'] = '%' . $search . '%';
        $params[':search3'] = '%' . $search . '%';
    }

    $sql .= " ORDER BY e.id ASC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $exercises = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format for frontend consumption
    $formatted = array_map(function($ex) {
        $mGroup = $ex['muscle_code'] ?? 'all';
        if ($mGroup === 'lower_back') $mGroup = 'lowerback';
        return [
            'id'          => 'ex_' . $ex['id'],
            'db_id'       => (int)$ex['id'],
            'name'        => $ex['name'],
            'muscle'      => $ex['muscle_name'] ?? 'Primary Muscle Group',
            'muscleGroup' => $mGroup,
            'equipment'   => ucfirst($ex['equipment_required'] ?? 'Barbell'),
            'difficulty'  => ucfirst($ex['difficulty'] ?? 'Intermediate'),
            'type'        => ucfirst($ex['exercise_type'] ?? 'Compound'),
            'target'      => ($ex['default_target_sets'] ?? 3) . ' sets x ' . ($ex['default_target_reps'] ?? '8-10 reps'),
            'rest'        => ($ex['default_rest_seconds'] ?? 90) . 's Rest',
            'cues'        => $ex['form_cues'] ?? 'Maintain structural alignment, brace core, control tempo.',
            'image'       => !empty($ex['image_path']) ? $ex['image_path'] : 'assets/images/ex_incline_bench.jpg'
        ];
    }, $exercises);

    echo json_encode([
        'success'   => true,
        'count'     => count($formatted),
        'exercises' => $formatted
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
