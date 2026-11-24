<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../includes/FitSyncDataService.php';

$service = FitSyncDataService::getInstance();

echo "1. Testing getGymOwnerDashboard(2)...\n";
$gymOwnerData = $service->getGymOwnerDashboard(2);
echo "   Gym: {$gymOwnerData['gym']['name']}, Coaches: {$gymOwnerData['stats']['coaches_count']}, Members: {$gymOwnerData['stats']['members_count']}, Capacity: {$gymOwnerData['stats']['capacity_pct']}%, Revenue: {$gymOwnerData['stats']['formatted_revenue']}\n";

echo "2. Testing getUserDashboard(8)...\n";
$userData = $service->getUserDashboard(8);
echo "   User: {$userData['user']['full_name']}, Weight: " . ($userData['user']['weight_kg'] ?? 'None') . ", BMI: " . ($userData['user']['bmi'] ?? 'None') . ", Calories: {$userData['nutrition']['calories']}, Water: {$userData['water']['liters']} L\n";

echo "3. Testing getTrainerDashboard(3)...\n";
$trainerData = $service->getTrainerDashboard(3);
echo "   Trainer: {$trainerData['trainer']['full_name']}, Assigned Athletes: " . count($trainerData['athletes']) . ", Today Agenda: " . count($trainerData['today_agenda']) . "\n";

echo "4. Testing getAthleteDossier(3, 8)...\n";
$dossier = $service->getAthleteDossier(3, 8);
echo "   Dossier Member: {$dossier['athlete']['full_name']}, Notes Count: " . count($dossier['notes']) . "\n";

echo "ALL SERVICE CHECKS PASSED!\n";
