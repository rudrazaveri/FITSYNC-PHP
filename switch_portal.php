<?php
/**
 * FitSync AI — Universal Cross-Portal Switcher
 * Allows instant, seamless switching between Gym Owner, Trainer, and Member portals
 * on the unified single port.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';
initSecureSession();

$portal = strtolower(trim($_GET['to'] ?? 'member'));

if ($portal === 'gym_owner' || $portal === 'owner') {
    $_SESSION['role'] = 'gym_owner';
    $_SESSION['user_id'] = 2; // Priya Sharma (FitZone Owner)
    $_SESSION['full_name'] = 'Priya Sharma (FitZone Owner)';
    header('Location: gym_owner/index.html');
    exit;
} elseif ($portal === 'trainer' || $portal === 'coach') {
    $_SESSION['role'] = 'trainer';
    $_SESSION['user_id'] = 3; // Coach Raj Malhotra
    $_SESSION['full_name'] = 'Coach Raj Malhotra';
    header('Location: trainer/index.html');
    exit;
} else {
    $_SESSION['role'] = 'user';
    $_SESSION['user_id'] = 8; // Aarav Patel
    $_SESSION['full_name'] = 'Aarav Patel';
    header('Location: index.html');
    exit;
}
