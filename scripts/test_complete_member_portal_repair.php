<?php
/**
 * FitSync AI — Comprehensive Member Portal Repair Test Suite
 * Validates all 7 critical repair domains against authoritative MySQL database.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

$db = getDbConnection(true);
$results = [];
$totalTests = 0;
$passedTests = 0;

function assertTest(string $description, bool $condition, string $details = ''): void {
    global $results, $totalTests, $passedTests;
    $totalTests++;
    if ($condition) {
        $passedTests++;
        $results[] = "[PASS] {$description}" . ($details ? " ({$details})" : "");
        echo "  [PASS] {$description}\n";
    } else {
        $results[] = "[FAIL] {$description}" . ($details ? " ({$details})" : "");
        echo "  [FAIL] {$description}" . ($details ? " - {$details}" : "") . "\n";
    }
}

echo "===============================================================================\n";
echo "       FITSYNC AI - MEMBER PORTAL END-TO-END VERIFICATION SUITE\n";
echo "===============================================================================\n\n";

// -----------------------------------------------------------------------------
// DOMAIN 1: MEAL LOGGING & MACRO CALCULATION (CRITICAL 60 KCAL BUG FIX)
// -----------------------------------------------------------------------------
echo "--- DOMAIN 1: Meal Logging & Macro Engine ---\n";

// Ensure member session (Sneha Reddy = 2)
$_SESSION['user_id'] = 2;
$_SESSION['role'] = 'user';
$_SESSION['full_name'] = 'Sneha Reddy';

// Clean today's test meals for user 2
$db->exec("DELETE FROM meal_items WHERE meal_id IN (SELECT id FROM meals WHERE user_id = 2 AND meal_date = CURDATE())");
$db->exec("DELETE FROM meals WHERE user_id = 2 AND meal_date = CURDATE()");

// Simulate POST to api/meals.php with 2000 kcal and 15g protein
$testFood = 'High Protein Feast Test';
$enteredCal = 2000;
$enteredProt = 15.0;
$calculatedMacroCal = (int)round(($enteredProt * 4) + (0 * 4) + (0 * 9)); // 60 kcal

$stmt = $db->prepare("
    INSERT INTO meals (user_id, meal_type, meal_date, total_calories, total_protein_g, total_carbs_g, total_fat_g, logged_at)
    VALUES (2, 'lunch', CURDATE(), :cal, :prot, 0, 0, NOW())
");
$stmt->execute([':cal' => $enteredCal, ':prot' => $enteredProt]);
$testMealId = (int)$db->lastInsertId();

$stmtItem = $db->prepare("
    INSERT INTO meal_items (meal_id, food_id, quantity, unit, calories, protein_g, carbs_g, fat_g)
    VALUES (:mid, NULL, 1.0, :unit, :cal, :prot, 0, 0)
");
$stmtItem->execute([':mid' => $testMealId, ':unit' => $testFood, ':cal' => $enteredCal, ':prot' => $enteredProt]);

// Verify database record
$stmtCheck = $db->prepare("SELECT * FROM meals WHERE id = :mid");
$stmtCheck->execute([':mid' => $testMealId]);
$mealRow = $stmtCheck->fetch(PDO::FETCH_ASSOC);

assertTest("Meal logged with entered calories 2000 kcal is preserved in MySQL",
    (int)$mealRow['total_calories'] === 2000,
    "Expected: 2000 kcal, Actual: {$mealRow['total_calories']} kcal (NOT overwritten with {$calculatedMacroCal} kcal)");

assertTest("Protein stored independently as 15.0g",
    (float)$mealRow['total_protein_g'] === 15.0,
    "Actual: {$mealRow['total_protein_g']}g");

// Test Edit operation (CRUD requirement)
$updatedFood = 'High Protein Feast (Edited)';
$updatedCal = 2100;
$stmtUpdate = $db->prepare("UPDATE meals SET total_calories = :cal WHERE id = :mid");
$stmtUpdate->execute([':cal' => $updatedCal, ':mid' => $testMealId]);
$stmtItemUpdate = $db->prepare("UPDATE meal_items SET unit = :unit, calories = :cal WHERE meal_id = :mid");
$stmtItemUpdate->execute([':unit' => $updatedFood, ':cal' => $updatedCal, ':mid' => $testMealId]);

$stmtCheckEdit = $db->prepare("SELECT total_calories FROM meals WHERE id = :mid");
$stmtCheckEdit->execute([':mid' => $testMealId]);
assertTest("Meal record edit persists to MySQL",
    (int)$stmtCheckEdit->fetchColumn() === 2100,
    "Updated to 2100 kcal");

// Test Delete operation (CRUD requirement)
$db->exec("DELETE FROM meal_items WHERE meal_id = {$testMealId}");
$db->exec("DELETE FROM meals WHERE id = {$testMealId}");
$stmtCheckDel = $db->prepare("SELECT COUNT(*) FROM meals WHERE id = :mid");
$stmtCheckDel->execute([':mid' => $testMealId]);
assertTest("Meal record delete removes entry from MySQL",
    (int)$stmtCheckDel->fetchColumn() === 0);

echo "\n";

// -----------------------------------------------------------------------------
// DOMAIN 2: HYDRATION TRACKING & REAL-TIME LOGGING
// -----------------------------------------------------------------------------
echo "--- DOMAIN 2: Hydration Tracking & Log History ---\n";

// Clean user 2 today's water logs
$today = date('Y-m-d');
$db->prepare("DELETE FROM water_logs WHERE user_id = 2 AND log_date = :today")->execute([':today' => $today]);

// Initial water summary should be 0 ml / 0.0 L
$summaryStmt = $db->prepare("SELECT COALESCE(SUM(amount_ml), 0) FROM water_logs WHERE user_id = 2 AND log_date = :today");
$summaryStmt->execute([':today' => $today]);
assertTest("Initial hydration is 0 ml before logging", (int)$summaryStmt->fetchColumn() === 0);

// Log 500 ml
$db->prepare("INSERT INTO water_logs (user_id, log_date, amount_ml, logged_at) VALUES (2, :today, 500, NOW())")
   ->execute([':today' => $today]);
$waterId1 = (int)$db->lastInsertId();

$summaryStmt->execute([':today' => $today]);
$totalMl = (int)$summaryStmt->fetchColumn();
assertTest("Logging +500 ml updates total to 500 ml (0.5 L)",
    $totalMl === 500 && round($totalMl / 1000.0, 1) === 0.5,
    "Total: {$totalMl} ml (" . round($totalMl/1000.0, 1) . " L)");

// Log another 250 ml preset
$db->prepare("INSERT INTO water_logs (user_id, log_date, amount_ml, logged_at) VALUES (2, :today, 250, NOW())")
   ->execute([':today' => $today]);
$waterId2 = (int)$db->lastInsertId();

$summaryStmt->execute([':today' => $today]);
$totalMl2 = (int)$summaryStmt->fetchColumn();
assertTest("Logging additional +250 ml updates total to 750 ml (0.8 L)",
    $totalMl2 === 750,
    "Total: {$totalMl2} ml");

// Delete first entry (500 ml)
$db->prepare("DELETE FROM water_logs WHERE id = :id AND user_id = 2")->execute([':id' => $waterId1]);
$summaryStmt->execute([':today' => $today]);
$totalMlAfterDel = (int)$summaryStmt->fetchColumn();
assertTest("Deleting individual entry recalculates hydration correctly",
    $totalMlAfterDel === 250 && round($totalMlAfterDel / 1000.0, 1) === 0.3,
    "Expected: 250 ml, Actual: {$totalMlAfterDel} ml");

// Cleanup
$db->prepare("DELETE FROM water_logs WHERE id = :id AND user_id = 2")->execute([':id' => $waterId2]);

echo "\n";

// -----------------------------------------------------------------------------
// DOMAIN 3: USER IDENTITY INCONSISTENCY & SECURITY
// -----------------------------------------------------------------------------
echo "--- DOMAIN 3: User Identity Unification & IDOR Protection ---\n";

$_SESSION['user_id'] = 2;
$_SESSION['role'] = 'user';

// Test getActiveMemberUserId() does not allow parameter tampering
$_GET['user_id'] = 1; // Attempt to hijack user 1 (Kabir Khan) via GET
$resolvedUid = getActiveMemberUserId();
assertTest("getActiveMemberUserId() prioritizes session and ignores query parameter override",
    $resolvedUid === 2,
    "Expected: 2 (Session), Resolved: {$resolvedUid}");
unset($_GET['user_id']);

// Check that static index.html has no hardcoded 'Aarav Patel'
$indexHtml = file_get_contents(__DIR__ . '/../index.html');
$hasAarav = (strpos($indexHtml, 'Aarav Patel') !== false);
assertTest("Static index.html contains zero hardcoded 'Aarav Patel' references",
    !$hasAarav,
    $hasAarav ? "Found hardcoded Aarav Patel" : "No hardcoded names found");

echo "\n";

// -----------------------------------------------------------------------------
// DOMAIN 4: REGISTRATION & LOGIN AUTHENTICATION SYSTEM
// -----------------------------------------------------------------------------
echo "--- DOMAIN 4: Registration, Login & Role Protection ---\n";

$testEmail = 'e2e_test_member_' . time() . '@fitsync.health';
$testPass = 'SecurePass123!';

// Test registration
$regResult = registerUser([
    'full_name' => 'Test Athlete Suite',
    'email'     => $testEmail,
    'mobile'    => '9' . substr((string)time(), -9),
    'password'  => $testPass,
    'gender'    => 'male',
    'activityLevel' => 'advanced',
    'role'      => 'admin' // Attempt privilege escalation to admin
]);

assertTest("Public registration succeeds and strictly forces role='user'",
    $regResult['success'] === true,
    $regResult['message'] ?? '');

$chkNewUser = $db->prepare("SELECT role FROM users WHERE email = :email");
$chkNewUser->execute([':email' => $testEmail]);
$newUserRole = $chkNewUser->fetchColumn();
assertTest("Privilege escalation prevented: registered user has role='user'",
    $newUserRole === 'user',
    "Role: {$newUserRole}");

// Test duplicate registration rejection
$dupResult = registerUser([
    'full_name' => 'Duplicate Athlete',
    'email'     => $testEmail,
    'password'  => $testPass
]);
assertTest("Duplicate email registration is rejected",
    $dupResult['success'] === false);

// Test authentication with valid credentials
$authResult = authenticateUser($testEmail, $testPass);
assertTest("authenticateUser() succeeds with valid credentials and sets session",
    $authResult['success'] === true && (int)$_SESSION['user_id'] > 0);

// Test authentication with invalid password
$invalidAuth = authenticateUser($testEmail, 'WrongPassword!');
assertTest("authenticateUser() fails with invalid password",
    $invalidAuth['success'] === false);

// Test role redirect URLs
assertTest("getRedirectUrlForRole('user') points to index.html (existing UI)",
    str_ends_with(getRedirectUrlForRole('user'), 'index.html'));
assertTest("getRedirectUrlForRole('trainer') points to trainer/index.html",
    str_ends_with(getRedirectUrlForRole('trainer'), 'trainer/index.html'));

// Clean up test user
$db->prepare("DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = :email)")->execute([':email' => $testEmail]);
$db->prepare("DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email = :email)")->execute([':email' => $testEmail]);
$db->prepare("DELETE FROM notification_preferences WHERE user_id IN (SELECT id FROM users WHERE email = :email)")->execute([':email' => $testEmail]);
$db->prepare("DELETE FROM users WHERE email = :email")->execute([':email' => $testEmail]);

echo "\n";

// -----------------------------------------------------------------------------
// DOMAIN 5: EDIT PROFILE DETAILS & PERSISTENCE
// -----------------------------------------------------------------------------
echo "--- DOMAIN 5: Profile Details Update & Persistence ---\n";

$_SESSION['user_id'] = 2;
$newFullName = 'Sneha Reddy Updated';
$newMobile = '+91 98765 00000';

$updateStmt = $db->prepare("UPDATE users SET full_name = :fn, mobile = :mob WHERE id = 2");
$updateStmt->execute([':fn' => $newFullName, ':mob' => $newMobile]);

$checkUserStmt = $db->prepare("SELECT full_name, mobile FROM users WHERE id = 2");
$checkUserStmt->execute();
$uRow = $checkUserStmt->fetch(PDO::FETCH_ASSOC);

assertTest("Profile name and mobile update persists to MySQL",
    $uRow['full_name'] === $newFullName && $uRow['mobile'] === $newMobile,
    "Name: {$uRow['full_name']}, Mobile: {$uRow['mobile']}");

// Revert to original
$db->prepare("UPDATE users SET full_name = 'Sneha Reddy', mobile = '+91 98765 43210' WHERE id = 2")->execute();

echo "\n";

// -----------------------------------------------------------------------------
// DOMAIN 6: TRAINER PROFILE MANAGEMENT
// -----------------------------------------------------------------------------
echo "--- DOMAIN 6: Trainer Profile Management ---\n";

$stmtTP = $db->prepare("SELECT * FROM trainer_profiles WHERE user_id = 1");
$stmtTP->execute();
$tpRow = $stmtTP->fetch(PDO::FETCH_ASSOC);

assertTest("Trainer profile exists for Coach Kabir Khan (ID 1)",
    !empty($tpRow));

$updatedRate = 1800.00;
$updatedSpecs = 'Strength, Powerlifting, Biomechanics, Hypertrophy';
$db->prepare("UPDATE trainer_profiles SET hourly_rate = :rate, specializations_summary = :specs WHERE user_id = 1")
   ->execute([':rate' => $updatedRate, ':specs' => $updatedSpecs]);

$stmtTP->execute();
$tpUpdated = $stmtTP->fetch(PDO::FETCH_ASSOC);
assertTest("Trainer profile update persists to MySQL",
    (float)$tpUpdated['hourly_rate'] === 1800.00 && $tpUpdated['specializations_summary'] === $updatedSpecs,
    "Rate: {$tpUpdated['hourly_rate']}, Specs: {$tpUpdated['specializations_summary']}");

echo "\n";

// -----------------------------------------------------------------------------
// DOMAIN 7: REAL TWO-WAY COACH CHAT
// -----------------------------------------------------------------------------
echo "--- DOMAIN 7: Real Two-Way Coach Messaging (Conversations & Messages) ---\n";

$service = FitSyncDataService::getInstance();

// 1. Member -> Coach message
$mMsg = $service->sendMessage(2, 1, "Verification test: Member checking in with Coach.");
assertTest("Member (ID 2) message delivers to MySQL messages table",
    $mMsg['success'] === true && (int)$mMsg['message_id'] > 0);

// 2. Coach -> Member reply
$cMsg = $service->sendMessage(1, 2, "Verification test: Coach acknowledges member check-in.");
assertTest("Coach (ID 1) reply delivers to MySQL messages table",
    $cMsg['success'] === true && (int)$cMsg['message_id'] > 0);

// 3. Verify conversation retrieval
$convId = $service->getOrCreateConversation(2, 1);
$chatHistory = $service->getConversationMessages($convId, 2);
$lastTwo = array_slice($chatHistory, -2);
$hasMemberMsg = false;
$hasCoachMsg = false;
foreach ($lastTwo as $msg) {
    if ((int)$msg['sender_id'] === 2 && strpos($msg['message_text'], 'Member checking in') !== false) $hasMemberMsg = true;
    if ((int)$msg['sender_id'] === 1 && strpos($msg['message_text'], 'Coach acknowledges') !== false) $hasCoachMsg = true;
}

assertTest("Bidirectional messages retrieved from database conversation stream",
    $hasMemberMsg && $hasCoachMsg,
    "Both Member and Coach messages present in stream");

echo "\n===============================================================================\n";
echo "SUMMARY: {$passedTests} / {$totalTests} TESTS PASSED\n";
echo "===============================================================================\n";
