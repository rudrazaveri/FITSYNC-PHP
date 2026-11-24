# 1. gym_owner/index.php
index_php = """<?php
/**
 * FitSync AI — Gym Owner Portal Entry Point
 *
 * Protected: Only users with role 'gym_owner' may access this portal.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

// Strict server-side role check
requireRole('gym_owner');

// Route directly into the primary Gym Owner Command Dashboard
require __DIR__ . '/dashboard.php';
"""

with open('gym_owner/index.php', 'w', encoding='utf-8') as f:
    f.write(index_php)

# 2. gym_owner/coaches.php
coaches_php = """<?php
/**
 * FitSync AI — Gym Owner Coaches & Staff Directory
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('gym_owner');

$pageTitle = 'Coaches & Staff Management — FitSync AI';
$activeNav = 'coaches';

$coaches = getGymCoaches();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Certified Coaching Staff</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Oversee certified personal trainers, monitor client load, and recruit new staff.</p>
  </div>
  <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 18px;" onclick="openModal('modalAddCoach')">
    <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 4px;"></i> + Add New Coach
  </button>
</div>

<div class="trainers-grid" id="ownerCoachesGrid">
  <?php foreach ($coaches as $c): ?>
    <div class="trainer-card" id="coach-card-<?= e($c['id']) ?>">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <img src="<?= asset($c['avatar'] ?? 'assets/images/trainer_raj.jpg') ?>" class="user-avatar-circle" alt="<?= e($c['name']) ?>" style="width: 52px; height: 52px;" onerror="this.src='<?= asset('assets/images/trainer_raj.jpg') ?>'">
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;"><?= e($c['name']) ?></h4>
          <div style="font-size: 12px; color: var(--text-secondary);"><?= e($c['title']) ?></div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;"><?= e($c['experience']) ?> Experience</div>
        </div>
        <button type="button" class="btn-outline-gym" style="color: #EF4444; border-color: #FCA5A5; padding: 4px 8px; font-size: 11px; margin-top: 0;" onclick="handleDeleteCoach('<?= e($c['id']) ?>')">
          <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; margin-bottom: 12px; font-size: 11px;">
        <div>
          <span style="color: var(--text-muted); display: block;">Hourly Rate</span>
          <strong style="color: var(--text-main); font-size: 13px;"><?= e($c['hourlyRate']) ?></strong>
        </div>
        <div>
          <span style="color: var(--text-muted); display: block;">Assigned Athletes</span>
          <strong style="color: var(--primary-blue); font-size: 13px;"><?= (int)($c['assignedAthletes'] ?? 0) ?> Active</strong>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Specializations:</span>
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
          <?php foreach ($c['specialties'] ?? [] as $s): ?>
            <span class="tag-badge" style="font-size: 11px; padding: 2px 7px;"><?= e($s) ?></span>
          <?php endforeach; ?>
        </div>
      </div>

      <div style="font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 8px; display: flex; justify-content: space-between;">
        <span>Contact: <strong><?= e($c['phone'] ?? '+91 98000 00000') ?></strong></span>
        <span>Rating: <strong style="color: #F59E0B;">★ <?= e($c['rating'] ?? '5.0') ?></strong></span>
      </div>
    </div>
  <?php endforeach; ?>
</div>

<!-- Re-use Modals from Dashboard -->
<?php require_once __DIR__ . '/dashboard.php'; ?>
"""

