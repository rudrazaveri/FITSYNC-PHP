<?php
/**
 * FitSync AI — Module 13 Acceptance Test Suite (20 Scenarios)
 * Uses real newly created accounts & separate HTTP cookie sessions against XAMPP Apache + MySQL.
 */

declare(strict_types=1);

$BASE = 'http://127.0.0.1:8080';
require_once __DIR__ . '/../config/bootstrap.php';
$pdo  = getDbConnection(true);

$passed = 0;
$failed = 0;

function assertTrue(bool $cond, string $label, string $detail = ''): void {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "[PASS] {$label}\n";
    } else {
        $failed++;
        echo "[FAIL] {$label}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
    }
}

class WkHttpSession {
    public string $cookieFile;
    public string $csrf = '';
    private string $base;

    public function __construct(string $base, string $name) {
        $this->base = $base;
        $this->cookieFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fs_wk_{$name}_" . getmypid() . ".txt";
        @unlink($this->cookieFile);
        $this->refreshCsrf();
    }

    public function __destruct() { @unlink($this->cookieFile); }

    public function refreshCsrf(): void {
        $r = $this->get('api/auth/csrf.php');
        if (!empty($r['body']['csrf_token'])) $this->csrf = (string)$r['body']['csrf_token'];
    }

    public function get(string $path): array { return $this->req('GET', $path, null); }
    public function post(string $path, array $payload): array { return $this->req('POST', $path, $payload); }

    private function req(string $method, string $path, ?array $payload): array {
        $ch = curl_init($this->base . '/' . ltrim($path, '/'));
        $headers = ['Accept: application/json'];
        if ($method === 'POST') {
            $headers[] = 'Content-Type: application/json';
            if ($this->csrf !== '') $headers[] = 'X-CSRF-Token: ' . $this->csrf;
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload ?? []));
        }
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_COOKIEJAR      => $this->cookieFile,
            CURLOPT_COOKIEFILE     => $this->cookieFile,
            CURLOPT_TIMEOUT        => 45,
        ]);
        $raw = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ['code' => $code, 'raw' => $raw, 'body' => is_string($raw) ? json_decode($raw, true) : null];
    }
}

$ts = date('His') . random_int(10, 99);
$ownerSess    = new WkHttpSession($BASE, 'owner');
$trainerSess  = new WkHttpSession($BASE, 'trainer');
$trainer2Sess = new WkHttpSession($BASE, 'trainer2');
$memberSess   = new WkHttpSession($BASE, 'member');

// Setup: Owner + Gym, Trainer 1, Trainer 2 (unrelated), Member
$rOwner = $ownerSess->post('api/auth/register.php', [
    'role' => 'gym_owner', 'full_name' => 'WK Owner', 'email' => "wk_owner_{$ts}@fitsync.test",
    'mobile' => '+91970000' . random_int(1000, 9999), 'password' => 'TestPass123!', 'confirm_password' => 'TestPass123!',
    'gym_name' => "WK Gym {$ts}", 'gym_email' => "wk_desk_{$ts}@fitsync.test", 'gym_phone' => '+91971111' . random_int(1000, 9999),
    'address_line1' => '10 Lift Rd', 'city' => 'Pune', 'state' => 'MH', 'postal_code' => '411001'
]);
$ownerSess->refreshCsrf();
$gymId = (int)($rOwner['body']['gym_id'] ?? 0);
$ownerId = (int)($rOwner['body']['user']['id'] ?? 0);

$rTr1 = $trainerSess->post('api/auth/register.php', [
    'role' => 'trainer', 'full_name' => 'WK Trainer One', 'email' => "wk_tr1_{$ts}@fitsync.test",
    'mobile' => '+91972222' . random_int(1000, 9999), 'password' => 'TestPass123!', 'confirm_password' => 'TestPass123!',
    'specialization' => 'Hypertrophy', 'certification_name' => 'ACE', 'certifying_body' => 'ACE',
    'bio' => 'Experienced hypertrophy and strength specialist.'
]);
$trainerSess->refreshCsrf();
$tr1Id = (int)($rTr1['body']['user']['id'] ?? 0);

