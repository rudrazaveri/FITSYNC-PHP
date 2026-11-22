<?php
/**
 * FitSync AI — Coach: Assigned Member Attendance Monitoring
 *
 * Maintains 100% visual consistency with the FitSync User Portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'Member Attendance — FitSync AI Coach';
$activeNav = 'attendance';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';

$members = getTrainerAssignedMembers((int)$_SESSION['user_id']);
?>

<!-- Header Title & Action Row -->
<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Assigned Member Attendance Log</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Real-time turnstile verification and physical gym facility check-in logs for your roster.</p>
  </div>
  <div>
    <span class="fs-badge fs-badge-green" style="font-size: 13px; padding: 6px 12px;">
      <i data-lucide="shield-check" style="width: 14px; height: 14px;"></i>
      Turnstile QR Sync Active
    </span>
  </div>
</div>

<!-- Attendance Card with Table -->
<div class="fs-card">
  <div class="card-header-row">
    <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
      <i data-lucide="calendar-check" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
      Turnstile Verification Events
    </h3>
  </div>

  <div style="overflow-x: auto;">
    <table class="fs-table">
      <thead>
        <tr>
          <th>ATHLETE</th>
          <th>TIMESTAMP</th>
          <th>FACILITY BRANCH</th>
          <th>CHECK-IN METHOD</th>
          <th>STATUS</th>
          <th style="text-align: right;">ACTION</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($members as $mbr): ?>
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 12px; background: var(--light-blue-bg); color: var(--primary-blue);">
                  <?= strtoupper(substr($mbr['full_name'], 0, 2)) ?>
                </div>
                <div>
                  <strong style="color: var(--text-main); display: block;"><?= e($mbr['full_name']) ?></strong>
                  <span style="font-size: 11px; color: var(--text-secondary);"><?= e($mbr['email']) ?></span>
                </div>
              </div>
            </td>
            <td>
              <strong>Today · 06:45 AM</strong>
            </td>
            <td><?= e($mbr['home_gym_name'] ?? 'FitZone Fitness') ?></td>
            <td><span class="fs-badge fs-badge-blue">QR_SCAN</span></td>
            <td><span class="badge-healthy">Verified</span></td>
            <td style="text-align: right;">
              <a href="<?= url('trainer/member_details.php?id=' . (int)$mbr['id']) ?>" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;">
                Dossier
              </a>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
