<?php
/**
 * FitSync AI — Phase 9 Acceptance Test Suite (20 Scenarios)
 * Uses separate HTTP cookie sessions (cURL) against live XAMPP Apache + MySQL.
 */

declare(strict_types=1);

$BASE = 'http://127.0.0.1:8080';
$pdo  = new PDO('mysql:host=127.0.0.1;dbname=fitsync_db;charset=utf8mb4', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

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

class HttpSession {
    public string $cookieFile;
    public string $csrf = '';
    private string $base;

    public function __construct(string $base, string $name) {
        $this->base = $base;
        $this->cookieFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fs_test_{$name}_" . getmypid() . ".txt";
        @unlink($this->cookieFile);
        $this->refreshCsrf();
    }

    public function __destruct() {
        @unlink($this->cookieFile);
    }

    public function refreshCsrf(): void {
        $r = $this->get('api/auth/csrf.php');
        if (!empty($r['body']['csrf_token'])) {
            $this->csrf = (string)$r['body']['csrf_token'];
        }
    }

    public function get(string $path): array {
        return $this->req('GET', $path, null);
    }

    public function post(string $path, array $payload): array {
        return $this->req('POST', $path, $payload);
    }

    private function req(string $method, string $path, ?array $payload): array {
        $ch = curl_init($this->base . '/' . ltrim($path, '/'));
        $headers = ['Accept: application/json'];
        if ($method === 'POST') {
            $headers[] = 'Content-Type: application/json';
            if ($this->csrf !== '') {
                $headers[] = 'X-CSRF-Token: ' . $this->csrf;
            }
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload ?? []));
        }
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_COOKIEJAR      => $this->cookieFile,
            CURLOPT_COOKIEFILE     => $this->cookieFile,
            CURLOPT_TIMEOUT        => 20,
        ]);
        $raw = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $json = is_string($raw) ? json_decode($raw, true) : null;
        return ['code' => $code, 'raw' => $raw, 'body' => $json];
    }
}

$ts = date('His') . random_int(10, 99);
$ownerEmail   = "owner_{$ts}@fitsync.test";
$trainerEmail = "trainer_{$ts}@fitsync.test";
$user1Email   = "user1_{$ts}@fitsync.test";
$user2Email   = "user2_{$ts}@fitsync.test";
$gymName      = "Titan Forge {$ts}";

$ownerSess   = new HttpSession($BASE, 'owner');
$trainerSess = new HttpSession($BASE, 'trainer');
$user1Sess   = new HttpSession($BASE, 'user1');
$user2Sess   = new HttpSession($BASE, 'user2');

// 1 & 2. Register a new Gym Owner & register a gym
$rOwner = $ownerSess->post('api/auth/register.php', [
    'role' => 'gym_owner',
    'full_name' => 'Vikram Owner',
    'email' => $ownerEmail,
    'mobile' => '+91980000' . random_int(1000, 9999),
    'password' => 'TestPass123!',
    'confirm_password' => 'TestPass123!',
    'gym_name' => $gymName,
    'gym_email' => "desk_{$ts}@fitsync.test",
    'gym_phone' => '+91981111' . random_int(1000, 9999),
    'address_line1' => '100 Iron Street',
    'city' => 'Bengaluru',
    'state' => 'Karnataka',
    'postal_code' => '560001',
    'facilities_csv' => 'Free Weights, Sauna, Locker Room',
    'default_plan_name' => 'Pro Monthly',
    'default_plan_price' => 1800
]);
$ownerSess->refreshCsrf();
$gymId = (int)($rOwner['body']['gym_id'] ?? 0);
assertTrue($rOwner['code'] === 201 && $gymId > 0, '1-2. Register Gym Owner & create published gym', (string)$rOwner['raw']);

// Register a Trainer independently (without gym association initially)
$rTrainer = $trainerSess->post('api/auth/register.php', [
    'role' => 'trainer',
    'full_name' => 'Coach Kabir',
    'email' => $trainerEmail,
    'mobile' => '+91982222' . random_int(1000, 9999),
    'password' => 'TestPass123!',
    'confirm_password' => 'TestPass123!',
    'specialization' => 'Strength & Conditioning',
    'certification_name' => 'CSCS',
    'certifying_body' => 'NSCA',
    'bio' => 'Certified strength coach with 6 years of athletic programming experience.'
]);
$trainerSess->refreshCsrf();
$trainerId = (int)($rTrainer['body']['user']['id'] ?? 0);
assertTrue($rTrainer['code'] === 201 && $trainerId > 0, 'Trainer registered independently', (string)$rTrainer['raw']);

// 5. Register User 1 independently
$rUser1 = $user1Sess->post('api/auth/register.php', [
    'role' => 'user',
    'full_name' => 'Aarav UserOne',
    'email' => $user1Email,
    'mobile' => '+91983333' . random_int(1000, 9999),
    'password' => 'TestPass123!',
    'confirm_password' => 'TestPass123!',
    'weight_kg' => 78.5,
    'height_cm' => 176
]);
$user1Sess->refreshCsrf();
$user1Id = (int)($rUser1['body']['user']['id'] ?? 0);
$user1Code = (string)($rUser1['body']['verification_code'] ?? '');
assertTrue($rUser1['code'] === 201 && $user1Id > 0, '5. Register User 1 independently', (string)$rUser1['raw']);

