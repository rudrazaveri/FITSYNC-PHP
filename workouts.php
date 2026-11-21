<?php
/**
 * FitSync AI — Workouts & Interactive Rest Timer Module
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/session.php';

$pageTitle = 'Workout Session & Rest Timer';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-4">
  <!-- Top Session Banner -->
  <div class="fitness-card p-4 mb-4">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <div>
        <span class="badge bg-success-subtle text-success small mb-1">HYPERTROPHY CYCLE • WEEK 3</span>
        <h3 class="text-white fw-bold mb-1">Day 1: Upper Body Push & Delts</h3>
        <p class="text-secondary small mb-0">Focus: Controlled Eccentric phase, 90s disciplined rest intervals.</p>
      </div>
      <div class="d-flex gap-2">
        <a href="<?= url('dashboard.php') ?>" class="btn btn-outline-light btn-sm">
          <i class="bi bi-chevron-left"></i> Back to Dashboard
        </a>
      </div>
    </div>
  </div>

  <div class="row g-4">
    <!-- Left Column: Workout Routine & Set Logger -->
    <div class="col-lg-7">
      <!-- Exercise 1 Card -->
      <div class="fitness-card p-4 mb-4">
        <div class="d-flex align-items-center gap-3 mb-3">
          <img src="<?= asset('assets/bench_press.jpg') ?>" alt="Bench Press" class="rounded-3 border border-secondary" width="75" height="75" style="object-fit: cover;" onerror="this.src='<?= asset('assets/logo.jpg') ?>'">
          <div>
            <div class="d-flex align-items-center gap-2">
              <h5 class="text-white fw-bold mb-0">1. Incline Barbell Bench Press</h5>
              <span class="badge bg-success">Compound</span>
            </div>
            <p class="text-secondary small mb-0 mt-1">Target: Clavicular Pectoralis Major & Triceps</p>
          </div>
        </div>

        <!-- Working Sets Table -->
        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-3 small">
            <thead>
              <tr class="text-secondary border-secondary">
                <th style="width: 50px;">SET</th>
                <th>PREVIOUS</th>
                <th>WEIGHT (KG)</th>
                <th>REPS</th>
                <th class="text-center" style="width: 80px;">DONE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="badge bg-secondary">1</span></td>
                <td class="text-secondary">60 kg × 10</td>
                <td><input type="number" class="form-control form-control-sm form-control-dark" value="65" style="width: 75px;"></td>
                <td><input type="number" class="form-control form-control-sm form-control-dark" value="10" style="width: 65px;"></td>
                <td class="text-center">
                  <input class="form-check-input bg-dark border-secondary p-2" type="checkbox" checked onclick="if(this.checked) setRestDuration(90);">
                </td>
              </tr>
              <tr>
                <td><span class="badge bg-secondary">2</span></td>
                <td class="text-secondary">65 kg × 8</td>
                <td><input type="number" class="form-control form-control-sm form-control-dark" value="70" style="width: 75px;"></td>
                <td><input type="number" class="form-control form-control-sm form-control-dark" value="8" style="width: 65px;"></td>
                <td class="text-center">
                  <input class="form-check-input bg-dark border-secondary p-2" type="checkbox" onclick="if(this.checked) setRestDuration(90);">
                </td>
              </tr>
              <tr>
                <td><span class="badge bg-secondary">3</span></td>
                <td class="text-secondary">70 kg × 8</td>
                <td><input type="number" class="form-control form-control-sm form-control-dark" value="70" style="width: 75px;"></td>
                <td><input type="number" class="form-control form-control-sm form-control-dark" value="8" style="width: 65px;"></td>
                <td class="text-center">
                  <input class="form-check-input bg-dark border-secondary p-2" type="checkbox" onclick="if(this.checked) setRestDuration(90);">
                </td>
              </tr>
              <tr>
                <td><span class="badge bg-secondary">4</span></td>
                <td class="text-secondary">70 kg × 6</td>
                <td><input type="number" class="form-control form-control-sm form-control-dark" value="72.5" style="width: 75px;"></td>
                <td><input type="number" class="form-control form-control-sm form-control-dark" value="6" style="width: 65px;"></td>
                <td class="text-center">
                  <input class="form-check-input bg-dark border-secondary p-2" type="checkbox" onclick="if(this.checked) setRestDuration(120);">
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-dark p-2 rounded-2 border border-secondary border-opacity-25 small text-secondary">
          <i class="bi bi-info-circle text-info me-1"></i> Checking a set automatically loads your recommended rest period in the timer widget!
        </div>
      </div>

      <!-- Exercise 2 Card -->
      <div class="fitness-card p-4">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="stat-icon bg-info-subtle text-info"><i class="bi bi-lightning-charge"></i></div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <h5 class="text-white fw-bold mb-0">2. Dumbbell Lateral Deltoid Raises</h5>
              <span class="badge bg-info-subtle text-info">Isolation</span>
            </div>
            <p class="text-secondary small mb-0 mt-1">Target: Lateral Head of Deltoid</p>
          </div>
        </div>

        <div class="d-flex gap-2">
          <button class="btn btn-outline-fitness btn-sm" onclick="setRestDuration(60);">
            <i class="bi bi-stopwatch"></i> Load 60s Rest
          </button>
          <span class="text-secondary small align-self-center">3 Sets • 12-15 Reps</span>
        </div>
      </div>
    </div>

    <!-- Right Column: Interactive Rest Timer Widget (JavaScript + Web Audio API) -->
    <div class="col-lg-5">
      <div class="fitness-card p-4 sticky-top" style="top: 85px;">
        <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25">
          <h5 class="text-white fw-bold mb-0 d-flex align-items-center gap-2">
            <i class="bi bi-stopwatch text-success"></i> Tactical Rest Timer
          </h5>
          <span class="badge bg-success-subtle text-success">Web Audio Engine</span>
        </div>

        <!-- Big Digital Display -->
        <div class="text-center bg-dark py-4 rounded-3 border border-secondary border-opacity-50 mb-3 shadow-inner">
          <div id="restTimerDisplay" class="timer-display">01:00</div>
          <span class="text-secondary small">Interval Countdown with Audible Pings</span>
        </div>

        <!-- Quick Duration Presets -->
        <div class="d-flex justify-content-center gap-2 mb-3">
          <button class="btn btn-dark border border-secondary btn-sm" onclick="setRestDuration(30);">30s</button>
          <button class="btn btn-dark border border-secondary btn-sm" onclick="setRestDuration(60);">60s</button>
          <button class="btn btn-dark border border-secondary btn-sm" onclick="setRestDuration(90);">90s</button>
          <button class="btn btn-dark border border-secondary btn-sm" onclick="setRestDuration(120);">120s</button>
        </div>

        <!-- Controls (Start/Pause, Reset, +30s) -->
        <div class="row g-2 mb-4">
          <div class="col-6">
            <button id="timerStartBtn" class="btn btn-fitness w-100 py-2">
              <i class="bi bi-play-fill"></i> Start
            </button>
          </div>
          <div class="col-3">
            <button id="timerAdd30Btn" class="btn btn-dark border border-secondary text-light w-100 py-2">
              +30s
            </button>
          </div>
          <div class="col-3">
            <button id="timerResetBtn" class="btn btn-dark border border-secondary text-secondary w-100 py-2">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>
        </div>

        <!-- Audio Test -->
        <div class="bg-dark p-3 rounded-3 border border-secondary border-opacity-25 text-center">
          <span class="text-secondary small d-block mb-2">Browser Sound & Haptics</span>
          <button class="btn btn-outline-secondary btn-sm px-3" onclick="playBeep(700, 0.3);">
            <i class="bi bi-volume-up me-1"></i> Test Audible Tone
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