# Let's write coaches.php, members.php, attendance.php, settings.php cleanly
clean_coaches_php = """<?php
/**
 * FitSync AI — Gym Owner Coaches & Staff Directory
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('gym_owner');

$pageTitle = 'Coaches & Staff Management — FitSync AI';
$activeNav = 'coaches';

$coaches = getGymCoaches();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Certified Coaching Staff</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Oversee certified personal trainers, monitor client load, and recruit new staff.</p>
  </div>
  <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 18px;" onclick="openModal('modalAddCoach')">
    <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 4px;"></i> + Add New Coach
  </button>
</div>

<div class="trainers-grid" id="ownerCoachesGrid">
  <?php foreach ($coaches as $c): ?>
    <div class="trainer-card" id="coach-card-<?= e($c['id']) ?>">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <img src="<?= asset($c['avatar'] ?? 'assets/images/trainer_raj.jpg') ?>" class="user-avatar-circle" alt="<?= e($c['name']) ?>" style="width: 52px; height: 52px;" onerror="this.src='<?= asset('assets/images/trainer_raj.jpg') ?>'">
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;"><?= e($c['name']) ?></h4>
          <div style="font-size: 12px; color: var(--text-secondary);"><?= e($c['title']) ?></div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;"><?= e($c['experience']) ?> Experience</div>
        </div>
        <button type="button" class="btn-outline-gym" style="color: #EF4444; border-color: #FCA5A5; padding: 4px 8px; font-size: 11px; margin-top: 0;" onclick="handleDeleteCoach('<?= e($c['id']) ?>')">
          <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; margin-bottom: 12px; font-size: 11px;">
        <div>
          <span style="color: var(--text-muted); display: block;">Hourly Rate</span>
          <strong style="color: var(--text-main); font-size: 13px;"><?= e($c['hourlyRate']) ?></strong>
        </div>
        <div>
          <span style="color: var(--text-muted); display: block;">Assigned Athletes</span>
          <strong style="color: var(--primary-blue); font-size: 13px;"><?= (int)($c['assignedAthletes'] ?? 0) ?> Active</strong>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Specializations:</span>
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
          <?php foreach ($c['specialties'] ?? [] as $s): ?>
            <span class="tag-badge" style="font-size: 11px; padding: 2px 7px;"><?= e($s) ?></span>
          <?php endforeach; ?>
        </div>
      </div>

      <div style="font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 8px; display: flex; justify-content: space-between;">
        <span>Contact: <strong><?= e($c['phone'] ?? '+91 98000 00000') ?></strong></span>
        <span>Rating: <strong style="color: #F59E0B;">★ <?= e($c['rating'] ?? '5.0') ?></strong></span>
      </div>
    </div>
  <?php endforeach; ?>
</div>

<!-- Modal: Add New Coach -->
<div id="modalAddCoach" class="fs-modal-backdrop">
  <div class="fs-modal-content">
    <div style="padding: 18px 24px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between;">
      <h3 style="font-size: 17px; font-weight: 700; color: var(--text-main);">+ Register New Coach</h3>
      <button type="button" onclick="closeModal('modalAddCoach')" style="background: transparent; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="handleCreateCoachSubmit(event)" style="padding: 20px 24px;">
      <div style="margin-bottom: 14px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Full Name *</label>
        <input type="text" id="newCoachName" class="form-input" placeholder="e.g. Coach Alex Hunter" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Email Address *</label>
          <input type="email" id="newCoachEmail" class="form-input" placeholder="alex@fitsync.health" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
        </div>
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Phone Contact *</label>
          <input type="text" id="newCoachPhone" class="form-input" placeholder="+91 98220 55667" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Professional Title</label>
          <input type="text" id="newCoachTitle" class="form-input" placeholder="e.g. Senior Strength Coach" value="Certified Strength Coach" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
        </div>
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Experience</label>
          <input type="text" id="newCoachExperience" class="form-input" placeholder="e.g. 5 Years" value="4 Years" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
        </div>
      </div>
      <div style="margin-bottom: 14px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Hourly Rate</label>
        <input type="text" id="newCoachRate" class="form-input" placeholder="e.g. ₹1,500 / hr" value="₹1,500 / hr" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Specializations (comma separated)</label>
        <input type="text" id="newCoachSpecialties" class="form-input" placeholder="Hypertrophy, Powerlifting, Form Correction" value="Hypertrophy, Biomechanical Alignment" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button type="button" class="btn-secondary" onclick="closeModal('modalAddCoach')">Cancel</button>
        <button type="submit" class="btn-primary-block" style="width: auto; padding: 8px 20px;">Save & Activate Coach</button>
      </div>
    </form>
  </div>
</div>

<script>
  async function handleCreateCoachSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('newCoachName').value.trim();
    const email = document.getElementById('newCoachEmail').value.trim();
    const phone = document.getElementById('newCoachPhone').value.trim();
    const title = document.getElementById('newCoachTitle').value.trim();
    const experience = document.getElementById('newCoachExperience').value.trim();
    const hourlyRate = document.getElementById('newCoachRate').value.trim();
    const specialties = document.getElementById('newCoachSpecialties').value.trim();

    if (window.fitSyncStore) {
      window.fitSyncStore.addTrainer({ name, email, phone, title, experience, hourlyRate, specialties });
    }
    try {
      await fetch('<?= url('api/gym_owner/add_coach.php') ?>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, title, experience, hourlyRate, specialties })
      });
    } catch(err) {}
    closeModal('modalAddCoach');
    alert(`Coach ${name} registered successfully!`);
    window.location.reload();
  }

  async function handleDeleteCoach(coachId) {
    if (!confirm('Are you sure you want to remove this coach?')) return;
    if (window.fitSyncStore) {
      window.fitSyncStore.deleteTrainer(coachId);
    }
    try {
      await fetch('<?= url('api/gym_owner/delete_user.php') ?>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId })
      });
    } catch(err) {}
    window.location.reload();
  }
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
"""