// Verify User 1 email
$rVerify1 = $user1Sess->post('api/auth/verify_email.php', ['code' => $user1Code]);
assertTrue(!empty($rVerify1['body']['success']), 'User 1 email verified via token', (string)$rVerify1['raw']);

// 3. Verify gym appears in User gym discovery
$rUserGyms = $user1Sess->get('api/user/membership.php?search=' . urlencode($gymName));
$foundInUser = array_filter($rUserGyms['body']['data']['gyms'] ?? [], fn($g) => (int)$g['id'] === $gymId);
assertTrue(count($foundInUser) === 1, '3. Published gym appears in User gym discovery');

// 4. Verify gym appears in Trainer gym discovery & trainer requests association
$rTrGyms = $trainerSess->get('api/trainer/gyms.php?search=' . urlencode($gymName));
$foundInTr = array_filter($rTrGyms['body']['data']['gyms'] ?? [], fn($g) => (int)$g['id'] === $gymId);
assertTrue(count($foundInTr) === 1, '4. Published gym appears in Trainer gym discovery');

$rTrReq = $trainerSess->post('api/trainer/gyms.php', ['action' => 'request', 'gym_id' => $gymId, 'employment_type' => 'full_time']);
assertTrue(!empty($rTrReq['body']['success']), 'Trainer requests gym association', (string)$rTrReq['raw']);

$rOwnerApproveTr = $ownerSess->post('api/gym_owner/trainer_affiliation_action.php', [
    'gym_id' => $gymId,
    'trainer_user_id' => $trainerId,
    'action' => 'approve'
]);
assertTrue(!empty($rOwnerApproveTr['body']['success']), 'Owner approves Trainer association', (string)$rOwnerApproveTr['raw']);

// 6. Owner invites existing User 1 by email
$rInv1 = $ownerSess->post('api/gym_owner/add_member.php', [
    'gym_id' => $gymId,
    'email' => $user1Email,
    'name' => 'Aarav UserOne'
]);
$inv1Id = (int)($rInv1['body']['data']['invitation_id'] ?? 0);
assertTrue($inv1Id > 0 && !empty($rInv1['body']['data']['user_exists']), '6. Owner invites existing User 1 (no duplicate user created)', (string)$rInv1['raw']);

// 7. User 1 receives the invitation
$rGetInv1 = $user1Sess->get('api/user/invitations.php');
$invFound = array_filter($rGetInv1['body']['data']['invitations'] ?? [], fn($i) => (int)$i['id'] === $inv1Id);
assertTrue(count($invFound) === 1, '7. User 1 receives pending invitation');

// 8. User 1 accepts invitation
$rAcc1 = $user1Sess->post('api/user/invitations.php', ['invitation_id' => $inv1Id, 'decision' => 'accept']);
assertTrue(!empty($rAcc1['body']['success']), '8. User 1 accepts invitation', (string)$rAcc1['raw']);

// 9. Owner sees actual registered User 1 in Member Roster
$rOwnerDash = $ownerSess->get('api/gym_owner/dashboard.php?gym_id=' . $gymId);
$inRoster = array_filter($rOwnerDash['body']['data']['members'] ?? [], fn($m) => (int)$m['user_id'] === $user1Id);
assertTrue(count($inRoster) === 1, '9. Owner sees actual User 1 in Member Roster');

// 10. Owner assigns Trainer to User 1
$rAssign = $ownerSess->post('api/gym_owner/assign_coach.php', [
    'gym_id' => $gymId,
    'memberEmail' => $user1Email,
    'coachId' => 'tr-' . $trainerId
]);
assertTrue(!empty($rAssign['body']['success']), '10. Owner assigns Trainer to User 1', (string)$rAssign['raw']);

// 11. Trainer sees User 1 in My Members
$rTrDash = $trainerSess->get('api/trainer/dashboard.php');
$inTrMembers = array_filter($rTrDash['body']['data']['athletes'] ?? [], fn($a) => (int)$a['user_id'] === $user1Id);
assertTrue(count($inTrMembers) === 1, '11. Trainer sees User 1 in My Members', (string)$rTrDash['raw']);

// 12. User 1 sees assigned Trainer
$rUserDash = $user1Sess->get('api/user/dashboard.php');
$assignedCoachName = $rUserDash['body']['data']['trainer']['coach_name'] ?? '';
assertTrue($assignedCoachName === 'Coach Kabir', '12. User 1 sees assigned Trainer', $assignedCoachName);

