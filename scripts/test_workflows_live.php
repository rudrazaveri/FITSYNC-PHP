<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

$service = FitSyncDataService::getInstance();

echo "========================================================\n";
echo "FITSYNC 5 LIVE CROSS-PORTAL WORKFLOW VERIFICATION SUITE\n";
echo "========================================================\n\n";

$memberId = 8; // Aarav Patel
$trainerId = 3; // Coach Raj Malhotra
$gymId = 1; // FitZone Fitness

// -----------------------------------------------------------------------------
// WORKFLOW A: Weight updates
// -----------------------------------------------------------------------------
echo "--> WORKFLOW A: Weight & Biometrics Update\n";
$newWeight = 74.5;
$resA = $service->recordWeightMeasurement($memberId, $newWeight, 78.0, 98.0, 34.0, 56.0, 15.5, "Morning fasted check-in");
echo "    [1] Recorded weight measurement: {$resA['weight_kg']} kg (Measurement ID: {$resA['measurement_id']})\n";

$userDash = $service->getUserDashboard($memberId);
echo "    [2] User Dashboard latest weight: {$userDash['user']['weight_kg']} kg, BMI: {$userDash['user']['bmi']}\n";
assert($userDash['user']['weight_kg'] == $newWeight, "User dashboard must reflect new weight");

$trainerDossier = $service->getAthleteDossier($trainerId, $memberId);
echo "    [3] Trainer Athlete Dossier latest weight: {$trainerDossier['athlete']['weight_kg']} kg\n";
assert($trainerDossier['athlete']['weight_kg'] == $newWeight, "Trainer dossier must reflect updated weight");
echo "    >>> WORKFLOW A PASSED!\n\n";

// -----------------------------------------------------------------------------
// WORKFLOW B: User sends message & Trainer replies
// -----------------------------------------------------------------------------
echo "--> WORKFLOW B: Coach Chat Messaging\n";
$userMsg = $service->sendMessage($memberId, $trainerId, "Hey Coach Raj, my shoulder felt great during today's bench pressing!");
echo "    [1] User sent message (ID: {$userMsg['message_id']}): '{$userMsg['message_text']}'\n";

$trainerReply = $service->sendMessage($trainerId, $memberId, "Awesome Aarav! Keep your scapulae retracted and maintain that 3-second eccentric.");
echo "    [2] Trainer sent reply (ID: {$trainerReply['message_id']}): '{$trainerReply['message_text']}'\n";

$convMessages = $service->getConversationMessages($userMsg['conversation_id'], $memberId);
echo "    [3] Conversation contains " . count($convMessages) . " persistent messages in DB.\n";
assert(count($convMessages) >= 2, "Conversation must contain at least 2 messages");
echo "    >>> WORKFLOW B PASSED!\n\n";

// -----------------------------------------------------------------------------
// WORKFLOW C: Workout assignment & logging
// -----------------------------------------------------------------------------
echo "--> WORKFLOW C: Workout Assignment & Set Logging\n";
$planId = 1; // PPL Hypertrophy Master Program
$assignRes = $service->assignWorkoutPlan($trainerId, $memberId, $planId);
echo "    [1] Trainer assigned Plan ID {$assignRes['plan_id']} to Member {$assignRes['user_id']} (Assignment ID: {$assignRes['assignment_id']})\n";

$userDashAfterPlan = $service->getUserDashboard($memberId);
echo "    [2] Member assigned plan: '{$userDashAfterPlan['workout']['plan']['plan_name']}' by Coach '{$userDashAfterPlan['workout']['plan']['coach_name']}'\n";
assert(!empty($userDashAfterPlan['workout']['plan']), "Member must have assigned plan in DB");

// Log a workout set
$logSet = $service->logExerciseSet($memberId, 1, 1, 1, 80.0, 10, 8.5);
echo "    [3] Member logged set: 80.0 kg x 10 reps (Set Log ID: {$logSet['log_id']}, Volume: {$logSet['volume_added']} kg)\n";

