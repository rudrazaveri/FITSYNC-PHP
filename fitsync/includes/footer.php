<?php
/**
 * FitSync AI — HTML Footer Partial
 */
?>
<footer class="footer-custom py-4 mt-auto">
  <div class="container">
    <div class="row g-4 align-items-center">
      <div class="col-md-6 text-center text-md-start">
        <div class="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
          <img src="<?= asset('assets/logo.jpg') ?>" alt="Logo" width="24" height="24" class="rounded-circle">
          <span class="fw-bold text-white"><?= APP_NAME ?></span>
          <span class="badge bg-success-subtle text-success">PHP Edition</span>
        </div>
        <p class="text-secondary small mb-0"><?= APP_TAGLINE ?></p>
      </div>
      <div class="col-md-6 text-center text-md-end">
        <p class="text-secondary small mb-1">
          <strong>Minor Project</strong> • HTML5 • CSS3 • JavaScript • PHP Engine
        </p>
        <span class="text-secondary" style="font-size: 11px;">
          &copy; <?= date('Y') ?> FitSync AI Platform. All rights reserved.
        </span>
      </div>
    </div>
  </div>
</footer>

<!-- Bootstrap 5.3 Bundle with Popper -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

<!-- Custom Interactive JS (Timers, Audio Alerts, Assessment Calculator) -->
<script src="<?= asset('assets/js/main.js') ?>"></script>

</body>
</html>
