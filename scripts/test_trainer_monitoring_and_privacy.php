<?php
/**
 * FitSync AI — End-to-End Tests for Trainer Member Data Access, Monitoring & Consent Privacy (Section 10 & 11)
 *
 * Tests with newly registered accounts (zero demo data):
 *  1-4. Owner + Gym + Verified Trainer + Member enrolled + Owner assigns Trainer to Member
 *  5.   Trainer sees Member in My Members with age, height, weight, goal, gym, status, adherence, plan
 *  6-7. Member updates weight 70 kg -> 71 kg -> Trainer dashboard & Dossier show 71 kg + history preserved
 *  8-9. Member logs workout + exercise set performance -> Trainer Dossier shows session & exercises
 *  10-11. Trainer creates & assigns new workout plan -> Member sees new plan
 *  12-15. Member sends "Hi" -> Trainer receives -> Trainer replies -> Member receives reply
 *  16-17. Member revokes nutrition sharing permission (and photo/workout/measurement toggles) -> Trainer Dossier returns restricted=true with zero meal/macro data
 *  Extra Security & Actions: Shared vs Private notes isolation, Workout Reminder notification, Unassigned Trainer 403, Assignment removal revokes access on both member_dossier.php & member_details.php
 */
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

$baseUrl = 'http://127.0.0.1:8080';
$db = getDbConnection();
if (!$db) {
    fwrite(STDERR, "DB connection failed.\n");
    exit(1);
}

$passed = 0;
$failed = 0;
$createdUserIds = [];
$createdGymIds = [];

function checkStep(bool $cond, string $label): void {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "[PASS] {$label}\n";
    } else {
        $failed++;
        echo "[FAIL] {$label}\n";
    }
}

function httpCall(string $method, string $url, array &$cookies, ?array $body = null, string $csrf = ''): array {
    $headers = [];
    if (!empty($cookies)) {
        $pairs = [];
        foreach ($cookies as $k => $v) $pairs[] = $k . '=' . $v;
        $headers[] = 'Cookie: ' . implode('; ', $pairs);
    }
    if ($csrf !== '') $headers[] = 'X-CSRF-Token: ' . $csrf;

    $opts = ['http' => ['method' => $method, 'follow_location' => 0, 'ignore_errors' => true, 'timeout' => 12]];
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        $opts['http']['content'] = json_encode($body);
    }
    if (!empty($headers)) $opts['http']['header'] = implode("\r\n", $headers);

    $raw = @file_get_contents($url, false, stream_context_create($opts));
    $status = 0;
    foreach (($http_response_header ?? []) as $h) {
        if (preg_match('#^HTTP/\S+\s+(\d+)#i', $h, $m)) $status = (int)$m[1];
        elseif (stripos($h, 'Set-Cookie:') === 0) {
            $spec = trim(substr($h, 11));
            $parts = explode(';', $spec);
            $kv = explode('=', trim($parts[0]), 2);
            if (count($kv) === 2) $cookies[trim($kv[0])] = trim($kv[1]);
        }
    }
    return ['status' => $status, 'raw' => $raw ?: '', 'json' => is_string($raw) ? json_decode($raw, true) : null];
}

function getCsrf(string $baseUrl, array &$cookies): string {
    return (string)(httpCall('GET', "{$baseUrl}/api/auth/csrf.php", $cookies)['json']['csrf_token'] ?? '');
}