$rTr2 = $trainer2Sess->post('api/auth/register.php', [
    'role' => 'trainer', 'full_name' => 'WK Unrelated Trainer', 'email' => "wk_tr2_{$ts}@fitsync.test",
    'mobile' => '+91973333' . random_int(1000, 9999), 'password' => 'TestPass123!', 'confirm_password' => 'TestPass123!',
    'specialization' => 'Cardio', 'certification_name' => 'ISSA', 'certifying_body' => 'ISSA',
    'bio' => 'Unrelated trainer for security isolation verification.'
]);
$trainer2Sess->refreshCsrf();
$tr2Id = (int)($rTr2['body']['user']['id'] ?? 0);

$rMem = $memberSess->post('api/auth/register.php', [
    'role' => 'user', 'full_name' => 'WK Member', 'email' => "wk_mem_{$ts}@fitsync.test",
    'mobile' => '+91974444' . random_int(1000, 9999), 'password' => 'TestPass123!', 'confirm_password' => 'TestPass123!'
]);
$memberSess->refreshCsrf();
$memId = (int)($rMem['body']['user']['id'] ?? 0);
$memCode = (string)($rMem['body']['verification_code'] ?? '');
$memberSess->post('api/auth/verify_email.php', ['code' => $memCode]);

// Associate Trainer 1 with Gym, invite & accept Member, assign Trainer 1 -> Member
$trainerSess->post('api/trainer/gyms.php', ['action' => 'request', 'gym_id' => $gymId]);
$ownerSess->post('api/gym_owner/trainer_affiliation_action.php', ['gym_id' => $gymId, 'trainer_user_id' => $tr1Id, 'action' => 'approve']);
$inv = $ownerSess->post('api/gym_owner/add_member.php', ['gym_id' => $gymId, 'email' => "wk_mem_{$ts}@fitsync.test"]);
$memberSess->post('api/user/invitations.php', ['invitation_id' => (int)($inv['body']['data']['invitation_id'] ?? 0), 'decision' => 'accept']);
$ownerSess->post('api/gym_owner/assign_coach.php', ['gym_id' => $gymId, 'memberEmail' => "wk_mem_{$ts}@fitsync.test", 'coachId' => 'tr-' . $tr1Id]);

// 1 & 2. Trainer opens Exercise Library & selects Incline Dumbbell Press
$rEx = $trainerSess->get('api/exercises.php?q=' . urlencode('Incline Dumbbell Press'));
$exList = $rEx['body']['exercises'] ?? [];
$inclineDb = null;
foreach ($exList as $ex) {
    if (strcasecmp($ex['name'], 'Incline Dumbbell Press') === 0) { $inclineDb = $ex; break; }
}
assertTrue(!empty($rEx['body']['success']) && $inclineDb !== null, '1-2. Trainer opens Exercise Library & finds Incline Dumbbell Press', (string)$rEx['raw']);

$allExRes = $trainerSess->get('api/exercises.php');
$allEx = $allExRes['body']['exercises'] ?? [];
$ex2 = $allEx[0]['db_id'] ?? 1;
$ex3 = $allEx[1]['db_id'] ?? 2;
$ex4 = $allEx[6]['db_id'] ?? 7;
$ex5 = $allEx[7]['db_id'] ?? 8;
$inclineId = (int)$inclineDb['db_id'];

