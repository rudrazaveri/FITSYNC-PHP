<?php
/**
 * FitSync AI — Dedicated Trainer Portal Header Component
 *
 * Maintains 100% visual identity with the FitSync User Portal.
 * Uses identical fonts, CSS variables, layout tokens, and Lucide icons.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../includes/trainer_data.php';

// Strict server-side role check
requireRole('trainer');

$coach = getTrainerProfile((int)$_SESSION['user_id']);
$pageTitle = $pageTitle ?? 'Coach Portal — FitSync AI';
$activeNav = $activeNav ?? 'dashboard';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e($pageTitle) ?></title>
  <link rel="icon" type="image/jpeg" href="<?= asset('assets/images/logo.jpg') ?>">

  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- Core FitSync Stylesheets (Identical to User Portal) -->
  <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
  <link rel="stylesheet" href="<?= asset('css/responsive.css') ?>">
  <link rel="stylesheet" href="<?= asset('css/trainer.css') ?>">

  <!-- Lucide Icons & Chart.js -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

  <!-- Mobile Top Header (Visible on screens <768px, identical to User Portal) -->
  <header class="mobile-top-bar">
    <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="window.location.href='<?= url('trainer/dashboard.php') ?>'">
      <div class="brand-icon-box" style="width: 32px; height: 32px;">
        <i data-lucide="activity" style="width: 18px; height: 18px;"></i>
      </div>
      <div>
        <strong style="font-size: 16px; color: var(--text-main);">FitSync</strong>
      </div>
    </div>
    <button class="mobile-menu-btn" id="mobileNavToggle" aria-label="Toggle navigation">
      <i data-lucide="menu" style="width: 24px; height: 24px;"></i>
    </button>
  </header>

  <!-- Sidebar Overlay for Mobile -->
  <div class="sidebar-overlay" id="sidebarOverlay"></div>

  <!-- Main Application Layout (Identical to User Portal) -->
  <div class="app-layout">
