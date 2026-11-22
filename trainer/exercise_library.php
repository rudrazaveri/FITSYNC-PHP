<?php
/**
 * FitSync AI — Coach: Exercise Library & Biomechanics Reference
 *
 * Maintains 100% visual consistency with the FitSync User Portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'Exercise Library — FitSync AI Coach';
$activeNav = 'exercise_library';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';

$exercises = [
    ['code' => 'bench_press', 'name' => 'Barbell Bench Press', 'muscle' => 'Chest (Pectoralis Major)', 'type' => 'Compound', 'difficulty' => 'Intermediate', 'equipment' => 'Barbell, Flat Bench'],
    ['code' => 'back_squat', 'name' => 'Barbell Back Squat', 'muscle' => 'Quadriceps, Glutes', 'type' => 'Compound', 'difficulty' => 'Advanced', 'equipment' => 'Barbell, Squat Rack'],
    ['code' => 'deadlift', 'name' => 'Conventional Deadlift', 'muscle' => 'Hamstrings, Erector Spinae', 'type' => 'Compound', 'difficulty' => 'Advanced', 'equipment' => 'Barbell, Olympic Plates'],
    ['code' => 'lat_pulldown', 'name' => 'Wide-Grip Lat Pulldown', 'muscle' => 'Latissimus Dorsi, Biceps', 'type' => 'Compound', 'difficulty' => 'Beginner', 'equipment' => 'Cable Lat Machine'],
    ['code' => 'overhead_press', 'name' => 'Overhead Barbell Press', 'muscle' => 'Anterior Deltoids, Triceps', 'type' => 'Compound', 'difficulty' => 'Intermediate', 'equipment' => 'Barbell'],
    ['code' => 'barbell_curl', 'name' => 'Standing Barbell Bicep Curl', 'muscle' => 'Biceps Brachii', 'type' => 'Isolation', 'difficulty' => 'Beginner', 'equipment' => 'Barbell'],
    ['code' => 'tricep_pushdown', 'name' => 'Cable Rope Tricep Pushdown', 'muscle' => 'Triceps Brachii', 'type' => 'Isolation', 'difficulty' => 'Beginner', 'equipment' => 'Cable Machine, Rope Attachment'],
    ['code' => 'bulgarian_split_squat', 'name' => 'Bulgarian Split Squat', 'muscle' => 'Quadriceps, Gluteus Medius', 'type' => 'Compound', 'difficulty' => 'Intermediate', 'equipment' => 'Dumbbells, Bench'],
    ['code' => 'romanian_deadlift', 'name' => 'Romanian Deadlift (RDL)', 'muscle' => 'Hamstrings, Gluteus Maximus', 'type' => 'Compound', 'difficulty' => 'Intermediate', 'equipment' => 'Barbell or Dumbbells'],
    ['code' => 'face_pull', 'name' => 'Cable Face Pull', 'muscle' => 'Rear Deltoids, Rotator Cuff', 'type' => 'Isolation', 'difficulty' => 'Beginner', 'equipment' => 'Cable Machine, Rope Attachment']
];
?>

<!-- Header Title & Action Row -->
<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Exercise Biomechanics Library</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Anatomically verified movements, kinetic chains, and coaching cues.</p>
  </div>
  <div>
    <span class="fs-badge fs-badge-blue" style="font-size: 13px; padding: 6px 12px;">
      <i data-lucide="book-open" style="width: 14px; height: 14px;"></i>
      38 Verified Movements
    </span>
  </div>
</div>

<!-- Search Bar (Exact match to User Portal) -->
<div class="filter-search-bar">
  <div class="search-input-box" style="flex: 1;">
    <i data-lucide="search"></i>
    <input type="text" id="exerciseSearch" placeholder="Search exercises by name, targeted muscle, or kinetic category...">
  </div>
</div>

<!-- Exercise Cards Grid -->
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
  <?php foreach ($exercises as $ex): ?>
    <div class="fs-card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);"><?= e($ex['name']) ?></h4>
          <span class="fs-badge fs-badge-blue"><?= e($ex['type']) ?></span>
        </div>

        <div style="margin-bottom: 12px;">
          <span style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 2px;">TARGET MUSCLES</span>
          <strong style="font-size: 13px; color: var(--primary-blue);"><?= e($ex['muscle']) ?></strong>
        </div>

        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
          <span>Equipment: <strong><?= e($ex['equipment']) ?></strong></span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border-color);">
        <span class="fs-badge fs-badge-gray"><?= e($ex['difficulty']) ?></span>
        <button type="button" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;" onclick="alert('Biomechanical coaching cues for <?= e($ex['name']) ?>');">
          Coaching Cues
        </button>
      </div>
    </div>
  <?php endforeach; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
