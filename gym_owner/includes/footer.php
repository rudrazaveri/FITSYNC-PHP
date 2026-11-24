<?php
/**
 * FitSync AI — Dedicated Gym Owner Portal Footer Component
 *
 * Closes the layout containers, loads shared scripts, and initializes Lucide icons.
 */

declare(strict_types=1);
?>
      </main><!-- /.dashboard-center -->
    </div><!-- /.main-wrapper -->
  </div><!-- /.app-layout -->

  <!-- Load Data Store for Real-Time Single-Origin Synchronization -->
  <script src="<?= asset('js/data.js') ?>"></script>
  <script>
    // Initialize Lucide icons on page load
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Modal Helpers
    function openModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.style.display = 'flex';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function closeModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.style.display = 'none';
    }

    // Close on backdrop click
    window.addEventListener('click', function(e) {
      if (e.target.classList.contains('fs-modal-backdrop')) {
        e.target.style.display = 'none';
      }
    });
  </script>
</body>
</html>
