<?php
/**
 * FitSync AI — Role-Specific Registration (Member, Fitness Trainer, Gym Owner)
 * Preserves FitSync design system with dynamic role cards, fieldsets,
 * secure uploads, password strength guidance, and transactional PDO persistence.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';
initSecureSession();

$requestedPortalCtx = normalizePortalKey((string)($_GET['portal_ctx'] ?? ''));
$switchAccount = !empty($_GET['switch_account']) || ($requestedPortalCtx !== '' && isLoggedIn() && !hasRole($requestedPortalCtx));

if (isLoggedIn() && !$switchAccount) {
    redirectByRole($_SESSION['active_portal'] ?? $_SESSION['role'] ?? 'user');
}

$csrfToken = getCsrfToken();

// Phase 4: Check for Gym Invitation Token
$inviteToken = trim((string)($_GET['invite'] ?? ''));
$inviteContext = null;
if ($inviteToken !== '') {
    $db = getDbConnection();
    if ($db) {
        $tHash = hash('sha256', $inviteToken);
        $iStmt = $db->prepare("
            SELECT gi.id, gi.invited_email, gi.invited_name, gi.invited_phone, gi.status, gi.expires_at,
                   g.name AS gym_name, g.city AS gym_city, mp.name AS plan_name
            FROM gym_invitations gi
            INNER JOIN gyms g ON g.id = gi.gym_id
            LEFT JOIN membership_plans mp ON mp.id = gi.plan_id
            WHERE gi.token_hash = :th AND gi.status = 'pending' AND gi.expires_at > NOW()
            LIMIT 1
        ");
        $iStmt->execute([':th' => $tHash]);
        $inviteContext = $iStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
}
$prefillEmail = $inviteContext ? (string)$inviteContext['invited_email'] : trim((string)($_GET['email'] ?? ''));
$prefillName  = $inviteContext ? (string)($inviteContext['invited_name'] ?? '') : '';
$prefillPhone = $inviteContext ? (string)($inviteContext['invited_phone'] ?? '') : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Create FitSync Account — Member, Trainer &amp; Gym Owner</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
  <style>
    body {
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      background: #F1F5F9;
      padding: 32px 16px 48px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0F172A;
    }
    .reg-shell {
      width: 100%;
      max-width: 780px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      box-shadow: 0 12px 30px -8px rgba(15, 23, 42, 0.08), 0 4px 12px -4px rgba(15, 23, 42, 0.04);
      padding: 34px 32px;
    }
    .auth-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 16px;
      text-decoration: none;
    }
    .auth-logo-icon {
      width: 40px;
      height: 40px;
      background: #155DFC;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
    }
    .auth-logo-text {
      font-size: 20px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    .auth-logo-text span { color: #155DFC; }
    .auth-title {
      font-size: 23px;
      font-weight: 800;
      color: #0F172A;
      text-align: center;
      margin: 0 0 6px;
      letter-spacing: -0.4px;
    }
    .auth-subtitle {
      font-size: 13.5px;
      color: #64748B;
      text-align: center;
      margin: 0 0 24px;
    }
    .role-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 22px;
    }
    .role-select-card {
      background: #F8FAFC;
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      padding: 18px 16px;
      cursor: pointer;
      transition: all 0.18s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: left;
    }
    .role-select-card:hover {
      border-color: #93C5FD;
      background: #F0F7FF;
      transform: translateY(-1px);
    }
    .role-select-card.active {
      border-color: #155DFC;
      background: #EFF6FF;
      box-shadow: 0 6px 16px rgba(21, 93, 252, 0.12);
    }
    .role-card-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #DBEAFE;
      color: #155DFC;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .role-select-card.active .role-card-icon {
      background: #155DFC;
      color: #FFFFFF;
    }
    .role-card-title {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .role-card-desc {
      font-size: 12px;
      color: #64748B;
      line-height: 1.45;
      margin-bottom: 14px;
    }
    .role-card-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      color: #334155;
    }
    .role-select-card.active .role-card-cta {
      background: #155DFC;
      border-color: #155DFC;
      color: #FFFFFF;
    }
    .selected-role-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 20px;
    }
    .selected-role-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #1E40AF;
    }
    .btn-change-role {
      background: #FFFFFF;
      border: 1px solid #93C5FD;
      color: #1D4ED8;
      border-radius: 7px;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-change-role:hover { background: #DBEAFE; }
    .form-section-box {
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 16px;
      background: #FFFFFF;
    }
    .section-heading {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #155DFC;
      margin: 0 0 14px;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .form-group { margin-bottom: 12px; }
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 5px;
    }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 9px 12px;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      font-size: 13.5px;
      color: #0F172A;
      font-family: inherit;
      box-sizing: border-box;
      transition: all 0.15s ease;
    }
    .form-input, .form-select { height: 40px; }
    .form-textarea { min-height: 76px; resize: vertical; }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: #155DFC;
      box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.14);
    }
    .pwd-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .pwd-wrap .form-input { padding-right: 40px; }
    .pwd-toggle-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: #64748B;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
    }
    .pwd-strength-wrap {
      margin-top: 6px;
      font-size: 11px;
      color: #64748B;
    }
    .pwd-strength-bar {
      height: 5px;
      background: #E2E8F0;
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 4px;
    }
    .pwd-strength-fill {
      height: 100%;
      width: 0%;
      transition: width 0.2s ease, background 0.2s ease;
    }
    .check-chip-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }
    .check-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 12px;
      color: #334155;
      cursor: pointer;
    }
    .notice-box {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      color: #92400E;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 12px;
      margin-top: 8px;
      line-height: 1.45;
    }
    .auth-alert {
      display: none;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .auth-alert-danger {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #B91C1C;
    }
    .auth-alert-success {
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #047857;
    }
    .btn-submit {
      width: 100%;
      height: 44px;
      background: #155DFC;
      color: #FFFFFF;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.15s ease;
    }
    .btn-submit:hover:not(:disabled) {
      background: #0E48D4;
      box-shadow: 0 4px 12px rgba(21, 93, 252, 0.25);
    }
    .btn-submit:disabled { opacity: 0.65; cursor: wait; }
    .auth-footer {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #E2E8F0;
      text-align: center;
      font-size: 13px;
      color: #64748B;
    }
    .auth-footer a { color: #155DFC; font-weight: 600; text-decoration: none; }
    .role-panel { display: none; }
    .role-panel.active { display: block; }
    @media (max-width: 680px) {
      .reg-shell { padding: 24px 18px; }
      .role-cards-grid, .grid-2, .grid-3 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="reg-shell">
    <a href="index.html" class="auth-logo">
      <div class="auth-logo-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 5v14"></path><path d="M18 5v14"></path><path d="M2 9v6"></path><path d="M22 9v6"></path><path d="M6 12h12"></path>
        </svg>
      </div>
      <div class="auth-logo-text">FitSync<span>AI</span></div>
    </a>

    <h1 class="auth-title">Create Your FitSync Account</h1>
    <p class="auth-subtitle">Select your account type to display its tailored registration workflow</p>

    <!-- STEP 0: ROLE SELECTION CARDS -->
    <div id="roleSelectionStage">
      <div class="role-cards-grid">
        <div class="role-select-card active" id="cardRoleMember" onclick="chooseRole('user')">
          <div>
            <div class="role-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="role-card-title">Gym Member</div>
            <div class="role-card-desc">Track workouts, calories, hydration, biometric goals, and gym attendance.</div>
          </div>
          <span class="role-card-cta">Select Gym Member</span>
        </div>

        <div class="role-select-card" id="cardRoleTrainer" onclick="chooseRole('trainer')">
          <div>
            <div class="role-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
              </svg>
            </div>
            <div class="role-card-title">Fitness Trainer</div>
            <div class="role-card-desc">Submit credentials, coach assigned athletes, prescribe splits, and sync progress.</div>
          </div>
          <span class="role-card-cta">Select Fitness Trainer</span>
        </div>

        <div class="role-select-card" id="cardRoleOwner" onclick="chooseRole('gym_owner')">
          <div>
            <div class="role-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path><path d="M2 21h20"></path><path d="M10 9h4"></path><path d="M10 13h4"></path>
              </svg>
            </div>
            <div class="role-card-title">Gym Owner</div>
            <div class="role-card-desc">Register your fitness facility, verify ownership, onboard coaches, and manage members.</div>
          </div>
          <span class="role-card-cta">Select Gym Owner</span>
        </div>
      </div>

      <div style="text-align: center;">
        <button type="button" class="btn-submit" style="max-width: 280px; margin: 0 auto;" onclick="proceedToRoleForm()">
          Continue to Registration Form →
        </button>
      </div>
    </div>

    <!-- REGISTRATION FORM STAGE -->
    <div id="roleFormStage" style="display: none;">
      <div class="selected-role-bar">
        <div class="selected-role-pill">
          <span>Selected Account Type:</span>
          <span id="activeRoleBadge">Gym Member</span>
        </div>
        <button type="button" class="btn-change-role" onclick="backToRoleSelection()">← Change Role</button>
      </div>

      <div id="regAlertBox" class="auth-alert"></div>

      <form id="roleRegisterForm" enctype="multipart/form-data" novalidate>
        <input type="hidden" name="csrf_token" id="csrfTokenInput" value="<?= htmlspecialchars($csrfToken) ?>">
        <input type="hidden" name="role" id="selectedRoleInput" value="user">
        <input type="hidden" name="invite_token" id="inviteTokenInput" value="<?= htmlspecialchars($inviteToken) ?>">
        <?php if ($inviteContext): ?>
          <div style="padding: 12px 16px; border-radius: 10px; background: #FFFBEB; border: 1.5px solid #FDBA74; color: #9A3412; font-size: 13px; margin-bottom: 16px;">
            <strong>Gym Invitation:</strong> You were invited to join <strong><?= htmlspecialchars($inviteContext['gym_name']) ?></strong><?= $inviteContext['gym_city'] ? ' (' . htmlspecialchars($inviteContext['gym_city']) . ')' : '' ?><?= $inviteContext['plan_name'] ? ' — ' . htmlspecialchars($inviteContext['plan_name']) : '' ?>. Complete registration &amp; verify your email to accept.
          </div>
        <?php endif; ?>

        <!-- SHARED PERSONAL ACCOUNT FIELDS -->
        <div class="form-section-box">
          <h3 class="section-heading" id="personalSectionTitle">1. Personal Information</h3>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="sharedFullName">Full Name *</label>
              <input type="text" id="sharedFullName" name="full_name" class="form-input" placeholder="e.g. Aarav Sharma" value="<?= htmlspecialchars($prefillName) ?>" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="sharedEmail">Email Address *</label>
              <input type="email" id="sharedEmail" name="email" class="form-input" placeholder="you@example.com" value="<?= htmlspecialchars($prefillEmail) ?>" <?= $inviteContext ? 'readonly style="background:#F8FAFC;cursor:not-allowed;"' : '' ?> required>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="sharedMobile" id="mobileLabel">Mobile Number <span id="mobileReqMark" style="color:#64748B;">(Optional)</span></label>
              <input type="tel" id="sharedMobile" name="mobile" class="form-input" placeholder="+91 98765 43210" value="<?= htmlspecialchars($prefillPhone) ?>">
            </div>
            <div class="form-group">
              <label class="form-label" for="sharedProfilePhoto" id="photoLabel">Profile Photo (Optional)</label>
              <input type="file" id="sharedProfilePhoto" name="profile_photo" class="form-input" accept="image/jpeg,image/png,image/webp" style="padding: 7px 10px;">
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="sharedPassword">Password (min 6 characters) *</label>
              <div class="pwd-wrap">
                <input type="password" id="sharedPassword" name="password" class="form-input" minlength="6" placeholder="Create password" required oninput="evaluatePasswordStrength(this.value)">
                <button type="button" class="pwd-toggle-btn" onclick="togglePwdVisibility('sharedPassword', this)" aria-label="Show password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
              <div class="pwd-strength-wrap">
                <div class="pwd-strength-bar"><div class="pwd-strength-fill" id="pwdStrengthFill"></div></div>
                <span id="pwdStrengthText">Use 8+ chars with uppercase, numbers, and symbols.</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="sharedConfirmPassword">Confirm Password *</label>
              <div class="pwd-wrap">
                <input type="password" id="sharedConfirmPassword" name="confirm_password" class="form-input" minlength="6" placeholder="Repeat password" required>
                <button type="button" class="pwd-toggle-btn" onclick="togglePwdVisibility('sharedConfirmPassword', this)" aria-label="Show confirm password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Shared DOB + Gender shown cleanly for Member & Trainer -->
          <div id="sharedDemographicsRow" class="grid-2">
            <div class="form-group">
              <label class="form-label" for="sharedDob" id="dobLabel">Date of Birth *</label>
              <input type="date" id="sharedDob" name="date_of_birth" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label" for="sharedGender">Gender (Optional)</label>
              <select id="sharedGender" name="gender" class="form-select">
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <!-- PANEL 1: GYM MEMBER SPECIFIC FIELDS -->
        <div class="role-panel active" id="panel-user">
          <div class="form-section-box">
            <h3 class="section-heading">2. Fitness Information</h3>
            <div class="grid-3">
              <div class="form-group">
                <label class="form-label" for="memHeight">Height (cm) *</label>
                <input type="number" id="memHeight" name="height_cm" class="form-input" placeholder="175" min="80" max="260" step="0.5" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="memWeight">Current Weight (kg) *</label>
                <input type="number" id="memWeight" name="weight_kg" class="form-input" placeholder="72.0" min="20" max="350" step="0.1" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="memExperience">Experience Level *</label>
                <select id="memExperience" name="fitness_experience" class="form-select" required>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate" selected>Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="memGoal">Primary Fitness Goal *</label>
                <select id="memGoal" name="primary_goal" class="form-select" required>
                  <option value="Weight Loss">Weight loss</option>
                  <option value="Muscle Gain" selected>Muscle gain</option>
                  <option value="Strength">Strength</option>
                  <option value="Endurance">Endurance</option>
                  <option value="General Fitness">General fitness</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="memActivity">Activity Level *</label>
                <select id="memActivity" name="activity_level" class="form-select" required>
                  <option value="1.2">Sedentary (Desk / Minimal exercise)</option>
                  <option value="1.375">Lightly Active (1-3 days/week)</option>
                  <option value="1.55" selected>Moderately Active (3-5 days/week)</option>
                  <option value="1.725">Very Active (6-7 days/week)</option>
                  <option value="1.9">Athlete / Intense Training</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section-box">
            <h3 class="section-heading">3. Gym Association (Optional)</h3>
            <div class="form-group">
              <label class="form-label" for="memGymSelect">Select a Verified Active Gym</label>
              <select id="memGymSelect" name="gym_id" class="form-select" onchange="onMemberGymChange()">
                <option value="">No gym selected yet (Browse after login)</option>
              </select>
            </div>
            <div id="memPlanSection" style="display: none; margin-top: 10px;">
              <label class="check-chip" style="margin-bottom: 10px;">
                <input type="checkbox" id="memRequestCb" name="request_membership" value="1" onchange="toggleMemberPlanDropdown()">
                <span>Request gym membership (Requires Gym Owner approval)</span>
              </label>
              <div class="form-group" id="memPlanPicker" style="display: none;">
                <label class="form-label" for="memPlanSelect">Select Membership Plan</label>
                <select id="memPlanSelect" name="plan_id" class="form-select"></select>
              </div>
            </div>
            <div class="notice-box">Memberships always begin as <strong>Pending Approval</strong> until verified by the Gym Owner. Trainers are assigned separately by the Gym Owner.</div>
          </div>
        </div>

        <!-- PANEL 2: FITNESS TRAINER SPECIFIC FIELDS -->
        <div class="role-panel" id="panel-trainer">
          <div class="form-section-box">
            <h3 class="section-heading">2. Professional Information</h3>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="trSpec">Primary Specialization *</label>
                <select id="trSpec" name="trainer_specialization" class="form-select" required onchange="toggleOtherSpecInput()">
                  <option value="Strength Training">Strength Training</option>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Muscle Building">Muscle Building</option>
                  <option value="Functional Fitness">Functional Fitness</option>
                  <option value="Cardio and Endurance">Cardio and Endurance</option>
                  <option value="Yoga">Yoga</option>
                  <option value="General Fitness">General Fitness</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="trExpYears">Years of Experience *</label>
                <input type="number" id="trExpYears" name="experience_years" class="form-input" min="0" max="50" value="2" required>
              </div>
            </div>

            <div class="form-group" id="trOtherSpecBox" style="display: none;">
              <label class="form-label" for="trOtherSpec">Specify Specialization *</label>
              <input type="text" id="trOtherSpec" name="specialization_other" class="form-input" placeholder="e.g. Kettlebell Sport / Olympic Weightlifting">
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="trQualifications">Qualifications</label>
                <input type="text" id="trQualifications" name="qualifications" class="form-input" placeholder="e.g. B.P.Ed., Diploma in Exercise Science">
              </div>
              <div class="form-group">
                <label class="form-label" for="trExpertise">Areas of Expertise</label>
                <input type="text" id="trExpertise" name="areas_of_expertise" class="form-input" placeholder="e.g. Powerlifting, Fat Loss, Mobility">
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="trCertName">Certification Title *</label>
                <input type="text" id="trCertName" name="certification_name" class="form-input" placeholder="e.g. ACE Certified Personal Trainer" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="trCertBody">Certification Issuing Organization *</label>
                <input type="text" id="trCertBody" name="certifying_body" class="form-input" placeholder="e.g. ACE / NASM / NSCA / ISSA" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="trCertDoc">Certification Document Upload (Optional: JPG, PNG, WEBP, PDF)</label>
              <input type="file" id="trCertDoc" name="certification_doc" class="form-input" accept="image/jpeg,image/png,image/webp,application/pdf" style="padding: 7px 10px;">
            </div>

            <div class="form-group">
              <label class="form-label" for="trBio">Professional Biography *</label>
              <textarea id="trBio" name="bio" class="form-textarea" placeholder="Describe your coaching background, client transformations, and specialties (min 10 chars)..." required></textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="trApproach">Training Approach</label>
              <textarea id="trApproach" name="training_approach" class="form-textarea" placeholder="Describe your programming philosophy and progression style..."></textarea>
            </div>
          </div>

          <div class="form-section-box">
            <h3 class="section-heading">3. Gym Association</h3>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="trGymSelect">Associated Gym</label>
                <select id="trGymSelect" name="gym_id" class="form-select" onchange="onTrainerGymChange()">
                  <option value="none">I am not currently associated with a gym</option>
                </select>
              </div>
              <div class="form-group" id="trEmpTypeGroup" style="display: none;">
                <label class="form-label" for="trEmpType">Employment / Affiliation Type</label>
                <select id="trEmpType" name="employment_type" class="form-select">
                  <option value="full_time">Full-Time Coach</option>
                  <option value="part_time">Part-Time Coach</option>
                  <option value="freelance">Freelance Trainer</option>
                </select>
              </div>
            </div>
            <div class="notice-box">New Trainer accounts begin with <strong>Pending Verification</strong>. If you select a gym, an affiliation request is sent to the Gym Owner for approval. Unverified trainers cannot view athlete data or assign plans until verified.</div>
          </div>
        </div>

        <!-- PANEL 3: GYM OWNER SPECIFIC FIELDS -->
        <div class="role-panel" id="panel-gym_owner">
          <div class="form-section-box">
            <h3 class="section-heading">2. Official Gym Information</h3>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="goGymName">Official Gym Name *</label>
                <input type="text" id="goGymName" name="gym_name" class="form-input" placeholder="e.g. Apex Strength Arena" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="goGymEmail">Official Gym Email *</label>
                <input type="email" id="goGymEmail" name="gym_email" class="form-input" placeholder="desk@apexgym.com" required>
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="goGymPhone">Gym Contact Number *</label>
                <input type="tel" id="goGymPhone" name="gym_phone" class="form-input" placeholder="+91 20 2500 1122" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="goGymCountry">Country *</label>
                <input type="text" id="goGymCountry" name="country" class="form-input" value="India" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="goGymAddr">Gym Street Address *</label>
              <input type="text" id="goGymAddr" name="address_line1" class="form-input" placeholder="Building / Plot / Street Road" required>
            </div>

            <div class="grid-3">
              <div class="form-group">
                <label class="form-label" for="goGymCity">City *</label>
                <input type="text" id="goGymCity" name="city" class="form-input" placeholder="Pune" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="goGymState">State *</label>
                <input type="text" id="goGymState" name="state" class="form-input" placeholder="Maharashtra" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="goGymPin">PIN Code *</label>
                <input type="text" id="goGymPin" name="postal_code" class="form-input" placeholder="411038" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="goGymDesc">Gym Description</label>
              <textarea id="goGymDesc" name="gym_description" class="form-textarea" placeholder="Describe facility zones, training culture, and specialties..."></textarea>
            </div>

            <div class="grid-3">
              <div class="form-group">
                <label class="form-label" for="goOpenTime">Opening Time</label>
                <input type="time" id="goOpenTime" name="open_time" class="form-input" value="06:00">
              </div>
              <div class="form-group">
                <label class="form-label" for="goCloseTime">Closing Time</label>
                <input type="time" id="goCloseTime" name="close_time" class="form-input" value="22:00">
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:6px;">
                <label class="check-chip" style="width:100%;justify-content:center;">
                  <input type="checkbox" name="open_sunday" value="1" checked>
                  <span>Open Sundays</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Available Facilities</label>
              <div class="check-chip-grid" id="goFacilitiesContainer"></div>
            </div>

            <div class="form-group">
              <label class="form-label">Available Equipment</label>
              <div class="check-chip-grid" id="goEquipmentContainer"></div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="goLogo">Gym Logo (Optional: JPG, PNG, WEBP)</label>
                <input type="file" id="goLogo" name="gym_logo" class="form-input" accept="image/jpeg,image/png,image/webp" style="padding:7px 10px;">
              </div>
              <div class="form-group">
                <label class="form-label" for="goPhotos">Gym Photos (Optional, up to 5)</label>
                <input type="file" id="goPhotos" name="gym_photos[]" class="form-input" accept="image/jpeg,image/png,image/webp" multiple style="padding:7px 10px;">
              </div>
            </div>
          </div>

          <div class="form-section-box">
            <h3 class="section-heading">3. Ownership Verification</h3>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="goRegNo">Business Registration / License No. (Optional)</label>
                <input type="text" id="goRegNo" name="business_registration" class="form-input" placeholder="e.g. UDYAM-MH-2026-001">
              </div>
              <div class="form-group">
                <label class="form-label" for="goOwnerDoc">Ownership / Authorization Document (Optional)</label>
                <input type="file" id="goOwnerDoc" name="ownership_doc" class="form-input" accept="image/jpeg,image/png,image/webp,application/pdf" style="padding:7px 10px;">
              </div>
            </div>
            <div class="notice-box">Your gym facility will be linked exclusively to your account with <strong>Pending Verification</strong> status until platform review. You can manage your gym profile and add coaches immediately in the Gym Owner Portal.</div>
          </div>
        </div>

        <button type="submit" id="btnSubmitReg" class="btn-submit">
          <span id="btnSubmitRegLabel">Create Gym Member Account</span>
        </button>
      </form>
    </div>

    <div class="auth-footer">
      Already have a FitSync account? <a href="login.php<?= $switchAccount ? '?switch_account=1' . ($requestedPortalCtx !== '' ? '&portal_ctx=' . urlencode($requestedPortalCtx) : '') : '' ?>">Sign In</a>
    </div>
  </div>

  <script>
    let selectedRole = 'user';
    let catalogGyms = [];
    let isSubmittingReg = false;

    const ROLE_META = {
      user: {
        label: 'Gym Member',
        cardId: 'cardRoleMember',
        btnText: 'Create Gym Member Account',
        mobileReq: false,
        dobReq: true,
        personalTitle: '1. Personal Information'
      },
      trainer: {
        label: 'Fitness Trainer',
        cardId: 'cardRoleTrainer',
        btnText: 'Submit Trainer Registration',
        mobileReq: true,
        dobReq: false,
        personalTitle: '1. Personal Information'
      },
      gym_owner: {
        label: 'Gym Owner',
        cardId: 'cardRoleOwner',
        btnText: 'Register Gym & Owner Account',
        mobileReq: true,
        dobReq: false,
        personalTitle: '1. Owner Personal Information'
      }
    };

    function chooseRole(role) {
      if (!ROLE_META[role]) return;
      selectedRole = role;
      document.querySelectorAll('.role-select-card').forEach(el => el.classList.remove('active'));
      document.getElementById(ROLE_META[role].cardId)?.classList.add('active');
    }

    function proceedToRoleForm() {
      applyRoleToForm(selectedRole);
      document.getElementById('roleSelectionStage').style.display = 'none';
      document.getElementById('roleFormStage').style.display = 'block';
    }

    function backToRoleSelection() {
      hideRegAlert();
      document.getElementById('roleFormStage').style.display = 'none';
      document.getElementById('roleSelectionStage').style.display = 'block';
    }

    function applyRoleToForm(role) {
      const meta = ROLE_META[role] || ROLE_META.user;
      document.getElementById('selectedRoleInput').value = role;
      document.getElementById('activeRoleBadge').innerText = meta.label;
      document.getElementById('btnSubmitRegLabel').innerText = meta.btnText;
      document.getElementById('personalSectionTitle').innerText = meta.personalTitle;

      const mobileEl = document.getElementById('sharedMobile');
      const mobileMark = document.getElementById('mobileReqMark');
      mobileEl.required = meta.mobileReq;
      mobileMark.innerText = meta.mobileReq ? '*' : '(Optional)';
      mobileMark.style.color = meta.mobileReq ? '#DC2626' : '#64748B';

      const dobEl = document.getElementById('sharedDob');
      const dobLbl = document.getElementById('dobLabel');
      const demoRow = document.getElementById('sharedDemographicsRow');
      if (role === 'gym_owner') {
        demoRow.style.display = 'none';
        dobEl.required = false;
      } else {
        demoRow.style.display = 'grid';
        dobEl.required = meta.dobReq;
        dobLbl.innerText = meta.dobReq ? 'Date of Birth *' : 'Date of Birth (Optional)';
      }

      document.getElementById('photoLabel').innerText = role === 'trainer' ? 'Profile Photo *' : 'Profile Photo (Optional)';

      // Show selected panel and disable hidden role fields so validation only targets active role
      ['user', 'trainer', 'gym_owner'].forEach(r => {
        const panel = document.getElementById('panel-' + r);
        const active = r === role;
        if (!panel) return;
        panel.classList.toggle('active', active);
        panel.querySelectorAll('input, select, textarea').forEach(ctrl => {
          ctrl.disabled = !active;
        });
      });

      if (role === 'trainer') toggleOtherSpecInput();
    }

    function togglePwdVisibility(inputId, btn) {
      const el = document.getElementById(inputId);
      if (!el) return;
      el.type = el.type === 'password' ? 'text' : 'password';
      btn.style.color = el.type === 'text' ? '#155DFC' : '#64748B';
    }

    function evaluatePasswordStrength(val) {
      const fill = document.getElementById('pwdStrengthFill');
      const text = document.getElementById('pwdStrengthText');
      if (!fill || !text) return;
      let score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      const states = [
        { w: '0%', c: '#E2E8F0', t: 'Use 8+ chars with uppercase, numbers, and symbols.' },
        { w: '25%', c: '#EF4444', t: 'Weak password — add numbers and uppercase letters.' },
        { w: '55%', c: '#F59E0B', t: 'Fair password — consider adding a symbol or extra length.' },
        { w: '80%', c: '#3B82F6', t: 'Good password strength.' },
        { w: '100%', c: '#10B981', t: 'Strong password.' }
      ];
      const s = states[score] || states[0];
      fill.style.width = s.w;
      fill.style.background = s.c;
      text.innerText = s.t;
    }

    function toggleOtherSpecInput() {
      const specSel = document.getElementById('trSpec');
      const otherBox = document.getElementById('trOtherSpecBox');
      const otherInput = document.getElementById('trOtherSpec');
      const isOther = specSel && specSel.value === 'Other';
      if (otherBox) otherBox.style.display = isOther ? 'block' : 'none';
      if (otherInput) otherInput.required = isOther && selectedRole === 'trainer';
    }

    function onMemberGymChange() {
      const gid = parseInt(document.getElementById('memGymSelect').value || '0', 10);
      const sec = document.getElementById('memPlanSection');
      const planSel = document.getElementById('memPlanSelect');
      const reqCb = document.getElementById('memRequestCb');
      if (!gid) {
        sec.style.display = 'none';
        reqCb.checked = false;
        toggleMemberPlanDropdown();
        return;
      }
      const gym = catalogGyms.find(g => parseInt(g.id, 10) === gid);
      const plans = gym && Array.isArray(gym.plans) ? gym.plans : [];
      if (plans.length > 0) {
        planSel.innerHTML = plans.map(p => `<option value="${p.id}">${p.name} — ₹${Number(p.price).toLocaleString()} (${p.duration_months} mo)</option>`).join('');
      } else {
        planSel.innerHTML = '<option value="">No active plans listed for this gym</option>';
      }
      sec.style.display = 'block';
    }

    function toggleMemberPlanDropdown() {
      const cb = document.getElementById('memRequestCb');
      const picker = document.getElementById('memPlanPicker');
      picker.style.display = cb && cb.checked ? 'block' : 'none';
    }

    function onTrainerGymChange() {
      const val = document.getElementById('trGymSelect').value;
      document.getElementById('trEmpTypeGroup').style.display = (val && val !== 'none') ? 'block' : 'none';
    }

    function showRegAlert(msg, isSuccess = false) {
      const box = document.getElementById('regAlertBox');
      if (!box) return;
      box.className = 'auth-alert ' + (isSuccess ? 'auth-alert-success' : 'auth-alert-danger');
      box.innerText = msg;
      box.style.display = 'block';
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideRegAlert() {
      const box = document.getElementById('regAlertBox');
      if (box) box.style.display = 'none';
    }

    async function loadRegistrationCatalog() {
      try {
        const res = await fetch('api/auth/register_options.php');
        const json = await res.json();
        if (!json.success || !json.data) return;

        catalogGyms = Array.isArray(json.data.gyms) ? json.data.gyms : [];
        const memGymSel = document.getElementById('memGymSelect');
        const trGymSel = document.getElementById('trGymSelect');

        if (memGymSel) {
          memGymSel.innerHTML = '<option value="">No gym selected yet (Browse after login)</option>' +
            catalogGyms.map(g => `<option value="${g.id}">${g.name} (${g.city}, ${g.state})</option>`).join('');
        }
        if (trGymSel) {
          trGymSel.innerHTML = '<option value="none">I am not currently associated with a gym</option>' +
            catalogGyms.map(g => `<option value="${g.id}">${g.name} (${g.city}, ${g.state})</option>`).join('');
        }

        const facBox = document.getElementById('goFacilitiesContainer');
        if (facBox && Array.isArray(json.data.facilities)) {
          facBox.innerHTML = json.data.facilities.map(f => `
            <label class="check-chip">
              <input type="checkbox" name="facilities[]" value="${f.id}">
              <span>${f.name}</span>
            </label>
          `).join('');
        }

        const eqBox = document.getElementById('goEquipmentContainer');
        if (eqBox && Array.isArray(json.data.equipment)) {
          eqBox.innerHTML = json.data.equipment.map(eq => `
            <label class="check-chip">
              <input type="checkbox" name="equipment[]" value="${eq.id}">
              <span>${eq.name}</span>
            </label>
          `).join('');
        }
      } catch (err) {
        console.warn('Could not load registration catalog:', err);
      }
    }

    document.getElementById('roleRegisterForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      if (isSubmittingReg) return;
      hideRegAlert();

      if (!this.checkValidity()) {
        this.reportValidity();
        return;
      }

      const pwd = document.getElementById('sharedPassword').value;
      const conf = document.getElementById('sharedConfirmPassword').value;
      if (pwd !== conf) {
        showRegAlert('Password and confirmation password do not match.');
        return;
      }

      isSubmittingReg = true;
      const submitBtn = document.getElementById('btnSubmitReg');
      const labelEl = document.getElementById('btnSubmitRegLabel');
      const origText = labelEl.innerText;
      submitBtn.disabled = true;
      labelEl.innerText = 'Creating Account...';

      try {
        const formData = new FormData(this);
        const res = await fetch('api/auth/register.php', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': document.getElementById('csrfTokenInput').value
          },
          body: formData
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json && json.success) {
          if (json.pending_invitation_id && json.verification_code) {
            showRegAlert(`Account created! Verification code: ${json.verification_code}. Verifying email & redirecting to your portal...`, true);
            await fetch('api/auth/verify_email.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': document.getElementById('csrfTokenInput').value },
              body: JSON.stringify({ code: json.verification_code })
            }).catch(() => {});
            window.location.href = (json.redirect || 'index.php') + '?view=membership';
            return;
          }
          showRegAlert(json.message || 'Account created! Redirecting to your portal...', true);
          setTimeout(() => {
            window.location.href = json.redirect || 'index.html';
          }, 700);
          return;
        }
        showRegAlert((json && json.message) ? json.message : 'Registration failed. Please check your entries.');
      } catch (err) {
        showRegAlert('Network or server error while creating your account.');
      } finally {
        isSubmittingReg = false;
        submitBtn.disabled = false;
        labelEl.innerText = origText;
      }
    });

    window.addEventListener('DOMContentLoaded', () => {
      applyRoleToForm('user');
      <?php if ($inviteContext): ?>
      if (typeof selectRoleCard === 'function') selectRoleCard('user');
      <?php endif; ?>
      loadRegistrationCatalog();
    });
  </script>
</body>
</html>