with open('gym_owner/coaches.php', 'w', encoding='utf-8') as f:
    f.write(clean_coaches_php)

# 3. gym_owner/members.php
members_php = """<?php
/**
 * FitSync AI — Gym Owner Athletes Directory & Assignments
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('gym_owner');

$pageTitle = 'Athletes Directory & Roster — FitSync AI';
$activeNav = 'members';

$members = getGymMembers();
$coaches = getGymCoaches();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Athletes Directory & Coach Assignments</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Oversee active member profiles, monitor adherence, and adjust assigned coaching staff.</p>
  </div>
  <button type="button" class="btn-primary-block" style="width: auto; padding: 8px 18px;" onclick="openModal('modalAddMember')">
    <i data-lucide="user-plus" style="width: 14px; height: 14px; margin-right: 4px;"></i> + Enroll New Athlete
  </button>
</div>

<!-- Search Bar -->
<div class="filter-search-bar" style="margin-bottom: 20px;">
  <div class="search-input-box" style="flex: 1;">
    <i data-lucide="search"></i>
    <input type="text" id="memberFilterInput" onkeyup="filterAthleteRows()" placeholder="Search athletes by name, email, or goal...">
  </div>
</div>

<div class="fs-card">
  <div style="overflow-x: auto;">
    <table class="fs-table" id="ownerMembersTable">
      <thead>
        <tr>
          <th>Athlete</th>
          <th>Contact & Goal</th>
          <th>Weight</th>
          <th>Membership Tier</th>
          <th>Assigned Coach (Reassign)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($members as $m): ?>
          <tr class="athlete-row" data-name="<?= strtolower(e($m['name'])) ?>" data-goal="<?= strtolower(e($m['goal'])) ?>">
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">
                  <?= strtoupper(substr($m['name'], 0, 2)) ?>
                </div>
                <div>
                  <strong style="color: var(--text-main); font-size: 13px;"><?= e($m['name']) ?></strong>
                  <div style="font-size: 11px; color: var(--text-muted);"><?= e($m['email']) ?></div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-size: 12px; color: var(--text-main);"><?= e($m['goal']) ?></div>
              <div style="font-size: 11px; color: var(--text-secondary);"><?= e($m['phone'] ?? '+91 98765 00000') ?></div>
            </td>
            <td style="font-weight: 600; font-size: 13px;"><?= (float)($m['weight'] ?? 60) ?> kg</td>
            <td>
              <span class="badge-tier badge-tier-<?= strtolower($m['membershipTier'] ?? 'gold') ?>">
                <?= e($m['membershipTier'] ?? 'Gold') ?>
              </span>
            </td>
            <td>
              <select class="form-input" style="padding: 4px 8px; font-size: 12px; border-radius: 6px; border: 1px solid var(--border-color); background: #fff;" onchange="handleReassignCoach('<?= e($m['email']) ?>', this.value)">
                <?php foreach ($coaches as $coachOpt): ?>
                  <option value="<?= e($coachOpt['id']) ?>" <?= ($m['assignedCoachId'] === $coachOpt['id'] || $m['assignedCoachName'] === $coachOpt['name']) ? 'selected' : '' ?>>
                    <?= e($coachOpt['name']) ?> (<?= e($coachOpt['title']) ?>)
                  </option>
                <?php endforeach; ?>
              </select>
            </td>
            <td>
              <button type="button" class="btn-outline-gym" style="color: #EF4444; border-color: #FCA5A5; padding: 4px 8px; font-size: 11px; margin-top: 0;" onclick="handleDeleteMember('<?= e($m['email']) ?>')">
                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i> Remove
              </button>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Modal: Add New Athlete -->
<div id="modalAddMember" class="fs-modal-backdrop">
  <div class="fs-modal-content">
    <div style="padding: 18px 24px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between;">
      <h3 style="font-size: 17px; font-weight: 700; color: var(--text-main);">+ Enroll New Athlete</h3>
      <button type="button" onclick="closeModal('modalAddMember')" style="background: transparent; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer;">&times;</button>
    </div>
    <form onsubmit="handleCreateMemberSubmit(event)" style="padding: 20px 24px;">
      <div style="margin-bottom: 14px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Athlete Full Name *</label>
        <input type="text" id="newMemberName" class="form-input" placeholder="e.g. Karan Verma" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Email Address *</label>
          <input type="email" id="newMemberEmail" class="form-input" placeholder="karan@fitsync.health" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
        </div>
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Phone Contact</label>
          <input type="text" id="newMemberPhone" class="form-input" placeholder="+91 98765 00000" value="+91 98765 43210" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Gender</label>
          <select id="newMemberGender" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
            <option value="Male">Male</option>
            <option value="Female" selected>Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Current Weight (kg)</label>
          <input type="number" id="newMemberWeight" class="form-input" step="0.5" placeholder="62.5" value="65.0" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Primary Goal</label>
          <input type="text" id="newMemberGoal" class="form-input" placeholder="e.g. Build Muscle (Hypertrophy)" value="Build Muscle (Hypertrophy Surplus)" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
        </div>
        <div>
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Membership Tier</label>
          <select id="newMemberTier" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
            <option value="Gold" selected>Gold Pass</option>
            <option value="Platinum">Platinum Pass</option>
            <option value="Elite">Elite VIP</option>
          </select>
        </div>
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Assign Dedicated Coach</label>
        <select id="newMemberCoachSelect" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
          <?php foreach ($coaches as $coachOpt): ?>
            <option value="<?= e($coachOpt['id']) ?>">
              <?= e($coachOpt['name']) ?> (<?= e($coachOpt['title']) ?>)
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button type="button" class="btn-secondary" onclick="closeModal('modalAddMember')">Cancel</button>
        <button type="submit" class="btn-primary-block" style="width: auto; padding: 8px 20px;">Enroll Athlete</button>
      </div>
    </form>
  </div>
</div>

<script>
  function filterAthleteRows() {
    const q = (document.getElementById('memberFilterInput').value || '').toLowerCase();
    document.querySelectorAll('.athlete-row').forEach(row => {
      const name = row.getAttribute('data-name') || '';
      const goal = row.getAttribute('data-goal') || '';
      row.style.display = (name.includes(q) || goal.includes(q)) ? '' : 'none';
    });
  }

  async function handleCreateMemberSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('newMemberName').value.trim();
    const email = document.getElementById('newMemberEmail').value.trim();
    const phone = document.getElementById('newMemberPhone').value.trim();
    const gender = document.getElementById('newMemberGender').value;
    const weight = document.getElementById('newMemberWeight').value;
    const goal = document.getElementById('newMemberGoal').value;
    const membershipTier = document.getElementById('newMemberTier').value;
    const coachSelect = document.getElementById('newMemberCoachSelect');
    const assignedCoachId = coachSelect.value;
    const assignedCoachName = coachSelect.options[coachSelect.selectedIndex].text.split('(')[0].trim();

    if (window.fitSyncStore) {
      window.fitSyncStore.addMember({ name, email, phone, gender, weight, goal, membershipTier, assignedCoachId, assignedCoachName });
    }
    try {
      await fetch('<?= url('api/gym_owner/add_member.php') ?>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, gender, weight, goal, membershipTier, assignedCoachId, assignedCoachName })
      });
    } catch(err) {}
    closeModal('modalAddMember');
    alert(`Athlete ${name} enrolled successfully!`);
    window.location.reload();
  }

  async function handleReassignCoach(memberEmail, coachId) {
    if (window.fitSyncStore) {
      window.fitSyncStore.assignCoach(memberEmail, coachId);
    }
    try {
      await fetch('<?= url('api/gym_owner/assign_coach.php') ?>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberEmail, coachId })
      });
    } catch(err) {}
    alert('Coach assignment updated successfully!');
  }

  async function handleDeleteMember(email) {
    if (!confirm(`Are you sure you want to remove athlete (${email})?`)) return;
    if (window.fitSyncStore) {
      window.fitSyncStore.deleteMember(email);
    }
    try {
      await fetch('<?= url('api/gym_owner/delete_user.php') ?>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch(err) {}
    window.location.reload();
  }
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
"""

