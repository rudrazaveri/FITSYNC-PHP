<?php
/**
 * FitSync AI — Dedicated Gym Owner Portal Sidebar
 *
 * Uses the exact same visual structure, classes, styles, and Lucide icons as the User & Trainer Portals.
 */

declare(strict_types=1);

$activeNav = $activeNav ?? 'dashboard';
$coachesCount = $coachesCount ?? count(getGymCoaches());
$membersCount = $membersCount ?? count(getGymMembers());
?>
    <!-- Left Fixed Navigation Sidebar (245px) -->
    <aside class="sidebar" id="sidebarNav">
      <!-- Logo Branding -->
      <a class="sidebar-brand" href="<?= url('gym_owner/dashboard.php') ?>">
        <div class="brand-icon-box">
          <i data-lucide="building-2" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="brand-info">
          <h1>FitSync</h1>
          <p>Gym Facility Command</p>
        </div>
      </a>

      <!-- Facility Owner Profile Badge -->
      <div class="sidebar-user" title="Gym Owner Profile">
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0; cursor:pointer;" onclick="window.location.href='<?= url('gym_owner/settings.php') ?>'">
          <div style="width:36px; height:36px; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex-shrink:0;">
            <?= strtoupper(substr($owner['full_name'] ?? 'VS', 0, 2)) ?>
          </div>
          <div class="user-meta" style="min-width:0; overflow:hidden;">
            <h4 style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><?= e($owner['full_name'] ?? 'Facility Owner') ?></h4>
            <span style="font-size: 11px; color: var(--text-secondary);">Facility Owner • Admin</span>
          </div>
        </div>
        <a href="<?= url('logout.php') ?>" class="btn-sidebar-user-logout" title="Log Out">
          <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
        </a>
      </div>

      <!-- Navigation Links -->
      <nav class="sidebar-nav">
        <!-- 1. Dashboard -->
        <a class="sidebar-nav-item <?= $activeNav === 'dashboard' ? 'active' : '' ?>" href="<?= url('gym_owner/dashboard.php') ?>">
          <i data-lucide="layout-dashboard"></i>
          <span class="nav-label">Command Center</span>
        </a>

        <!-- 2. Coaches & Staff -->
        <a class="sidebar-nav-item <?= $activeNav === 'coaches' ? 'active' : '' ?>" href="<?= url('gym_owner/coaches.php') ?>">
          <i data-lucide="user-check"></i>
          <span class="nav-label">Coaches & Staff</span>
          <span class="nav-pill" id="sidebarBadgeCoaches"><?= $coachesCount ?></span>
        </a>

        <!-- 3. Registered Athletes & Assignments -->
        <a class="sidebar-nav-item <?= $activeNav === 'members' ? 'active' : '' ?>" href="<?= url('gym_owner/members.php') ?>">
          <i data-lucide="users"></i>
          <span class="nav-label">Athletes & Rosters</span>
          <span class="nav-pill" id="sidebarBadgeMembers"><?= $membersCount ?></span>
        </a>

        <!-- 4. Turnstile QR Logs -->
        <a class="sidebar-nav-item <?= $activeNav === 'attendance' ? 'active' : '' ?>" href="<?= url('gym_owner/attendance.php') ?>">
          <i data-lucide="qr-code"></i>
          <span class="nav-label">QR Check-in Logs</span>
        </a>

        <!-- 5. Facility Settings -->
        <a class="sidebar-nav-item <?= $activeNav === 'settings' ? 'active' : '' ?>" href="<?= url('gym_owner/settings.php') ?>">
          <i data-lucide="sliders"></i>
          <span class="nav-label">Facility Settings</span>
        </a>
      </nav>

      <!-- Sidebar Branch Footer -->
      <div style="padding: 16px; margin-top: auto; border-top: 1px solid var(--border-color); font-size: 11px; color: var(--text-muted); display:flex; align-items:center; gap:8px;">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981;"></span>
        <span><?= e($owner['gym_name'] ?? 'FitZone Fitness') ?></span>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="main-wrapper">
      <main class="dashboard-center">
