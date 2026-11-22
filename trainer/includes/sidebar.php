<?php
/**
 * FitSync AI — Dedicated Trainer Portal Sidebar
 *
 * Uses the exact same visual structure, classes, styles, and Lucide icons as the User Portal.
 * Follows Section 4 of the FitSync specification.
 */

declare(strict_types=1);

$activeNav = $activeNav ?? 'dashboard';
?>
    <!-- 1. Left Fixed Navigation Sidebar (245px) -->
    <aside class="sidebar" id="sidebarNav">
      <!-- Logo Branding (Clicking returns to Dashboard) -->
      <a class="sidebar-brand" href="<?= url('trainer/dashboard.php') ?>">
        <div class="brand-icon-box">
          <i data-lucide="activity" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="brand-info">
          <h1>FitSync</h1>
          <p>Fitness · Gym · Healthcare</p>
        </div>
      </a>

      <!-- User Profile Badge (Clicking navigates to Settings) -->
      <div class="sidebar-user" title="View Settings & Profile">
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0; cursor:pointer;" onclick="window.location.href='<?= url('trainer/settings.php') ?>'">
          <img src="<?= e($coach['profile_picture'] ?? 'assets/images/trainer_raj.jpg') ?>" class="user-avatar-circle" alt="CR" onerror="this.outerHTML='<div class=\'user-avatar-circle\'>CR</div>'">
          <div class="user-meta" style="min-width:0; overflow:hidden;">
            <h4 style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><?= e($coach['full_name'] ?? 'Coach Raj') ?></h4>
            <span style="font-size: 11px; color: var(--text-secondary);">Trainer · Certified</span>
          </div>
        </div>
        <a href="<?= url('logout.php') ?>" class="btn-sidebar-user-logout" title="Log Out">
          <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
        </a>
      </div>

      <!-- 9 Ordered Navigation Links for Trainer Portal (PRD Section 4) -->
      <nav class="sidebar-nav">
        <!-- 1. Dashboard -->
        <a class="sidebar-nav-item <?= $activeNav === 'dashboard' ? 'active' : '' ?>" href="<?= url('trainer/dashboard.php') ?>">
          <i data-lucide="layout-dashboard"></i>
          <span class="nav-label">Dashboard</span>
        </a>

        <!-- 2. My Members -->
        <a class="sidebar-nav-item <?= $activeNav === 'members' ? 'active' : '' ?>" href="<?= url('trainer/members.php') ?>">
          <i data-lucide="users"></i>
          <span class="nav-label">My Members</span>
        </a>

        <!-- 3. Workout Plans -->
        <a class="sidebar-nav-item <?= $activeNav === 'workouts' ? 'active' : '' ?>" href="<?= url('trainer/workouts.php') ?>">
          <i data-lucide="dumbbell"></i>
          <span class="nav-label">Workout Plans</span>
        </a>

        <!-- 4. Exercise Library -->
        <a class="sidebar-nav-item <?= $activeNav === 'exercise_library' ? 'active' : '' ?>" href="<?= url('trainer/exercise_library.php') ?>">
          <i data-lucide="book-open"></i>
          <span class="nav-label">Exercise Library</span>
        </a>

        <!-- 5. Schedule -->
        <a class="sidebar-nav-item <?= $activeNav === 'schedule' ? 'active' : '' ?>" href="<?= url('trainer/schedule.php') ?>">
          <i data-lucide="calendar"></i>
          <span class="nav-label">Schedule</span>
        </a>

        <!-- 6. Attendance -->
        <a class="sidebar-nav-item <?= $activeNav === 'attendance' ? 'active' : '' ?>" href="<?= url('trainer/attendance.php') ?>">
          <i data-lucide="calendar-check"></i>
          <span class="nav-label">Attendance</span>
        </a>

        <!-- 7. Progress Monitoring -->
        <a class="sidebar-nav-item <?= $activeNav === 'progress' ? 'active' : '' ?>" href="<?= url('trainer/members.php?tab=progress') ?>">
          <i data-lucide="trending-up"></i>
          <span class="nav-label">Progress Monitoring</span>
        </a>

        <!-- 8. Messages -->
        <a class="sidebar-nav-item <?= $activeNav === 'messages' ? 'active' : '' ?>" href="<?= url('trainer/messages.php') ?>">
          <i data-lucide="message-square"></i>
          <span class="nav-label">Messages</span>
        </a>

        <!-- 9. Settings -->
        <a class="sidebar-nav-item <?= $activeNav === 'settings' ? 'active' : '' ?>" href="<?= url('trainer/settings.php') ?>">
          <i data-lucide="settings"></i>
          <span class="nav-label">Settings</span>
        </a>
      </nav>
    </aside>

    <!-- 2. Main Application Wrapper (Central Content) -->
    <div class="main-wrapper">
      <main class="dashboard-center">