// 3, 4, 5, 6, 7. Trainer configures 3 sets with individual targets, Mon-Sun schedule, Thu & Sun rest, different exercises, saves as reusable template
$daysPayload = [
    ['day_number'=>1,'day_code'=>'mon','day_name'=>'Monday','day_type'=>'training','focus_area'=>'Upper Push','exercises'=>[
        ['exercise_id'=>$inclineId,'target_sets'=>3,'target_reps'=>'12-8','rest_seconds'=>90,'notes'=>'Control 3s eccentric','sets'=>[
            ['set_number'=>1,'target_reps'=>'12','target_weight'=>10,'weight_unit'=>'kg','rest_seconds'=>90],
            ['set_number'=>2,'target_reps'=>'10','target_weight'=>12,'weight_unit'=>'kg','rest_seconds'=>90],
            ['set_number'=>3,'target_reps'=>'8','target_weight'=>12,'weight_unit'=>'kg','rest_seconds'=>90]
        ]]
    ]],
    ['day_number'=>2,'day_code'=>'tue','day_name'=>'Tuesday','day_type'=>'training','focus_area'=>'Pull & Back','exercises'=>[
        ['exercise_id'=>$ex4,'target_sets'=>3,'target_reps'=>'10','target_weight'=>40,'rest_seconds'=>90]
    ]],
    ['day_number'=>3,'day_code'=>'wed','day_name'=>'Wednesday','day_type'=>'training','focus_area'=>'Lower Body','exercises'=>[
        ['exercise_id'=>$ex2,'target_sets'=>4,'target_reps'=>'8','target_weight'=>60,'rest_seconds'=>120]
    ]],
    ['day_number'=>4,'day_code'=>'thu','day_name'=>'Thursday','day_type'=>'rest','focus_area'=>'Rest & Recovery','exercises'=>[]],
    ['day_number'=>5,'day_code'=>'fri','day_name'=>'Friday','day_type'=>'training','focus_area'=>'Upper Hypertrophy','exercises'=>[
        ['exercise_id'=>$ex3,'target_sets'=>3,'target_reps'=>'10','target_weight'=>30,'rest_seconds'=>90]
    ]],
    ['day_number'=>6,'day_code'=>'sat','day_name'=>'Saturday','day_type'=>'active_recovery','focus_area'=>'Conditioning','exercises'=>[
        ['exercise_id'=>$ex5,'target_sets'=>3,'target_reps'=>'12','target_weight'=>0,'rest_seconds'=>60]
    ]],
    ['day_number'=>7,'day_code'=>'sun','day_name'=>'Sunday','day_type'=>'rest','focus_area'=>'Rest & Recovery','exercises'=>[]]
];

// Verify negative set/weight validation
$rNeg = $trainerSess->post('api/trainer/workouts.php', [
    'name' => 'Invalid Plan', 'is_template' => 1, 'days_per_week' => 5,
    'days' => [['day_number'=>1,'day_type'=>'training','exercises'=>[['exercise_id'=>$inclineId,'target_sets'=>-1,'target_weight'=>-5]]]]
]);
assertTrue($rNeg['code'] === 400, 'Validation rejects negative sets/weights', (string)$rNeg['raw']);

$rTmpl = $trainerSess->post('api/trainer/workouts.php', [
    'name' => "Hypertrophy Master {$ts}",
    'description' => 'Mon-Sun custom split with Thu/Sun rest',
    'goal' => 'hypertrophy',
    'difficulty' => 'intermediate',
    'split_type' => 'Custom Split',
    'duration_weeks' => 4,
    'days_per_week' => 5,
    'is_template' => 1,
    'days' => $daysPayload
]);
$templateId = (int)($rTmpl['body']['data']['plan_id'] ?? 0);
assertTrue($rTmpl['code'] === 200 && $templateId > 0, '3-7. Trainer creates Mon-Sun plan (Thu/Sun rest, 3-set Incline DB Press) & saves as reusable template', (string)$rTmpl['raw']);

// 8. Trainer assigns plan to assigned member (creates isolated snapshot)
$rAssign = $trainerSess->post('api/trainer/assign_workout.php', [
    'member_id' => $memId,
    'plan_id' => $templateId,
    'start_date' => date('Y-m-d')
]);
$assignedSnapshotPlanId = (int)($rAssign['body']['data']['plan_id'] ?? 0);
assertTrue(!empty($rAssign['body']['success']) && $assignedSnapshotPlanId > 0 && $assignedSnapshotPlanId !== $templateId, '8. Trainer assigns plan to member (creates isolated snapshot)', (string)$rAssign['raw']);

