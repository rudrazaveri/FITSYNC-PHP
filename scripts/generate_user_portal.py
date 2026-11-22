with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Insert PHP header check, base href and script injection
php_head = """<?php
/**
 * FitSync AI — Preserved Member / Athlete Portal Template
 *
 * Fully preserves existing HTML5, CSS3, and Vanilla JavaScript UI components:
 * Workout Logger, Anatomy Diagrams, Rest Timer, Charts, and Multi-Gym Telemetry.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('user');

$authUser = currentUser();
$initialView = $initialView ?? 'dashboard';
?>
"""

# Replace <head> with <head>\n  <base href="<?= url('/') ?>/">
head_tag = "<head>"
injected_head = """<head>
  <base href="<?= url('/') ?>/">
  <script>
    window.__AUTHENTICATED_USER__ = <?= json_encode($authUser, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;
    window.__INITIAL_VIEW__ = <?= json_encode($initialView) ?>;
  </script>"""

html = html.replace(head_tag, injected_head, 1)

portal_content = php_head + html

with open('user/portal_template.php', 'w', encoding='utf-8') as f:
    f.write(portal_content)

print(f"user/portal_template.php generated successfully! ({len(portal_content)} bytes)")
