<?php
/**
 * FitSync AI — Landing / Index Page
 */
$pageTitle = 'Next-Gen Multi-Gym & Personalized Fitness Platform';
include __DIR__ . '/includes/header.php';
?>

<!-- Hero Section -->
<section class="hero-gradient py-5 text-center text-lg-start">
  <div class="container py-4">
    <div class="row align-items-center g-5">
      <div class="col-lg-7">
        <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-dark border border-secondary mb-3">
          <span class="badge bg-success">NEW</span>
          <span class="small text-light">Built on PHP, Supabase PostgreSQL & Bootstrap</span>
        </div>
        <h1 class="display-4 fw-extrabold text-white mb-3">
          Your Fitness. Your Health. <br>
          <span class="text-success">Your Intelligence.</span>
        </h1>
        <p class="lead text-secondary mb-4">
          The unified platform connecting Gym Members, Coaches, and Medical Specialists. 
          Real-time biometric assessment, intelligent workout telemetry, and seamless multi-gym access.
        </p>
        <div class="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start">
          <a href="<?= url('assessment.php') ?>" class="btn btn-fitness btn-lg px-4">
            <i class="bi bi-heart-pulse-fill me-2"></i> Start Free Assessment
          </a>
          <a href="<?= url('dashboard.php') ?>" class="btn btn-outline-light btn-lg px-4">
            <i class="bi bi-speedometer2 me-2"></i> Explore Dashboard
          </a>
        </div>

        <!-- Tech Stack Pill Row (From Minor Project Spec) -->
        <div class="mt-5 pt-3 border-top border-secondary border-opacity-25">
          <span class="text-secondary small text-uppercase fw-semibold d-block mb-2">Verified Technology Stack</span>
          <div class="d-flex flex-wrap gap-2">
            <span class="badge bg-dark border border-secondary px-3 py-2 text-light"><i class="bi bi-filetype-php text-primary me-1"></i> PHP 8.x Backend</span>
            <span class="badge bg-dark border border-secondary px-3 py-2 text-light"><i class="bi bi-database text-success me-1"></i> Supabase + PostgreSQL</span>
            <span class="badge bg-dark border border-secondary px-3 py-2 text-light"><i class="bi bi-bootstrap text-info me-1"></i> HTML5 + CSS3 + Bootstrap</span>
            <span class="badge bg-dark border border-secondary px-3 py-2 text-light"><i class="bi bi-filetype-js text-warning me-1"></i> JavaScript Interactive Engine</span>
          </div>
        </div>
      </div>

      <div class="col-lg-5 text-center">
        <div class="fitness-card p-4 text-start position-relative">
          <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom border-secondary border-opacity-25">
            <div class="d-flex align-items-center gap-3">
              <img src="<?= asset('assets/aarav.jpg') ?>" alt="Member" class="rounded-circle border border-success" width="48" height="48" onerror="this.src='<?= asset('assets/logo.jpg') ?>'">
              <div>
                <h6 class="mb-0 text-white fw-bold">Aarav Patel</h6>
                <span class="small text-secondary">FitSync Pro Member</span>
              </div>
            </div>
            <span class="badge bg-success-subtle text-success border border-success px-2 py-1">Active</span>
          </div>

          <!-- Quick Metrics Preview -->
          <div class="row g-3 mb-3">
            <div class="col-6">
              <div class="bg-dark p-3 rounded-3 border border-secondary border-opacity-25">
                <span class="text-secondary small d-block">Daily Calories</span>
                <span class="fs-5 fw-bold text-success">1,850 / 2,400</span>
                <div class="progress mt-2" style="height: 6px;">
                  <div class="progress-bar progress-bar-fitness" style="width: 77%"></div>
                </div>
              </div>
            </div>
            <div class="col-6">
              <div class="bg-dark p-3 rounded-3 border border-secondary border-opacity-25">
                <span class="text-secondary small d-block">Workout Streak</span>
                <span class="fs-5 fw-bold text-warning">5 Days 🔥</span>
                <span class="text-secondary" style="font-size: 11px;">Target: 6 Days</span>
              </div>
            </div>
          </div>

          <div class="bg-dark p-3 rounded-3 border border-secondary border-opacity-25 mb-3">
            <div class="d-flex justify-content-between small text-secondary mb-1">
              <span>Today's Routine</span>
              <span class="text-success">Chest & Triceps</span>
            </div>
            <div class="fw-semibold text-white">Hypertrophy Chest Press & Dips</div>
            <div class="small text-secondary mt-1"><i class="bi bi-stopwatch me-1"></i> 4 Sets • 90s Rest Intervals</div>
          </div>

          <a href="<?= url('workouts.php') ?>" class="btn btn-fitness w-100 py-2">
            <i class="bi bi-play-circle-fill me-2"></i> Open Workout Engine
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Feature Pillars Section -->
<section class="py-5">
  <div class="container py-4">
    <div class="text-center max-w-700 mx-auto mb-5">
      <h6 class="text-success fw-bold text-uppercase letter-spacing-1">Core Modules</h6>
      <h2 class="display-6 fw-bold text-white">Engineered For Complete Wellness</h2>
      <p class="text-secondary">Everything you need for data-driven athletic progression and multi-gym access.</p>
    </div>

    <div class="row g-4">
      <div class="col-md-4">
        <div class="fitness-card p-4 h-100">
          <div class="stat-icon bg-success-subtle text-success mb-3">
            <i class="bi bi-heart-pulse"></i>
          </div>
          <h4 class="text-white fw-bold mb-2">Senses AI Assessment</h4>
          <p class="text-secondary small mb-3">
            Computes Mifflin-St Jeor Basal Metabolic Rate (BMR), TDEE, and optimal macronutrient split tailored to your exact goal.
          </p>
          <a href="<?= url('assessment.php') ?>" class="text-success small fw-semibold text-decoration-none">
            Test Calculator <i class="bi bi-arrow-right"></i>
          </a>
        </div>
      </div>

      <div class="col-md-4">
        <div class="fitness-card p-4 h-100">
          <div class="stat-icon bg-info-subtle text-info mb-3">
            <i class="bi bi-stopwatch"></i>
          </div>
          <h4 class="text-white fw-bold mb-2">Interactive Workout Logger</h4>
          <p class="text-secondary small mb-3">
            Precision set tracking, RPE exertion metrics, and browser Web Audio rest timer with audible interval beeps.
          </p>
          <a href="<?= url('workouts.php') ?>" class="text-info small fw-semibold text-decoration-none">
            Launch Timer & Sets <i class="bi bi-arrow-right"></i>
          </a>
        </div>
      </div>

      <div class="col-md-4">
        <div class="fitness-card p-4 h-100">
          <div class="stat-icon bg-warning-subtle text-warning mb-3">
            <i class="bi bi-qr-code-scan"></i>
          </div>
          <h4 class="text-white fw-bold mb-2">Multi-Gym QR Attendance</h4>
          <p class="text-secondary small mb-3">
            Cross-branch access card system. Check into any affiliated facility with instantaneous cryptographic turnstile validation.
          </p>
          <a href="<?= url('attendance.php') ?>" class="text-warning small fw-semibold text-decoration-none">
            View Pass <i class="bi bi-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<?php include __DIR__ . '/includes/footer.php'; ?>
