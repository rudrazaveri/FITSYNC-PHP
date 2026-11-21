<?php
/**
 * FitSync AI — Nutrition & Meal Tracking Module
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/session.php';

$pageTitle = 'Nutrition & Macro Tracker';
include __DIR__ . '/includes/header.php';
?>

<div class="container py-4">
  <!-- Top Banner -->
  <div class="fitness-card p-4 mb-4">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <div>
        <span class="badge bg-info-subtle text-info small mb-1">METABOLIC NUTRITION</span>
        <h3 class="text-white fw-bold mb-1">Daily Dietary Protocol & Macronutrients</h3>
        <p class="text-secondary small mb-0">Calculated to support lean tissue accretion with controlled caloric surplus.</p>
      </div>
      <div>
        <a href="<?= url('dashboard.php') ?>" class="btn btn-outline-light btn-sm">
          <i class="bi bi-chevron-left"></i> Dashboard
        </a>
      </div>
    </div>
  </div>

  <!-- Caloric & Macro Overview Row -->
  <div class="row g-3 mb-4">
    <div class="col-md-3">
      <div class="fitness-card p-3 text-center">
        <span class="text-secondary small d-block">Calories Consumed</span>
        <div class="fs-3 fw-bold text-success mt-1">1,850</div>
        <span class="text-secondary small">of 2,400 kcal target</span>
        <div class="progress mt-2" style="height: 6px;">
          <div class="progress-bar bg-success" style="width: 77%"></div>
        </div>
      </div>
    </div>

    <div class="col-md-3">
      <div class="fitness-card p-3 text-center">
        <span class="text-secondary small d-block">Protein Target</span>
        <div class="fs-3 fw-bold text-info mt-1">128g</div>
        <span class="text-secondary small">of 165g (77%)</span>
        <div class="progress mt-2" style="height: 6px;">
          <div class="progress-bar bg-info" style="width: 77%"></div>
        </div>
      </div>
    </div>

    <div class="col-md-3">
      <div class="fitness-card p-3 text-center">
        <span class="text-secondary small d-block">Carbohydrates</span>
        <div class="fs-3 fw-bold text-warning mt-1">210g</div>
        <span class="text-secondary small">of 280g (75%)</span>
        <div class="progress mt-2" style="height: 6px;">
          <div class="progress-bar bg-warning" style="width: 75%"></div>
        </div>
      </div>
    </div>

    <div class="col-md-3">
      <div class="fitness-card p-3 text-center">
        <span class="text-secondary small d-block">Healthy Fats</span>
        <div class="fs-3 fw-bold text-danger mt-1">54g</div>
        <span class="text-secondary small">of 65g (83%)</span>
        <div class="progress mt-2" style="height: 6px;">
          <div class="progress-bar bg-danger" style="width: 83%"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Meals List & Logger -->
  <div class="row g-4">
    <div class="col-lg-8">
      <!-- Meal 1: Breakfast -->
      <div class="fitness-card p-4 mb-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-dark border border-secondary text-secondary">08:30 AM</span>
            <h5 class="text-white fw-bold mb-0">Breakfast: Rolled Oats & Whey Bowl</h5>
          </div>
          <span class="text-success fw-bold">520 kcal</span>
        </div>
        <div class="d-flex flex-wrap gap-2 text-secondary small">
          <span class="badge bg-dark border border-secondary">38g Protein</span>
          <span class="badge bg-dark border border-secondary">62g Carbs</span>
          <span class="badge bg-dark border border-secondary">11g Fat</span>
        </div>
      </div>

      <!-- Meal 2: Lunch -->
      <div class="fitness-card p-4 mb-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-dark border border-secondary text-secondary">01:15 PM</span>
            <h5 class="text-white fw-bold mb-0">Lunch: Grilled Herb Chicken & Basmati Bowl</h5>
          </div>
          <span class="text-success fw-bold">680 kcal</span>
        </div>
        <div class="d-flex flex-wrap gap-2 text-secondary small">
          <span class="badge bg-dark border border-secondary">52g Protein</span>
          <span class="badge bg-dark border border-secondary">75g Carbs</span>
          <span class="badge bg-dark border border-secondary">16g Fat</span>
        </div>
      </div>

      <!-- Meal 3: Evening Snack -->
      <div class="fitness-card p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-dark border border-secondary text-secondary">05:00 PM</span>
            <h5 class="text-white fw-bold mb-0">Pre-Workout: Greek Yogurt, Banana & Honey</h5>
          </div>
          <span class="text-success fw-bold">340 kcal</span>
        </div>
        <div class="d-flex flex-wrap gap-2 text-secondary small">
          <span class="badge bg-dark border border-secondary">22g Protein</span>
          <span class="badge bg-dark border border-secondary">48g Carbs</span>
          <span class="badge bg-dark border border-secondary">4g Fat</span>
        </div>
      </div>
    </div>

    <!-- Right Side: Fast Food Log Card -->
    <div class="col-lg-4">
      <div class="fitness-card p-4">
        <h5 class="text-white fw-bold mb-3 d-flex align-items-center gap-2">
          <i class="bi bi-plus-circle text-success"></i> Log Food Item
        </h5>
        
        <form onsubmit="alert('Meal successfully logged in your profile!'); return false;">
          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">Meal Category</label>
            <select class="form-select form-select-dark">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="snack">Pre / Post-Workout Snack</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label text-light small fw-semibold">Food Name</label>
            <input type="text" class="form-control form-control-dark" placeholder="e.g. 3 Boiled Eggs & Whole Wheat Toast" required>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label text-light small fw-semibold">Calories (kcal)</label>
              <input type="number" class="form-control form-control-dark" placeholder="320" required>
            </div>
            <div class="col-6">
              <label class="form-label text-light small fw-semibold">Protein (g)</label>
              <input type="number" class="form-control form-control-dark" placeholder="24">
            </div>
          </div>

          <button type="submit" class="btn btn-fitness w-100 py-2">
            <i class="bi bi-check2-circle me-1"></i> Add Meal Log
          </button>
        </form>
      </div>
    </div>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
