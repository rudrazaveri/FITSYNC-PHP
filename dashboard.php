<?php
/**
 * FitSync AI — Member Dashboard
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/session.php';

// Auto demo-login for developer ease if visiting dashboard directly
if (!isLoggedIn()) {
    setCurrentUser([
        'id' => '00000000-0000-0000-0000-000000000001',
        'full_name' => 'Aarav Patel',
        'email' => 'aarav.patel@fitsync.ai',
        'role' => 'member',
        'avatar_url' => asset('assets/aarav.jpg')
    ]);
}

$user = getCurrentUser();
$pageTitle = 'Member Dashboard';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-4">
  <!-- Top Profile Header Banner -->
  <div class="fitness-card p-4 mb-4">
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
      <div class="d-flex align-items-center gap-3">
        <img src="<?= asset('assets/aarav.jpg') ?>" alt="Avatar" width="64" height="64" class="rounded-circle border border-success p-1" onerror="this.src='<?= asset('assets/logo.jpg') ?>'">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h4 class="text-white fw-bold mb-0">Hello, <?= htmlspecialchars($user['full_name']) ?>!</h4>
            <span class="badge bg-success-subtle text-success">PRO ATHLETE</span>
          </div>
          <p class="text-secondary small mb-0 mt-1">
            <i class="bi bi-geo-alt-fill text-danger me-1"></i> FitSync Prime Arena, Central Sector • Gold Membership
          </p>
        </div>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <a href="<?= url('workouts.php') ?>" class="btn btn-fitness btn-sm px-3">
          <i class="bi bi-play-fill"></i> Start Today's Workout
        </a>
        <a href="<?= url('attendance.php') ?>" class="btn btn-outline-light btn-sm px-3">
          <i class="bi bi-qr-code"></i> Check-in Pass
        </a>
      </div>
    </div>
  </div>

  <!-- Metric Quick Cards (Row of 4) -->
  <div class="row g-3 mb-4">
    <div class="col-sm-6 col-lg-3">
      <div class="fitness-card p-3 h-100">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-secondary small">Calories Remaining</span>
          <span class="stat-icon bg-success-subtle text-success" style="width: 36px; height: 36px; font-size: 18px;"><i class="bi bi-fire"></i></span>
        </div>
        <div class="fs-4 fw-bold text-white">550 <span class="fs-6 text-secondary fw-normal">/ 2,400 kcal</span></div>
        <div class="progress mt-2" style="height: 6px;">
          <div class="progress-bar bg-success" style="width: 77%"></div>
        </div>
      </div>
    </div>

    <div class="col-sm-6 col-lg-3">
      <div class="fitness-card p-3 h-100">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-secondary small">Protein Ingested</span>
          <span class="stat-icon bg-info-subtle text-info" style="width: 36px; height: 36px; font-size: 18px;"><i class="bi bi-egg-fried"></i></span>
        </div>
        <div class="fs-4 fw-bold text-white">128g <span class="fs-6 text-secondary fw-normal">/ 165g target</span></div>
        <div class="progress mt-2" style="height: 6px;">
          <div class="progress-bar bg-info" style="width: 78%"></div>
        </div>
      </div>
    </div>

    <div class="col-sm-6 col-lg-3">
      <div class="fitness-card p-3 h-100">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-secondary small">Current Streak</span>
          <span class="stat-icon bg-warning-subtle text-warning" style="width: 36px; height: 36px; font-size: 18px;"><i class="bi bi-lightning-charge-fill"></i></span>
        </div>
        <div class="fs-4 fw-bold text-warning">5 Days <span class="fs-6 text-secondary fw-normal">In a row</span></div>
        <span class="text-secondary" style="font-size: 11px;">Next badge at 7-day milestone</span>
      </div>
    </div>

    <div class="col-sm-6 col-lg-3">
      <div class="fitness-card p-3 h-100">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-secondary small">Monthly Check-Ins</span>
          <span class="stat-icon bg-primary-subtle text-primary" style="width: 36px; height: 36px; font-size: 18px;"><i class="bi bi-calendar2-check"></i></span>
        </div>
        <div class="fs-4 fw-bold text-white">18 Days <span class="fs-6 text-secondary fw-normal">/ 22 Target</span></div>
        <span class="text-success small" style="font-size: 11px;"><i class="bi bi-arrow-up"></i> 91% consistency</span>
      </div>
    </div>
  </div>

  <!-- Main Body Grid: 2 Columns -->
  <div class="row g-4">
    <!-- Left Column: Today's Routine & Exercise Sets -->
    <div class="col-lg-8">
      <div class="fitness-card p-4 mb-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div>
            <span class="badge bg-success-subtle text-success small mb-1">PROGRAMMED TODAY</span>
            <h5 class="text-white fw-bold mb-0">Push Hypertrophy: Chest, Delts & Triceps</h5>
          </div>
          <span class="text-secondary small"><i class="bi bi-clock me-1"></i> 55 Mins</span>
        </div>

        <div class="bg-dark p-3 rounded-3 border border-secondary border-opacity-25 mb-3">
          <div class="d-flex align-items-center gap-3">
            <img src="<?= asset('assets/bench_press.jpg') ?>" alt="Bench Press" class="rounded-3 border border-secondary" width="70" height="70" style="object-fit: cover;" onerror="this.src='<?= asset('assets/logo.jpg') ?>'">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between">
                <h6 class="text-white fw-bold mb-1">Barbell Incline Bench Press</h6>
                <span class="badge bg-dark border border-secondary text-secondary">Primary Compound</span>
              </div>
              <p class="text-secondary small mb-1">Target: Upper Pectoralis Major, Anterior Deltoids</p>
              <div class="d-flex gap-2">
                <span class="badge bg-secondary-subtle text-light small">4 Working Sets</span>
                <span class="badge bg-secondary-subtle text-light small">8-10 Reps</span>
                <span class="badge bg-secondary-subtle text-light small">90s Rest</span>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center pt-2">
          <span class="text-secondary small">Coached by <strong>Raj Malhotra</strong></span>
          <a href="<?= url('workouts.php') ?>" class="btn btn-outline-fitness btn-sm">
            Launch Set & Rest Tracker <i class="bi bi-arrow-right"></i>
          </a>
        </div>
      </div>

      <!-- Quick Action Cards Grid -->
      <div class="row g-3">
        <div class="col-md-6">
          <div class="fitness-card p-3">
            <div class="d-flex align-items-center gap-3">
              <div class="stat-icon bg-success-subtle text-success"><i class="bi bi-sliders"></i></div>
              <div>
                <h6 class="text-white fw-bold mb-1">Health Assessment</h6>
                <p class="text-secondary small mb-0">Review BMR, TDEE, & body composition</p>
              </div>
            </div>
            <a href="<?= url('assessment.php') ?>" class="btn btn-outline-light btn-sm w-100 mt-3">Open Assessment</a>
          </div>
        </div>

        <div class="col-md-6">
          <div class="fitness-card p-3">
            <div class="d-flex align-items-center gap-3">
              <div class="stat-icon bg-info-subtle text-info"><i class="bi bi-egg-fried"></i></div>
              <div>
                <h6 class="text-white fw-bold mb-1">Daily Meal Log</h6>
                <p class="text-secondary small mb-0">Log breakfast, lunch & snacks</p>
              </div>
            </div>
            <a href="<?= url('nutrition.php') ?>" class="btn btn-outline-light btn-sm w-100 mt-3">Log Food</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Senses Biometric Summary -->
    <div class="col-lg-4">
      <div class="fitness-card p-4 mb-4">
        <h5 class="text-white fw-bold mb-3 d-flex align-items-center gap-2">
          <i class="bi bi-shield-check text-success"></i> Biometric Summary
        </h5>

        <div class="mb-3 pb-3 border-bottom border-secondary border-opacity-25">
          <div class="d-flex justify-content-between small text-secondary mb-1">
            <span>Basal Metabolic Rate (BMR)</span>
            <span class="text-white fw-bold">1,780 kcal</span>
          </div>
          <div class="d-flex justify-content-between small text-secondary mb-1">
            <span>Total Daily Energy (TDEE)</span>
            <span class="text-white fw-bold">2,448 kcal</span>
          </div>
          <div class="d-flex justify-content-between small text-secondary">
            <span>Body Mass Index (BMI)</span>
            <span class="text-success fw-bold">22.4 (Normal)</span>
          </div>
        </div>

        <div class="mb-3 pb-3 border-bottom border-secondary border-opacity-25">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="text-secondary small">FitSync Health Index</span>
            <span class="badge bg-success">88 / 100</span>
          </div>
          <p class="text-secondary small mb-0" style="font-size: 11px;">
            Calculated using Mifflin-St Jeor biometric formula and workout regularity.
          </p>
        </div>

        <div class="bg-dark p-3 rounded-3 border border-secondary border-opacity-25">
          <div class="d-flex align-items-center gap-2 mb-2">
            <img src="<?= asset('assets/trainer_raj.jpg') ?>" class="rounded-circle border border-warning" width="32" height="32" onerror="this.src='<?= asset('assets/logo.jpg') ?>'">
            <div>
              <div class="text-white fw-semibold small">Coach Note</div>
              <div class="text-secondary" style="font-size: 10px;">Raj Malhotra • 2h ago</div>
            </div>
          </div>
          <p class="text-light small mb-0 fst-italic" style="font-size: 12px;">
            "Great progressive overload on the bench press yesterday. Keep your rest intervals disciplined at 90s today!"
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
