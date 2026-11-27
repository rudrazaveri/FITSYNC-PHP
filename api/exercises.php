<?php
/**
 * FitSync AI — Exercises Library API (GET + Trainer Custom Exercise POST)
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/upload_helper.php';

header('Content-Type: application/json; charset=UTF-8');

$db = getDbConnection(true);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $muscle     = trim((string)($_GET['muscle'] ?? 'all'));
        $category   = trim((string)($_GET['category'] ?? 'all'));
        $equipment  = trim((string)($_GET['equipment'] ?? 'all'));
        $difficulty = trim((string)($_GET['difficulty'] ?? 'all'));
        $type       = trim((string)($_GET['type'] ?? 'all'));
        $search     = trim((string)($_GET['q'] ?? ''));

        $sql = "
            SELECT 
                e.id, e.code, e.name, e.description, e.category, e.exercise_type, e.equipment_required, e.difficulty,
                e.form_cues, e.coaching_tips, e.default_target_sets, e.default_target_reps,
                e.default_rest_seconds, e.image_path, e.video_url, e.is_active, e.created_by_trainer_id,
                mg.code AS muscle_code, mg.name AS muscle_name, mg.latin_name, mg.view_aspect,
                mg.category AS muscle_category, mg.biomechanical_function, mg.synergist_muscles
            FROM exercises e
            LEFT JOIN muscle_groups mg ON mg.id = e.primary_muscle_id
            WHERE e.is_active = 1
        ";
        $params = [];

        if ($muscle !== 'all' && $muscle !== '') {
            $muscleNormalized = str_replace('-', '_', strtolower($muscle));
            if ($muscleNormalized === 'lowerback') $muscleNormalized = 'lower_back';
            $sql .= " AND (LOWER(mg.code) = :mcode OR LOWER(mg.code) = :mcode2)";
            $params[':mcode'] = strtolower($muscle);
            $params[':mcode2'] = $muscleNormalized;
        }
        if ($category !== 'all' && $category !== '') {
            $sql .= " AND LOWER(e.category) = LOWER(:cat)";
            $params[':cat'] = $category;
        }
        if ($equipment !== 'all' && $equipment !== '') {
            $sql .= " AND LOWER(e.equipment_required) = LOWER(:eq)";
            $params[':eq'] = $equipment;
        }
        if ($difficulty !== 'all' && $difficulty !== '') {
            $sql .= " AND LOWER(e.difficulty) = LOWER(:diff)";
            $params[':diff'] = $difficulty;
        }
        if ($type !== 'all' && $type !== '') {
            $sql .= " AND LOWER(e.exercise_type) = LOWER(:etype)";
            $params[':etype'] = $type;
        }
        if ($search !== '') {
            $sql .= " AND (e.name LIKE :s1 OR e.description LIKE :s2 OR e.form_cues LIKE :s3 OR mg.name LIKE :s4 OR e.category LIKE :s5)";
            $like = '%' . $search . '%';
            $params[':s1'] = $like;
            $params[':s2'] = $like;
            $params[':s3'] = $like;
            $params[':s4'] = $like;
            $params[':s5'] = $like;
        }

        $sql .= " ORDER BY e.id ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $exercises = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $secRows = $db->query("
            SELECT em.exercise_id, mg.name
            FROM exercise_muscles em
            INNER JOIN muscle_groups mg ON mg.id = em.muscle_id
            WHERE em.is_primary = 0
        ")->fetchAll(PDO::FETCH_ASSOC);
        $secByEx = [];
        foreach ($secRows as $sr) {
            $secByEx[(int)$sr['exercise_id']][] = $sr['name'];
        }

        $formatted = array_map(function($ex) use ($secByEx) {
            $secMuscles = $secByEx[(int)$ex['id']] ?? [];
            $mGroup = $ex['muscle_code'] ?? 'all';
            if ($mGroup === 'lower_back') $mGroup = 'lowerback';
            return [
                'id'                   => 'ex_' . $ex['id'],
                'db_id'                => (int)$ex['id'],
                'name'                 => $ex['name'],
                'description'          => $ex['description'] ?: ($ex['form_cues'] ?? ''),
                'category'             => $ex['category'] ?: 'Full Body',
                'muscle'               => $ex['muscle_name'] ?? 'Primary Muscle Group',
                'muscleGroup'          => $mGroup,
                'secondary_muscles'    => $secMuscles,
                'equipment'            => ucfirst($ex['equipment_required'] ?? 'Barbell'),
                'equipment_key'        => $ex['equipment_required'] ?? 'barbell',
                'difficulty'           => ucfirst($ex['difficulty'] ?? 'Intermediate'),
                'difficulty_key'       => $ex['difficulty'] ?? 'intermediate',
                'type'                 => ucfirst($ex['exercise_type'] ?? 'Compound'),
                'type_key'             => $ex['exercise_type'] ?? 'compound',
                'default_target_sets'  => (int)($ex['default_target_sets'] ?? 3),
                'default_target_reps'  => (string)($ex['default_target_reps'] ?? '8-12'),
                'default_rest_seconds' => (int)($ex['default_rest_seconds'] ?? 90),
                'target'               => ($ex['default_target_sets'] ?? 3) . ' sets x ' . ($ex['default_target_reps'] ?? '8-10 reps'),
                'rest'                 => ($ex['default_rest_seconds'] ?? 90) . 's Rest',
                'cues'                 => $ex['form_cues'] ?? 'Maintain structural alignment, brace core, control tempo.',
                'coaching_tips'        => $ex['coaching_tips'] ?? '',
                'image'                => !empty($ex['image_path']) ? fitSyncResolveFileUrl($ex['image_path'], 'assets/images/exercise_placeholder.svg') : 'assets/images/exercise_placeholder.svg',
                'video_url'            => $ex['video_url'] ?? '',
                'is_custom'            => !empty($ex['created_by_trainer_id'])
            ];
        }, $exercises);

        $muscleGroups = $db->query("SELECT id, code, name FROM muscle_groups ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success'       => true,
            'count'         => count($formatted),
            'exercises'     => $formatted,
            'muscle_groups' => $muscleGroups,
            'categories'    => ['Chest','Back','Shoulders','Biceps','Triceps','Forearms','Quadriceps','Hamstrings','Glutes','Calves','Core','Full Body','Cardio']
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    $authUser = requireApiAuth(['trainer', 'admin']);
    requireCsrfToken();

    $rawInput = file_get_contents('php://input');
    $input = (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false)
        ? (json_decode($rawInput, true) ?: [])
        : (!empty($_POST) ? $_POST : (json_decode($rawInput, true) ?: []));

    $action = trim((string)($input['action'] ?? 'create'));
    if ($action === 'update_image') {
        $exerciseId = (int)($input['exercise_id'] ?? 0);
        if ($exerciseId <= 0) {
            apiResponse(false, 'Valid exercise_id is required.', null, 400);
        }
        $chk = $db->prepare("SELECT id, name, image_path FROM exercises WHERE id = :eid LIMIT 1");
        $chk->execute([':eid' => $exerciseId]);
        $exRow = $chk->fetch(PDO::FETCH_ASSOC);
        if (!$exRow) {
            apiResponse(false, 'Exercise not found.', null, 404);
        }

        $uploadedStorageKey = null;
        $db->beginTransaction();
        try {
            $newImagePath = '';
            if (!empty($_FILES['exercise_image']) && (int)($_FILES['exercise_image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
                $fileId = fitSyncStoreUploadedFile($db, $_FILES['exercise_image'], 'exercise_media', (int)$authUser['id'], false, false);
                if ($fileId) {
                    $skQ = $db->prepare("SELECT storage_key FROM files WHERE id = :fid LIMIT 1");
                    $skQ->execute([':fid' => $fileId]);
                    $uploadedStorageKey = (string)$skQ->fetchColumn();
                    $newImagePath = fitSyncResolveFileUrl($uploadedStorageKey, 'assets/images/exercise_placeholder.svg');
                }
            } elseif (!empty($input['image_path']) && preg_match('#^(assets/images/|uploads/)#i', trim((string)$input['image_path']))) {
                $newImagePath = trim((string)$input['image_path']);
            } elseif (!empty($input['remove_image'])) {
                $newImagePath = 'assets/images/exercise_placeholder.svg';
            }

            if ($newImagePath === '') {
                apiResponse(false, 'Please select a valid JPG, PNG, or WEBP exercise image.', null, 400);
            }

            // Scoped strictly to the target exercise ID
            $db->prepare("UPDATE exercises SET image_path = :img, updated_at = NOW() WHERE id = :eid")
                ->execute([':img' => $newImagePath, ':eid' => $exerciseId]);
            $db->commit();

            // Remove previous uploaded file if it lived in uploads/registration/ and is unused elsewhere
            $oldImg = (string)($exRow['image_path'] ?? '');
            if ($oldImg !== '' && $oldImg !== $newImagePath && str_starts_with($oldImg, 'uploads/')) {
                $cntStmt = $db->prepare("SELECT COUNT(*) FROM exercises WHERE image_path = :old");
                $cntStmt->execute([':old' => $oldImg]);
                if ((int)$cntStmt->fetchColumn() === 0) {
                    fitSyncUnlinkRelativeStorageKey($oldImg);
                    $db->prepare("DELETE FROM files WHERE storage_key = :old AND purpose = 'exercise_media'")->execute([':old' => $oldImg]);
                }
            }

            apiResponse(true, "Updated image for '{$exRow['name']}'.", [
                'exercise_id' => $exerciseId,
                'name'        => $exRow['name'],
                'image_path'  => $newImagePath
            ]);
        } catch (InvalidArgumentException $e) {
            if ($db->inTransaction()) $db->rollBack();
            if ($uploadedStorageKey) fitSyncUnlinkRelativeStorageKey($uploadedStorageKey);
            apiResponse(false, $e->getMessage(), null, 400);
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            if ($uploadedStorageKey) fitSyncUnlinkRelativeStorageKey($uploadedStorageKey);
            error_log('[FitSync exercises.php update_image] ' . $e->getMessage());
            apiResponse(false, 'Unable to update exercise image.', null, 500);
        }
    }

    $name        = trim((string)($input['name'] ?? ''));
    $category    = trim((string)($input['category'] ?? 'Full Body'));
    $description = trim((string)($input['description'] ?? ''));
    $formCues    = trim((string)($input['form_cues'] ?? ($input['instructions'] ?? $description)));
    $equip       = strtolower(trim((string)($input['equipment_required'] ?? ($input['equipment'] ?? 'dumbbell'))));
    $difficulty  = strtolower(trim((string)($input['difficulty'] ?? 'intermediate')));
    $exType      = strtolower(trim((string)($input['exercise_type'] ?? ($input['type'] ?? 'compound'))));
    $sets        = isset($input['default_target_sets']) ? (int)$input['default_target_sets'] : 3;
    $reps        = trim((string)($input['default_target_reps'] ?? '8-12'));
    $rest        = isset($input['default_rest_seconds']) ? (int)$input['default_rest_seconds'] : 90;
    $rawImgInput = trim((string)($input['image_path'] ?? ''));
    $imagePath   = ($rawImgInput !== '' && preg_match('#^(assets/images/|uploads/)#i', $rawImgInput))
        ? $rawImgInput
        : 'assets/images/exercise_placeholder.svg';
    $videoUrl    = trim((string)($input['video_url'] ?? ''));
    $muscleId    = isset($input['primary_muscle_id']) && (int)$input['primary_muscle_id'] > 0 ? (int)$input['primary_muscle_id'] : 0;

    if ($name === '' || mb_strlen($name) < 2) {
        apiResponse(false, 'Exercise name is required (at least 2 characters).', null, 400);
    }
    if ($sets < 1 || $sets > 20 || $rest < 0 || $rest > 600) {
        apiResponse(false, 'Default sets must be 1–20 and rest must be 0–600 seconds.', null, 400);
    }
    if (!in_array($equip, ['barbell','dumbbell','cable','machine','bodyweight','kettlebell','other'], true)) {
        $equip = 'other';
    }
    if (!in_array($difficulty, ['beginner','intermediate','advanced'], true)) {
        $difficulty = 'intermediate';
    }
    if (!in_array($exType, ['compound','isolation','cardio','mobility'], true)) {
        $exType = 'compound';
    }

    $uploadedStorageKey = null;
    try {
        $dup = $db->prepare("SELECT id, name FROM exercises WHERE LOWER(TRIM(name)) = LOWER(:nm) LIMIT 1");
        $dup->execute([':nm' => $name]);
        if ($dup->fetch()) {
            apiResponse(false, "An exercise named '{$name}' already exists in the library.", null, 409);
        }

        if ($muscleId <= 0) {
            $catToCode = [
                'chest'=>'chest','back'=>'back','shoulders'=>'shoulders','biceps'=>'biceps',
                'triceps'=>'triceps','forearms'=>'forearms','quadriceps'=>'quads','hamstrings'=>'hamstrings',
                'glutes'=>'glutes','calves'=>'calves','core'=>'abs','full body'=>'full_body','cardio'=>'cardio'
            ];
            $codeGuess = $catToCode[strtolower($category)] ?? 'full_body';
            $mStmt = $db->prepare("SELECT id FROM muscle_groups WHERE code = :c LIMIT 1");
            $mStmt->execute([':c' => $codeGuess]);
            $muscleId = (int)($mStmt->fetchColumn() ?: 1);
        }

        $db->beginTransaction();
        if (!empty($_FILES['exercise_image']) && (int)($_FILES['exercise_image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            $fileId = fitSyncStoreUploadedFile($db, $_FILES['exercise_image'], 'exercise_media', (int)$authUser['id'], false, false);
            if ($fileId) {
                $skQ = $db->prepare("SELECT storage_key FROM files WHERE id = :fid LIMIT 1");
                $skQ->execute([':fid' => $fileId]);
                $uploadedStorageKey = (string)$skQ->fetchColumn();
                $imagePath = fitSyncResolveFileUrl($uploadedStorageKey, 'assets/images/exercise_placeholder.svg');
            }
        }

        $code = 'ex_custom_' . preg_replace('/[^a-z0-9]+/', '_', strtolower($name)) . '_' . random_int(100, 999);
        $ins = $db->prepare("
            INSERT INTO exercises (
                code, name, description, category, primary_muscle_id, exercise_type, equipment_required,
                difficulty, form_cues, default_target_sets, default_target_reps, default_rest_seconds,
                image_path, video_url, is_verified, is_active, created_by_trainer_id, created_at, updated_at
            ) VALUES (
                :code, :nm, :desc, :cat, :mid, :etype, :eq,
                :diff, :cues, :sets, :reps, :rest,
                :img, :vid, 1, 1, :tid, NOW(), NOW()
            )
        ");
        $ins->execute([
            ':code' => mb_substr($code, 0, 100),
            ':nm'   => mb_substr($name, 0, 200),
            ':desc' => $description !== '' ? $description : null,
            ':cat'  => mb_substr($category, 0, 60),
            ':mid'  => $muscleId,
            ':etype'=> $exType,
            ':eq'   => $equip,
            ':diff' => $difficulty,
            ':cues' => $formCues !== '' ? $formCues : 'Maintain controlled form and full range of motion.',
            ':sets' => $sets,
            ':reps' => $reps !== '' ? $reps : '8-12',
            ':rest' => $rest,
            ':img'  => $imagePath,
            ':vid'  => $videoUrl !== '' ? $videoUrl : null,
            ':tid'  => (int)$authUser['id']
        ]);
        $newId = (int)$db->lastInsertId();
        $db->commit();

        apiResponse(true, "Exercise '{$name}' added to the Exercise Library.", ['exercise_id' => $newId, 'name' => $name, 'image_path' => $imagePath], 201);
    } catch (InvalidArgumentException $e) {
        if ($db->inTransaction()) $db->rollBack();
        if ($uploadedStorageKey) fitSyncUnlinkRelativeStorageKey($uploadedStorageKey);
        apiResponse(false, $e->getMessage(), null, 400);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        if ($uploadedStorageKey) fitSyncUnlinkRelativeStorageKey($uploadedStorageKey);
        error_log('[FitSync exercises.php POST] ' . $e->getMessage());
        apiResponse(false, 'Unable to create custom exercise.', null, 500);
    }
}

apiResponse(false, 'Method not allowed.', null, 405);
