<?php
/**
 * FitSync AI — Coach: Profile & Credentials
 *
 * Maintains 100% visual consistency with the FitSync User Portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'Coach Profile — FitSync AI Coach';
$activeNav = 'profile';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<!-- Header Title -->
<div style="margin-bottom: 20px;">
  <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Coach Profile & Credentials</h2>
  <p style="font-size: 13px; color: var(--text-secondary);">Manage professional certifications, client-facing bio, and personal training specializations.</p>
</div>

<div class="fs-card" style="max-width: 800px;">
  
  <!-- Profile Avatar Row -->
  <div style="display: flex; gap: 18px; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
    <div class="user-avatar-circle" style="width: 72px; height: 72px; font-size: 24px; font-weight: 700; background: var(--light-blue-bg); color: var(--primary-blue);">
      <?= strtoupper(substr($coach['full_name'] ?? 'CR', 0, 2)) ?>
    </div>
    <div>
      <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;"><?= e($coach['full_name'] ?? 'Coach Raj') ?></h3>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;"><?= e($coach['email'] ?? 'coach@fitsync.health') ?></p>
      <span class="badge-active">Certified Strength & Conditioning Specialist (CSCS)</span>
    </div>
  </div>

  <!-- Profile Details Form -->
  <form onsubmit="event.preventDefault(); alert('Profile updated successfully!');">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-input" value="<?= e($coach['full_name'] ?? 'Raj Coach') ?>" readonly>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">Email Address</label>
        <input type="email" class="form-input" value="<?= e($coach['email'] ?? 'coach@fitsync.health') ?>" readonly>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">Primary Certification</label>
        <input type="text" class="form-input" value="<?= e($coach['certification_name'] ?? 'CSCS - Certified Strength & Conditioning Specialist') ?>" readonly>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">Certifying Body</label>
        <input type="text" class="form-input" value="<?= e($coach['certifying_body'] ?? 'NSCA') ?>" readonly>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">Experience (Years)</label>
        <input type="text" class="form-input" value="<?= (int)($coach['experience_years'] ?? 8) ?> Years" readonly>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">Hourly Coaching Rate (INR)</label>
        <input type="text" class="form-input" value="₹<?= number_format((float)($coach['hourly_rate'] ?? 2500)) ?> / hour" readonly>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Professional Bio & Coaching Philosophy</label>
      <textarea class="form-textarea" rows="4" readonly><?= e($coach['bio'] ?? 'Dedicated strength and conditioning specialist focused on evidence-based progressive overload, injury prevention, and athletic performance.') ?></textarea>
    </div>

    <button type="submit" class="btn-primary-block" style="width: auto; padding: 9px 20px;">
      <i data-lucide="check" style="width: 14px; height: 14px; margin-right: 6px;"></i>
      Update Credentials
    </button>
  </form>

</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