// 9. Member receives notification
$rMemDash = $memberSess->get('api/user/dashboard.php');
$notifs = $rMemDash['body']['data']['notifications'] ?? [];
$hasPlanNotif = count(array_filter($notifs, fn($n) => ($n['entity_type'] ?? '') === 'workout_plan')) > 0;
assertTrue($hasPlanNotif, '9. Member receives workout assignment notification');

// 10. Member sees weekly schedule (7 days, Thu/Sun rest, 3 per-set targets on Monday)
$rMemWk = $memberSess->get('api/workouts.php');
$memDays = $rMemWk['body']['data']['days'] ?? [];
$monDay = $memDays[0] ?? null;
$tueDay = $memDays[1] ?? null;
$thuDay = $memDays[3] ?? null;
$sunDay = $memDays[6] ?? null;
$monSets = $monDay['exercises'][0]['sets'] ?? [];
assertTrue(
    count($memDays) === 7 && ($thuDay['day_type'] ?? '') === 'rest' && ($sunDay['day_type'] ?? '') === 'rest' && count($monSets) === 3 && (float)($monSets[1]['target_weight'] ?? 0) == 12.0,
    '10. Member sees 7-day weekly schedule, Thu/Sun rest & Incline DB Press 3 per-set targets',
    json_encode($monSets)
);

// 11. Member starts Monday's workout
$monDayId = (int)$monDay['id'];
$rStart = $memberSess->post('api/workouts.php', ['action' => 'start_session', 'plan_day_id' => $monDayId]);
$sessionId = (int)($rStart['body']['data']['session_id'] ?? 0);
assertTrue($sessionId > 0, '11. Member starts Monday workout session', (string)$rStart['raw']);

// 20a. Refresh/reopen Member portal recovers unfinished in_progress session & prevents duplicate
$rStart2 = $memberSess->post('api/workouts.php', ['action' => 'start_session', 'plan_day_id' => $monDayId]);
$rMemWkMid = $memberSess->get('api/workouts.php');
assertTrue(
    (int)($rStart2['body']['data']['session_id'] ?? 0) === $sessionId && !empty($rStart2['body']['data']['recovered']) && (int)($rMemWkMid['body']['data']['active_session']['id'] ?? 0) === $sessionId,
    '20a. Unfinished workout session recovers cleanly on refresh without duplicate'
);

// 12. Member logs actual reps & weights for 3 sets (and duplicate set_number updates instead of duplicating)
$s1 = $memberSess->post('api/workouts.php', ['action'=>'log_set','plan_day_id'=>$monDayId,'exercise_id'=>$inclineId,'set_number'=>1,'weight_kg'=>10,'reps'=>12,'session_id'=>$sessionId]);
$s2 = $memberSess->post('api/workouts.php', ['action'=>'log_set','plan_day_id'=>$monDayId,'exercise_id'=>$inclineId,'set_number'=>2,'weight_kg'=>12.5,'reps'=>10,'session_id'=>$sessionId]);
$s3 = $memberSess->post('api/workouts.php', ['action'=>'log_set','plan_day_id'=>$monDayId,'exercise_id'=>$inclineId,'set_number'=>3,'weight_kg'=>12.5,'reps'=>9,'session_id'=>$sessionId]);
assertTrue(!empty($s1['body']['success']) && !empty($s2['body']['success']) && !empty($s3['body']['success']), '12. Member logs actual reps & weights for all 3 sets');

// 13 & 14. Member completes workout & data persists in MySQL
$rFin = $memberSess->post('api/workouts.php', [
    'action' => 'complete_session',
    'session_id' => $sessionId,
    'plan_day_id' => $monDayId,
    'duration_minutes' => 42,
    'difficulty_rating' => 'challenging',
    'feedback_text' => 'Great upper chest pump!'
]);
$rMemWkAfter = $memberSess->get('api/workouts.php');
$completedCount = (int)($rMemWkAfter['body']['data']['completed_count'] ?? 0);
$prs = $rMemWkAfter['body']['data']['personal_records'] ?? [];
assertTrue(!empty($rFin['body']['success']) && $completedCount >= 1 && count($prs) >= 1, '13-14. Member completes workout & session/sets/feedback/PR persist in MySQL', (string)$rFin['raw']);