with open('gym_owner/members.php', 'w', encoding='utf-8') as f:
    f.write(members_php)

# 4. gym_owner/attendance.php
attendance_php = """<?php
/**
 * FitSync AI — Gym Owner QR Turnstile Attendance & Telemetry
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('gym_owner');

$pageTitle = 'Facility Attendance & Turnstiles — FitSync AI';
$activeNav = 'attendance';

$stats = getGymFacilityStats();
$logs = getGymTurnstileLogs();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Live Facility Turnstiles & Attendance</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Real-time check-in telemetry from optical turnstile sensors and QR scanners.</p>
  </div>
  <span class="fs-badge fs-badge-green" style="font-size: 13px; padding: 6px 14px;">
    ● Scanner Online • Gate A Active
  </span>
</div>

<div class="fs-card" style="margin-bottom: 22px;">
  <div class="card-header-row">
    <div>
      <h3 class="card-title">Turnstile Scan Logs</h3>
      <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Validated membership passes at Turnstile Gate A.</p>
    </div>
  </div>
  <div style="overflow-x: auto;">
    <table class="fs-table">
      <thead>
        <tr>
          <th>Athlete Name</th>
          <th>Scan Timestamp</th>
          <th>Membership Tier</th>
          <th>Verification Gate</th>
          <th>Turnstile Pass Status</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($logs as $log): ?>
          <tr>
            <td><strong><?= e($log['athlete_name']) ?></strong></td>
            <td style="color: var(--text-muted); font-size: 12px;"><?= e($log['check_in_time']) ?></td>
            <td><span class="badge-tier badge-tier-<?= strtolower($log['tier']) ?>"><?= e($log['tier']) ?></span></td>
            <td style="font-size: 12px; color: var(--text-secondary);"><?= e($log['gate']) ?></td>
            <td><span class="fs-badge fs-badge-green"><i data-lucide="check" style="width: 11px; height: 11px;"></i> <?= e($log['status']) ?></span></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
"""

