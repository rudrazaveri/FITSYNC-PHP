<?php
/**
 * FitSync AI — End-to-End Centralized Directory & Cross-Portal Sync Acceptance Tests (Tests A–F)
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

function assertOk(bool $cond, string $label): void {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "[PASS] {$label}\n";
    } else {
        $failed++;
        echo "[FAIL] {$label}\n";
    }
}

function apiCall(string $method, string $url, array &$cookies, ?array $jsonBody = null, string $csrfToken = ''): array {
    $headers = [];
    if (!empty($cookies)) {
        $pairs = [];
        foreach ($cookies as $k => $v) $pairs[] = $k . '=' . $v;
        $headers[] = 'Cookie: ' . implode('; ', $pairs);
    }
    if ($csrfToken !== '') {
        $headers[] = 'X-CSRF-Token: ' . $csrfToken;
    }

    $opts = [
        'http' => [
            'method' => $method,
            'follow_location' => 0,
            'ignore_errors' => true,
            'timeout' => 12,
        ]
    ];
    if ($jsonBody !== null) {
        $headers[] = 'Content-Type: application/json';
        $opts['http']['content'] = json_encode($jsonBody);
    }
    if (!empty($headers)) {
        $opts['http']['header'] = implode("\r\n", $headers);
    }

    $raw = @file_get_contents($url, false, stream_context_create($opts));
    $status = 0;
    foreach (($http_response_header ?? []) as $h) {
        if (preg_match('#^HTTP/\S+\s+(\d+)#i', $h, $m)) {
            $status = (int)$m[1];
        } elseif (stripos($h, 'Set-Cookie:') === 0) {
            $spec = trim(substr($h, 11));
            $parts = explode(';', $spec);
            $kv = explode('=', trim($parts[0]), 2);
            if (count($kv) === 2) {
                if (trim($kv[1]) === '' || stripos($spec, 'Max-Age=0') !== false) {
                    unset($cookies[trim($kv[0])]);
                } else {
                    $cookies[trim($kv[0])] = trim($kv[1]);
                }
            }
        }
    }

    return [
        'status' => $status,
        'raw'    => $raw !== false ? $raw : '',
        'json'   => is_string($raw) ? json_decode($raw, true) : null
    ];
}

function fetchCsrf(string $baseUrl, array &$cookies): string {
    $r = apiCall('GET', "{$baseUrl}/api/auth/csrf.php", $cookies);
    return (string)($r['json']['csrf_token'] ?? '');
}

$exitCode = 1;
try {
    echo "=== FitSync Centralized Directory & Cross-Portal Sync Tests (Tests A-F) ===\n";
    $tag = bin2hex(random_bytes(4));

    // Create isolated Platform Admin for approving test gyms/trainers
    $adminEmail = "dir_admin_{$tag}@fitsync.test";
    $adminPass = 'AdminPass@2026!';
    $db->prepare("INSERT INTO users (email, password_hash, role, full_name, status) VALUES (?, ?, 'admin', 'Test Admin', 'active')")
       ->execute([$adminEmail, password_hash($adminPass, PASSWORD_DEFAULT)]);
    $adminId = (int)$db->lastInsertId();
    $createdUserIds[] = $adminId;
    $db->prepare("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, 'admin')")->execute([$adminId]);

    $cAdmin = [];
    $csrfAdmin = fetchCsrf($baseUrl, $cAdmin);
    apiCall('POST', "{$baseUrl}/api/auth/login.php", $cAdmin, ['email' => $adminEmail, 'password' => $adminPass], $csrfAdmin);
    $csrfAdmin = fetchCsrf($baseUrl, $cAdmin);

    // Register Gym Owner A + Gym A
    $cOwnerA = [];
    $csrfOwnerA = fetchCsrf($baseUrl, $cOwnerA);
    $ownerAEmail = "ownerA_{$tag}@fitsync.test";
    $resOwnerA = apiCall('POST', "{$baseUrl}/api/auth/register.php", $cOwnerA, [
        'role' => 'gym_owner',
        'full_name' => "Owner Alpha {$tag}",
        'email' => $ownerAEmail,
        'mobile' => '+91991100' . rand(1000, 9999),
        'password' => 'OwnerPass@123',
        'confirm_password' => 'OwnerPass@123',
        'gym_name' => "Alpha Iron Gym {$tag}",
        'gym_email' => "alpha_{$tag}@gym.test",
        'gym_phone' => '+912011223344',
        'address_line1' => 'Plot 10, FC Road',
        'city' => 'Pune',
        'state' => 'Maharashtra',
        'postal_code' => '411004'
    ], $csrfOwnerA);
    assertOk($resOwnerA['status'] === 201 && ($resOwnerA['json']['success'] ?? false), "Owner A & Gym A registered centrally");
    $ownerAId = (int)$resOwnerA['json']['user']['id'];
    $gymAId = (int)$resOwnerA['json']['gym_id'];
    $createdUserIds[] = $ownerAId;
    $createdGymIds[] = $gymAId;
    $csrfOwnerA = fetchCsrf($baseUrl, $cOwnerA);

    // Seed active plan on Gym A & approve Gym A via Admin
    $db->prepare("INSERT INTO membership_plans (gym_id, name, description, duration_months, price, access_type, is_active) VALUES (?, 'Gold Monthly', 'Full access', 1, 2499.00, 'single_gym', 1)")
       ->execute([$gymAId]);
    $planAId = (int)$db->lastInsertId();
    $admApproveGymA = apiCall('POST', "{$baseUrl}/api/admin/verifications.php", $cAdmin, ['entity_type' => 'gym', 'entity_id' => $gymAId, 'decision' => 'approve'], $csrfAdmin);
    assertOk($admApproveGymA['status'] === 200, "Platform Admin approved Gym A");

    // -------------------------------------------------------------------------
    // TEST A: Trainer Registration & Gym Owner Registered Trainers Directory
    // -------------------------------------------------------------------------
    echo "\n--- Test A: Trainer Registration & Gym Owner Directory ---\n";
    $cTrainer1 = [];
    $csrfT1 = fetchCsrf($baseUrl, $cTrainer1);
    $tr1Email = "trainer1_{$tag}@fitsync.test";
    $tr1Phone = '+91982200' . rand(1000, 9999);
    $resT1 = apiCall('POST', "{$baseUrl}/api/auth/register.php", $cTrainer1, [
        'role' => 'trainer',
        'full_name' => "Coach Vikram {$tag}",
        'email' => $tr1Email,
        'mobile' => $tr1Phone,
        'password' => 'TrainerPass@123',
        'confirm_password' => 'TrainerPass@123',
        'trainer_specialization' => 'Strength Training',
        'experience_years' => 6,
        'certification_name' => 'CSCS',
        'certifying_body' => 'NSCA',
        'qualifications' => 'M.Sc Sports Science',
        'bio' => 'Certified barbell strength and hypertrophy coach.'
    ], $csrfT1);
    assertOk($resT1['status'] === 201, "Independent Trainer 1 registered cleanly");
    $trainer1Id = (int)$resT1['json']['user']['id'];
    $createdUserIds[] = $trainer1Id;
    $csrfT1 = fetchCsrf($baseUrl, $cTrainer1);

    // Check Admin notification received for New Trainer registration
    $admNotifs = apiCall('GET', "{$baseUrl}/api/notifications.php", $cAdmin);
    $hasTrNotif = count(array_filter($admNotifs['json']['data']['notifications'] ?? [], fn($n) => str_contains((string)$n['title'], 'New Trainer'))) > 0;
    assertOk($hasTrNotif, "Platform Admin notified of new Trainer registration");

    // Verify Gym Owner A sees Trainer 1 ONCE in Registered Trainers directory, with privacy-masked phone before association
    $goDash1 = apiCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php", $cOwnerA);
    $regTrMatches = array_values(array_filter($goDash1['json']['data']['registered_trainers'] ?? [], fn($t) => (int)$t['user_id'] === $trainer1Id));
    assertOk(count($regTrMatches) === 1 && $regTrMatches[0]['association_status'] === 'not_associated' && $regTrMatches[0]['phone'] === 'Private until affiliated',
        "Trainer 1 appears exactly once in FitSync Registered Trainers with privacy-protected phone before affiliation");

    // Gym Owner invites Trainer 1 -> Trainer 1 accepts -> active on Gym A
    $invRes = apiCall('POST', "{$baseUrl}/api/gym_owner/trainer_affiliation_action.php", $cOwnerA, ['gym_id' => $gymAId, 'trainer_user_id' => $trainer1Id, 'action' => 'invite'], $csrfOwnerA);
    assertOk($invRes['status'] === 200 && ($invRes['json']['data']['status'] ?? '') === 'invited', "Gym Owner invited Trainer 1 to Gym A");

    $accRes = apiCall('POST', "{$baseUrl}/api/trainer/affiliation_action.php", $cTrainer1, ['gym_id' => $gymAId, 'decision' => 'accept'], $csrfT1);
    assertOk($accRes['status'] === 200 && ($accRes['json']['data']['status'] ?? '') === 'active', "Trainer 1 accepted Gym A coaching invitation");

    // Admin verifies Trainer 1 credentials
    apiCall('POST', "{$baseUrl}/api/admin/verifications.php", $cAdmin, ['entity_type' => 'trainer', 'entity_id' => $trainer1Id, 'decision' => 'approve'], $csrfAdmin);

    $goDash2 = apiCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php", $cOwnerA);
    $activeCoaches = array_filter($goDash2['json']['data']['coaches'] ?? [], fn($c) => (int)$c['user_id'] === $trainer1Id);
    assertOk(count($activeCoaches) === 1 && (int)$goDash2['json']['data']['stats']['coaches_count'] >= 1, "Trainer 1 appears in Gym A active Coaching Staff");

    // Also register Trainer 2 requesting Gym A affiliation on registration
    $cTrainer2 = [];
    $csrfT2 = fetchCsrf($baseUrl, $cTrainer2);
    $tr2Email = "trainer2_{$tag}@fitsync.test";
    $resT2 = apiCall('POST', "{$baseUrl}/api/auth/register.php", $cTrainer2, [
        'role' => 'trainer',
        'full_name' => "Coach Neha {$tag}",
        'email' => $tr2Email,
        'mobile' => '+91983300' . rand(1000, 9999),
        'password' => 'TrainerPass@123',
        'confirm_password' => 'TrainerPass@123',
        'trainer_specialization' => 'Functional Fitness',
        'experience_years' => 4,
        'certification_name' => 'ACE CPT',
        'certifying_body' => 'ACE',
        'bio' => 'Functional movement and endurance specialist.',
        'gym_id' => $gymAId
    ], $csrfT2);
    $trainer2Id = (int)$resT2['json']['user']['id'];
    $createdUserIds[] = $trainer2Id;
    $csrfT2 = fetchCsrf($baseUrl, $cTrainer2);

    apiCall('POST', "{$baseUrl}/api/gym_owner/trainer_affiliation_action.php", $cOwnerA, ['gym_id' => $gymAId, 'trainer_user_id' => $trainer2Id, 'action' => 'approve'], $csrfOwnerA);
    apiCall('POST', "{$baseUrl}/api/admin/verifications.php", $cAdmin, ['entity_type' => 'trainer', 'entity_id' => $trainer2Id, 'decision' => 'approve'], $csrfAdmin);

    // -------------------------------------------------------------------------
    // TEST B: Member Registration, Pending Request & Approval
    // -------------------------------------------------------------------------
    echo "\n--- Test B: Member Registration & Approval Workflow ---\n";
    $cMember = [];
    $csrfM = fetchCsrf($baseUrl, $cMember);
    $memEmail = "member_{$tag}@fitsync.test";
    $resM = apiCall('POST', "{$baseUrl}/api/auth/register.php", $cMember, [
        'role' => 'user',
        'full_name' => "Athlete Kabir {$tag}",
        'email' => $memEmail,
        'mobile' => '+91984400' . rand(1000, 9999),
        'password' => 'MemberPass@123',
        'confirm_password' => 'MemberPass@123',
        'height_cm' => 178,
        'weight_kg' => 72.5,
        'primary_goal' => 'Muscle Gain',
        'gym_id' => $gymAId,
        'plan_id' => $planAId,
        'request_membership' => 1
    ], $csrfM);
    assertOk($resM['status'] === 201 && ($resM['json']['membership_status'] ?? '') === 'pending', "Member registered with pending Gym A membership request");
    $memberId = (int)$resM['json']['user']['id'];
    $createdUserIds[] = $memberId;
    $csrfM = fetchCsrf($baseUrl, $cMember);

    $goDash3 = apiCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php", $cOwnerA);
    $pendingReqs = array_values(array_filter($goDash3['json']['data']['membership_requests'] ?? [], fn($r) => (int)$r['user_id'] === $memberId && $r['status'] === 'pending'));
    $regMemMatch = array_values(array_filter($goDash3['json']['data']['registered_members'] ?? [], fn($r) => (int)$r['user_id'] === $memberId));
    $activeMemBefore = array_filter($goDash3['json']['data']['members'] ?? [], fn($r) => (int)$r['user_id'] === $memberId);
    assertOk(count($pendingReqs) === 1 && count($regMemMatch) === 1 && $regMemMatch[0]['selected_this_gym'] === true && count($activeMemBefore) === 0,
        "Gym Owner sees Member in Registered Members & Pending Requests (NOT active before approval)");

    $membershipId = (int)$pendingReqs[0]['membership_id'];
    $appMem = apiCall('POST', "{$baseUrl}/api/gym_owner/membership_action.php", $cOwnerA, ['membership_id' => $membershipId, 'decision' => 'approve'], $csrfOwnerA);
    assertOk($appMem['status'] === 200 && ($appMem['json']['data']['status'] ?? '') === 'active', "Gym Owner approved membership request");

    $goDash4 = apiCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php", $cOwnerA);
    $activeMemAfter = array_filter($goDash4['json']['data']['members'] ?? [], fn($r) => (int)$r['user_id'] === $memberId);
    assertOk(count($activeMemAfter) === 1 && (float)($goDash4['json']['data']['stats']['revenue'] ?? 0) >= 2499.0,
        "Member appears in Active Gym Members and revenue stat updated dynamically");

    // -------------------------------------------------------------------------
    // TEST C: Trainer Directory & Assignment / Reassignment Sync
    // -------------------------------------------------------------------------
    echo "\n--- Test C: Member Trainer Directory & Assignment Sync ---\n";
    // Also register an unverified trainer to confirm Member Directory does NOT mark them certified!
    $cTrUnver = [];
    $csrfTU = fetchCsrf($baseUrl, $cTrUnver);
    $resTU = apiCall('POST', "{$baseUrl}/api/auth/register.php", $cTrUnver, [
        'role' => 'trainer', 'full_name' => "Unverified Coach {$tag}", 'email' => "unver_{$tag}@fitsync.test",
        'mobile' => '+91985500' . rand(1000, 9999), 'password' => 'TrainerPass@123', 'confirm_password' => 'TrainerPass@123',
        'trainer_specialization' => 'Yoga', 'experience_years' => 1, 'certification_name' => 'RYT200',
        'certifying_body' => 'Yoga Alliance', 'bio' => 'Yoga teacher pending review.'
    ], $csrfTU);
    $unverTrainerId = (int)$resTU['json']['user']['id'];
    $createdUserIds[] = $unverTrainerId;

    $memTrDir = apiCall('GET', "{$baseUrl}/api/user/trainers.php", $cMember);
    $trListMem = $memTrDir['json']['data']['trainers'] ?? [];
    $tr1DirRow = array_values(array_filter($trListMem, fn($x) => (int)$x['user_id'] === $trainer1Id));
    $trUnvDirRow = array_values(array_filter($trListMem, fn($x) => (int)$x['user_id'] === $unverTrainerId));
    assertOk(count($tr1DirRow) === 1 && $tr1DirRow[0]['is_certified'] === true && $tr1DirRow[0]['isAssigned'] === false && count($trUnvDirRow) === 1 && $trUnvDirRow[0]['is_certified'] === false,
        "Member Trainer Directory shows live DB trainers & marks unverified trainers as non-certified without auto-assigning");

    // Member requests Trainer 1 (still NOT assigned until Owner approves)
    $reqTrRes = apiCall('POST', "{$baseUrl}/api/user/trainers.php", $cMember, ['action' => 'request_trainer', 'trainer_user_id' => $trainer1Id], $csrfM);
    assertOk($reqTrRes['status'] === 200 && ($reqTrRes['json']['data']['status'] ?? '') === 'pending', "Member submitted Trainer request (pending owner review)");

    // Gym Owner assigns Member to Trainer 1
    $assignRes = apiCall('POST', "{$baseUrl}/api/gym_owner/assign_coach.php", $cOwnerA, ['memberEmail' => $memEmail, 'coachId' => 'tr-' . $trainer1Id], $csrfOwnerA);
    assertOk($assignRes['status'] === 200 && ($assignRes['json']['success'] ?? false), "Gym Owner assigned Trainer 1 to Member");

    $tr1Dash = apiCall('GET', "{$baseUrl}/api/trainer/dashboard.php", $cTrainer1);
    $tr1Athletes = array_filter($tr1Dash['json']['data']['athletes'] ?? [], fn($a) => (int)$a['user_id'] === $memberId);
    $memDash1 = apiCall('GET', "{$baseUrl}/api/user/dashboard.php", $cMember);
    assertOk(count($tr1Athletes) === 1 && (int)($memDash1['json']['data']['trainer']['coach_id'] ?? 0) === $trainer1Id,
        "Assigned Member appears in Trainer 1 My Members AND Trainer 1 appears in Member dashboard");

    // Reassign Member from Trainer 1 to Trainer 2 and verify history preserved
    $reassignRes = apiCall('POST', "{$baseUrl}/api/gym_owner/assign_coach.php", $cOwnerA, ['memberEmail' => $memEmail, 'coachId' => 'tr-' . $trainer2Id], $csrfOwnerA);
    assertOk($reassignRes['status'] === 200, "Gym Owner reassigned Member to Trainer 2");

    $tr1DashAfter = apiCall('GET', "{$baseUrl}/api/trainer/dashboard.php", $cTrainer1);
    $tr2DashAfter = apiCall('GET', "{$baseUrl}/api/trainer/dashboard.php", $cTrainer2);
    $histCount = (int)$db->query("SELECT COUNT(*) FROM trainer_assignments WHERE user_id = {$memberId}")->fetchColumn();
    $transferredCount = (int)$db->query("SELECT COUNT(*) FROM trainer_assignments WHERE user_id = {$memberId} AND status = 'transferred'")->fetchColumn();
    assertOk(count($tr1DashAfter['json']['data']['athletes'] ?? []) === 0 && count($tr2DashAfter['json']['data']['athletes'] ?? []) === 1 && $histCount === 2 && $transferredCount === 1,
        "Reassignment moved Member from Trainer 1 to Trainer 2 and preserved assignment history");

    // -------------------------------------------------------------------------
    // TEST D: Live Weight & Chat Sync Across Portals
    // -------------------------------------------------------------------------
    echo "\n--- Test D: Live Biometric & Chat Synchronization ---\n";
    apiCall('POST', "{$baseUrl}/api/user/measurements.php", $cMember, ['weight_kg' => 74.5, 'notes' => 'Live sync check'], $csrfM);
    $dossierT2 = apiCall('GET', "{$baseUrl}/api/trainer/member_dossier.php?member_id={$memberId}", $cTrainer2);
    $goDash5 = apiCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php", $cOwnerA);
    $goMemWt = array_values(array_filter($goDash5['json']['data']['members'] ?? [], fn($m) => (int)$m['user_id'] === $memberId))[0]['weight'] ?? '';
    $dWt = (float)($dossierT2['json']['data']['athlete']['weight_kg'] ?? 0);
    $dHistCnt = count($dossierT2['json']['data']['measurement']['history'] ?? []);
    assertOk($dWt === 74.5 && $dHistCnt >= 2 && str_contains($goMemWt, '74.5'), "Updated Member weight (74.5 kg) & history synced live to Trainer 2 dossier and Gym Owner roster");

    $msgRes = apiCall('POST', "{$baseUrl}/api/messages.php", $cMember, ['recipient_id' => $trainer2Id, 'message_text' => "Hello Coach {$tag}"], $csrfM);
    $trMsgs = apiCall('GET', "{$baseUrl}/api/messages.php?with_user={$memberId}", $cTrainer2);
    $msgTexts = array_map(fn($m) => $m['message_text'], $trMsgs['json']['messages'] ?? []);
    assertOk(($msgRes['json']['success'] ?? false) && in_array("Hello Coach {$tag}", $msgTexts, true), "Member -> Assigned Trainer live chat message synchronized via MySQL");

    // -------------------------------------------------------------------------
    // TEST E: Duplicate Prevention & Safe Deactivation
    // -------------------------------------------------------------------------
    echo "\n--- Test E: Duplicate Prevention & Account Preservation ---\n";
    apiCall('POST', "{$baseUrl}/api/gym_owner/add_coach.php", $cOwnerA, ['name' => "Coach Vikram {$tag}", 'email' => $tr1Email, 'title' => 'CSCS'], $csrfOwnerA);
    apiCall('POST', "{$baseUrl}/api/gym_owner/membership_action.php", $cOwnerA, ['membership_id' => $membershipId, 'decision' => 'approve'], $csrfOwnerA);

    $tr1UserCount = (int)$db->query("SELECT COUNT(*) FROM users WHERE email = " . $db->quote($tr1Email))->fetchColumn();
    $gtCount = (int)$db->query("SELECT COUNT(*) FROM gym_trainers WHERE gym_id = {$gymAId} AND trainer_user_id = {$trainer1Id}")->fetchColumn();
    $payCount = (int)$db->query("SELECT COUNT(*) FROM payments WHERE membership_id = {$membershipId}")->fetchColumn();
    assertOk($tr1UserCount === 1 && $gtCount === 1 && $payCount === 1, "Duplicate Trainer link & double membership approval prevented (1 user, 1 gym_trainers, 1 payment)");

    $deactRes = apiCall('POST', "{$baseUrl}/api/gym_owner/trainer_affiliation_action.php", $cOwnerA, ['gym_id' => $gymAId, 'trainer_user_id' => $trainer1Id, 'action' => 'deactivate'], $csrfOwnerA);
    $tr1StatusAfter = (string)$db->query("SELECT status FROM users WHERE id = {$trainer1Id}")->fetchColumn();
    $gtActiveAfter = (int)$db->query("SELECT is_active FROM gym_trainers WHERE gym_id = {$gymAId} AND trainer_user_id = {$trainer1Id}")->fetchColumn();
    assertOk($deactRes['status'] === 200 && $tr1StatusAfter === 'active' && $gtActiveAfter === 0, "Deactivating gym association kept centralized users.status='active' untouched");

    // -------------------------------------------------------------------------
    // TEST F: Access Control & Unrelated Gym Owner Isolation
    // -------------------------------------------------------------------------
    echo "\n--- Test F: Cross-Gym Privacy & Authorization Enforcement ---\n";
    $cOwnerB = [];
    $csrfOwnerB = fetchCsrf($baseUrl, $cOwnerB);
    $resOwnerB = apiCall('POST', "{$baseUrl}/api/auth/register.php", $cOwnerB, [
        'role' => 'gym_owner', 'full_name' => "Owner Beta {$tag}", 'email' => "ownerB_{$tag}@fitsync.test",
        'mobile' => '+91996600' . rand(1000, 9999), 'password' => 'OwnerPass@123', 'confirm_password' => 'OwnerPass@123',
        'gym_name' => "Beta Fitness {$tag}", 'gym_email' => "beta_{$tag}@gym.test", 'gym_phone' => '+912022334455',
        'address_line1' => 'Lane 5, Baner', 'city' => 'Pune', 'state' => 'Maharashtra', 'postal_code' => '411045'
    ], $csrfOwnerB);
    $ownerBId = (int)$resOwnerB['json']['user']['id'];
    $gymBId = (int)$resOwnerB['json']['gym_id'];
    $createdUserIds[] = $ownerBId;
    $createdGymIds[] = $gymBId;
    $csrfOwnerB = fetchCsrf($baseUrl, $cOwnerB);

    // Owner B tries to manage Gym A records -> 403
    $tamper1 = apiCall('POST', "{$baseUrl}/api/gym_owner/membership_action.php", $cOwnerB, ['membership_id' => $membershipId, 'decision' => 'reject'], $csrfOwnerB);
    $tamper2 = apiCall('POST', "{$baseUrl}/api/gym_owner/assign_coach.php", $cOwnerB, ['memberEmail' => $memEmail, 'coachId' => 'tr-' . $trainer2Id, 'gym_id' => $gymAId], $csrfOwnerB);
    $tamper3 = apiCall('GET', "{$baseUrl}/api/trainer/member_dossier.php?member_id={$memberId}", $cTrainer1);
    $tamper4 = apiCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php", $cMember);
    assertOk($tamper1['status'] === 403 && $tamper2['status'] === 403 && $tamper3['status'] === 403 && $tamper4['status'] === 403,
        "Cross-gym owner tampering ({$tamper1['status']}, {$tamper2['status']}), unassigned trainer dossier ({$tamper3['status']}), and member privilege escalation ({$tamper4['status']}) rejected with 403");

    // Verify Owner B sees Member Kabir as unaffiliated with masked private contact
    $goBDash = apiCall('GET', "{$baseUrl}/api/gym_owner/dashboard.php", $cOwnerB);
    $memBView = array_values(array_filter($goBDash['json']['data']['registered_members'] ?? [], fn($m) => (int)$m['user_id'] === $memberId));
    assertOk(count($memBView) === 1 && $memBView[0]['contact_visible'] === false && $memBView[0]['phone'] === 'Private',
        "Unrelated Gym Owner B sees only permitted Member directory fields with contact masked");

    echo "\nSUMMARY: PASSED={$passed}, FAILED={$failed}\n";
    $exitCode = $failed > 0 ? 1 : 0;
} finally {
    if (!empty($createdGymIds)) {
        $ph = implode(',', array_fill(0, count($createdGymIds), '?'));
        $db->prepare("DELETE FROM payments WHERE gym_id IN ({$ph})")->execute($createdGymIds);
        $db->prepare("DELETE FROM memberships WHERE gym_id IN ({$ph})")->execute($createdGymIds);
        $db->prepare("DELETE FROM membership_plans WHERE gym_id IN ({$ph})")->execute($createdGymIds);
        $db->prepare("DELETE FROM gyms WHERE id IN ({$ph})")->execute($createdGymIds);
    }
    if (!empty($createdUserIds)) {
        $ph = implode(',', array_fill(0, count($createdUserIds), '?'));
        $db->prepare("DELETE FROM users WHERE id IN ({$ph})")->execute($createdUserIds);
    }
}
exit($exitCode);
