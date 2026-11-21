<?php
/**
 * FitSync AI — Responsive Navbar Partial
 */
$currentPage = basename($_SERVER['PHP_SELF'] ?? '');
?>
<nav class="navbar navbar-expand-lg navbar-dark navbar-custom sticky-top py-2">
  <div class="container">
    <!-- Brand -->
    <a class="navbar-brand" href="<?= url('index.php') ?>">
      <img src="<?= asset('assets/logo.jpg') ?>" alt="Logo" width="34" height="34" class="rounded-circle border border-success">
      <span>FitSync <span class="brand-badge-ai">AI</span></span>
    </a>

    <!-- Mobile Toggler -->
    <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain" aria-controls="navbarMain" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <!-- Nav Links & Auth -->
    <div class="collapse navbar-collapse" id="navbarMain">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0 ps-lg-3">
        <li class="nav-item">
          <a class="nav-link <?= $currentPage === 'index.php' ? 'active text-success fw-bold' : '' ?>" href="<?= url('index.php') ?>">
            <i class="bi bi-house-door me-1"></i> Home
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?= $currentPage === 'dashboard.php' ? 'active text-success fw-bold' : '' ?>" href="<?= url('dashboard.php') ?>">
            <i class="bi bi-speedometer2 me-1"></i> Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?= $currentPage === 'workouts.php' ? 'active text-success fw-bold' : '' ?>" href="<?= url('workouts.php') ?>">
            <i class="bi bi-activity me-1"></i> Workouts
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?= $currentPage === 'nutrition.php' ? 'active text-success fw-bold' : '' ?>" href="<?= url('nutrition.php') ?>">
            <i class="bi bi-pie-chart me-1"></i> Nutrition
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?= $currentPage === 'assessment.php' ? 'active text-success fw-bold' : '' ?>" href="<?= url('assessment.php') ?>">
            <i class="bi bi-heart-pulse me-1"></i> Assessment
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?= $currentPage === 'attendance.php' ? 'active text-success fw-bold' : '' ?>" href="<?= url('attendance.php') ?>">
            <i class="bi bi-qr-code-scan me-1"></i> Attendance
          </a>
        </li>
      </ul>

      <!-- User Auth State -->
      <div class="d-flex align-items-center gap-2">
        <?php if (isLoggedIn()): ?>
          <div class="dropdown">
            <button class="btn btn-dark dropdown-toggle d-flex align-items-center gap-2 border border-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle text-success fs-5"></i>
              <span class="small fw-semibold"><?= htmlspecialchars($currentUser['full_name'] ?? 'Member') ?></span>
              <span class="badge bg-success-subtle text-success text-uppercase" style="font-size: 10px;"><?= htmlspecialchars($currentUser['role'] ?? 'member') ?></span>
            </button>
            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
              <li><a class="dropdown-item" href="<?= url('dashboard.php') ?>"><i class="bi bi-person me-2"></i> My Dashboard</a></li>
              <li><a class="dropdown-item" href="<?= url('assessment.php') ?>"><i class="bi bi-sliders me-2"></i> Health Biometrics</a></li>
              <li><hr class="dropdown-divider border-secondary"></li>
              <li><a class="dropdown-item text-danger" href="<?= url('logout.php') ?>"><i class="bi bi-box-arrow-right me-2"></i> Sign Out</a></li>
            </ul>
          </div>
        <?php else: ?>
          <a href="<?= url('login.php') ?>" class="btn btn-outline-fitness btn-sm px-3">
            <i class="bi bi-box-arrow-in-right me-1"></i> Login
          </a>
          <a href="<?= url('register.php') ?>" class="btn btn-fitness btn-sm px-3">
            <i class="bi bi-person-plus me-1"></i> Sign Up
          </a>
        <?php endif; ?>
      </div>
    </div>
  </div>
</nav>