with open('gym_owner/attendance.php', 'w', encoding='utf-8') as f:
    f.write(attendance_php)

# 5. gym_owner/settings.php
settings_php = """<?php
/**
 * FitSync AI — Gym Owner Facility Settings
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
requireRole('gym_owner');

$pageTitle = 'Facility Configuration & Settings — FitSync AI';
$activeNav = 'settings';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
  <div>
    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Facility Profile & Operational Settings</h2>
    <p style="font-size: 13px; color: var(--text-secondary);">Configure facility branding, peak capacity limits, and operating hours.</p>
  </div>
</div>

<div class="fs-card" style="max-width: 680px;">
  <form onsubmit="event.preventDefault(); alert('Facility profile configuration saved successfully!');">
    <div style="margin-bottom: 14px;">
      <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Facility Name</label>
      <input type="text" class="form-input" value="<?= e($owner['gym_name'] ?? 'FitZone Fitness Center') ?>" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;" required>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
      <div>
        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Facility Branch / City</label>
        <input type="text" class="form-input" value="<?= e($owner['city'] ?? 'Pune') ?>" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
      </div>
      <div>
        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Maximum Occupancy Limit</label>
        <input type="number" class="form-input" value="<?= (int)($owner['max_capacity'] ?? 150) ?>" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
      <div>
        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Standard Monthly Pass Fee</label>
        <input type="text" class="form-input" value="₹<?= number_format((float)($owner['monthly_fee'] ?? 3500)) ?>" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
      </div>
      <div>
        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Facility Contact Hotline</label>
        <input type="text" class="form-input" value="<?= e($owner['mobile'] ?? '+91 99000 11223') ?>" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Facility Street Address</label>
      <input type="text" class="form-input" value="<?= e($owner['address'] ?? 'Plot 42, Kothrud Main Road, Pune') ?>" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;">
    </div>

    <button type="submit" class="btn-primary-block" style="width: 100%;">Save Facility Configuration</button>
  </form>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
"""

with open('gym_owner/settings.php', 'w', encoding='utf-8') as f:
    f.write(settings_php)

print("All gym_owner PHP views created successfully!")
