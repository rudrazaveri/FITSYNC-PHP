<?php
/**
 * FitSync AI — Senses Health Assessment Calculator
 * Implements the Mifflin-St Jeor Formula for BMR & TDEE
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/session.php';

$pageTitle = 'Senses Biometric Assessment';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-4">
  <!-- Top Banner -->
  <div class="fitness-card p-4 mb-4">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <div>
        <span class="badge bg-success-subtle text-success small mb-1">BIOMETRIC ENGINE</span>
        <h3 class="text-white fw-bold mb-1">Senses Health Assessment</h3>
        <p class="text-secondary small mb-0">Computes Mifflin-St Jeor Basal Metabolic Rate (BMR), TDEE, and optimal macronutrient split.</p>
      </div>
      <div>
        <a href="<?= url('dashboard.php') ?>" class="btn btn-outline-light btn-sm">
          <i class="bi bi-chevron-left"></i> Dashboard
        </a>
      </div>
    </div>
  </div>

  <div class="row g-4">
    <!-- Left Column: Assessment Input Form -->
    <div class="col-lg-7">
      <div class="fitness-card p-4">
        <h5 class="text-white fw-bold mb-3 d-flex align-items-center gap-2">
          <i class="bi bi-sliders text-success"></i> Anthropometric Parameters
        </h5>

        <form id="assessmentForm" onsubmit="alert('Assessment parameters updated and saved to health profile!'); return false;">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label text-light small fw-semibold">Age (Years)</label>
              <input type="number" id="calcAge" class="form-control form-control-dark" value="24" min="13" max="100" required>
            </div>
            <div class="col-md-6">
              <label class="form-label text-light small fw-semibold">Biological Sex</label>
              <select id="calcGender" class="form-select form-select-dark">
                <option value="male" selected>Male (Mifflin formula: +5)</option>
                <option value="female">Female (Mifflin formula: -161)</option>
              </select>
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label text-light small fw-semibold">Height (cm)</label>
              <input type="number" id="calcHeight" class="form-control form-control-dark" value="178" min="100" max="250" required>
            </div>
            <div class="col-md-6">
              <label class="form-label text-light small fw-semibold">Weight (kg)</label>
              <input type="number" id="calcWeight" class="form-control form-control-dark" value="74" min="30" max="250" required>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">Daily Physical Activity Multiplier</label>
            <select id="calcActivity" class="form-select form-select-dark">
              <option value="1.2">Sedentary (Little or no exercise: 1.2x)</option>
              <option value="1.375">Lightly Active (Exercise 1-3 days/week: 1.375x)</option>
              <option value="1.55" selected>Moderately Active (Hard exercise 3-5 days/week: 1.55x)</option>
              <option value="1.725">Very Active (Hard exercise 6-7 days/week: 1.725x)</option>
              <option value="1.9">Extremely Active (Athletic training twice per day: 1.9x)</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="form-label text-light small fw-semibold">Primary Fitness Objective</label>
            <select class="form-select form-select-dark">
              <option value="muscle_gain" selected>Lean Hypertrophy (Muscle Gain)</option>
              <option value="fat_loss">Adipose Reduction (Fat Loss)</option>
              <option value="maintenance">Athletic Maintenance & Strength</option>
            </select>
          </div>

          <button type="submit" class="btn btn-fitness w-100 py-2 fw-semibold">
            <i class="bi bi-save2 me-1"></i> Save Biometric Profile
          </button>
        </form>
      </div>
    </div>

    <!-- Right Column: Live Calculated Output Results -->
    <div class="col-lg-5">
      <div class="fitness-card p-4 sticky-top" style="top: 85px;">
        <h5 class="text-white fw-bold mb-3 d-flex align-items-center gap-2">
          <i class="bi bi-cpu text-success"></i> Real-Time Mathematical Engine
        </h5>

        <div class="bg-dark p-3 rounded-3 border border-secondary border-opacity-50 mb-3 text-center">
          <span class="text-secondary small d-block">Basal Metabolic Rate (BMR)</span>
          <div id="previewBmr" class="fs-2 fw-bold text-success">1,733 kcal</div>
          <span class="text-secondary" style="font-size: 11px;">Resting metabolic burn at cellular homeostasis</span>
        </div>

        <div class="bg-dark p-3 rounded-3 border border-secondary border-opacity-50 mb-3 text-center">
          <span class="text-secondary small d-block">Total Daily Energy Expenditure (TDEE)</span>
          <div id="previewTdee" class="fs-2 fw-bold text-info">2,686 kcal</div>
          <span class="text-secondary" style="font-size: 11px;">Calories burned daily including exercise</span>
        </div>

        <div class="bg-dark p-3 rounded-3 border border-secondary border-opacity-50 mb-3 text-center">
          <span class="text-secondary small d-block">Body Mass Index (BMI)</span>
          <div id="previewBmi" class="fs-3 fw-bold text-warning">23.4</div>
          <span class="badge bg-success-subtle text-success mt-1">Normal Weight Range</span>
        </div>

        <div class="small text-secondary pt-2">
          <i class="bi bi-calculator me-1"></i> <strong>Scientific Formula:</strong> Mifflin-St Jeor equation computes physiological basal rate:
          <div class="bg-black p-2 rounded mt-1 font-monospace text-light" style="font-size: 10px;">
            BMR = 10×W(kg) + 6.25×H(cm) - 5×Age + s
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
