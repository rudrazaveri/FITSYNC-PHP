<?php
/**
 * FitSync AI — Dedicated Trainer Portal Footer Component
 *
 * Closes the unified application layout and loads Lucide icons and trainer interactions.
 */

declare(strict_types=1);
?>
      </main><!-- /.dashboard-center -->
    </div><!-- /.main-wrapper -->
  </div><!-- /.app-layout -->

  <!-- Interactive Scripts -->
  <script src="<?= asset('js/trainer.js') ?>"></script>
  <script>
    // Initialize Lucide icons on page load
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  </script>
</body>
</html>