$trainerDossierAfterLog = $service->getAthleteDossier($trainerId, $memberId);
echo "    [4] Trainer sees recent sessions logged by athlete: " . count($trainerDossierAfterLog['recent_sessions']) . " session(s)\n";
assert(count($trainerDossierAfterLog['recent_sessions']) > 0, "Trainer must see athlete's logged session");
echo "    >>> WORKFLOW C PASSED!\n\n";

// -----------------------------------------------------------------------------
// WORKFLOW D: Turnstile Attendance & Facility Occupancy
// -----------------------------------------------------------------------------
echo "--> WORKFLOW D: Turnstile Attendance & Facility Occupancy\n";
$ownerId = 2; // Priya Sharma
$ownerBefore = $service->getGymOwnerDashboard($ownerId, $gymId);
echo "    [1] Facility occupancy before check-in: {$ownerBefore['stats']['active_checkins']} active ({$ownerBefore['stats']['capacity_pct']}% capacity)\n";

$checkin = $service->recordAttendanceCheckIn($memberId, $gymId, 'turnstile');
echo "    [2] Member {$memberId} checked in at turnstile (Attendance ID: {$checkin['attendance_id']})\n";

$ownerAfter = $service->getGymOwnerDashboard($ownerId, $gymId);
echo "    [3] Facility occupancy after check-in: {$ownerAfter['stats']['active_checkins']} active ({$ownerAfter['stats']['capacity_pct']}% capacity)\n";
assert($ownerAfter['stats']['active_checkins'] >= 1, "Facility occupancy must increment after turnstile check-in");

$trainerAfterAtt = $service->getTrainerDashboard($trainerId);
$targetAthleteInTrainer = null;
foreach ($trainerAfterAtt['athletes'] as $ath) {
    if ($ath['id'] == $memberId) $targetAthleteInTrainer = $ath;
}
echo "    [4] Trainer sees Member {$memberId} last attendance: {$targetAthleteInTrainer['last_attendance']}\n";
assert(!empty($targetAthleteInTrainer['last_attendance']), "Trainer must see member last attendance timestamp");
echo "    >>> WORKFLOW D PASSED!\n\n";

// -----------------------------------------------------------------------------
// WORKFLOW E: Trainer Notes & Feedback Visibility
// -----------------------------------------------------------------------------
echo "--> WORKFLOW E: Trainer Notes & Shared Feedback Visibility\n";
// Shared note
$sharedNote = $service->addTrainerNote($trainerId, $memberId, "Excellent bar speed on your bench press today. Target 82.5 kg next week.", 'workout_feedback', true);
echo "    [1] Trainer saved SHARED feedback (Note ID: {$sharedNote['note_id']})\n";

// Private note
$privateNote = $service->addTrainerNote($trainerId, $memberId, "Athlete experiencing mild fatigue after set 3. Monitor hydration.", 'general_observation', false);
echo "    [2] Trainer saved PRIVATE staff note (Note ID: {$privateNote['note_id']})\n";

$memberFeedback = $service->getUserDashboard($memberId)['feedback'];
echo "    [3] Member portal received " . count($memberFeedback) . " shared feedback note(s)\n";
$hasShared = false;
$hasPrivate = false;
foreach ($memberFeedback as $fb) {
    if ($fb['id'] == $sharedNote['note_id']) $hasShared = true;
    if ($fb['id'] == $privateNote['note_id']) $hasPrivate = true;
}
assert($hasShared === true, "Member MUST see shared feedback");
assert($hasPrivate === false, "Member MUST NEVER see private trainer notes");
echo "    [4] Verified: Shared note is visible to member; private staff note remains completely hidden from member!\n";
echo "    >>> WORKFLOW E PASSED!\n\n";

echo "========================================================\n";
echo "SUCCESS: ALL 5 CROSS-PORTAL WORKFLOWS VERIFIED 100% IN DB\n";
echo "========================================================\n";
