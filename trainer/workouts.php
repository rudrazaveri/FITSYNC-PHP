<?php
/**
 * FitSync AI — Coach: Workout Plans Overview
 *
 * Maintains 100% visual consistency with the FitSync User Portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'Workout Plans — FitSync AI Coach';
$activeNav = 'workouts';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';

$members = getTrainerAssignedMembers((int)$_SESSION['user_id']);
?>

<!-- Header Title & Action Row -->
<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Workout Plans & Prescriptions</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Manage training splits, assign routines, and review member workout volume.</p>
  </div>
  <div>
    <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 16px;" onclick="alert('Workout Builder Wizard will be available in Phase 4.');">
      <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 6px;"></i>
      Create New Plan
    </button>
  </div>
</div>

<!-- Plan Templates Card -->
<div class="fs-card" style="margin-bottom: 22px;">
  <div class="card-header-row">
    <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
      <i data-lucide="dumbbell" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
      Active Prescription Templates
    </h3>
  </div>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
    
    <!-- Template 1 -->
    <div style="padding: 16px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Hypertrophy 4-Day Split</h4>
        <span class="fs-badge fs-badge-blue">Intermediate</span>
      </div>
      <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">Upper/Lower body split focused on mechanical tension and metabolic stress for hypertrophy.</p>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
        <span>4 Days / Week</span>
        <span>2 Athletes Assigned</span>
      </div>
    </div>

    <!-- Template 2 -->
    <div style="padding: 16px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Push / Pull / Legs (PPL)</h4>
        <span class="fs-badge fs-badge-green">Advanced</span>
      </div>
      <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">High frequency 6-day rotation targeting compound strength lifts and accessory volume.</p>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
        <span>6 Days / Week</span>
        <span>1 Athlete Assigned</span>
      </div>
    </div>

    <!-- Template 3 -->
    <div style="padding: 16px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Conditioning & Mobility</h4>
        <span class="fs-badge fs-badge-orange">Beginner</span>
      </div>
      <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">Foundational aerobic base building, core stability, and post-injury structural restoration.</p>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
        <span>3 Days / Week</span>
        <span>Active Template</span>
      </div>
    </div>

  </div>
</div>

<!-- Plan Assignment Roster Table -->
<div class="fs-card">
  <div class="card-header-row">
    <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
      <i data-lucide="clipboard-list" style="width: 18px; height: 18px; color: var(--primary-blue);"></i>
      Athlete Plan Assignments
    </h3>
  </div>

  <div style="overflow-x: auto;">
    <table class="fs-table">
      <thead>
        <tr>
          <th>ATHLETE</th>
          <th>ACTIVE PRESCRIBED PLAN</th>
          <th>DIFFICULTY</th>
          <th>START DATE</th>
          <th>ADHERENCE</th>
          <th style="text-align: right;">ACTION</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($members as $mbr): ?>
          <tr>
            <td>
              <strong style="color: var(--text-main);"><?= e($mbr['full_name']) ?></strong>
              <span style="font-size: 11px; color: var(--text-secondary); display: block;"><?= e($mbr['email']) ?></span>
            </td>
            <td>
              <span class="fs-badge fs-badge-blue">Push / Pull / Legs</span>
            </td>
            <td>Intermediate</td>
            <td>Nov 01, 2026</td>
            <td><span class="badge-healthy">92% Compliance</span></td>
            <td style="text-align: right;">
              <a href="<?= url('trainer/member_details.php?id=' . (int)$mbr['id']) ?>" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;">
                Review Sessions
              </a>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
