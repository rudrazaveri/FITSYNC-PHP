<?php
/**
 * FitSync AI — Coach Workspace: My Assigned Members
 *
 * Maintains 100% visual consistency with the FitSync User Portal.
 * Features search, goal filtering, biometric summaries, and quick dossier links.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'My Members — Coach Workspace';
$activeNav = 'members';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';

$trainerId = (int)$_SESSION['user_id'];
$members = getTrainerAssignedMembers($trainerId);
?>

<!-- Header Title & Action Row -->
<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">My Assigned Members</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Oversee active coaching rosters, monitor compliance, and access full athletic dossiers.</p>
  </div>
  <div>
    <span class="fs-badge fs-badge-blue" style="font-size: 13px; padding: 6px 12px;">
      <i data-lucide="users" style="width: 14px; height: 14px;"></i>
      <?= count($members) ?> Total Assigned
    </span>
  </div>
</div>

<!-- Search & Filtering Controls (Exact match to User Portal .filter-search-bar) -->
<div class="filter-search-bar">
  <div class="search-input-box" style="flex: 1; min-width: 260px;">
    <i data-lucide="search"></i>
    <input type="text" id="memberSearchInput" placeholder="Search athletes by name, email, or keywords...">
  </div>

  <select id="goalFilterSelect" class="form-select" style="width: auto; min-width: 180px;">
    <option value="">All Fitness Goals</option>
    <option value="muscle_hypertrophy">Muscle Hypertrophy</option>
    <option value="fat_loss">Fat Loss & Leaning</option>
    <option value="strength">Strength & Power</option>
    <option value="endurance">Cardiovascular Endurance</option>
  </select>
</div>

<!-- Member Cards Grid -->
<?php if (empty($members)): ?>
  <div class="fs-card" style="text-align: center; padding: 48px 24px;">
    <i data-lucide="user-x" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;"></i>
    <h3 style="font-size: 16px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">No Athletes Assigned</h3>
    <p style="font-size: 13px; color: var(--text-secondary); max-width: 400px; margin: 0 auto;">
      You currently do not have any members assigned to your roster. Once the gym administrator or athlete assigns you, they will appear here.
    </p>
  </div>
<?php else: ?>
  <div class="member-grid">
    <?php foreach ($members as $m): 
      $days = (int)($m['days_since_workout'] ?? 0);
      $goalRaw = strtolower((string)($m['primary_goal'] ?? ''));
    ?>
      <div class="fs-card member-card member-item" 
           data-name="<?= e(strtolower($m['full_name'])) ?>" 
           data-email="<?= e(strtolower($m['email'])) ?>"
           data-goal="<?= e($goalRaw) ?>">
        
        <div>
          <!-- Card Header: Avatar & Name -->
          <div class="member-card-header">
            <div class="member-avatar">
              <?= strtoupper(substr($m['full_name'], 0, 2)) ?>
            </div>
            <div class="member-meta" style="flex: 1; min-width: 0;">
              <h4 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><?= e($m['full_name']) ?></h4>
              <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><?= e($m['email']) ?></p>
            </div>
            <div>
              <?php if ($days === 0): ?>
                <span class="badge-active">Active</span>
              <?php elseif ($days >= 3): ?>
                <span class="fs-badge fs-badge-orange"><?= $days ?>d off</span>
              <?php else: ?>
                <span class="fs-badge fs-badge-green"><?= $days ?>d ago</span>
              <?php endif; ?>
            </div>
          </div>

          <!-- Goal & Branch Badges -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
            <span class="fs-badge fs-badge-blue">
              <?= e(ucwords(str_replace('_', ' ', $m['primary_goal'] ?? 'General Fitness'))) ?>
            </span>
            <span class="fs-badge fs-badge-gray">
              <?= e($m['home_gym_name'] ?? 'FitZone') ?>
            </span>
          </div>

          <!-- Biometrics Stat Row -->
          <div class="member-stats-row">
            <div class="member-stat-col">
              <span>WEIGHT</span>
              <strong><?= $m['weight_kg'] ? number_format((float)$m['weight_kg'], 1) . ' kg' : '—' ?></strong>
            </div>
            <div class="member-stat-col">
              <span>HEIGHT</span>
              <strong><?= $m['height_cm'] ? (int)$m['height_cm'] . ' cm' : '—' ?></strong>
            </div>
            <div class="member-stat-col">
              <span>EXP</span>
              <strong><?= e($m['fitness_experience'] ?? 'Inter') ?></strong>
            </div>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <a href="<?= url('trainer/member_details.php?id=' . (int)$m['id']) ?>" class="fs-btn fs-btn-primary" style="flex: 1;">
            <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
            Open Dossier
          </a>
          <a href="<?= url('trainer/messages.php?user_id=' . (int)$m['id']) ?>" class="fs-btn fs-btn-outline" title="Send Message">
            <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
          </a>
        </div>

      </div>
    <?php endforeach; ?>
  </div>
<?php endif; ?>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
