<?php
/**
 * FitSync AI — Coach: Portal Settings
 *
 * Maintains 100% visual consistency with the FitSync User Portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'Settings — FitSync AI Coach';
$activeNav = 'settings';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';

$flash = getFlash();
$msg = null;
$err = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrfToken();
    $current = (string)($_POST['current_password'] ?? '');
    $new = (string)($_POST['new_password'] ?? '');
    $confirm = (string)($_POST['confirm_password'] ?? '');

    if ($new !== $confirm) {
        $err = 'New passwords do not match.';
    } else {
        $res = changePassword((int)$_SESSION['user_id'], $current, $new);
        if ($res['success']) {
            $msg = $res['message'];
        } else {
            $err = $res['message'];
        }
    }
}
?>

<!-- Header Title -->
<div style="margin-bottom: 20px;">
  <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Coach Security & Account Settings</h2>
  <p style="font-size: 13px; color: var(--text-secondary);">Manage your authentication credentials, session security, and account preferences.</p>
</div>

<div class="fs-card" style="max-width: 600px;">
  <div class="card-header-row">
    <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
      <i data-lucide="shield" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
      Change Password
    </h3>
  </div>

  <?php if ($msg): ?>
    <div style="padding: 12px 16px; background: var(--light-green); color: var(--success-green); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; margin-bottom: 16px;">
      <i data-lucide="check-circle" style="width: 16px; height: 16px; vertical-align: -3px; margin-right: 6px;"></i>
      <?= e($msg) ?>
    </div>
  <?php endif; ?>

  <?php if ($err): ?>
    <div style="padding: 12px 16px; background: var(--light-pink); color: var(--pink); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; margin-bottom: 16px;">
      <i data-lucide="alert-circle" style="width: 16px; height: 16px; vertical-align: -3px; margin-right: 6px;"></i>
      <?= e($err) ?>
    </div>
  <?php endif; ?>

  <form method="POST" action="">
    <?= csrfField() ?>

    <div class="form-group">
      <label class="form-label" for="current_password">Current Password</label>
      <input type="password" id="current_password" name="current_password" class="form-input" required>
    </div>

    <div class="form-group">
      <label class="form-label" for="new_password">New Password</label>
      <input type="password" id="new_password" name="new_password" class="form-input" minlength="8" required>
    </div>

    <div class="form-group">
      <label class="form-label" for="confirm_password">Confirm New Password</label>
      <input type="password" id="confirm_password" name="confirm_password" class="form-input" minlength="8" required>
    </div>

    <button type="submit" class="btn-primary-block" style="width: auto; padding: 9px 20px;">
      <i data-lucide="key" style="width: 14px; height: 14px; margin-right: 6px;"></i>
      Update Password
    </button>
  </form>
</div>

<!-- Sign Out Card -->
<div class="fs-card" style="max-width: 600px; border-color: #FECDD3; background: #FFF1F2;">
  <div style="display: flex; align-items: center; justify-content: space-between;">
    <div>
      <strong style="color: #BE123C; font-size: 14px; display: block; margin-bottom: 2px;">Sign Out of FitSync</strong>
      <span style="font-size: 12px; color: #9F1239;">Terminate your active coaching session securely.</span>
    </div>
    <a href="<?= url('logout.php') ?>" class="fs-btn fs-btn-outline" style="border-color: #FDA4AF; color: #BE123C; background: #FFFFFF;">
      <i data-lucide="log-out" style="width: 14px; height: 14px;"></i>
      Sign Out
    </a>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