$exitCode = 1;
try {
    echo "=== FitSync Trainer Monitoring, Dossier & Consent Privacy Tests (Section 10 & 11) ===\n";
    $tag = bin2hex(random_bytes(4));
    $pwd = 'FitSyncT11@2026';

    // 1. Register Gym Owner + create Gym
    $ownerEmail = "s11_owner_{$tag}@fitsync.test";
    $cOwner = [];
    $csrfO = getCsrf($baseUrl, $cOwner);
    $regO = httpCall('POST', "{$baseUrl}/api/auth/register.php", $cOwner, [
        'role' => 'gym_owner', 'full_name' => "Owner S11 {$tag}", 'email' => $ownerEmail, 'mobile' => '+9197001' . rand(10000, 99999),
        'password' => $pwd, 'confirm_password' => $pwd,
        'gym_name' => "S11 Gym {$tag}", 'gym_email' => "desk_{$tag}@s11.test", 'gym_phone' => '+91 20 26001122',
        'address_line1' => '12 Main St', 'city' => 'Pune', 'state' => 'Maharashtra', 'postal_code' => '411001'
    ], $csrfO);
    $ownerId = (int)($regO['json']['user']['id'] ?? 0);
    $gymId = (int)($regO['json']['gym_id'] ?? 0);
    if ($ownerId) $createdUserIds[] = $ownerId;
    if ($gymId) $createdGymIds[] = $gymId;

    // Activate gym (Owner portal allows toggling active)
    $csrfO = getCsrf($baseUrl, $cOwner);
    httpCall('POST', "{$baseUrl}/api/gym_owner/gyms.php", $cOwner, ['action' => 'set_status', 'gym_id' => $gymId, 'status' => 'active'], $csrfO);
    $gCheck = httpCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php?gym_id={$gymId}", $cOwner);
    $planId = (int)($gCheck['json']['data']['membership_plans'][0]['id'] ?? 0);

    // 2. Register Trainer 1 & Unassigned Trainer 2, verify profiles & affiliate Trainer 1 with Gym
    $tr1Email = "s11_tr1_{$tag}@fitsync.test";
    $cTr1 = [];
    $csrfT1 = getCsrf($baseUrl, $cTr1);
    $regT1 = httpCall('POST', "{$baseUrl}/api/auth/register.php", $cTr1, [
        'role' => 'trainer', 'full_name' => "Trainer S11 {$tag}", 'email' => $tr1Email, 'mobile' => '+9197002' . rand(10000, 99999),
        'password' => $pwd, 'confirm_password' => $pwd,
        'specialization' => 'Strength Training', 'certification_name' => 'CSCS', 'certifying_body' => 'NSCA',
        'bio' => 'Evidence based strength coaching for athletes.', 'gym_id' => $gymId
    ], $csrfT1);
    $tr1Id = (int)($regT1['json']['user']['id'] ?? 0);
    if ($tr1Id) $createdUserIds[] = $tr1Id;

    // Verify trainer credential status + owner approves gym affiliation
    $db->prepare("UPDATE trainer_profiles SET status = 'verified' WHERE user_id = ?")->execute([$tr1Id]);
    httpCall('POST', "{$baseUrl}/api/gym_owner/trainer_affiliation_action.php", $cOwner, ['gym_id' => $gymId, 'trainer_user_id' => $tr1Id, 'action' => 'approve'], $csrfO);

    $tr2Email = "s11_tr2_{$tag}@fitsync.test";
    $db->prepare("INSERT INTO users (email, mobile, password_hash, role, full_name, status) VALUES (?, ?, ?, 'trainer', ?, 'active')")
       ->execute([$tr2Email, '+9197003' . rand(10000, 99999), password_hash($pwd, PASSWORD_DEFAULT), "Unassigned Trainer {$tag}"]);
    $tr2Id = (int)$db->lastInsertId();
    $createdUserIds[] = $tr2Id;
    $db->prepare("INSERT INTO user_roles (user_id, role) VALUES (?, 'trainer')")->execute([$tr2Id]);
    $db->prepare("INSERT INTO trainer_profiles (user_id, status) VALUES (?, 'verified')")->execute([$tr2Id]);
    $cTr2 = [];
    $csrfT2 = getCsrf($baseUrl, $cTr2);
    httpCall('POST', "{$baseUrl}/api/auth/login.php", $cTr2, ['email' => $tr2Email, 'password' => $pwd], $csrfT2);

    // 3. Register Member (starting weight 70 kg, height 175 cm) & enroll + approve
    $memEmail = "s11_mem_{$tag}@fitsync.test";
    $cMem = [];
    $csrfM = getCsrf($baseUrl, $cMem);
    $regM = httpCall('POST', "{$baseUrl}/api/auth/register.php", $cMem, [
        'role' => 'user', 'full_name' => "Member S11 {$tag}", 'email' => $memEmail, 'mobile' => '+9197004' . rand(10000, 99999),
        'password' => $pwd, 'confirm_password' => $pwd,
        'date_of_birth' => '1997-04-10', 'gender' => 'male',
        'height_cm' => 175, 'weight_kg' => 70, 'primary_goal' => 'hypertrophy',
        'gym_id' => $gymId, 'request_membership' => '1', 'plan_id' => $planId
    ], $csrfM);
    $memId = (int)($regM['json']['user']['id'] ?? 0);
    $memPassId = (int)($regM['json']['membership_id'] ?? 0);
    if ($memId) $createdUserIds[] = $memId;

    $csrfM = getCsrf($baseUrl, $cMem);
    httpCall('POST', "{$baseUrl}/api/gym_owner/membership_action.php", $cOwner, ['membership_id' => $memPassId, 'decision' => 'approve'], $csrfO);

    // 4. Owner assigns Trainer 1 to Member
    $asRes = httpCall('POST', "{$baseUrl}/api/gym_owner/assign_coach.php", $cOwner, ['memberEmail' => $memEmail, 'coachId' => 'tr-' . $tr1Id, 'gym_id' => $gymId], $csrfO);
    $csrfT1 = getCsrf($baseUrl, $cTr1);

    // 5. Trainer 1 sees Member in My Members with age, height, weight, gym, plan
    $tDash1 = httpCall('GET', "{$baseUrl}/api/trainer/dashboard.php", $cTr1);
    $athRow = array_values(array_filter($tDash1['json']['data']['athletes'] ?? [], fn($a) => (int)$a['user_id'] === $memId))[0] ?? [];
    checkStep(
        $ownerId > 0 && $gymId > 0 && $tr1Id > 0 && $memId > 0 && $asRes['status'] === 200
        && (int)($athRow['user_id'] ?? 0) === $memId && (float)($athRow['weight'] ?? 0) === 70.0
        && (int)($athRow['height_cm'] ?? 0) === 175 && !empty($athRow['gym_name']),
        "Steps 1-5: Owner/Gym/Trainer/Member created & assigned; My Members renders weight=70kg, height=175cm, age, and gym"
    );

    // 6-7. Member updates weight 70 kg -> 71 kg (preserving history) -> Trainer sees 71 kg automatically
    $upWt = httpCall('POST', "{$baseUrl}/api/user/profile.php", $cMem, [
        'action' => 'save_body_stats', 'weight' => 71.0, 'height' => 175, 'age' => 29, 'goal' => 'Build Muscle', 'activity_level' => 'moderately_active'
    ], $csrfM);
    $tDashAfterWt = httpCall('GET', "{$baseUrl}/api/trainer/dashboard.php", $cTr1);
    $athAfterWt = array_values(array_filter($tDashAfterWt['json']['data']['athletes'] ?? [], fn($a) => (int)$a['user_id'] === $memId))[0] ?? [];
    $dosAfterWt = httpCall('GET', "{$baseUrl}/api/trainer/member_dossier.php?member_id={$memId}", $cTr1);
    $histWeights = array_map(fn($h) => (float)$h['weight_kg'], $dosAfterWt['json']['data']['measurement']['history'] ?? []);
    checkStep(
        $upWt['status'] === 200 && (float)($athAfterWt['weight'] ?? 0) === 71.0
        && (float)($dosAfterWt['json']['data']['athlete']['weight_kg'] ?? 0) === 71.0
        && in_array(70.0, $histWeights, true) && in_array(71.0, $histWeights, true),
        "Steps 6-7: Member weight updated 70->71 kg; Trainer dashboard & dossier reflect 71 kg with 70 kg history preserved"
    );

    // 8-9. Member logs workout session + set performance -> Trainer sees completed workout & exercise performance
    $exId = (int)$db->query("SELECT id FROM exercises ORDER BY id ASC LIMIT 1")->fetchColumn();
    $wkLog = httpCall('POST', "{$baseUrl}/api/workouts.php", $cMem, [
        'action' => 'complete_session',
        'duration_minutes' => 52,
        'notes' => 'Strong top sets',
        'exercises' => [[
            'exercise_id' => $exId,
            'sets' => [['set' => 1, 'weight' => 80, 'reps' => 8, 'done' => true]]
        ]]
    ], $csrfM);
    $dosAfterWk = httpCall('GET', "{$baseUrl}/api/trainer/member_dossier.php?member_id={$memId}", $cTr1);
    $recentWk = $dosAfterWk['json']['data']['recent_sessions'][0] ?? [];
    $exPerfCount = count($recentWk['exercises_performed'] ?? []);
    checkStep(
        $wkLog['status'] === 200 && (int)($recentWk['duration_minutes'] ?? 0) === 52
        && (float)($recentWk['total_volume_kg'] ?? 0) === 640.0 && $exPerfCount >= 1,
        "Steps 8-9: Member logged workout (52m, 640kg volume); Trainer dossier shows completed workout + exercise-level set log"
    );

    // 10-11. Trainer creates & assigns a new workout plan -> Member sees new plan
    $planRes = httpCall('POST', "{$baseUrl}/api/trainer/workouts.php", $cTr1, [
        'name' => "S11 Peak Split {$tag}",
        'goal' => 'strength',
        'description' => 'Progressive overload 4-day block',
        'exercise_ids' => [$exId],
        'target_sets' => 4,
        'target_reps' => '6-8',
        'assign_to_member_id' => $memId
    ], $csrfT1);
    $memDashPlan = httpCall('GET', "{$baseUrl}/api/user/dashboard.php", $cMem);
    $memPlanName = $memDashPlan['json']['data']['workout']['plan']['plan_name'] ?? '';
    checkStep(
        $planRes['status'] === 200 && $memPlanName === "S11 Peak Split {$tag}",
        "Steps 10-11: Trainer created & assigned workout plan; Member dashboard synced '{$memPlanName}'"
    );

    // Bonus Trainer actions: Shared vs Private notes + Workout Reminder
    httpCall('POST', "{$baseUrl}/api/trainer/notes.php", $cTr1, ['member_id' => $memId, 'note_text' => 'Shared Cue: Keep chest up', 'note_type' => 'form_correction', 'is_visible' => true], $csrfT1);
    httpCall('POST', "{$baseUrl}/api/trainer/notes.php", $cTr1, ['member_id' => $memId, 'note_text' => 'Private Note: Monitor lower back fatigue', 'note_type' => 'general_observation', 'is_visible' => false], $csrfT1);
    $remRes = httpCall('POST', "{$baseUrl}/api/trainer/remind_member.php", $cTr1, ['member_id' => $memId], $csrfT1);
    $memFeedback = httpCall('GET', "{$baseUrl}/api/user/dashboard.php", $cMem)['json']['data']['feedback'] ?? [];
    $memNotifs = httpCall('GET', "{$baseUrl}/api/user/dashboard.php", $cMem)['json']['data']['notifications'] ?? [];
    $fbTexts = array_map(fn($f) => $f['note_text'], $memFeedback);
    $remNotifs = array_filter($memNotifs, fn($n) => $n['entity_type'] === 'workout_reminder');
    checkStep(
        $remRes['status'] === 200 && in_array('Shared Cue: Keep chest up', $fbTexts, true)
        && !in_array('Private Note: Monitor lower back fatigue', $fbTexts, true) && count($remNotifs) >= 1,
        "Shared note visible to Member, Private observation hidden from Member, and Workout Reminder persisted"
    );

    // 12-15. Real two-way chat ("Hi" <-> reply)
    $chat1 = httpCall('POST', "{$baseUrl}/api/messages.php", $cMem, ['recipient_id' => $tr1Id, 'message_text' => 'Hi'], $csrfM);
    $trMsgs = httpCall('GET', "{$baseUrl}/api/messages.php?with_user={$memId}", $cTr1);
    $trSawHi = !empty(array_filter($trMsgs['json']['messages'] ?? [], fn($m) => $m['message_text'] === 'Hi'));
    $chat2 = httpCall('POST', "{$baseUrl}/api/messages.php", $cTr1, ['recipient_id' => $memId, 'message_text' => "Hello {$tag}, great lift!"], $csrfT1);
    $memMsgs = httpCall('GET', "{$baseUrl}/api/messages.php?with_user={$tr1Id}", $cMem);
    $memSawReply = !empty(array_filter($memMsgs['json']['messages'] ?? [], fn($m) => $m['message_text'] === "Hello {$tag}, great lift!"));
    checkStep(
        $chat1['status'] === 200 && $trSawHi && $chat2['status'] === 200 && $memSawReply,
        "Steps 12-15: Member sent 'Hi', Trainer received & replied, Member received actual reply from MySQL"
    );

    // 16-17. Member logs meal -> revokes nutrition sharing permission -> Trainer blocked from nutrition & photo data
    httpCall('POST', "{$baseUrl}/api/meals.php", $cMem, [
        'category' => 'Lunch', 'food_name' => 'Grilled Paneer Bowl', 'calories' => 620, 'protein' => 42, 'carbs' => 50, 'fat' => 24
    ], $csrfM);
    $dosNutBefore = httpCall('GET', "{$baseUrl}/api/trainer/member_dossier.php?member_id={$memId}", $cTr1);
    $calBefore = (int)($dosNutBefore['json']['data']['nutrition']['calories'] ?? 0);

    $permRevoke = httpCall('POST', "{$baseUrl}/api/user/profile.php", $cMem, [
        'action' => 'save_data_permissions',
        'can_view_measurements' => 1,
        'can_view_nutrition' => 0,
        'can_view_assessments' => 1,
        'can_view_progress_photos' => 0,
        'can_view_workouts' => 1
    ], $csrfM);
    $dosNutAfter = httpCall('GET', "{$baseUrl}/api/trainer/member_dossier.php?member_id={$memId}", $cTr1);
    checkStep(
        $calBefore === 620 && $permRevoke['status'] === 200
        && !empty($dosNutAfter['json']['data']['nutrition']['restricted'])
        && (int)($dosNutAfter['json']['data']['nutrition']['calories'] ?? -1) === 0
        && empty($dosNutAfter['json']['data']['nutrition']['meal_history'])
        && !empty($dosNutAfter['json']['data']['progress_photos']['restricted']),
        "Steps 16-17: Nutrition visible (620 kcal) while consented; once revoked, backend restricts nutrition & progress photos completely"
    );

    // Section 10 Security: Unassigned trainer blocked + removing assignment revokes access
    $unassignedDossier = httpCall('GET', "{$baseUrl}/api/trainer/member_dossier.php?member_id={$memId}", $cTr2);
    $unassignedDetails = httpCall('GET', "{$baseUrl}/api/trainer/member_details.php?id={$memId}", $cTr2);

    // Unassign Trainer 1 and confirm both endpoints now reject with 403
    httpCall('POST', "{$baseUrl}/api/gym_owner/assign_coach.php", $cOwner, ['memberEmail' => $memEmail, 'coachId' => '', 'gym_id' => $gymId], $csrfO);
    $revokedDossier = httpCall('GET', "{$baseUrl}/api/trainer/member_dossier.php?member_id={$memId}", $cTr1);
    $revokedDetails = httpCall('GET', "{$baseUrl}/api/trainer/member_details.php?id={$memId}", $cTr1);
    checkStep(
        $unassignedDossier['status'] === 403 && $unassignedDetails['status'] === 403
        && $revokedDossier['status'] === 403 && $revokedDetails['status'] === 403,
        "Security (Section 10): Unassigned trainer & unassigned-after-removal rejected with 403 on both member_dossier.php & member_details.php"
    );

    echo "\nSUMMARY: PASSED={$passed}, FAILED={$failed}\n";
    $exitCode = $failed > 0 ? 1 : 0;
} finally {
    if (!empty($createdGymIds)) {
        $ph = implode(',', array_fill(0, count($createdGymIds), '?'));
        $db->prepare("DELETE FROM gyms WHERE id IN ({$ph})")->execute($createdGymIds);
    }
    if (!empty($createdUserIds)) {
        $ph = implode(',', array_fill(0, count($createdUserIds), '?'));
        $db->prepare("DELETE FROM users WHERE id IN ({$ph})")->execute($createdUserIds);
    }
}
exit($exitCode);
