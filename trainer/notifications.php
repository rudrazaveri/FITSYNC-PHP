<?php
/**
 * FitSync AI — Coach: Notifications Feed
 *
 * Maintains 100% visual consistency with the FitSync User Portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'Notifications — FitSync AI Coach';
$activeNav = 'notifications';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<!-- Header Title & Action Row -->
<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Coach Alert & Notification Stream</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Real-time alerts regarding session bookings, athlete milestones, and compliance warnings.</p>
  </div>
  <div>
    <span class="fs-badge fs-badge-blue" style="font-size: 13px; padding: 6px 12px;">
      <i data-lucide="bell" style="width: 14px; height: 14px;"></i>
      3 Unread Alerts
    </span>
  </div>
</div>

<div class="fs-card">
  <div class="card-header-row">
    <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
      <i data-lucide="bell" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
      Recent Notifications
    </h3>
  </div>

  <div style="display: flex; flex-direction: column; gap: 12px;">
    
    <!-- Notification 1 -->
    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
      <div class="stat-icon-box stat-icon-blue" style="width: 34px; height: 34px;">
        <i data-lucide="calendar-plus" style="width: 16px; height: 16px;"></i>
      </div>
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 14px; color: var(--text-main);">New PT Session Booked</strong>
          <span style="font-size: 11px; color: var(--text-muted);">20 mins ago</span>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 0;">
          Aarav Patel booked a 60-minute Strength & Hypertrophy session for Friday at 05:00 PM.
        </p>
      </div>
    </div>

    <!-- Notification 2 -->
    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
      <div class="stat-icon-box stat-icon-pink" style="width: 34px; height: 34px;">
        <i data-lucide="award" style="width: 16px; height: 16px;"></i>
      </div>
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 14px; color: var(--text-main);">Athlete Milestone Achieved</strong>
          <span style="font-size: 11px; color: var(--text-muted);">2 hours ago</span>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 0;">
          Ritika Sharma completed 12 consecutive workout sessions this month with a 95% adherence rate!
        </p>
      </div>
    </div>

    <!-- Notification 3 -->
    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
      <div class="stat-icon-box stat-icon-orange" style="width: 34px; height: 34px;">
        <i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i>
      </div>
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 14px; color: var(--text-main);">Inactivity Warning</strong>
          <span style="font-size: 11px; color: var(--text-muted);">1 day ago</span>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 0;">
          Isha Kulkarni has not logged a workout session in 4 days. Consider sending a motivational check-in.
        </p>
      </div>
    </div>

  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
