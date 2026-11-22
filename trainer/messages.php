<?php
/**
 * FitSync AI — Coach: Direct Messages
 *
 * Maintains 100% visual consistency with the FitSync User Portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('trainer');

$pageTitle = 'Direct Messages — FitSync AI Coach';
$activeNav = 'messages';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';

$members = getTrainerAssignedMembers((int)$_SESSION['user_id']);
$targetUserId = (int)($_GET['user_id'] ?? ($members[0]['id'] ?? 7));
$selectedMember = null;
foreach ($members as $m) {
    if ((int)$m['id'] === $targetUserId) {
        $selectedMember = $m;
        break;
    }
}
if (!$selectedMember && !empty($members)) {
    $selectedMember = $members[0];
}
?>

<!-- Header Title & Action Row -->
<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Coach & Athlete Communication</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Direct messaging channel with your assigned athletes.</p>
  </div>
  <div>
    <span class="fs-badge fs-badge-blue" style="font-size: 13px; padding: 6px 12px;">
      <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
      Direct Channel Active
    </span>
  </div>
</div>

<div style="display: grid; grid-template-columns: 280px 1fr; gap: 18px; margin-bottom: 22px;">
  
  <!-- Left Column: Member Channels List -->
  <div class="fs-card" style="margin-bottom: 0; padding: 14px;">
    <h3 class="card-title" style="margin-bottom: 12px; font-size: 14px;">Assigned Athletes</h3>
    <div style="display: flex; flex-direction: column; gap: 6px;">
      <?php foreach ($members as $m): 
        $isSelected = ($selectedMember && (int)$selectedMember['id'] === (int)$m['id']);
      ?>
        <a href="<?= url('trainer/messages.php?user_id=' . (int)$m['id']) ?>" 
           style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: var(--radius-sm); text-decoration: none; transition: all 0.15s ease; background: <?= $isSelected ? 'var(--light-blue-bg)' : '#F8FAFC' ?>; border: 1px solid <?= $isSelected ? 'var(--light-blue)' : 'var(--border-color)' ?>;">
          <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 11px; background: <?= $isSelected ? 'var(--primary-blue)' : '#E2E8F0' ?>; color: <?= $isSelected ? '#FFFFFF' : '#334155' ?>;">
            <?= strtoupper(substr($m['full_name'], 0, 2)) ?>
          </div>
          <div style="flex: 1; min-width: 0;">
            <strong style="font-size: 13px; color: var(--text-main); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><?= e($m['full_name']) ?></strong>
            <span style="font-size: 11px; color: var(--text-secondary);"><?= e($m['primary_goal'] ?? 'General') ?></span>
          </div>
        </a>
      <?php endforeach; ?>
    </div>
  </div>

  <!-- Right Column: Active Conversation Pane -->
  <div class="fs-card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between; min-height: 440px;">
    <?php if ($selectedMember): ?>
      <div>
        <!-- Chat Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid var(--border-color); margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="user-avatar-circle" style="width: 40px; height: 40px; font-size: 14px; background: var(--light-blue-bg); color: var(--primary-blue);">
              <?= strtoupper(substr($selectedMember['full_name'], 0, 2)) ?>
            </div>
            <div>
              <strong style="font-size: 15px; color: var(--text-main); display: block;"><?= e($selectedMember['full_name']) ?></strong>
              <span style="font-size: 12px; color: var(--text-secondary);"><?= e($selectedMember['email']) ?></span>
            </div>
          </div>
          <div>
            <a href="<?= url('trainer/member_details.php?id=' . (int)$selectedMember['id']) ?>" class="btn-outline-gym" style="margin-top: 0; padding: 4px 10px; font-size: 11px;">
              View Dossier
            </a>
          </div>
        </div>

        <!-- Chat History Stream -->
        <div style="display: flex; flex-direction: column; gap: 14px; padding: 10px 0;">
          <div style="align-self: flex-start; max-width: 75%; background: #F8FAFC; border: 1px solid var(--border-color); padding: 12px 16px; border-radius: var(--radius-sm);">
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;"><?= e($selectedMember['full_name']) ?> · Yesterday</div>
            <div style="font-size: 13px; color: var(--text-main);">Hi Coach, I felt great on yesterday's back squats! Should I increase the working load by 5 kg on Friday?</div>
          </div>

          <div style="align-self: flex-end; max-width: 75%; background: var(--light-blue-soft); border: 1px solid var(--light-blue); padding: 12px 16px; border-radius: var(--radius-sm);">
            <div style="font-size: 11px; color: var(--primary-blue); margin-bottom: 4px;">You (Coach) · Today 09:15 AM</div>
            <div style="font-size: 13px; color: var(--text-main);">Great job! If your RPE was below 8 on the final set, go ahead with the 5 kg increment. Keep bracing tight.</div>
          </div>
        </div>
      </div>

      <!-- Message Input Box -->
      <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--border-color); display: flex; gap: 10px;">
        <input type="text" class="form-input" placeholder="Type a coaching cue or response..." style="flex: 1;">
        <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 18px;" onclick="alert('Message sent to athlete!');">
          <i data-lucide="send" style="width: 14px; height: 14px; margin-right: 6px;"></i>
          Send
        </button>
      </div>
    <?php else: ?>
      <div style="text-align: center; padding: 48px; color: var(--text-secondary);">
        <p>No athlete selected.</p>
      </div>
    <?php endif; ?>
  </div>

</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