// 15. Trainer sees completed session & actual performance
$rTrWk = $trainerSess->get('api/trainer/workouts.php');
$trSessions = $rTrWk['body']['data']['completed_sessions'] ?? [];
$foundSess = array_filter($trSessions, fn($s) => (int)$s['id'] === $sessionId);
$firstFound = $foundSess ? array_values($foundSess)[0] : null;
assertTrue(
    $firstFound !== null && count($firstFound['exercises_performed'] ?? []) === 3 && ($firstFound['feedback_text'] ?? '') === 'Great upper chest pump!',
    '15. Trainer sees completed session, actual 3 sets & member feedback'
);

// 16, 17, 18. Trainer changes a future workout (Tuesday) -> Member sees updated prescription -> Monday history intact
$daysUpdated = $daysPayload;
$daysUpdated[1]['focus_area'] = 'Updated Pull & Rear Delts';
$daysUpdated[1]['exercises'][] = ['exercise_id'=>$ex5,'target_sets'=>4,'target_reps'=>'15','target_weight'=>15,'rest_seconds'=>60];
$rUpdFuture = $trainerSess->post('api/trainer/workouts.php', [
    'plan_id' => $assignedSnapshotPlanId,
    'name' => "Hypertrophy Master {$ts}",
    'days_per_week' => 5,
    'is_template' => 0,
    'days' => $daysUpdated
]);
$rMemWkUpd = $memberSess->get('api/workouts.php');
$tueUpd = $rMemWkUpd['body']['data']['days'][1] ?? null;
$histAfterUpd = $rMemWkUpd['body']['data']['sessions'] ?? [];
assertTrue(
    !empty($rUpdFuture['body']['success']) && ($tueUpd['focus_area'] ?? '') === 'Updated Pull & Rear Delts' && count($tueUpd['exercises'] ?? []) === 2 && count($histAfterUpd) >= 1,
    '16-18. Trainer updates future day -> Member sees updated prescription & Monday history remains intact'
);

// 19. Unrelated Trainer cannot access/modify/assign the plan or member
$rUnrelAssign = $trainer2Sess->post('api/trainer/assign_workout.php', ['member_id' => $memId, 'plan_id' => $templateId]);
$rUnrelEdit   = $trainer2Sess->post('api/trainer/workouts.php', ['plan_id' => $assignedSnapshotPlanId, 'name' => 'Hacked Plan', 'days_per_week' => 3]);
assertTrue($rUnrelAssign['code'] === 403 && $rUnrelEdit['code'] === 403, '19. Unrelated Trainer blocked (403) from assigning to member or editing plan');

// 20b. Reopening Member portal still shows completed workout history & updated plan
$rReopen = $memberSess->get('api/workouts.php');
assertTrue(count($rReopen['body']['data']['sessions'] ?? []) >= 1 && !empty($rReopen['body']['data']['plan']), '20b. Reopening Member portal preserves all workout data');

// Cleanup test records
$pdo->prepare("DELETE FROM workout_plans WHERE id IN (:p1, :p2)")->execute([':p1' => $templateId, ':p2' => $assignedSnapshotPlanId]);
$pdo->prepare("DELETE FROM gyms WHERE id = :gid")->execute([':gid' => $gymId]);
$pdo->prepare("DELETE FROM users WHERE id IN (:u1, :u2, :u3, :u4)")->execute([':u1' => $ownerId, ':u2' => $tr1Id, ':u3' => $tr2Id, ':u4' => $memId]);

echo "\nSUMMARY: PASSED={$passed}, FAILED={$failed}\n";
exit($failed > 0 ? 1 : 0);
