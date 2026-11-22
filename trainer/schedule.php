<?php
/**
 * FitSync AI — Coach: Schedule & Session Management (PRD Section 12)
 *
 * Maintains 100% visual consistency with the FitSync User Portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'Training Schedule — FitSync AI Coach';
$activeNav = 'schedule';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';

$schedule = getTrainerSchedule((int)$_SESSION['user_id']);
$rules = $schedule['rules'] ?? [];
$sessions = $schedule['sessions'] ?? [];

$daysOfWeek = [
    0 => 'Sunday',
    1 => 'Monday',
    2 => 'Tuesday',
    3 => 'Wednesday',
    4 => 'Thursday',
    5 => 'Friday',
    6 => 'Saturday'
];
?>

<!-- Header Title & Action Row -->
<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Schedule & Session Management</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Manage weekly working shifts, athlete booking slots, and one-on-one personal training sessions.</p>
  </div>
  <div>
    <span class="fs-badge fs-badge-blue" style="font-size: 13px; padding: 6px 12px;">
      <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
      Weekly Availability Rules Active
    </span>
  </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 22px;">

  <!-- Panel 1: Scheduled Personal Training Sessions -->
  <div class="fs-card" style="margin-bottom: 0;">
    <div class="card-header-row">
      <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
        <i data-lucide="calendar" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
        Personal Training Sessions (<?= count($sessions) ?>)
      </h3>
    </div>

    <?php if (empty($sessions)): ?>
      <div style="text-align: center; padding: 32px 16px; color: var(--text-secondary);">
        <i data-lucide="calendar-x" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 8px;"></i>
        <p style="font-size: 13px; font-weight: 500;">No upcoming training sessions booked.</p>
        <p style="font-size: 11px; color: var(--text-muted);">Assigned athletes can book slots based on your availability.</p>
      </div>
    <?php else: ?>
      <div class="schedule-list">
        <?php foreach ($sessions as $sess): ?>
          <div class="schedule-item">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="schedule-time-box">
                <strong><?= date('h:i A', strtotime($sess['start_time'])) ?></strong>
                <span><?= date('M d', strtotime($sess['session_date'])) ?></span>
              </div>
              <div>
                <strong style="color: var(--text-main); font-size: 14px; display: block;">
                  <?= e($sess['member_name'] ?? 'Athlete') ?>
                </strong>
                <span style="font-size: 12px; color: var(--text-secondary); display: block;">
                  <?= e($sess['session_type'] ?? 'Personal Training') ?> · <?= e($sess['gym_name'] ?? 'FitZone') ?>
                </span>
                <?php if (!empty($sess['session_notes'])): ?>
                  <span style="font-size: 11px; color: var(--primary-blue);">
                    <i data-lucide="info" style="width: 11px; height: 11px; vertical-align: -1px;"></i>
                    <?= e($sess['session_notes']) ?>
                  </span>
                <?php endif; ?>
              </div>
            </div>
            <div>
              <span class="<?= $sess['status'] === 'completed' ? 'badge-active' : 'fs-badge fs-badge-blue' ?>">
                <?= e(ucfirst($sess['status'])) ?>
              </span>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>

  <!-- Panel 2: Weekly Working Shifts & Availability -->
  <div class="fs-card" style="margin-bottom: 0;">
    <div class="card-header-row">
      <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
        <i data-lucide="calendar-range" style="width: 18px; height: 18px; color: var(--success-green);"></i>
        Weekly Facility Shifts
      </h3>
    </div>

    <?php if (empty($rules)): ?>
      <p style="font-size: 13px; color: var(--text-secondary);">No recurring shifts configured.</p>
    <?php else: ?>
      <div style="overflow-x: auto;">
        <table class="fs-table">
          <thead>
            <tr>
              <th>DAY</th>
              <th>HOURS</th>
              <th>MAX CLIENTS</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($rules as $r): ?>
              <tr>
                <td><strong><?= $daysOfWeek[$r['day_of_week']] ?? 'Day ' . $r['day_of_week'] ?></strong></td>
                <td><?= date('h:i A', strtotime($r['start_time'])) ?> – <?= date('h:i A', strtotime($r['end_time'])) ?></td>
                <td><?= (int)$r['max_concurrent_sessions'] ?> slot(s)</td>
                <td>
                  <span class="<?= $r['is_available'] ? 'badge-active' : 'fs-badge fs-badge-gray' ?>">
                    <?= $r['is_available'] ? 'Working' : 'Off' ?>
                  </span>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </div>

</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
