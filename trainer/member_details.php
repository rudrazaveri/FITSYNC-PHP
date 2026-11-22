<?php
/**
 * FitSync AI — Coach Workspace: Athlete Telemetry Dossier
 *
 * STRICT PRIVACY REQUIREMENT: Validates assignment relationship.
 * If member is NOT assigned to authenticated trainer, returns 403 Forbidden.
 * Maintains 100% visual consistency with the FitSync User Portal design system.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'Member Dossier — FitSync AI';
$activeNav = 'members';

$trainerId = (int)$_SESSION['user_id'];
$memberId = (int)($_GET['id'] ?? 0);

$member = null;
if ($memberId > 0) {
    $member = getAssignedMemberDetails($trainerId, $memberId);
}

// STRICT PRIVACY GATE
if ($member === null) {
    http_response_code(403);
    require_once __DIR__ . '/includes/header.php';
    require_once __DIR__ . '/includes/sidebar.php';
    ?>
    <div style="margin-bottom: 20px;">
      <a href="<?= url('trainer/members.php') ?>" class="btn-back-dashboard">
        <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
        Back to My Members
      </a>
    </div>

    <div class="fs-card" style="text-align: center; padding: 48px 24px;">
      <i data-lucide="shield-alert" style="width: 48px; height: 48px; color: var(--pink); margin-bottom: 12px;"></i>
      <h2 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Access Denied (403 Forbidden)</h2>
      <p style="font-size: 13px; color: var(--text-secondary); max-width: 460px; margin: 0 auto 18px auto;">
        You do not have authorization to view this athlete's records. FitSync strictly protects member privacy: only trainers actively assigned to this member can access their biometric telemetry, workout logs, and attendance history.
      </p>
      <a href="<?= url('trainer/members.php') ?>" class="fs-btn fs-btn-primary">
        Return to My Coaching Roster
      </a>
    </div>
    <?php
    require_once __DIR__ . '/includes/footer.php';
    exit;
}

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';

$profile = $member['profile'];
$goals = $member['goals'];
$sessions = $member['workout_sessions'];
$measurements = $member['measurements'];
$attendance = $member['attendance'];
$notes = $member['notes'];
?>

<!-- Back Navigation Link -->
<div style="margin-bottom: 18px;">
  <a href="<?= url('trainer/members.php') ?>" class="btn-back-dashboard">
    <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
    Back to My Members
  </a>
</div>

<!-- Athlete Header Hero Card -->
<div class="fs-card" style="margin-bottom: 22px;">
  <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
    
    <div style="display: flex; align-items: center; gap: 16px;">
      <div class="user-avatar-circle" style="width: 56px; height: 56px; font-size: 18px; font-weight: 700; background: var(--light-blue-bg); color: var(--primary-blue);">
        <?= strtoupper(substr($profile['full_name'], 0, 2)) ?>
      </div>
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main);"><?= e($profile['full_name']) ?></h2>
          <span class="badge-active">Assigned Athlete</span>
        </div>
        <div style="display: flex; align-items: center; gap: 14px; font-size: 12px; color: var(--text-secondary); flex-wrap: wrap;">
          <span><i data-lucide="mail" style="width: 13px; height: 13px; vertical-align: -2px;"></i> <?= e($profile['email']) ?></span>
          <span><i data-lucide="phone" style="width: 13px; height: 13px; vertical-align: -2px;"></i> <?= e($profile['mobile'] ?? 'Not provided') ?></span>
          <span><i data-lucide="building-2" style="width: 13px; height: 13px; vertical-align: -2px;"></i> <?= e($profile['home_gym_name'] ?? 'FitZone') ?></span>
        </div>
      </div>
    </div>

    <div style="display: flex; gap: 8px;">
      <a href="<?= url('trainer/messages.php?user_id=' . (int)$memberId) ?>" class="fs-btn fs-btn-outline">
        <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
        Message
      </a>
      <a href="<?= url('trainer/schedule.php?book_member=' . (int)$memberId) ?>" class="fs-btn fs-btn-primary">
        <i data-lucide="calendar-plus" style="width: 14px; height: 14px;"></i>
        Book Session
      </a>
    </div>

  </div>
</div>

<!-- 5-Tab Navigation (Matching FitSync Tabs) -->
<nav class="fs-tabs-nav">
  <button type="button" class="fs-tab-btn active" data-tab="overview">
    <i data-lucide="user" style="width: 16px; height: 16px;"></i>
    Overview & Goals
  </button>
  <button type="button" class="fs-tab-btn" data-tab="workouts">
    <i data-lucide="dumbbell" style="width: 16px; height: 16px;"></i>
    Workout History (<?= count($sessions) ?>)
  </button>
  <button type="button" class="fs-tab-btn" data-tab="measurements">
    <i data-lucide="scale" style="width: 16px; height: 16px;"></i>
    Biometric Progress (<?= count($measurements) ?>)
  </button>
  <button type="button" class="fs-tab-btn" data-tab="attendance">
    <i data-lucide="calendar-check" style="width: 16px; height: 16px;"></i>
    Attendance (<?= count($attendance) ?>)
  </button>
  <button type="button" class="fs-tab-btn" data-tab="notes">
    <i data-lucide="clipboard-pen" style="width: 16px; height: 16px;"></i>
    Coach Notes (<?= count($notes) ?>)
  </button>
</nav>

<!-- TAB 1: OVERVIEW & GOALS -->
<div class="fs-tab-pane active" id="tab-overview">
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
    
    <!-- Biometrics Card -->
    <div class="fs-card" style="margin-bottom: 0;">
      <h3 class="card-title" style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <i data-lucide="activity" style="width: 16px; height: 16px; color: var(--primary-blue);"></i>
        Biometrics Profile
      </h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;">
        <div style="padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm);">
          <span style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 2px;">CURRENT WEIGHT</span>
          <strong style="font-size: 16px; color: var(--text-main);">
            <?= $profile['weight_kg'] ? number_format((float)$profile['weight_kg'], 1) . ' kg' : '—' ?>
          </strong>
        </div>
        <div style="padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm);">
          <span style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 2px;">HEIGHT</span>
          <strong style="font-size: 16px; color: var(--text-main);">
            <?= $profile['height_cm'] ? (int)$profile['height_cm'] . ' cm' : '—' ?>
          </strong>
        </div>
        <div style="padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm);">
          <span style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 2px;">GENDER</span>
          <strong style="font-size: 14px; color: var(--text-main);">
            <?= e(ucfirst($profile['gender'] ?? 'Not set')) ?>
          </strong>
        </div>
        <div style="padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm);">
          <span style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 2px;">EXPERIENCE</span>
          <strong style="font-size: 14px; color: var(--text-main);">
            <?= e($profile['fitness_experience'] ?? 'Intermediate') ?>
          </strong>
        </div>
      </div>

      <?php if (!empty($profile['emergency_contact_name'])): ?>
        <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border-color); font-size: 12px; color: var(--text-secondary);">
          <strong>Emergency Contact:</strong> <?= e($profile['emergency_contact_name']) ?> (<?= e($profile['emergency_contact_phone'] ?? 'N/A') ?>)
        </div>
      <?php endif; ?>
    </div>

    <!-- Active Fitness Goals -->
    <div class="fs-card" style="margin-bottom: 0;">
      <h3 class="card-title" style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <i data-lucide="target" style="width: 16px; height: 16px; color: var(--success-green);"></i>
        Primary Fitness Goals
      </h3>

      <?php if (empty($goals)): ?>
        <p style="font-size: 13px; color: var(--text-secondary);">No explicit fitness goals recorded yet.</p>
      <?php else: ?>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <?php foreach ($goals as $g): ?>
            <div style="padding: 12px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <strong style="font-size: 14px; color: var(--text-main);"><?= e($g['title'] ?? 'Primary Fitness Target') ?></strong>
                <span class="fs-badge fs-badge-green"><?= e(ucfirst($g['status'] ?? 'Active')) ?></span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary); display: flex; gap: 12px;">
                <span>Type: <strong><?= e(ucwords(str_replace('_', ' ', $g['goal_type'] ?? 'General'))) ?></strong></span>
                <?php if ($g['target_weight_kg']): ?>
                  <span>Target Weight: <strong><?= number_format((float)$g['target_weight_kg'], 1) ?> kg</strong></span>
                <?php endif; ?>
                <?php if ($g['target_date']): ?>
                  <span>Target Date: <strong><?= date('M d, Y', strtotime($g['target_date'])) ?></strong></span>
                <?php endif; ?>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

  </div>
</div>

<!-- TAB 2: WORKOUT HISTORY -->
<div class="fs-tab-pane" id="tab-workouts">
  <div class="fs-card">
    <div class="card-header-row">
      <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
        <i data-lucide="dumbbell" style="width: 16px; height: 16px; color: var(--primary-blue);"></i>
        Recent Workout Sessions
      </h3>
    </div>

    <?php if (empty($sessions)): ?>
      <p style="font-size: 13px; color: var(--text-secondary); text-align: center; padding: 24px;">No completed workout sessions logged yet.</p>
    <?php else: ?>
      <div style="overflow-x: auto;">
        <table class="fs-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>DURATION</th>
              <th>TOTAL VOLUME</th>
              <th>SETS COMPLETED</th>
              <th>PERCEIVED RPE</th>
              <th>COACH NOTES</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($sessions as $s): ?>
              <tr>
                <td><strong><?= date('M d, Y', strtotime($s['session_date'])) ?></strong></td>
                <td><?= (int)($s['duration_minutes'] ?? 45) ?> mins</td>
                <td><strong style="color: var(--primary-blue);"><?= number_format((float)($s['total_volume_kg'] ?? 0)) ?> kg</strong></td>
                <td><?= (int)($s['total_sets_completed'] ?? 0) ?> sets</td>
                <td>
                  <?php if (!empty($s['perceived_rpe'])): ?>
                    <span class="fs-badge fs-badge-blue"><?= (int)$s['perceived_rpe'] ?> / 10 RPE</span>
                  <?php else: ?>
                    <span style="color: var(--text-muted);">—</span>
                  <?php endif; ?>
                </td>
                <td style="font-size: 12px; color: var(--text-secondary); max-width: 220px;"><?= e($s['notes'] ?? 'Standard prescribed routine') ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </div>
</div>

<!-- TAB 3: BIOMETRIC PROGRESS -->
<div class="fs-tab-pane" id="tab-measurements">
  <div class="fs-card">
    <div class="card-header-row">
      <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
        <i data-lucide="scale" style="width: 16px; height: 16px; color: var(--pink);"></i>
        Body Measurements & Telemetry Log
      </h3>
    </div>

    <?php if (empty($measurements)): ?>
      <p style="font-size: 13px; color: var(--text-secondary); text-align: center; padding: 24px;">No biometric check-ins recorded yet.</p>
    <?php else: ?>
      <div style="overflow-x: auto;">
        <table class="fs-table">
          <thead>
            <tr>
              <th>RECORDED DATE</th>
              <th>WEIGHT</th>
              <th>BODY FAT %</th>
              <th>CHEST</th>
              <th>WAIST</th>
              <th>HIPS</th>
              <th>ARMS</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($measurements as $bm): ?>
              <tr>
                <td><strong><?= date('M d, Y', strtotime($bm['recorded_at'])) ?></strong></td>
                <td><strong><?= $bm['weight_kg'] ? number_format((float)$bm['weight_kg'], 1) . ' kg' : '—' ?></strong></td>
                <td><?= $bm['body_fat_pct'] ? number_format((float)$bm['body_fat_pct'], 1) . '%' : '—' ?></td>
                <td><?= $bm['chest_cm'] ? number_format((float)$bm['chest_cm'], 1) . ' cm' : '—' ?></td>
                <td><?= $bm['waist_cm'] ? number_format((float)$bm['waist_cm'], 1) . ' cm' : '—' ?></td>
                <td><?= $bm['hips_cm'] ? number_format((float)$bm['hips_cm'], 1) . ' cm' : '—' ?></td>
                <td><?= $bm['arms_cm'] ? number_format((float)$bm['arms_cm'], 1) . ' cm' : '—' ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </div>
</div>

<!-- TAB 4: ATTENDANCE HISTORY -->
<div class="fs-tab-pane" id="tab-attendance">
  <div class="fs-card">
    <div class="card-header-row">
      <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
        <i data-lucide="calendar-check" style="width: 16px; height: 16px; color: var(--primary-blue);"></i>
        Gym Facility Turnstile Check-Ins
      </h3>
    </div>

    <?php if (empty($attendance)): ?>
      <p style="font-size: 13px; color: var(--text-secondary); text-align: center; padding: 24px;">No physical check-in turnstile events recorded.</p>
    <?php else: ?>
      <div style="overflow-x: auto;">
        <table class="fs-table">
          <thead>
            <tr>
              <th>DATE & TIME</th>
              <th>FACILITY BRANCH</th>
              <th>CHECK-IN METHOD</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($attendance as $att): ?>
              <tr>
                <td><strong><?= date('M d, Y · h:i A', strtotime($att['check_in_time'])) ?></strong></td>
                <td><?= e($att['gym_name'] ?? 'FitZone Alkapuri') ?></td>
                <td><span class="fs-badge fs-badge-blue"><?= e(strtoupper($att['check_in_method'] ?? 'QR_SCAN')) ?></span></td>
                <td><span class="badge-healthy">Verified</span></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </div>
</div>

<!-- TAB 5: COACH NOTES -->
<div class="fs-tab-pane" id="tab-notes">
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
    
    <!-- Add Note Form -->
    <div class="fs-card" style="margin-bottom: 0;">
      <h3 class="card-title" style="margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
        <i data-lucide="edit" style="width: 16px; height: 16px; color: var(--primary-blue);"></i>
        Record Athlete Note
      </h3>

      <form id="coachNoteForm" data-member-id="<?= (int)$memberId ?>">
        <div class="form-group">
          <label class="form-label" for="noteTypeSelect">Note Category</label>
          <select id="noteTypeSelect" class="form-select">
            <option value="general">General Coaching Note</option>
            <option value="form_correction">Biomechanical & Form Correction</option>
            <option value="dietary">Dietary & Nutrition Observation</option>
            <option value="milestone">Progress Milestone Achieved</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="noteTextInput">Observations & Recommendations</label>
          <textarea id="noteTextInput" class="form-textarea" rows="4" placeholder="Log technical observations, intensity cues, or recovery feedback for this athlete..." required></textarea>
        </div>

        <button type="submit" class="btn-primary-block" style="width: auto; padding: 8px 18px;">
          <i data-lucide="save" style="width: 14px; height: 14px; margin-right: 6px;"></i>
          Save Coach Note
        </button>
      </form>
    </div>

    <!-- Existing Notes Chronological Feed -->
    <div class="fs-card" style="margin-bottom: 0;">
      <h3 class="card-title" style="margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
        <i data-lucide="history" style="width: 16px; height: 16px; color: var(--text-secondary);"></i>
        Note History
      </h3>

      <div class="notes-feed" id="notesFeedContainer">
        <?php if (empty($notes)): ?>
          <div class="empty-notes-notice" style="text-align: center; padding: 24px; color: var(--text-secondary);">
            <p style="font-size: 13px;">No coaching notes recorded yet for this athlete.</p>
          </div>
        <?php else: ?>
          <?php foreach ($notes as $n): ?>
            <div class="note-item">
              <div class="note-meta">
                <span class="fs-badge fs-badge-blue"><?= e(ucwords(str_replace('_', ' ', $n['note_type'] ?? 'general'))) ?></span>
                <span><?= date('M d, Y · h:i A', strtotime($n['created_at'])) ?></span>
              </div>
              <div class="note-body"><?= nl2br(e($n['note_text'])) ?></div>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>
    </div>

  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