// 13 & 14. User 1 updates weight -> Trainer sees updated weight
$rWeight = $user1Sess->post('api/user/measurements.php', ['weight_kg' => 75.2, 'recorded_at' => date('Y-m-d')]);
assertTrue(!empty($rWeight['body']['success']), '13. User 1 updates weight to 75.2 kg', (string)$rWeight['raw']);

$rDossier = $trainerSess->get('api/trainer/member_dossier.php?member_id=' . $user1Id);
$dossierWeight = (float)($rDossier['body']['data']['athlete']['weight_kg'] ?? ($rDossier['body']['data']['measurement']['latest']['weight_kg'] ?? 0));
assertTrue(abs($dossierWeight - 75.2) < 0.1, '14. Trainer sees updated weight (75.2 kg)', (string)$rDossier['raw']);

// 15. User 1 and Trainer exchange real messages
$rMsg1 = $user1Sess->post('api/messages.php', ['receiver_id' => $trainerId, 'message' => 'Hello Coach Kabir, ready for leg day!']);
$rMsg2 = $trainerSess->post('api/messages.php', ['receiver_id' => $user1Id, 'message' => 'Great Aarav! Focus on squat depth today.']);
$rConv = $user1Sess->get('api/messages.php?peer_id=' . $trainerId);
$msgs = $rConv['body']['data']['messages'] ?? $rConv['body']['messages'] ?? [];
assertTrue(!empty($rMsg1['body']['success']) && !empty($rMsg2['body']['success']) && count($msgs) >= 2, '15. User 1 and Trainer exchange real messages', (string)$rConv['raw']);

// 16 & 17. Owner invites User 2 who does NOT yet have a FitSync account
$u2Before = $pdo->prepare("SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER(:em)");
$u2Before->execute([':em' => $user2Email]);
$rInv2 = $ownerSess->post('api/gym_owner/add_member.php', [
    'gym_id' => $gymId,
    'email' => $user2Email,
    'name' => 'Riya Invited'
]);
$u2After = $pdo->prepare("SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER(:em)");
$u2After->execute([':em' => $user2Email]);
$inv2Token = (string)($rInv2['body']['data']['invite_token'] ?? '');
$inv2Id    = (int)($rInv2['body']['data']['invitation_id'] ?? 0);
assertTrue((int)$u2Before->fetchColumn() === 0 && (int)$u2After->fetchColumn() === 0 && $inv2Token !== '', '16-17. Owner invites unregistered User 2 without creating fake user account', (string)$rInv2['raw']);

// 18 & 19. User 2 registers through invitation, verifies email, accepts invitation, and links to gym
$rUser2 = $user2Sess->post('api/auth/register.php', [
    'role' => 'user',
    'full_name' => 'Riya Invited',
    'email' => $user2Email,
    'password' => 'TestPass123!',
    'confirm_password' => 'TestPass123!',
    'invite_token' => $inv2Token
]);
$user2Sess->refreshCsrf();
$user2Id   = (int)($rUser2['body']['user']['id'] ?? 0);
$user2Code = (string)($rUser2['body']['verification_code'] ?? '');
$linkedInvId = (int)($rUser2['body']['pending_invitation_id'] ?? 0);
$rVerify2 = $user2Sess->post('api/auth/verify_email.php', ['code' => $user2Code]);
$rAcc2 = $user2Sess->post('api/user/invitations.php', ['invitation_id' => $inv2Id, 'decision' => 'accept']);
assertTrue($user2Id > 0 && $linkedInvId === $inv2Id && !empty($rVerify2['body']['success']) && !empty($rAcc2['body']['success']), '18-19. User 2 registers via invite, verifies email & links to gym', (string)$rAcc2['raw']);

// 20. Duplicate invitations, duplicate memberships, and single-use token reuse are prevented
$rDupInv = $ownerSess->post('api/gym_owner/add_member.php', ['gym_id' => $gymId, 'email' => $user1Email]);
$rDupAcc = $user2Sess->post('api/user/invitations.php', ['invitation_id' => $inv2Id, 'decision' => 'accept']);
$rDupSelf = $user1Sess->post('api/user/membership.php', ['action' => 'request', 'gym_id' => $gymId, 'plan_id' => (int)$rInv2['body']['data']['plan_id']]);
assertTrue(
    $rDupInv['code'] === 409 && $rDupAcc['code'] === 400 && !empty($rDupSelf['body']['data']['duplicate_prevented']),
    '20. Duplicate invitations, duplicate memberships, and invite reuse prevented'
);

// Cleanup test accounts & gym so DB stays clean
$pdo->prepare("DELETE FROM gyms WHERE id = :gid")->execute([':gid' => $gymId]);
$pdo->prepare("DELETE FROM users WHERE id IN (:u1, :u2, :u3, :u4)")->execute([':u1' => $ownerSess ? (int)$rOwner['body']['user']['id'] : 0, ':u2' => $trainerId, ':u3' => $user1Id, ':u4' => $user2Id]);

echo "\nSUMMARY: PASSED={$passed}, FAILED={$failed}\n";
exit($failed > 0 ? 1 : 0);
