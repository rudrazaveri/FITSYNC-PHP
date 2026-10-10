// FitSync AI — Interactive Application Engine & Prototype Controller
import { FITSYNC_DATA } from './data.js';

// State Management
const state = {
  activePage: 'member', // 'member' | 'trainer' | 'doctor' | 'physio' | 'gym-admin' | 'platform-admin' | 'design-system' | 'prototype-flow'
  activeMemberTab: 'home', // 'home' | 'workout' | 'nutrition' | 'health' | 'profile'
  memberSubScreen: 'dashboard', // 'welcome' | 'register' | 'gym-select' | 'assessment' | 'assessment-result' | 'dashboard' | 'workout-detail' | 'exercise-lib' | 'trainer-profile' | 'doctor-profile' | 'physio-profile' | 'appointments' | 'health-reports' | 'progress'
  assessmentStep: 1, // 1 to 4
  assessmentData: {
    age: 23,
    gender: 'Male',
    heightCm: 175,
    weightKg: 72.4,
    waistCm: 81,
    neckCm: 38,
    hipCm: 96,
    activity: 'Moderately Active',
    frequency: '4–5 days/week',
    goal: 'Build Muscle',
    diet: 'Non-Vegetarian',
    allergies: ['Peanuts']
  },
  soundEnabled: true,
  viewportMode: 'mobile', // 'mobile' | 'fluid'
  isAiDrawerOpen: false,
  isVideoCallActive: false,
  videoCallSeconds: 0,
  videoCallInterval: null,
  isCameraOn: true,
  isMicOn: true,
  searchQuery: '',
  selectedTrainer: FITSYNC_DATA.trainers[0],
  selectedDoctor: FITSYNC_DATA.doctors[0],
  selectedPhysio: FITSYNC_DATA.physiotherapists[0],
  activeExerciseForModal: FITSYNC_DATA.todayWorkout.exercises[0],
  isExerciseModalOpen: false,
  isReportUploadOpen: false,
  isAppointmentModalOpen: false,
  isNotificationsOpen: false,
  appointmentBookingStep: 1,
  appointmentDraft: {
    provider: FITSYNC_DATA.physiotherapists[0],
    date: 'Today, Oct 7',
    time: '05:30 PM',
    type: 'Online Video Consultation'
  },
  user: JSON.parse(JSON.stringify(FITSYNC_DATA.currentUser)),
  workout: JSON.parse(JSON.stringify(FITSYNC_DATA.todayWorkout)),
  appointments: JSON.parse(JSON.stringify(FITSYNC_DATA.appointments)),
  reports: JSON.parse(JSON.stringify(FITSYNC_DATA.healthReports)),
  reactionLogs: JSON.parse(JSON.stringify(FITSYNC_DATA.foodReactionLogs)),
  chatHistory: [
    { sender: 'ai', text: 'Hello Aarav! I am your FitSync AI Coach. I have your fitness metrics (BMR 1,720 kcal, TDEE 2,450 kcal) and peanut allergy logged. How can I help power your training and nutrition today?' }
  ]
};

// ==========================================================================
// Web Audio API Synthesizer for Tactile Native-Feel Haptics
// ==========================================================================
const audioCtx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

export function playHaptic(type = 'tap') {
  if (!state.soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'ai') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    // Ignore audio policy errors
  }
}

// Show Toast HUD
export function showToast(message, icon = '✨') {
  const toast = document.getElementById('toastHud');
  if (!toast) return;
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toast.classList.add('active');
  playHaptic('success');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3200);
}

// Format Seconds to MM:SS
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ==========================================================================
// Health & Fitness Mathematical Assessment Engine
// ==========================================================================
function calculateHealthMetrics(d = state.assessmentData) {
  const hM = d.heightCm / 100;
  const bmi = +(d.weightKg / (hM * hM)).toFixed(1);

  // Mifflin-St Jeor Formula
  let bmr = Math.round(10 * d.weightKg + 6.25 * d.heightCm - 5 * d.age + (d.gender === 'Male' ? 5 : -161));

  // Activity multipliers
  const actMult = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extremely Active': 1.9
  }[d.activity] || 1.55;

  const tdee = Math.round(bmr * actMult);

  // Goal calorie adjustment
  let calorieTarget = tdee;
  let recommendation = 'Maintenance (Caloric Equilibrium)';
  if (d.goal === 'Build Muscle' || d.goal === 'Increase Strength') {
    calorieTarget = tdee + 250;
    recommendation = 'Calorie Surplus (+250 kcal for Hypertrophy)';
  } else if (d.goal === 'Lose Weight') {
    calorieTarget = Math.max(1400, tdee - 500);
    recommendation = 'Calorie Deficit (-500 kcal for Fat Loss)';
  }

  // Macronutrient calculation
  const proteinG = Math.round(d.weightKg * 2.1); // 2.1g per kg for athletic muscle support
  const fatG = Math.round((calorieTarget * 0.25) / 9); // 25% of calories
  const carbsG = Math.round((calorieTarget - (proteinG * 4 + fatG * 9)) / 4);
  const hydrationTargetL = +(d.weightKg * 0.045).toFixed(1); // 3.2 - 3.5 L

  // Estimated Body Fat via Navy Method if waist/neck provided
  let bodyFatEst = '14.5%';
  if (d.gender === 'Male' && d.waistCm && d.neckCm) {
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(d.waistCm - d.neckCm) + 0.15456 * Math.log10(d.heightCm)) - 450;
    bodyFatEst = `${Math.max(8, Math.min(35, bf)).toFixed(1)}%`;
  }

  return {
    bmi,
    bmiCategory: bmi < 18.5 ? 'Underweight' : bmi < 24.9 ? 'Normal & Optimal' : bmi < 29.9 ? 'Overweight' : 'Obese',
    bmr,
    tdee,
    calorieTarget,
    recommendation,
    proteinG,
    carbsG,
    fatG,
    hydrationTargetL,
    bodyFatEst,
    fitnessScore: 82,
    activityScore: 85,
    strengthScore: 80,
    consistencyScore: 88,
    nutritionScore: 78
  };
}

// ==========================================================================
// RENDERERS FOR ALL PAGES & ROLES
// ==========================================================================

export function initApp() {
  bindGlobalEvents();
  renderCurrentView();
  startHardwareClock();
}

function startHardwareClock() {
  const clockEl = document.getElementById('hardwareClock');
  if (!clockEl) return;
  const update = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  update();
  setInterval(update, 30000);
}

// Global Event Listeners
function bindGlobalEvents() {
  // Page/Role switcher tabs
  document.querySelectorAll('.page-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playHaptic('tap');
      state.activePage = btn.dataset.page;
      document.querySelectorAll('.page-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCurrentView();
    });
  });

  // Viewport mode switcher
  const viewMobile = document.getElementById('viewMobileBtn');
  const viewFluid = document.getElementById('viewFluidBtn');
  const mainViewport = document.getElementById('mainViewport');

  if (viewMobile && viewFluid) {
    viewMobile.addEventListener('click', () => {
      playHaptic('tap');
      state.viewportMode = 'mobile';
      viewMobile.classList.add('active');
      viewFluid.classList.remove('active');
      mainViewport.classList.remove('fluid-mode');
    });

    viewFluid.addEventListener('click', () => {
      playHaptic('tap');
      state.viewportMode = 'fluid';
      viewFluid.classList.add('active');
      viewMobile.classList.remove('active');
      mainViewport.classList.add('fluid-mode');
    });
  }

  // Sound toggle button
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      soundToggleBtn.textContent = state.soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      playHaptic('tap');
    });
  }

  // Floating AI Assistant Button
  const floatingAiBtn = document.getElementById('floatingAiBtn');
  if (floatingAiBtn) {
    floatingAiBtn.addEventListener('click', () => {
      playHaptic('ai');
      openAiDrawer();
    });
  }
}

// Master Render Router
function renderCurrentView() {
  const screenScroll = document.getElementById('screenScrollContainer');
  const memberBottomNav = document.getElementById('memberBottomNav');
  const floatingAiBtn = document.getElementById('floatingAiBtn');
  const phoneDeviceFrame = document.querySelector('.mobile-device-frame');

  if (!screenScroll) return;

  // Clear previous content
  screenScroll.innerHTML = '';

  // Bottom nav visibility
  if (state.activePage === 'member' && !['welcome', 'register', 'gym-select', 'assessment'].includes(state.memberSubScreen)) {
    memberBottomNav.style.display = 'flex';
    floatingAiBtn.style.display = 'flex';
  } else {
    memberBottomNav.style.display = 'none';
    floatingAiBtn.style.display = 'none';
  }

  switch (state.activePage) {
    case 'member':
      renderMemberPage(screenScroll);
      break;
    case 'trainer':
      renderTrainerPage(screenScroll);
      break;
    case 'doctor':
      renderDoctorPage(screenScroll);
      break;
    case 'physio':
      renderPhysioPage(screenScroll);
      break;
    case 'gym-admin':
      renderGymAdminPage(screenScroll);
      break;
    case 'platform-admin':
      renderPlatformAdminPage(screenScroll);
      break;
    case 'design-system':
      renderDesignSystemPage(screenScroll);
      break;
    case 'prototype-flow':
      renderPrototypeFlowPage(screenScroll);
      break;
    default:
      renderMemberPage(screenScroll);
  }

  // Auto-scroll to top on view change
  screenScroll.scrollTop = 0;
}

// ==========================================================================
// 1. MEMBER APP (All Flows & Screens)
// ==========================================================================
function renderMemberPage(container) {
  // Check if we are in onboarding sub-screens
  if (state.memberSubScreen === 'welcome') {
    container.innerHTML = getWelcomeScreenHtml();
    bindWelcomeEvents();
    return;
  }
  if (state.memberSubScreen === 'register') {
    container.innerHTML = getRegistrationScreenHtml();
    bindRegistrationEvents();
    return;
  }
  if (state.memberSubScreen === 'gym-select') {
    container.innerHTML = getGymSelectionHtml();
    bindGymSelectEvents();
    return;
  }
  if (state.memberSubScreen === 'assessment') {
    container.innerHTML = getAssessmentScreenHtml();
    bindAssessmentEvents();
    return;
  }
  if (state.memberSubScreen === 'assessment-result') {
    container.innerHTML = getAssessmentResultHtml();
    bindAssessmentResultEvents();
    return;
  }

  // Main Authenticated Member Tabs
  if (state.activeMemberTab === 'home') {
    container.innerHTML = getMemberHomeHtml();
    bindMemberHomeEvents();
  } else if (state.activeMemberTab === 'workout') {
    container.innerHTML = getWorkoutModuleHtml();
    bindWorkoutEvents();
  } else if (state.activeMemberTab === 'nutrition') {
    container.innerHTML = getNutritionModuleHtml();
    bindNutritionEvents();
  } else if (state.activeMemberTab === 'health') {
    container.innerHTML = getHealthHubHtml();
    bindHealthHubEvents();
  } else if (state.activeMemberTab === 'profile') {
    container.innerHTML = getMemberProfileHtml();
    bindProfileEvents();
  }

  // Bind bottom nav active states
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === state.activeMemberTab);
    btn.onclick = () => {
      playHaptic('tap');
      state.activeMemberTab = btn.dataset.tab;
      state.memberSubScreen = 'dashboard';
      renderCurrentView();
    };
  });
}

// --------------------------------------------------------------------------
// Member Sub-Screens: Welcome, Registration, Gym Selection, Assessment
// --------------------------------------------------------------------------
function getWelcomeScreenHtml() {
  return `
    <div class="screen-wrapper" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 40px 24px 20px;">
      <div style="text-align: center; margin-top: 40px;">
        <img src="assets/logo.jpg" alt="FitSync AI Logo" style="width: 100px; height: 100px; border-radius: 26px; box-shadow: var(--shadow-glow-fitness); border: 2px solid var(--fitness-primary); margin-bottom: 24px;" />
        <h1 style="font-family: var(--font-headline); font-size: 32px; font-weight: 800; letter-spacing: -0.03em; color: #fff;">FitSync <span style="background: var(--ai-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI</span></h1>
        <p style="font-size: 14px; font-weight: 600; color: var(--fitness-primary); margin-top: 6px; letter-spacing: 0.04em; text-transform: uppercase;">Your Fitness. Your Health. Your Intelligence.</p>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 14px; line-height: 1.6; max-width: 280px; margin-left: auto; margin-right: auto;">
          The unified commercial ecosystem connecting you with elite gyms, certified trainers, sports doctors, and predictive nutrition.
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
        <button id="btnGetStarted" class="btn btn-primary-fitness" style="width: 100%; font-size: 15px; padding: 14px;">
          Get Started ✨
        </button>
        <button id="btnLoginDirect" class="btn btn-outline" style="width: 100%; font-size: 14px;">
          Already have an account? Login
        </button>
      </div>
    </div>
  `;
}

function bindWelcomeEvents() {
  document.getElementById('btnGetStarted')?.addEventListener('click', () => {
    playHaptic('tap');
    state.memberSubScreen = 'register';
    renderCurrentView();
  });
  document.getElementById('btnLoginDirect')?.addEventListener('click', () => {
    playHaptic('tap');
    state.memberSubScreen = 'dashboard';
    showToast('Welcome back, Aarav!', '👋');
    renderCurrentView();
  });
}

function getRegistrationScreenHtml() {
  return `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <button id="regBackBtn" class="icon-btn-pill" style="width: 32px; height: 32px;">←</button>
        <div style="text-align: center;">
          <h2 class="screen-title" style="font-size: 18px;">Create FitSync Account</h2>
          <p class="screen-subtitle">Join the intelligent fitness network</p>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="card-glass" style="margin-top: 8px;">
        <div class="input-group">
          <label class="input-label">Full Name</label>
          <input type="text" id="regName" class="input-field" value="Aarav Shah" />
        </div>
        <div class="input-group">
          <label class="input-label">Email Address</label>
          <input type="email" id="regEmail" class="input-field" value="aarav.shah@fitsync.health" />
        </div>
        <div class="input-group">
          <label class="input-label">Phone Number</label>
          <input type="tel" id="regPhone" class="input-field" value="+91 98250 14829" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="input-group">
            <label class="input-label">Date of Birth</label>
            <input type="date" id="regDob" class="input-field" value="2003-04-18" />
          </div>
          <div class="input-group">
            <label class="input-label">Gender</label>
            <select id="regGender" class="input-field">
              <option value="Male" selected>Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Password</label>
          <input type="password" class="input-field" value="••••••••••••" />
        </div>
        <div class="input-group">
          <label class="input-label">Confirm Password</label>
          <input type="password" class="input-field" value="••••••••••••" />
        </div>

        <button id="btnCreateAccount" class="btn btn-primary-fitness" style="width: 100%; margin-top: 10px;">
          Create Account & Find Gym →
        </button>
      </div>
    </div>
  `;
}

function bindRegistrationEvents() {
  document.getElementById('regBackBtn')?.addEventListener('click', () => {
    playHaptic('tap');
    state.memberSubScreen = 'welcome';
    renderCurrentView();
  });
  document.getElementById('btnCreateAccount')?.addEventListener('click', () => {
    playHaptic('tap');
    state.memberSubScreen = 'gym-select';
    showToast('Account Created! Select your gym.', '🏢');
    renderCurrentView();
  });
}

function getGymSelectionHtml() {
  const gymsList = FITSYNC_DATA.gyms.map(gym => `
    <div class="card-glass card-glass-interactive gym-card-choice" data-gym-id="${gym.id}" style="margin-bottom: 12px; border: ${gym.id === state.user.gymId ? '2px solid var(--fitness-primary)' : '1px solid var(--surface-glass-border)'};">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h3 style="font-family: var(--font-headline); font-size: 16px; color: #fff; font-weight: 700;">${gym.name}</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">📍 ${gym.location} • <span style="color: var(--fitness-primary); font-weight: 600;">${gym.distance}</span></p>
        </div>
        <span class="badge badge-fitness">★ ${gym.rating}</span>
      </div>

      <div style="display: flex; gap: 8px; margin: 10px 0; font-size: 11px; color: var(--text-secondary);">
        <span>🏋️ ${gym.availableTrainers} Trainers</span>
        <span>•</span>
        <span>👥 ${gym.totalMembers} Members</span>
        <span>•</span>
        <span>🟢 86% Attendance</span>
      </div>

      <div style="font-size: 11px; color: var(--text-muted); background: var(--surface-2); padding: 8px 10px; border-radius: 8px; margin-bottom: 10px;">
        💡 <strong>Highlights:</strong> ${gym.equipmentHighlights || gym.features.join(', ')}
      </div>

      <button class="btn ${gym.id === state.user.gymId ? 'btn-primary-fitness' : 'btn-secondary'} btn-sm btn-join-gym" data-gym-id="${gym.id}" style="width: 100%;">
        ${gym.id === state.user.gymId ? 'Selected Gym ✓' : 'Join This Gym'}
      </button>
    </div>
  `).join('');

  return `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <button id="gymBackBtn" class="icon-btn-pill" style="width: 32px; height: 32px;">←</button>
        <div style="text-align: center;">
          <h2 class="screen-title" style="font-size: 18px;">Find Your Gym</h2>
          <p class="screen-subtitle">Connect to a FitSync Network Branch</p>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <div class="input-group" style="margin-bottom: 6px;">
        <input type="text" id="gymSearchInput" class="input-field" placeholder="🔍 Search gym by name or location (e.g. Vadodara)..." value="Vadodara" />
      </div>

      <div style="display: flex; flex-direction: column;">
        ${gymsList}
      </div>

      <div style="text-align: center; margin-top: 6px;">
        <button id="btnNoGymYet" class="btn btn-outline btn-sm" style="width: 100%;">
          I don't have a gym yet (Independent Plan)
        </button>
      </div>
    </div>
  `;
}

function bindGymSelectEvents() {
  document.getElementById('gymBackBtn')?.addEventListener('click', () => {
    playHaptic('tap');
    state.memberSubScreen = 'register';
    renderCurrentView();
  });

  document.querySelectorAll('.btn-join-gym').forEach(btn => {
    btn.addEventListener('click', () => {
      playHaptic('tap');
      state.user.gymId = btn.dataset.gymId;
      state.memberSubScreen = 'assessment';
      state.assessmentStep = 1;
      showToast('Joined FitZone! Now build your Health Profile', '🩺');
      renderCurrentView();
    });
  });

  document.getElementById('btnNoGymYet')?.addEventListener('click', () => {
    playHaptic('tap');
    state.memberSubScreen = 'assessment';
    state.assessmentStep = 1;
    renderCurrentView();
  });
}

// --------------------------------------------------------------------------
// SENSES-STYLE HEALTH & FITNESS ASSESSMENT (Steps 1 to 4 + Results)
// --------------------------------------------------------------------------
function getAssessmentScreenHtml() {
  const step = state.assessmentStep;
  const d = state.assessmentData;

  let stepContent = '';

  if (step === 1) {
    stepContent = `
      <h3 style="font-family: var(--font-headline); font-size: 16px; color: #fff; margin-bottom: 4px;">Step 1 — Body Information</h3>
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">Accurate biometric metrics help us determine your baseline metabolic rate.</p>

      <div class="card-glass">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="input-group">
            <label class="input-label">Age (Years)</label>
            <input type="number" id="inputAge" class="input-field" value="${d.age}" />
          </div>
          <div class="input-group">
            <label class="input-label">Gender</label>
            <select id="inputGender" class="input-field">
              <option value="Male" ${d.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Female" ${d.gender === 'Female' ? 'selected' : ''}>Female</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="input-group">
            <label class="input-label">Height (cm)</label>
            <input type="number" id="inputHeight" class="input-field" value="${d.heightCm}" />
          </div>
          <div class="input-group">
            <label class="input-label">Weight (kg)</label>
            <input type="number" id="inputWeight" class="input-field" step="0.1" value="${d.weightKg}" />
          </div>
        </div>

        <div style="border-top: 1px solid var(--surface-glass-border); padding-top: 12px; margin-top: 4px;">
          <p style="font-size: 11px; color: var(--fitness-primary); font-weight: 700; margin-bottom: 8px;">Optional Tape Measurements (Navy Body Fat Method):</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
            <div class="input-group">
              <label class="input-label" style="font-size: 10px;">Waist (cm)</label>
              <input type="number" id="inputWaist" class="input-field" value="${d.waistCm}" />
            </div>
            <div class="input-group">
              <label class="input-label" style="font-size: 10px;">Neck (cm)</label>
              <input type="number" id="inputNeck" class="input-field" value="${d.neckCm}" />
            </div>
            <div class="input-group">
              <label class="input-label" style="font-size: 10px;">Hip (cm)</label>
              <input type="number" id="inputHip" class="input-field" value="${d.hipCm}" />
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (step === 2) {
    stepContent = `
      <h3 style="font-family: var(--font-headline); font-size: 16px; color: #fff; margin-bottom: 4px;">Step 2 — Activity & Exercise</h3>
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">How active are you in your daily work and workouts?</p>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'].map(act => `
          <div class="card-glass card-glass-interactive act-choice-card" data-val="${act}" style="padding: 12px; border: ${d.activity === act ? '2px solid var(--fitness-primary)' : '1px solid var(--surface-glass-border)'};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: #fff; font-size: 13px;">${act}</strong>
                <p style="font-size: 11px; color: var(--text-muted);">
                  ${act === 'Sedentary' ? 'Desk job, little intentional exercise' :
                    act === 'Moderately Active' ? 'Moderate exercise 3-5 days/week or active job' :
                    act === 'Very Active' ? 'Hard training 6-7 days/week or physical labor' : 'Consistent daily movement'}
                </p>
              </div>
              <span style="font-size: 16px;">${d.activity === act ? '🟢' : '⚪'}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card-glass" style="margin-top: 14px;">
        <label class="input-label" style="margin-bottom: 8px;">How often do you exercise?</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${['0–1 days/week', '2–3 days/week', '4–5 days/week', '6–7 days/week'].map(freq => `
            <button class="btn ${d.frequency === freq ? 'btn-primary-fitness' : 'btn-secondary'} btn-sm freq-btn" data-freq="${freq}">
              ${freq}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  } else if (step === 3) {
    stepContent = `
      <h3 style="font-family: var(--font-headline); font-size: 16px; color: #fff; margin-bottom: 4px;">Step 3 — Primary Fitness Goal</h3>
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">Choose your main objective to configure your calorie and macro split.</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        ${[
          { name: 'Build Muscle', icon: '💪', desc: 'Hypertrophy & strength' },
          { name: 'Lose Weight', icon: '🔥', desc: 'Fat loss & calorie deficit' },
          { name: 'Maintain Weight', icon: '⚖️', desc: 'Recomposition & fitness' },
          { name: 'Increase Strength', icon: '🏋️', desc: 'Compound powerlifting' },
          { name: 'Improve Flexibility', icon: '🧘', desc: 'Mobility & joint health' },
          { name: 'General Wellness', icon: '❤️', desc: 'Longevity & cardio stamina' }
        ].map(goal => `
          <div class="card-glass card-glass-interactive goal-choice-card" data-goal="${goal.name}" style="padding: 14px; text-align: center; border: ${d.goal === goal.name ? '2px solid var(--fitness-primary)' : '1px solid var(--surface-glass-border)'};">
            <div style="font-size: 26px; margin-bottom: 6px;">${goal.icon}</div>
            <strong style="color: #fff; font-size: 13px; display: block;">${goal.name}</strong>
            <span style="font-size: 10px; color: var(--text-muted);">${goal.desc}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else if (step === 4) {
    stepContent = `
      <h3 style="font-family: var(--font-headline); font-size: 16px; color: #fff; margin-bottom: 4px;">Step 4 — Nutrition & Dietary Safety</h3>
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">Dietary restrictions & allergen safety checks.</p>

      <div class="card-glass" style="margin-bottom: 12px;">
        <label class="input-label" style="margin-bottom: 8px;">Dietary Preference</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${['Non-Vegetarian', 'Vegetarian', 'Vegan', 'Eggetarian'].map(pref => `
            <button class="btn ${d.diet === pref ? 'btn-primary-fitness' : 'btn-secondary'} btn-sm diet-btn" data-diet="${pref}">
              ${pref}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="card-glass">
        <label class="input-label" style="margin-bottom: 4px; color: #f87171;">⚠️ Food Allergies (FitSync Safety Filter):</label>
        <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">Select any known allergies. FitSync AI will flag potential conflicts in meals.</p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${['Peanuts', 'Milk', 'Eggs', 'Seafood', 'Gluten', 'Soy'].map(allergy => {
            const hasAllergy = d.allergies.includes(allergy);
            return `
              <button class="btn ${hasAllergy ? 'btn-danger' : 'btn-outline'} btn-sm allergy-toggle-btn" data-allergy="${allergy}">
                ${hasAllergy ? '🔴 ' : ''}${allergy}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <button id="assessmentBackBtn" class="icon-btn-pill" style="width: 32px; height: 32px;">←</button>
        <div style="text-align: center;">
          <h2 class="screen-title" style="font-size: 18px;">Build Your Health Profile</h2>
          <p class="screen-subtitle">Senses-Style Clinical Assessment</p>
        </div>
        <div style="width: 32px;"></div>
      </div>

      <!-- Multi-step progress indicator -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin: 4px 0 10px;">
        ${[1, 2, 3, 4].map(s => `
          <div style="display: flex; align-items: center; flex: 1;">
            <div style="width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: ${s <= step ? 'var(--fitness-primary)' : 'var(--surface-3)'}; color: ${s <= step ? '#0b0f17' : 'var(--text-muted)'};">
              ${s}
            </div>
            ${s < 4 ? `<div style="flex: 1; height: 3px; background: ${s < step ? 'var(--fitness-primary)' : 'var(--surface-3)'}; margin: 0 4px;"></div>` : ''}
          </div>
        `).join('')}
      </div>

      ${stepContent}

      <div style="margin-top: 14px;">
        <button id="assessmentNextBtn" class="btn btn-primary-fitness" style="width: 100%;">
          ${step === 4 ? 'Compute FitSync Health Profile 🧠 →' : 'Continue to Next Step →'}
        </button>
      </div>
    </div>
  `;
}

function bindAssessmentEvents() {
  document.getElementById('assessmentBackBtn')?.addEventListener('click', () => {
    playHaptic('tap');
    if (state.assessmentStep > 1) {
      state.assessmentStep--;
      renderCurrentView();
    } else {
      state.memberSubScreen = 'gym-select';
      renderCurrentView();
    }
  });

  // Step 1 inputs
  const ageEl = document.getElementById('inputAge');
  const heightEl = document.getElementById('inputHeight');
  const weightEl = document.getElementById('inputWeight');
  const genderEl = document.getElementById('inputGender');
  const waistEl = document.getElementById('inputWaist');
  const neckEl = document.getElementById('inputNeck');
  const hipEl = document.getElementById('inputHip');

  // Step 2 buttons
  document.querySelectorAll('.act-choice-card').forEach(card => {
    card.addEventListener('click', () => {
      playHaptic('tap');
      state.assessmentData.activity = card.dataset.val;
      renderCurrentView();
    });
  });
  document.querySelectorAll('.freq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playHaptic('tap');
      state.assessmentData.frequency = btn.dataset.freq;
      renderCurrentView();
    });
  });

  // Step 3 goals
  document.querySelectorAll('.goal-choice-card').forEach(card => {
    card.addEventListener('click', () => {
      playHaptic('tap');
      state.assessmentData.goal = card.dataset.goal;
      renderCurrentView();
    });
  });

  // Step 4 nutrition & allergies
  document.querySelectorAll('.diet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playHaptic('tap');
      state.assessmentData.diet = btn.dataset.diet;
      renderCurrentView();
    });
  });

  document.querySelectorAll('.allergy-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playHaptic('tap');
      const al = btn.dataset.allergy;
      if (state.assessmentData.allergies.includes(al)) {
        state.assessmentData.allergies = state.assessmentData.allergies.filter(x => x !== al);
      } else {
        state.assessmentData.allergies.push(al);
      }
      renderCurrentView();
    });
  });

  document.getElementById('assessmentNextBtn')?.addEventListener('click', () => {
    playHaptic('tap');
    if (state.assessmentStep === 1) {
      if (ageEl) state.assessmentData.age = +ageEl.value || 23;
      if (heightEl) state.assessmentData.heightCm = +heightEl.value || 175;
      if (weightEl) state.assessmentData.weightKg = +weightEl.value || 72.4;
      if (genderEl) state.assessmentData.gender = genderEl.value;
      if (waistEl) state.assessmentData.waistCm = +waistEl.value || 81;
      if (neckEl) state.assessmentData.neckCm = +neckEl.value || 38;
      if (hipEl) state.assessmentData.hipCm = +hipEl.value || 96;
    }

    if (state.assessmentStep < 4) {
      state.assessmentStep++;
      renderCurrentView();
    } else {
      // Calculate and save to state
      const computed = calculateHealthMetrics();
      state.user.metrics = {
        bmi: computed.bmi,
        bmiCategory: computed.bmiCategory,
        bmr: computed.bmr,
        tdee: computed.tdee,
        bodyFatEst: computed.bodyFatEst,
        waistCm: state.assessmentData.waistCm,
        neckCm: state.assessmentData.neckCm,
        hipCm: state.assessmentData.hipCm
      };
      state.user.calorieTarget = computed.calorieTarget;
      state.user.proteinTarget = computed.proteinG;
      state.user.carbsTarget = computed.carbsG;
      state.user.fatTarget = computed.fatG;
      state.user.waterTargetMl = Math.round(computed.hydrationTargetL * 1000);
      state.memberSubScreen = 'assessment-result';
      playHaptic('success');
      renderCurrentView();
    }
  });
}

function getAssessmentResultHtml() {
  const m = calculateHealthMetrics();

  return `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <div>
          <span class="badge badge-ai" style="margin-bottom: 4px;">✨ FitSync Health Engine</span>
          <h2 class="screen-title">Your Health Profile</h2>
        </div>
        <span class="badge badge-fitness">Status: Calibrated</span>
      </div>

      <!-- Legal & Estimations Disclaimer Banner -->
      <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 11px; color: var(--health-accent); display: flex; align-items: center; gap: 8px;">
        <span>ℹ️</span>
        <span>All physiological markers are scientific <strong>estimations</strong> based on Mifflin-St Jeor & Navy formulas. Not a medical diagnosis.</span>
      </div>

      <!-- Fitness Score Card (Section 19) -->
      <div class="fitness-score-dial-card">
        <div class="score-circle-wrapper">
          <svg class="score-circle-svg" viewBox="0 0 100 100">
            <circle class="score-circle-bg" cx="50" cy="50" r="40" />
            <circle class="score-circle-progress" cx="50" cy="50" r="40" />
          </svg>
          <div class="score-center-text">
            <div class="score-number">${m.fitnessScore}</div>
            <div class="score-label-small">/ 100</div>
          </div>
        </div>
        <div class="score-breakdown-bars">
          <div style="font-weight: 700; color: #fff; font-size: 13px; margin-bottom: 2px;">Overall Fitness Score</div>
          <div class="subscore-row">
            <span class="subscore-name">Activity Index</span>
            <span class="subscore-val">${m.activityScore}</span>
          </div>
          <div class="subscore-track"><div class="tile-progress-fill fill-emerald" style="width: ${m.activityScore}%;"></div></div>

          <div class="subscore-row">
            <span class="subscore-name">Strength Progression</span>
            <span class="subscore-val">${m.strengthScore}</span>
          </div>
          <div class="subscore-track"><div class="tile-progress-fill fill-cyan" style="width: ${m.strengthScore}%;"></div></div>

          <div class="subscore-row">
            <span class="subscore-name">Consistency Streak</span>
            <span class="subscore-val">${m.consistencyScore}</span>
          </div>
          <div class="subscore-track"><div class="tile-progress-fill fill-purple" style="width: ${m.consistencyScore}%;"></div></div>
        </div>
      </div>

      <!-- BMR & TDEE Dual Cards (Sections 15 & 16) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div class="card-glass">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="badge badge-health">BMR</span>
            <span style="font-size: 10px; color: var(--text-muted);">Estimated</span>
          </div>
          <div style="font-family: var(--font-headline); font-size: 20px; font-weight: 700; color: #fff; margin: 6px 0 2px;">
            ${m.bmr.toLocaleString()} <span style="font-size: 11px; font-weight: 500; color: var(--text-muted);">kcal/day</span>
          </div>
          <p style="font-size: 10px; color: var(--text-muted); line-height: 1.4;">
            Calories required strictly at complete rest.
          </p>
        </div>

        <div class="card-glass">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="badge badge-fitness">TDEE</span>
            <span style="font-size: 10px; color: var(--text-muted);">Estimated</span>
          </div>
          <div style="font-family: var(--font-headline); font-size: 20px; font-weight: 700; color: #fff; margin: 6px 0 2px;">
            ${m.tdee.toLocaleString()} <span style="font-size: 11px; font-weight: 500; color: var(--text-muted);">kcal/day</span>
          </div>
          <p style="font-size: 10px; color: var(--text-muted); line-height: 1.4;">
            Daily energy expenditure with physical activity.
          </p>
        </div>
      </div>

      <!-- Calorie Target Hero Card (Section 17) -->
      <div class="card-glass card-ai-insight">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <span class="badge badge-ai">✨ Recommended Daily Target</span>
            <div style="font-family: var(--font-headline); font-size: 26px; font-weight: 800; color: #fff; margin: 4px 0;">
              ${m.calorieTarget.toLocaleString()} <span style="font-size: 13px; font-weight: 600; color: var(--fitness-primary);">kcal</span>
            </div>
            <p style="font-size: 12px; color: #cbd5e1;">${m.recommendation}</p>
          </div>
          <span class="badge badge-fitness" style="margin-top: 4px;">Goal: ${state.assessmentData.goal}</span>
        </div>
      </div>

      <!-- Daily Macros Breakdown (Section 18) -->
      <div>
        <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 8px;">Macro Distribution Target:</div>
        <div class="macro-pills-row">
          <div class="macro-pill">
            <div class="macro-pill-title" style="color: var(--fitness-primary);">Protein</div>
            <div class="macro-pill-val">${m.proteinG}g</div>
            <div class="macro-pill-target">2.1g / kg bodyweight</div>
          </div>
          <div class="macro-pill">
            <div class="macro-pill-title" style="color: var(--health-primary);">Carbs</div>
            <div class="macro-pill-val">${m.carbsG}g</div>
            <div class="macro-pill-target">Clean Glycogen</div>
          </div>
          <div class="macro-pill">
            <div class="macro-pill-title" style="color: var(--status-warning);">Healthy Fats</div>
            <div class="macro-pill-val">${m.fatG}g</div>
            <div class="macro-pill-target">25% Caloric Ratio</div>
          </div>
        </div>
      </div>

      <!-- BMI & Est Body Composition (Section 14) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div class="card-glass">
          <span class="badge badge-health">Body Mass Index</span>
          <div style="font-family: var(--font-headline); font-size: 18px; font-weight: 700; color: #fff; margin: 4px 0 2px;">
            ${m.bmi} <span style="font-size: 11px; color: var(--fitness-primary);">BMI</span>
          </div>
          <p style="font-size: 11px; color: var(--text-secondary);">${m.bmiCategory}</p>
        </div>
        <div class="card-glass">
          <span class="badge badge-fitness">Body Composition</span>
          <div style="font-family: var(--font-headline); font-size: 18px; font-weight: 700; color: #fff; margin: 4px 0 2px;">
            ${m.bodyFatEst} <span style="font-size: 11px; color: var(--text-muted);">Est. Fat</span>
          </div>
          <p style="font-size: 11px; color: var(--text-secondary);">Water: ${m.hydrationTargetL} L / day</p>
        </div>
      </div>

      <div style="margin-top: 10px;">
        <button id="btnLaunchDashboard" class="btn btn-primary-fitness" style="width: 100%; font-size: 14px; padding: 14px;">
          Go to Member Dashboard 🚀
        </button>
      </div>
    </div>
  `;
}

function bindAssessmentResultEvents() {
  document.getElementById('btnLaunchDashboard')?.addEventListener('click', () => {
    playHaptic('success');
    state.memberSubScreen = 'dashboard';
    state.activeMemberTab = 'home';
    showToast('Health Profile Connected! Enjoy FitSync AI.', '🎉');
    renderCurrentView();
  });
}

// --------------------------------------------------------------------------
// MEMBER HOME DASHBOARD (Prompt Section 20)
// --------------------------------------------------------------------------
function getMemberHomeHtml() {
  const u = state.user;
  const w = state.workout;

  return `
    <div class="screen-wrapper">
      <!-- Member Top Header Row -->
      <div class="member-home-header">
        <div class="member-user-info">
          <img src="${u.avatar}" alt="Aarav Shah" class="user-avatar-small" />
          <div class="user-welcome-text">
            <h2>Good Morning, ${u.name.split(' ')[0]} 👋</h2>
            <div class="user-gym-tag">
              <span>📍 FitZone Vadodara</span>
              <span>•</span>
              <span style="color: var(--fitness-primary);">Coach Raj P.</span>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <button id="globalSearchTrigger" class="icon-btn-pill" title="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button id="notifBellBtn" class="icon-btn-pill" title="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            <span class="notif-unread-dot"></span>
          </button>
        </div>
      </div>

      <!-- Today's Summary Strip (Section 20) -->
      <div class="today-summary-strip">
        <div class="summary-tile">
          <span class="tile-label">Calories</span>
          <span class="tile-val" style="color: var(--fitness-primary);">${u.caloriesLogged}</span>
          <div class="tile-progress-bar">
            <div class="tile-progress-fill fill-emerald" style="width: ${Math.min(100, (u.caloriesLogged / u.calorieTarget) * 100)}%;"></div>
          </div>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Protein</span>
          <span class="tile-val" style="color: var(--health-primary);">${u.proteinLogged}g</span>
          <div class="tile-progress-bar">
            <div class="tile-progress-fill fill-cyan" style="width: ${Math.min(100, (u.proteinLogged / u.proteinTarget) * 100)}%;"></div>
          </div>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Workout</span>
          <span class="tile-val" style="color: #fff; font-size: 11px;">Chest & Tri</span>
          <div class="tile-progress-bar">
            <div class="tile-progress-fill fill-purple" style="width: 50%;"></div>
          </div>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Streak</span>
          <span class="tile-val" style="color: var(--status-warning);">5 Days 🔥</span>
          <div class="tile-progress-bar">
            <div class="tile-progress-fill fill-orange" style="width: 85%;"></div>
          </div>
        </div>
      </div>

      <!-- Quick Interactive Water Tracker -->
      <div class="water-quick-widget">
        <div class="water-info">
          <span class="water-icon-drop">💧</span>
          <div>
            <div class="water-text-title">${u.waterLoggedMl} / ${u.waterTargetMl} ml Hydration</div>
            <div class="water-text-sub">${((u.waterLoggedMl / u.waterTargetMl) * 100).toFixed(0)}% of daily target reached</div>
          </div>
        </div>
        <button id="quickLogWaterBtn" class="btn-water-add">+250 ml</button>
      </div>

      <!-- Today's Workout Card (Hero) -->
      <div class="workout-hero-card">
        <div class="workout-hero-top">
          <div>
            <span class="badge badge-fitness">Today's Assigned Session</span>
            <div class="workout-hero-title">${w.title}</div>
            <div class="workout-hero-meta">${w.totalExercises} Exercises • ${w.duration} • ${w.focus}</div>
          </div>
          <button id="openWorkoutDetailBtn" class="btn btn-sm btn-outline" style="border-radius: var(--radius-full); font-size: 11px;">
            View Plan
          </button>
        </div>

        <!-- Muscle Pill Tags -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <span class="badge" style="background: var(--surface-2); color: var(--text-secondary); font-size: 10px;">Barbell Bench</span>
          <span class="badge" style="background: var(--surface-2); color: var(--text-secondary); font-size: 10px;">Incline DB</span>
          <span class="badge" style="background: var(--surface-2); color: var(--text-secondary); font-size: 10px;">Cable Fly</span>
          <span class="badge" style="background: var(--surface-2); color: var(--text-secondary); font-size: 10px;">Tricep Pushdown</span>
        </div>

        <div class="workout-hero-bottom">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--fitness-primary); box-shadow: 0 0 6px var(--fitness-primary);"></div>
            <span style="font-size: 12px; color: #fff; font-weight: 600;">2 of 5 exercises logged</span>
          </div>
          <button id="startWorkoutBtn" class="btn btn-primary-fitness btn-sm">
            Resume Workout →
          </button>
        </div>
      </div>

      <!-- AI Coach Card (Section 20 & 62) -->
      <div class="card-glass card-ai-insight">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; gap: 10px; align-items: flex-start;">
            <div style="font-size: 24px;">✨</div>
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-family: var(--font-headline); font-weight: 700; color: #fff; font-size: 14px;">Ask FitSync AI</span>
                <span class="badge badge-ai" style="font-size: 9px;">Active</span>
              </div>
              <p style="font-size: 12px; color: #e2e8f0; margin-top: 4px; line-height: 1.4;">
                "Need help adjusting your calories or progressing your bench press sets today?"
              </p>
            </div>
          </div>
        </div>
        <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
          <button id="openAiChatBtn" class="btn btn-ai btn-sm">
            Chat with AI Coach 💬
          </button>
        </div>
      </div>

      <!-- Upcoming Healthcare Telehealth Preview (Section 43) -->
      <div class="card-glass" style="border-left: 3px solid var(--health-primary);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="badge badge-health">Online Session Today</span>
          <span style="font-size: 11px; font-weight: 700; color: #38bdf8;">05:30 PM (In 35 mins)</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${FITSYNC_DATA.physiotherapists[0].avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid var(--health-primary);" />
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 13px;">${FITSYNC_DATA.physiotherapists[0].name}</div>
              <div style="font-size: 11px; color: var(--text-muted);">Consultant Physiotherapist</div>
            </div>
          </div>
          <button id="btnJoinTelehealthDirect" class="btn btn-primary-health btn-sm">
            Join Video Room 📹
          </button>
        </div>
      </div>

      <!-- Nutrition Status Card (Section 20) -->
      <div class="card-glass">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div>
            <h4 style="color: #fff; font-size: 14px; font-weight: 700;">Nutrition & Macros</h4>
            <span style="font-size: 11px; color: var(--text-muted);">${u.caloriesLogged} / ${u.calorieTarget} kcal logged</span>
          </div>
          <button id="btnLogMealHome" class="btn btn-secondary btn-sm">
            + Log Meal
          </button>
        </div>
        <div class="macro-pills-row" style="margin-top: 6px;">
          <div class="macro-pill" style="padding: 6px;">
            <span style="font-size: 10px; color: var(--text-muted);">Protein</span>
            <div style="font-size: 13px; font-weight: 700; color: #fff;">${u.proteinLogged} / ${u.proteinTarget}g</div>
          </div>
          <div class="macro-pill" style="padding: 6px;">
            <span style="font-size: 10px; color: var(--text-muted);">Carbs</span>
            <div style="font-size: 13px; font-weight: 700; color: #fff;">${u.carbsLogged} / ${u.carbsTarget}g</div>
          </div>
          <div class="macro-pill" style="padding: 6px;">
            <span style="font-size: 10px; color: var(--text-muted);">Fats</span>
            <div style="font-size: 13px; font-weight: 700; color: #fff;">${u.fatLogged} / ${u.fatTarget}g</div>
          </div>
        </div>
      </div>

      <!-- Weight & Body Progress Card (Section 20) -->
      <div class="card-glass card-glass-interactive" id="btnViewProgressCard">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="color: #fff; font-size: 14px; font-weight: 700;">Weight & Body Progress</h4>
            <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 2px;">
              <span style="font-family: var(--font-headline); font-size: 18px; font-weight: 700; color: #fff;">${u.weightKg} kg</span>
              <span style="font-size: 11px; color: var(--fitness-primary); font-weight: 600;">-2.1 kg this month</span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm">View Charts →</button>
        </div>
      </div>
    </div>
  `;
}

function bindMemberHomeEvents() {
  document.getElementById('quickLogWaterBtn')?.addEventListener('click', () => {
    state.user.waterLoggedMl += 250;
    playHaptic('tap');
    showToast(`Logged +250ml! Total: ${state.user.waterLoggedMl}ml`, '💧');
    renderCurrentView();
  });

  document.getElementById('openWorkoutDetailBtn')?.addEventListener('click', () => {
    playHaptic('tap');
    state.activeMemberTab = 'workout';
    renderCurrentView();
  });

  document.getElementById('startWorkoutBtn')?.addEventListener('click', () => {
    playHaptic('tap');
    state.activeMemberTab = 'workout';
    renderCurrentView();
  });

  document.getElementById('openAiChatBtn')?.addEventListener('click', () => {
    playHaptic('ai');
    openAiDrawer();
  });

  document.getElementById('btnJoinTelehealthDirect')?.addEventListener('click', () => {
    playHaptic('tap');
    launchVideoCall();
  });

  document.getElementById('btnLogMealHome')?.addEventListener('click', () => {
    playHaptic('tap');
    state.activeMemberTab = 'nutrition';
    renderCurrentView();
  });

  document.getElementById('btnViewProgressCard')?.addEventListener('click', () => {
    playHaptic('tap');
    openProgressModal();
  });

  document.getElementById('notifBellBtn')?.addEventListener('click', () => {
    playHaptic('tap');
    openNotificationsDrawer();
  });

  document.getElementById('globalSearchTrigger')?.addEventListener('click', () => {
    playHaptic('tap');
    openSearchDrawer();
  });
}

// --------------------------------------------------------------------------
// WORKOUT MODULE (Prompt Section 22-25)
// --------------------------------------------------------------------------
function getWorkoutModuleHtml() {
  const w = state.workout;

  const exercisesHtml = w.exercises.map((ex, exIdx) => {
    const rows = ex.completedSets.map((s, sIdx) => `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-secondary);">Set ${s.set}</td>
        <td style="color: #fff; font-weight: 600;">${s.weight}</td>
        <td style="color: #fff; font-weight: 600;">${s.reps} reps</td>
        <td style="text-align: right;">
          <span class="set-status-badge ${s.status === 'completed' ? 'set-status-completed' : 'set-status-pending'} btn-toggle-set" data-ex-idx="${exIdx}" data-set-idx="${sIdx}">
            ${s.status === 'completed' ? '✓ Completed' : 'Log Set'}
          </span>
        </td>
      </tr>
    `).join('');

    return `
      <div class="exercise-log-card">
        <div class="exercise-log-header">
          <div class="exercise-title-group" style="cursor: pointer;" onclick="window.viewExerciseGuide('${ex.id}')">
            <img src="${ex.thumbnail}" class="exercise-thumb-mini" alt="${ex.name}" />
            <div>
              <div class="exercise-log-name">${ex.name} ↗</div>
              <div class="exercise-log-meta">${ex.muscle} • Rest: ${ex.restSeconds}s</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.viewExerciseGuide('${ex.id}')" style="padding: 4px 8px; font-size: 10px;">
            Guide
          </button>
        </div>

        <table class="sets-table">
          <thead>
            <tr>
              <th>SET</th>
              <th>WEIGHT</th>
              <th>REPS</th>
              <th style="text-align: right;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <!-- Interactive Rest Countdown Widget -->
        <div class="rest-timer-box">
          <span style="color: var(--text-muted);">⏱️ Recommended Rest Interval:</span>
          <span class="timer-countdown" id="restTimerDisplay_${exIdx}">${ex.restSeconds}s</span>
          <button class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 10px;" onclick="window.startRestCountdown(${exIdx}, ${ex.restSeconds})">
            Start Rest
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <div>
          <span class="badge badge-fitness">Workout Center</span>
          <h2 class="screen-title">${w.title}</h2>
        </div>
        <button id="btnOpenExLibrary" class="btn btn-secondary btn-sm">
          📚 Library
        </button>
      </div>

      <!-- Weekly Volume Telemetry -->
      <div class="today-summary-strip">
        <div class="summary-tile">
          <span class="tile-label">Weekly Vol</span>
          <span class="tile-val">18,400 kg</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Completed</span>
          <span class="tile-val" style="color: var(--fitness-primary);">2 / 5</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Avg RPE</span>
          <span class="tile-val">7.8</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Coach</span>
          <span class="tile-val" style="color: #38bdf8;">Raj Patel</span>
        </div>
      </div>

      <!-- Adaptive Workout Recommendation (Section 24) -->
      <div class="card-glass card-ai-insight" style="border: 1px solid rgba(16, 185, 129, 0.4);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 16px;">🧠</span>
          <span style="font-weight: 700; color: #fff; font-size: 13px;">FitSync Adaptive Recommendation</span>
          <span class="badge badge-fitness" style="font-size: 9px;">AI + Coach Raj</span>
        </div>
        <p style="font-size: 12px; color: #cbd5e1; line-height: 1.45;">
          ${w.aiRecommendation.insight}
        </p>
        <div style="font-size: 11px; color: var(--text-muted); margin: 6px 0; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px;">
          💬 <em>Coach Note: "${w.aiRecommendation.trainerNote}"</em>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <button id="btnAcceptAiProgression" class="btn btn-primary-fitness btn-sm">
            Accept Recommendation (82.5 kg) ✓
          </button>
          <button id="btnAskTrainerProgression" class="btn btn-outline btn-sm">
            Ask Trainer
          </button>
        </div>
      </div>

      <!-- Exercises List -->
      <div style="margin-top: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; color: #fff;">Workout Routine Exercises:</span>
          <span style="font-size: 11px; color: var(--text-muted);">Tap set to mark complete</span>
        </div>
        ${exercisesHtml}
      </div>

      <button id="btnFinishWorkout" class="btn btn-primary-fitness" style="width: 100%; margin-top: 8px; padding: 14px;">
        Complete Workout & Sync Telemetry 🏁
      </button>
    </div>
  `;
}

function bindWorkoutEvents() {
  document.getElementById('btnOpenExLibrary')?.addEventListener('click', () => {
    playHaptic('tap');
    openExerciseLibraryModal();
  });

  document.querySelectorAll('.btn-toggle-set').forEach(badge => {
    badge.addEventListener('click', () => {
      const exIdx = +badge.dataset.exIdx;
      const setIdx = +badge.dataset.setIdx;
      const current = state.workout.exercises[exIdx].completedSets[setIdx].status;
      state.workout.exercises[exIdx].completedSets[setIdx].status = current === 'completed' ? 'pending' : 'completed';
      playHaptic(current === 'completed' ? 'tap' : 'success');
      showToast(current === 'completed' ? 'Set unmarked' : `Set ${setIdx + 1} Logged! Take rest.`, '💪');
      renderCurrentView();
    });
  });

  document.getElementById('btnAcceptAiProgression')?.addEventListener('click', () => {
    playHaptic('success');
    showToast('Applied 82.5 kg progression to bench press sets!', '🧠');
  });

  document.getElementById('btnAskTrainerProgression')?.addEventListener('click', () => {
    playHaptic('tap');
    showToast('Sent inquiry to Coach Raj Patel.', '💬');
  });

  document.getElementById('btnFinishWorkout')?.addEventListener('click', () => {
    playHaptic('success');
    showToast('Workout Saved! Volume: 18,400 kg recorded.', '🏆');
    state.activeMemberTab = 'home';
    renderCurrentView();
  });
}

// Global hook for exercise modal
window.viewExerciseGuide = function(exId) {
  const ex = state.workout.exercises.find(e => e.id === exId) || FITSYNC_DATA.todayWorkout.exercises[0];
  state.activeExerciseForModal = ex;
  playHaptic('tap');
  openExerciseDetailModal();
};

window.startRestCountdown = function(exIdx, seconds) {
  playHaptic('tap');
  let current = seconds;
  const display = document.getElementById(`restTimerDisplay_${exIdx}`);
  if (!display) return;
  display.textContent = `${current}s`;
  const interval = setInterval(() => {
    current--;
    if (current <= 0) {
      clearInterval(interval);
      display.textContent = 'REST COMPLETE!';
      playHaptic('success');
      showToast('Rest interval completed! Ready for next set.', '🔔');
    } else {
      display.textContent = `${current}s`;
    }
  }, 1000);
};

// --------------------------------------------------------------------------
// NUTRITION MODULE (Prompt Section 31-36)
// --------------------------------------------------------------------------
function getNutritionModuleHtml() {
  const u = state.user;

  const mealsList = FITSYNC_DATA.meals.map(m => `
    <div class="card-glass" style="margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="badge badge-fitness" style="font-size: 9px;">${m.type} • ${m.time}</span>
          <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin: 4px 0 2px;">${m.title}</h4>
          <p style="font-size: 11px; color: var(--text-muted);">${m.ingredients}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-family: var(--font-headline); font-size: 16px; font-weight: 700; color: #fff;">${m.calories} <span style="font-size: 10px; color: var(--text-muted);">kcal</span></div>
          <span style="font-size: 10px; color: var(--health-primary); font-weight: 600;">${m.protein}g protein</span>
        </div>
      </div>
      ${m.image ? `<img src="${m.image}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-top: 10px;" />` : ''}
    </div>
  `).join('');

  return `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <div>
          <span class="badge badge-fitness">Nutrition Intelligence</span>
          <h2 class="screen-title">Diet & Food Log</h2>
        </div>
        <button id="btnOpenFoodSafetyModal" class="btn btn-outline btn-sm">
          🛡️ Safety Check
        </button>
      </div>

      <!-- Macro Tracker Card -->
      <div class="card-glass">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; color: #fff;">Daily Caloric Budget</span>
          <span style="font-size: 12px; font-family: var(--font-mono); color: var(--fitness-primary); font-weight: 700;">
            ${u.caloriesLogged} / ${u.calorieTarget} kcal
          </span>
        </div>
        <div class="tile-progress-bar" style="height: 8px; margin-bottom: 12px;">
          <div class="tile-progress-fill fill-emerald" style="width: ${(u.caloriesLogged / u.calorieTarget) * 100}%;"></div>
        </div>

        <div class="macro-pills-row">
          <div class="macro-pill">
            <span class="macro-pill-title" style="color: var(--fitness-primary);">Protein</span>
            <div class="macro-pill-val">${u.proteinLogged} / ${u.proteinTarget}g</div>
          </div>
          <div class="macro-pill">
            <span class="macro-pill-title" style="color: var(--health-primary);">Carbs</span>
            <div class="macro-pill-val">${u.carbsLogged} / ${u.carbsTarget}g</div>
          </div>
          <div class="macro-pill">
            <span class="macro-pill-title" style="color: var(--status-warning);">Fat</span>
            <div class="macro-pill-val">${u.fatLogged} / ${u.fatTarget}g</div>
          </div>
        </div>
      </div>

      <!-- Meal Logging Interactive Bar (Section 32) -->
      <div class="card-glass">
        <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 8px;">Log New Meal</div>
        <div class="input-group" style="margin-bottom: 8px;">
          <input type="text" id="foodSearchInput" class="input-field" placeholder="Search food (e.g. Grilled Chicken, Paneer, Peanut Toast)..." />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <select id="mealTypeSelect" class="input-field" style="padding: 8px;">
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>
          <input type="number" id="mealCaloriesInput" class="input-field" placeholder="Est. Calories" style="padding: 8px;" value="420" />
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="btnQuickAddMeal" class="btn btn-primary-fitness btn-sm" style="flex: 1;">
            + Add to Daily Log
          </button>
          <button id="btnSimulatePhotoUpload" class="btn btn-secondary btn-sm" title="AI Photo Macro Scanner">
            📷 Scan Plate
          </button>
        </div>
      </div>

      <!-- Food Reaction Pattern Detection Card (Section 36) -->
      <div class="pattern-observation-card">
        <div class="pattern-title">
          <span>⚠️ Recurring Pattern Detected</span>
          <span class="badge badge-warning" style="font-size: 9px;">AI Observation</span>
        </div>
        <div class="pattern-text">
          "${state.reactionLogs[0].aiObservation}"
        </div>
        <div class="disclaimer-small">
          * ${state.reactionLogs[0].disclaimer}
        </div>
        <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
          <button id="btnLogNewReaction" class="btn btn-secondary btn-sm" style="font-size: 10px; padding: 4px 10px;">
            + Log Food Reaction
          </button>
        </div>
      </div>

      <!-- Logged Meals Timeline -->
      <div>
        <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 8px;">Today's Logged Meals:</div>
        ${mealsList}
      </div>
    </div>
  `;
}

function bindNutritionEvents() {
  document.getElementById('btnQuickAddMeal')?.addEventListener('click', () => {
    const foodName = document.getElementById('foodSearchInput')?.value || 'Custom Meal';
    const cal = +document.getElementById('mealCaloriesInput')?.value || 350;

    // Allergy check on the fly
    if (foodName.toLowerCase().includes('peanut') && state.user.allergies.includes('Peanuts')) {
      playHaptic('tap');
      alert(`⚠️ DIETARY SAFETY ALERT: "${foodName}" contains peanuts! Your allergy profile strictly restricts peanuts.`);
      return;
    }

    state.user.caloriesLogged += cal;
    state.user.proteinLogged += 24;
    playHaptic('success');
    showToast(`Added ${foodName} (+${cal} kcal, +24g protein)!`, '🥗');
    renderCurrentView();
  });

  document.getElementById('btnSimulatePhotoUpload')?.addEventListener('click', () => {
    playHaptic('ai');
    showToast('AI Plate Vision: Detected Gourmet Fitness Bowl (680 kcal, 48g P)', '📷');
  });

  document.getElementById('btnOpenFoodSafetyModal')?.addEventListener('click', () => {
    playHaptic('tap');
    openFoodSafetyModal();
  });

  document.getElementById('btnLogNewReaction')?.addEventListener('click', () => {
    playHaptic('tap');
    const reaction = prompt('Enter food and observed reaction (e.g. Whey Shake -> Mild gas):');
    if (reaction) {
      showToast(`Reaction recorded: "${reaction}". Pattern observation updated.`, '📝');
    }
  });
}

// --------------------------------------------------------------------------
// HEALTH HUB (Prompt Section 37-46)
// --------------------------------------------------------------------------
function getHealthHubHtml() {
  const doctorsList = FITSYNC_DATA.doctors.map(doc => `
    <div class="card-glass card-glass-interactive" style="margin-bottom: 10px;" onclick="window.selectDoctorForBooking('${doc.id}')">
      <div style="display: flex; gap: 12px; align-items: flex-start;">
        <img src="${doc.avatar}" style="width: 50px; height: 50px; border-radius: 12px; object-fit: cover; border: 1px solid var(--health-primary);" />
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <h4 style="color: #fff; font-size: 14px; font-weight: 700;">${doc.name}</h4>
            <span class="badge badge-health">★ ${doc.rating}</span>
          </div>
          <div style="font-size: 11px; color: var(--health-accent); font-weight: 600;">${doc.specialty}</div>
          <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0;">${doc.clinic} • ${doc.experience}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <span style="font-size: 11px; color: #fff; font-weight: 700;">Fee: ${doc.consultationFee}</span>
            <button class="btn btn-primary-health btn-sm" style="padding: 4px 10px; font-size: 10px;">
              Book Appointment 📅
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  const physiosList = FITSYNC_DATA.physiotherapists.map(pt => `
    <div class="card-glass card-glass-interactive" style="margin-bottom: 10px;" onclick="window.selectPhysioForBooking('${pt.id}')">
      <div style="display: flex; gap: 12px; align-items: flex-start;">
        <img src="${pt.avatar}" style="width: 50px; height: 50px; border-radius: 12px; object-fit: cover; border: 1px solid #38bdf8;" />
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <h4 style="color: #fff; font-size: 14px; font-weight: 700;">${pt.name}</h4>
            <span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">★ ${pt.rating}</span>
          </div>
          <div style="font-size: 11px; color: #38bdf8; font-weight: 600;">${pt.specialty}</div>
          <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0;">${pt.clinic} • ${pt.experience}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <span style="font-size: 11px; color: #fff; font-weight: 700;">Fee: ${pt.consultationFee}</span>
            <button class="btn btn-primary-health btn-sm" style="padding: 4px 10px; font-size: 10px; background: #38bdf8; color: #0b0f17;">
              Book Session 🏃‍♂️
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <div>
          <span class="badge badge-health">Clinical Connectivity</span>
          <h2 class="screen-title">Health Hub</h2>
        </div>
        <button id="btnHealthReportsVault" class="btn btn-outline btn-sm">
          📁 Records (${state.reports.length})
        </button>
      </div>

      <!-- Privacy UX Alert (Section 63 & 64) -->
      <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: var(--radius-sm); padding: 10px 12px; font-size: 11px; color: #e0f2fe; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">🔒</span>
        <div>
          <strong>Health Report Privacy Protection:</strong>
          <p style="color: var(--text-muted); margin-top: 1px;">Your clinical records are encrypted and only accessible to accredited medical professionals you explicitly approve.</p>
        </div>
      </div>

      <!-- Quick Subnav: Appointments & Reports -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button id="btnViewMyAppointments" class="btn btn-secondary btn-sm" style="justify-content: flex-start; padding: 10px;">
          📅 Appointments (${state.appointments.length})
        </button>
        <button id="btnUploadReportModal" class="btn btn-secondary btn-sm" style="justify-content: flex-start; padding: 10px;">
          ⬆️ Upload Report
        </button>
      </div>

      <!-- Sports Doctors Discovery (Section 38) -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="font-family: var(--font-headline); font-size: 15px; color: #fff; font-weight: 700;">Sports Medicine Doctors</h3>
          <span style="font-size: 11px; color: var(--health-accent);">Vadodara & Telehealth</span>
        </div>
        ${doctorsList}
      </div>

      <!-- Physiotherapists Discovery (Section 40) -->
      <div style="margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="font-family: var(--font-headline); font-size: 15px; color: #fff; font-weight: 700;">Sports Physiotherapists</h3>
          <span style="font-size: 11px; color: #38bdf8;">Movement & Posture</span>
        </div>
        ${physiosList}
      </div>
    </div>
  `;
}

function bindHealthHubEvents() {
  document.getElementById('btnHealthReportsVault')?.addEventListener('click', () => {
    playHaptic('tap');
    openHealthReportsModal();
  });
  document.getElementById('btnUploadReportModal')?.addEventListener('click', () => {
    playHaptic('tap');
    openUploadReportModal();
  });
  document.getElementById('btnViewMyAppointments')?.addEventListener('click', () => {
    playHaptic('tap');
    openAppointmentsModal();
  });
}

window.selectDoctorForBooking = function(docId) {
  const doc = FITSYNC_DATA.doctors.find(d => d.id === docId);
  if (doc) {
    state.appointmentDraft.provider = doc;
    playHaptic('tap');
    openAppointmentBookingModal();
  }
};

window.selectPhysioForBooking = function(ptId) {
  const pt = FITSYNC_DATA.physiotherapists.find(p => p.id === ptId);
  if (pt) {
    state.appointmentDraft.provider = pt;
    playHaptic('tap');
    openAppointmentBookingModal();
  }
};

// --------------------------------------------------------------------------
// MEMBER PROFILE & ATTENDANCE (Prompt Section 57, 53)
// --------------------------------------------------------------------------
function getMemberProfileHtml() {
  const u = state.user;

  return `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <div>
          <span class="badge badge-fitness">Member Account</span>
          <h2 class="screen-title">Profile & Bio</h2>
        </div>
        <button id="btnProfileLogout" class="btn btn-outline btn-sm" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4);">
          Logout
        </button>
      </div>

      <!-- Member Card -->
      <div class="card-glass" style="display: flex; gap: 14px; align-items: center;">
        <img src="${u.avatar}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid var(--fitness-primary); box-shadow: var(--shadow-glow-fitness);" />
        <div>
          <h3 style="font-family: var(--font-headline); font-size: 18px; color: #fff; font-weight: 700;">${u.name}</h3>
          <p style="font-size: 12px; color: var(--text-muted);">Age: ${u.age} • ${u.heightCm} cm • ${u.weightKg} kg</p>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <span class="badge badge-fitness">${u.goal}</span>
            <span class="badge badge-ai">FitZone VIP</span>
          </div>
        </div>
      </div>

      <!-- Gym Attendance Heatmap Strip (Section 53) -->
      <div class="card-glass">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div>
            <h4 style="color: #fff; font-size: 13px; font-weight: 700;">Gym Attendance (October 2026)</h4>
            <span style="font-size: 11px; color: var(--fitness-primary); font-weight: 600;">18 Visits This Month • 88% Compliance</span>
          </div>
          <span class="badge badge-fitness">5 Day Streak 🔥</span>
        </div>

        <!-- 30-day mini attendance calendar dots -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 8px; text-align: center;">
          ${Array.from({ length: 28 }).map((_, i) => {
            const visited = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20, 22, 23, 25].includes(i + 1);
            return `
              <div style="padding: 6px 2px; border-radius: 6px; background: ${visited ? 'var(--fitness-container)' : 'var(--surface-2)'}; border: 1px solid ${visited ? 'var(--fitness-primary)' : 'transparent'}; font-size: 10px; font-family: var(--font-mono); color: ${visited ? '#fff' : 'var(--text-muted)'};">
                ${i + 1}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Profile Settings Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="btnRecalibrateAssessment" class="btn btn-secondary" style="justify-content: space-between;">
          <span>🧠 Recalibrate Health Profile (Senses)</span>
          <span>→</span>
        </button>
        <button id="btnFindTrainerFromProfile" class="btn btn-secondary" style="justify-content: space-between;">
          <span>🏋️ Find / Change Gym Trainer</span>
          <span>→</span>
        </button>
        <button id="btnPrivacySettings" class="btn btn-secondary" style="justify-content: space-between;">
          <span>🔒 Health Privacy & Access Controls</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `;
}

function bindProfileEvents() {
  document.getElementById('btnProfileLogout')?.addEventListener('click', () => {
    playHaptic('tap');
    state.memberSubScreen = 'welcome';
    showToast('Logged out of FitSync AI.', '👋');
    renderCurrentView();
  });
  document.getElementById('btnRecalibrateAssessment')?.addEventListener('click', () => {
    playHaptic('tap');
    state.memberSubScreen = 'assessment';
    state.assessmentStep = 1;
    renderCurrentView();
  });
  document.getElementById('btnFindTrainerFromProfile')?.addEventListener('click', () => {
    playHaptic('tap');
    openTrainerDiscoveryModal();
  });
  document.getElementById('btnPrivacySettings')?.addEventListener('click', () => {
    playHaptic('tap');
    openHealthReportsModal();
  });
}

// ==========================================================================
// 2. GYM TRAINER APP (Coach Raj Patel UI — Sections 28-30)
// ==========================================================================
function renderTrainerPage(container) {
  const interventionsHtml = FITSYNC_DATA.trainerInterventions.map(int => `
    <div class="card-glass" style="margin-bottom: 10px; border-left: 3px solid ${int.statusColor === 'red' ? 'var(--status-danger)' : 'var(--status-warning)'};">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <img src="${int.memberAvatar}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;" />
          <div>
            <h4 style="color: #fff; font-size: 13px; font-weight: 700;">${int.memberName} (${int.memberAge})</h4>
            <span class="badge ${int.statusColor === 'red' ? 'badge-danger' : 'badge-warning'}" style="font-size: 9px;">${int.status}</span>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="alert('Viewing live log for ${int.memberName}')" style="padding: 4px 8px; font-size: 10px;">
          View
        </button>
      </div>

      <div style="font-size: 12px; color: #f87171; font-weight: 600; margin: 8px 0 4px;">
        ⚠️ ${int.issue}
      </div>
      <div style="font-size: 11px; color: var(--text-muted); background: var(--surface-2); padding: 6px 10px; border-radius: 6px;">
        🧠 <strong>AI Nudge:</strong> ${int.aiRecommendation}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <div style="display: flex; gap: 10px; align-items: center;">
          <img src="assets/trainer_raj.jpg" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--fitness-primary);" />
          <div>
            <span class="badge badge-fitness" style="font-size: 9px;">Gym Trainer Portal</span>
            <h2 class="screen-title" style="font-size: 17px;">Coach Raj Patel</h2>
          </div>
        </div>
        <span class="badge" style="background: var(--surface-2); color: #fff;">FitZone Vadodara</span>
      </div>

      <!-- Trainer Overview Metrics (Section 28) -->
      <div class="today-summary-strip">
        <div class="summary-tile">
          <span class="tile-label">Assigned</span>
          <span class="tile-val">24</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Active Today</span>
          <span class="tile-val" style="color: var(--fitness-primary);">14</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Attention</span>
          <span class="tile-val" style="color: #f87171;">3</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Sessions</span>
          <span class="tile-val" style="color: var(--health-primary);">4</span>
        </div>
      </div>

      <!-- Trainer Intervention Intelligence (Section 30) -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="font-family: var(--font-headline); font-size: 15px; color: #fff; font-weight: 700;">Members Needing Attention</h3>
          <span class="badge badge-ai">FitSync AI Sentinel</span>
        </div>
        ${interventionsHtml}
      </div>

      <!-- Quick Action: Assign Workout Split -->
      <div class="card-glass">
        <h4 style="color: #fff; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Quick Member Assignment</h4>
        <div style="display: flex; gap: 8px;">
          <input type="text" class="input-field" placeholder="Select member..." value="Aarav Shah" style="padding: 8px;" />
          <button class="btn btn-primary-fitness btn-sm" onclick="alert('Pushed progressive overload routine to Aarav Shah')">
            Push Split →
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 3. DOCTOR APP (Dr. Ananya Iyer UI — Sections 38-39)
// ==========================================================================
function renderDoctorPage(container) {
  container.innerHTML = `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <div style="display: flex; gap: 10px; align-items: center;">
          <img src="assets/doctor_iyer.jpg" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--health-primary);" />
          <div>
            <span class="badge badge-health" style="font-size: 9px;">Sports Medicine Portal</span>
            <h2 class="screen-title" style="font-size: 17px;">Dr. Ananya Iyer, MD</h2>
          </div>
        </div>
        <span class="badge badge-fitness">Online & Available</span>
      </div>

      <!-- Metrics -->
      <div class="today-summary-strip">
        <div class="summary-tile">
          <span class="tile-label">Today Queue</span>
          <span class="tile-val" style="color: var(--health-primary);">6</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Telehealth</span>
          <span class="tile-val">4</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">In-Clinic</span>
          <span class="tile-val">2</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Rating</span>
          <span class="tile-val" style="color: var(--fitness-primary);">4.95 ★</span>
        </div>
      </div>

      <!-- Patient Queue -->
      <div>
        <h3 style="font-family: var(--font-headline); font-size: 15px; color: #fff; font-weight: 700; margin-bottom: 8px;">Today's Consultation Schedule</h3>

        <div class="card-glass" style="margin-bottom: 10px; border-left: 3px solid var(--health-primary);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="badge badge-health">10:30 AM • In-Clinic</span>
              <h4 style="color: #fff; font-size: 14px; font-weight: 700; margin-top: 4px;">Aarav Shah (23 / M)</h4>
              <p style="font-size: 11px; color: var(--text-muted);">Quarterly Athletic Bloodwork Review</p>
            </div>
            <button class="btn btn-primary-health btn-sm" onclick="alert('Viewing Aarav Shah blood chemistry panel (Approved with Patient Consent)')">
              Open Vault 🔒
            </button>
          </div>
        </div>

        <div class="card-glass" style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="badge badge-fitness">02:00 PM • Video Telehealth</span>
              <h4 style="color: #fff; font-size: 14px; font-weight: 700; margin-top: 4px;">Vikram Mehta (31 / M)</h4>
              <p style="font-size: 11px; color: var(--text-muted);">Patellar Tendinopathy Assessment</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="launchVideoCall()">
              Join Room 📹
            </button>
          </div>
        </div>
      </div>

      <!-- Weekly Schedule Configuration -->
      <div class="card-glass">
        <h4 style="color: #fff; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Provider Availability Grid (Section 41)</h4>
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-family: var(--font-mono);">
          <div style="display: flex; justify-content: space-between; padding: 4px; background: var(--surface-2); border-radius: 4px;">
            <span>MONDAY</span> <span style="color: var(--fitness-primary);">10:00 AM – 1:00 PM (Active)</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px; background: var(--surface-2); border-radius: 4px;">
            <span>TUESDAY</span> <span style="color: var(--text-muted);">Unavailable</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px; background: var(--surface-2); border-radius: 4px;">
            <span>WEDNESDAY</span> <span style="color: var(--fitness-primary);">4:00 PM – 7:00 PM (Active)</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px; background: var(--surface-2); border-radius: 4px;">
            <span>THURSDAY</span> <span style="color: var(--fitness-primary);">10:00 AM – 2:00 PM (Active)</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 4. PHYSIOTHERAPIST APP (Dr. Ramesh Sharma UI — Sections 40, 48)
// ==========================================================================
function renderPhysioPage(container) {
  container.innerHTML = `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <div style="display: flex; gap: 10px; align-items: center;">
          <img src="assets/physio_sharma.jpg" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #38bdf8;" />
          <div>
            <span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 9px;">Sports Physiotherapy</span>
            <h2 class="screen-title" style="font-size: 17px;">Dr. Ramesh Sharma</h2>
          </div>
        </div>
        <span class="badge badge-fitness">Telehealth Ready</span>
      </div>

      <!-- Active Telehealth Session Alert -->
      <div class="card-glass" style="border: 1px solid #38bdf8; background: linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(17, 24, 39, 0.9) 100%);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <span class="badge" style="background: #38bdf8; color: #0b0f17; font-weight: 700;">LIVE SESSION WAITING</span>
            <h3 style="font-family: var(--font-headline); font-size: 16px; color: #fff; margin: 6px 0 2px;">Aarav Shah • 5:30 PM</h3>
            <p style="font-size: 11px; color: #cbd5e1;">Agenda: Rotator cuff ultrasound follow-up & overhead shoulder kinematic test.</p>
          </div>
        </div>
        <button class="btn btn-primary-health" style="width: 100%; margin-top: 10px; background: #38bdf8; color: #0b0f17;" onclick="launchVideoCall()">
          Enter Video Consultation Room 📹
        </button>
      </div>

      <!-- Patient Mobility Kinematics -->
      <div class="card-glass">
        <h4 style="color: #fff; font-size: 13px; font-weight: 700; margin-bottom: 8px;">Aarav Shah — Mobility Telemetry</h4>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>Right Shoulder External Rotation</span>
              <span style="font-weight: 700; color: var(--fitness-primary);">85° (Target 90°)</span>
            </div>
            <div class="tile-progress-bar"><div class="tile-progress-fill fill-emerald" style="width: 94%;"></div></div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>Thoracic Spine Extension</span>
              <span style="font-weight: 700; color: var(--status-warning);">18° (Slight Kyphotic Drift)</span>
            </div>
            <div class="tile-progress-bar"><div class="tile-progress-fill fill-orange" style="width: 70%;"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 5. GYM ADMIN / OWNER APP (FitZone Vadodara — Sections 54-55)
// ==========================================================================
function renderGymAdminPage(container) {
  const g = FITSYNC_DATA.gyms[0];

  container.innerHTML = `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <div>
          <span class="badge badge-warning" style="font-size: 9px;">Gym Management Portal</span>
          <h2 class="screen-title">${g.name}</h2>
          <p class="screen-subtitle">Vadodara Flagship Branch</p>
        </div>
        <span class="badge badge-fitness">Operational 24/7</span>
      </div>

      <!-- Metrics Grid (Section 54) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div class="card-glass">
          <span class="tile-label">Total Members</span>
          <div style="font-family: var(--font-headline); font-size: 22px; font-weight: 700; color: #fff;">${g.totalMembers}</div>
          <span style="font-size: 10px; color: var(--fitness-primary);">+28 this month</span>
        </div>
        <div class="card-glass">
          <span class="tile-label">Active Trainers</span>
          <div style="font-family: var(--font-headline); font-size: 22px; font-weight: 700; color: #fff;">${g.availableTrainers}</div>
          <span style="font-size: 10px; color: var(--text-muted);">Lead: Raj Patel</span>
        </div>
        <div class="card-glass">
          <span class="tile-label">Monthly Attendance</span>
          <div style="font-family: var(--font-headline); font-size: 22px; font-weight: 700; color: var(--fitness-primary);">${g.attendanceRate}</div>
          <span style="font-size: 10px; color: var(--text-muted);">Optimal Range</span>
        </div>
        <div class="card-glass">
          <span class="tile-label">Active Today</span>
          <div style="font-family: var(--font-headline); font-size: 22px; font-weight: 700; color: var(--health-primary);">${g.activeToday}</div>
          <span style="font-size: 10px; color: var(--text-muted);">Turnstile sync live</span>
        </div>
      </div>

      <!-- Trainer Roster Management -->
      <div class="card-glass">
        <h4 style="color: #fff; font-size: 13px; font-weight: 700; margin-bottom: 8px;">Staff Trainers Roster</h4>
        ${FITSYNC_DATA.trainers.map(tr => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--surface-glass-border);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${tr.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
              <div>
                <div style="font-weight: 700; color: #fff; font-size: 12px;">${tr.name}</div>
                <div style="font-size: 10px; color: var(--text-muted);">${tr.role.split(' ')[0]} • ${tr.assignedMembersCount} Members</div>
              </div>
            </div>
            <span class="badge badge-fitness">★ ${tr.rating}</span>
          </div>
        `).join('')}
      </div>

      <!-- Gym Membership Tier Management (Section 55) -->
      <div class="card-glass">
        <h4 style="color: #fff; font-size: 13px; font-weight: 700; margin-bottom: 8px;">FitZone Membership Packages</h4>
        ${g.membershipTiers.map(t => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: var(--surface-2); border-radius: 6px; margin-bottom: 4px;">
            <div>
              <strong style="color: #fff; font-size: 12px;">${t.name}</strong>
              <div style="font-size: 10px; color: var(--text-muted);">${t.access}</div>
            </div>
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--fitness-primary); font-size: 12px;">${t.price}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==========================================================================
// 6. PLATFORM ADMIN APP (Multi-Gym Network Architecture — Section 56)
// ==========================================================================
function renderPlatformAdminPage(container) {
  const gymsList = FITSYNC_DATA.gyms.map(gym => `
    <div class="card-glass" style="margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h4 style="font-family: var(--font-headline); font-size: 15px; color: #fff; font-weight: 700;">${gym.name} — ${gym.city}</h4>
        <span class="badge badge-ai">Tenant ID: ${gym.id}</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 8px; font-size: 11px;">
        <div style="background: var(--surface-2); padding: 6px; border-radius: 6px;">
          <div style="color: var(--text-muted);">Members</div>
          <div style="font-weight: 700; color: #fff; font-size: 13px;">${gym.totalMembers}</div>
        </div>
        <div style="background: var(--surface-2); padding: 6px; border-radius: 6px;">
          <div style="color: var(--text-muted);">Trainers</div>
          <div style="font-weight: 700; color: #fff; font-size: 13px;">${gym.availableTrainers}</div>
        </div>
        <div style="background: var(--surface-2); padding: 6px; border-radius: 6px;">
          <div style="color: var(--text-muted);">Attendance</div>
          <div style="font-weight: 700; color: var(--fitness-primary); font-size: 13px;">${gym.attendanceRate}</div>
        </div>
      </div>
      <div style="font-size: 10px; color: var(--text-muted); margin-top: 8px; font-family: var(--font-mono);">
        🔒 Isolated Database Partition • Separate Billing • Encrypted Healthcare Tunnel
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="screen-wrapper">
      <div class="screen-header-row">
        <div>
          <span class="badge badge-ai">Multi-Tenant Architecture</span>
          <h2 class="screen-title">FitSync Network Admin</h2>
        </div>
        <span class="badge badge-fitness">Network: Healthy</span>
      </div>

      <!-- Network Aggregates -->
      <div class="today-summary-strip">
        <div class="summary-tile">
          <span class="tile-label">Total Gyms</span>
          <span class="tile-val" style="color: var(--ai-primary);">3</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Members</span>
          <span class="tile-val">1,492</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Trainers</span>
          <span class="tile-val">26</span>
        </div>
        <div class="summary-tile">
          <span class="tile-label">Consults</span>
          <span class="tile-val" style="color: var(--health-primary);">342</span>
        </div>
      </div>

      <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-sm); padding: 10px 12px; font-size: 11px; color: #e9d5ff;">
        🌐 <strong>Multi-Gym Isolation Guarantees:</strong> Member workout data, trainer rosters, and financial records are partitioned strictly per gym tenant, while medical health consultations operate under sovereign patient-consent HIPAA/ISO safeguards.
      </div>

      <div>
        <h3 style="font-family: var(--font-headline); font-size: 14px; color: #fff; font-weight: 700; margin-bottom: 8px;">Active Fitness Network Branches</h3>
        ${gymsList}
      </div>
    </div>
  `;
}

// ==========================================================================
// 7. DESIGN SYSTEM PAGE (Prompt Section 61-64, 75)
// ==========================================================================
function renderDesignSystemPage(container) {
  container.innerHTML = `
    <div class="screen-wrapper" style="padding: 24px;">
      <div class="design-system-container">
        <div>
          <span class="badge badge-ai" style="margin-bottom: 6px;">FitSync Design System</span>
          <h1 style="font-family: var(--font-headline); font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.02em;">
            BioDigital Kinetic Design System
          </h1>
          <p style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">
            A unified health-tech and fitness-tech visual specification engineered for high-performance athletic applications.
          </p>
        </div>

        <!-- Color Palette -->
        <div>
          <div class="ds-section-title">🎨 Color Tokens & Functional Roles</div>
          <div class="ds-palette-grid">
            <div class="swatch-card">
              <div class="swatch-color-box" style="background: #10B981;"></div>
              <div class="swatch-details">
                <span class="swatch-name">Fitness Primary</span>
                <span class="swatch-hex">#10B981 (Emerald)</span>
              </div>
            </div>
            <div class="swatch-card">
              <div class="swatch-color-box" style="background: #06B6D4;"></div>
              <div class="swatch-details">
                <span class="swatch-name">Healthcare Primary</span>
                <span class="swatch-hex">#06B6D4 (Cyan)</span>
              </div>
            </div>
            <div class="swatch-card">
              <div class="swatch-color-box" style="background: linear-gradient(135deg, #8B5CF6, #3B82F6);"></div>
              <div class="swatch-details">
                <span class="swatch-name">AI Nebula Gradient</span>
                <span class="swatch-hex">#8B5CF6 / #3B82F6</span>
              </div>
            </div>
            <div class="swatch-card">
              <div class="swatch-color-box" style="background: #0B0F17;"></div>
              <div class="swatch-details">
                <span class="swatch-name">Canvas Base</span>
                <span class="swatch-hex">#0B0F17 (Dark Obsidian)</span>
              </div>
            </div>
            <div class="swatch-card">
              <div class="swatch-color-box" style="background: #F59E0B;"></div>
              <div class="swatch-details">
                <span class="swatch-name">Warning Status</span>
                <span class="swatch-hex">#F59E0B (Amber)</span>
              </div>
            </div>
            <div class="swatch-card">
              <div class="swatch-color-box" style="background: #EF4444;"></div>
              <div class="swatch-details">
                <span class="swatch-name">Danger / Allergen</span>
                <span class="swatch-hex">#EF4444 (Crimson)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Typography -->
        <div>
          <div class="ds-section-title">🔤 Typography Hierarchy</div>
          <div class="card-glass" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">DISPLAY HERO (Space Grotesk 34px / 800)</span>
              <div style="font-family: var(--font-headline); font-size: 34px; font-weight: 800; color: #fff;">18,400 kg Volume</div>
            </div>
            <div>
              <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">HEADLINE LG (Space Grotesk 22px / 700)</span>
              <div style="font-family: var(--font-headline); font-size: 22px; font-weight: 700; color: #fff;">Chest & Triceps Hypertrophy</div>
            </div>
            <div>
              <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">BODY LG (Plus Jakarta Sans 14px / 500)</span>
              <div style="font-size: 14px; color: var(--text-primary); line-height: 1.6;">
                FitSync AI monitors your physiological load, macronutrient oxidation, and joint range-of-motion to personalize every session.
              </div>
            </div>
            <div>
              <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">METRIC CODE (JetBrains Mono 12px / 700)</span>
              <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--fitness-primary);">BMR: 1,720 KCAL • TDEE: 2,450 KCAL • BMI: 23.6</div>
            </div>
          </div>
        </div>

        <!-- Interactive Components Showcase -->
        <div>
          <div class="ds-section-title">🧩 Button & Status Component Sandbox</div>
          <div class="card-glass" style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
            <button class="btn btn-primary-fitness" onclick="playHaptic('tap')">Primary Fitness</button>
            <button class="btn btn-primary-health" onclick="playHaptic('tap')">Primary Healthcare</button>
            <button class="btn btn-ai" onclick="playHaptic('ai')">AI Predictive Action ✨</button>
            <button class="btn btn-secondary" onclick="playHaptic('tap')">Secondary Glass</button>
            <button class="btn btn-outline" onclick="playHaptic('tap')">Ghost Outline</button>
            <button class="btn btn-danger" onclick="playHaptic('tap')">Danger Alert</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 8. PROTOTYPE FLOW PAGE (Prompt Section 72, 75, 76)
// ==========================================================================
function renderPrototypeFlowPage(container) {
  const journeys = [
    {
      num: '1',
      title: 'Member Onboarding & Assessment',
      path: 'Welcome → Register → Gym Selection → 4-Step Senses Assessment → Health Profile Results → Dashboard',
      desc: 'Collects age, height, weight, waist measurements, activity multipliers, primary goals, and allergy profile. Computes real mathematical BMI, BMR, TDEE, and macros with non-diagnostic transparency.',
      actionText: 'Launch Onboarding Flow 🚀',
      onClick: () => {
        state.activePage = 'member';
        state.memberSubScreen = 'welcome';
        renderCurrentView();
      }
    },
    {
      num: '2',
      title: 'Workout & AI Adaptive Progression',
      path: 'Home Dashboard → Chest & Triceps Detail → Live Exercise Logger → Set Completion → Rest Timer → AI Recommendation Acceptance',
      desc: 'Users execute prescribed workouts with set-by-set logging. AI detects high bar velocity and proposes a 82.5kg load increase approved by Coach Raj Patel.',
      actionText: 'Open Workout Routine 💪',
      onClick: () => {
        state.activePage = 'member';
        state.memberSubScreen = 'dashboard';
        state.activeMemberTab = 'workout';
        renderCurrentView();
      }
    },
    {
      num: '3',
      title: 'Nutrition, Food Safety & Pattern Detection',
      path: 'Home Dashboard → Nutrition Module → Meal Log → Dietary Safety Check (Peanut Conflict) → Recurring Reaction Pattern Tracker',
      desc: 'Tracks daily calories and protein against targets. Live allergen filter prevents accidental peanut consumption. Food reaction logs observe recurring lactose bloating.',
      actionText: 'Open Nutrition Hub 🥗',
      onClick: () => {
        state.activePage = 'member';
        state.memberSubScreen = 'dashboard';
        state.activeMemberTab = 'nutrition';
        renderCurrentView();
      }
    },
    {
      num: '4',
      title: 'Trainer Connectivity & Intervention Intelligence',
      path: 'Trainer Portal → Coach Raj Dashboard → Members Needing Attention → Workout Split Push',
      desc: 'Trainers monitor member attendance lapses (Rahul missed 3 workouts) and volume dips (Aarav -8%) with rule-based intervention intelligence.',
      actionText: 'Open Trainer Portal 🏋️',
      onClick: () => {
        state.activePage = 'trainer';
        renderCurrentView();
      }
    },
    {
      num: '5',
      title: 'Doctor & Physio Booking to Telehealth Video Call',
      path: 'Health Hub → Select Doctor / Physio → Available Time Slots → 5-Step Booking → Confirmed Session → Video Consultation Room',
      desc: 'Complete simulated telehealth ecosystem with camera/mic controls, session timers, and private health report access governed by explicit user consent.',
      actionText: 'Launch Telehealth Video Call 📹',
      onClick: () => {
        launchVideoCall();
      }
    },
    {
      num: '6',
      title: 'Multi-Gym Enterprise Network Administration',
      path: 'Platform Admin → Multi-Gym Network Controller → Vadodara / Ahmedabad / Surat Isolation',
      desc: 'Cross-gym platform administrator manages multi-tenant isolation, cross-city facility metrics, and centralized health provider networks.',
      actionText: 'View Multi-Gym Architecture 🌐',
      onClick: () => {
        state.activePage = 'platform-admin';
        renderCurrentView();
      }
    }
  ];

  const stepsHtml = journeys.map(j => `
    <div class="flow-node-step">
      <div class="node-circle-num">${j.num}</div>
      <div class="node-card-body">
        <h3 style="font-family: var(--font-headline); font-size: 16px; color: #fff; font-weight: 700;">${j.title}</h3>
        <div style="font-size: 11px; font-family: var(--font-mono); color: var(--fitness-primary); margin: 4px 0 6px;">
          ${j.path}
        </div>
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 10px;">
          ${j.desc}
        </p>
        <button class="btn btn-primary-fitness btn-sm flow-jump-btn" data-step="${j.num}">
          ${j.actionText}
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="screen-wrapper" style="padding: 24px;">
      <div class="flow-diagram-canvas">
        <div>
          <span class="badge badge-ai" style="margin-bottom: 6px;">Interactive Architecture & Flows</span>
          <h1 style="font-family: var(--font-headline); font-size: 26px; font-weight: 800; color: #fff;">
            FitSync AI — Complete Ecosystem Flow
          </h1>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
            Click any journey to immediately jump into that active screen state and experience the user flow.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 10px;">
          ${stepsHtml}
        </div>
      </div>
    </div>
  `;

  // Bind jump buttons
  container.querySelectorAll('.flow-jump-btn').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      playHaptic('tap');
      journeys[idx].onClick();
    });
  });
}

// ==========================================================================
// MODALS, DRAWERS & OVERLAYS
// ==========================================================================

// AI Assistant Drawer
export function openAiDrawer() {
  state.isAiDrawerOpen = true;
  const drawer = document.getElementById('aiChatDrawerModal');
  if (drawer) {
    drawer.classList.add('active');
    renderAiChatMessages();
  }
}

export function closeAiDrawer() {
  state.isAiDrawerOpen = false;
  const drawer = document.getElementById('aiChatDrawerModal');
  if (drawer) drawer.classList.remove('active');
}

function renderAiChatMessages() {
  const container = document.getElementById('aiChatMessagesList');
  if (!container) return;

  container.innerHTML = state.chatHistory.map(m => `
    <div class="chat-msg ${m.sender === 'ai' ? 'msg-ai' : 'msg-user'}">
      ${m.text}
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

export function handleSendAiChat(text) {
  if (!text || !text.trim()) return;
  state.chatHistory.push({ sender: 'user', text });
  renderAiChatMessages();
  playHaptic('tap');

  // Medical red-flag detection
  const lower = text.toLowerCase();
  let aiReply = '';

  if (lower.includes('chest pain') || lower.includes('sharp pain') || lower.includes('injury') || lower.includes('swelling')) {
    aiReply = '⚠️ MEDICAL SAFETY ADVISORY: I detected a report of acute pain or physical distress. FitSync AI does not provide medical diagnoses or triage acute injuries. Please consult Dr. Ananya Iyer (Sports Physician) or Dr. Ramesh Sharma (Physiotherapist) immediately via the Health Hub tab.';
  } else if (lower.includes('dinner')) {
    aiReply = 'Based on your remaining budget (810 kcal, 38g protein), I suggest: 200g Grilled Lemon-Herb Chicken Breast or 250g Spiced Paneer with 1 cup steamed quinoa and sautéed broccoli. Total: 640 kcal, 44g protein, zero peanut exposure.';
  } else if (lower.includes('increase my protein') || lower.includes('protein')) {
    aiReply = 'To hit your 150g protein goal easily: 1) Add 1 scoop whey isolate with breakfast (+25g), 2) Include 150g Greek yogurt for evening snack (+15g), 3) Increase chicken/paneer portion at dinner by 50g (+14g).';
  } else if (lower.includes('vegetarian high-protein breakfast') || lower.includes('breakfast')) {
    aiReply = 'Try this 520 kcal, 38g protein vegetarian power bowl: 150g Low-fat Greek yogurt, 1 scoop plant/whey protein, 40g rolled oats, 1 tbsp chia seeds, and sliced banana.';
  } else if (lower.includes('600 calories left') || lower.includes('calories left')) {
    aiReply = 'With 600 kcal remaining: 150g grilled fish or tofu skewers (280 kcal, 34g protein) + 1 cup brown basmati rice (215 kcal, 45g carbs) + fresh salad (60 kcal). Perfect balance!';
  } else {
    aiReply = `Great question! Looking at your current stats (${state.user.weightKg} kg, ${state.user.calorieTarget} kcal target), maintaining your 5-day streak and hitting 150g protein will support steady hypertrophy. Let me know if you want to swap exercises or check food allergens.`;
  }

  setTimeout(() => {
    state.chatHistory.push({ sender: 'ai', text: aiReply });
    renderAiChatMessages();
    playHaptic('ai');
  }, 450);
}

// Telehealth Video Call Screen Simulator (Prompt Section 48)
export function launchVideoCall() {
  state.isVideoCallActive = true;
  state.videoCallSeconds = 0;
  const modal = document.getElementById('videoConsultModal');
  if (!modal) return;
  modal.classList.add('active');
  playHaptic('ai');

  // Start call timer
  if (state.videoCallInterval) clearInterval(state.videoCallInterval);
  const timerDisplay = document.getElementById('videoCallTimerDisplay');
  state.videoCallInterval = setInterval(() => {
    state.videoCallSeconds++;
    if (timerDisplay) timerDisplay.textContent = formatTime(state.videoCallSeconds);
  }, 1000);
}

export function endVideoCall() {
  state.isVideoCallActive = false;
  if (state.videoCallInterval) clearInterval(state.videoCallInterval);
  const modal = document.getElementById('videoConsultModal');
  if (modal) modal.classList.remove('active');
  playHaptic('tap');
  showToast(`Telehealth Session Ended (${formatTime(state.videoCallSeconds)}). Clinical notes archived.`, '🩺');
}

// Exercise Detail Modal
function openExerciseDetailModal() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  const ex = state.activeExerciseForModal;
  if (!modal || !body || !ex) return;

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
      <div>
        <span class="badge badge-fitness">${ex.muscle}</span>
        <h3 style="font-family: var(--font-headline); font-size: 20px; color: #fff; font-weight: 700; margin-top: 4px;">${ex.name}</h3>
        <p style="font-size: 12px; color: var(--text-muted);">${ex.equipment} • ${ex.targetSets} Sets × ${ex.targetReps}</p>
      </div>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>

    <img src="${ex.thumbnail}" style="width: 100%; height: 180px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 14px;" />

    <div style="margin-bottom: 12px;">
      <h4 style="color: #fff; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Step-by-Step Instructions:</h4>
      <ol style="padding-left: 20px; color: var(--text-secondary); font-size: 12px; line-height: 1.6;">
        ${ex.instructions.map(step => `<li>${step}</li>`).join('')}
      </ol>
    </div>

    <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 10px; font-size: 11px;">
      <strong style="color: var(--status-warning);">Common Form Mistakes:</strong>
      <p style="color: #e2e8f0; margin-top: 2px;">${ex.commonMistakes}</p>
    </div>

    <div style="background: var(--fitness-container); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-sm); padding: 10px; font-size: 11px;">
      <strong style="color: var(--fitness-primary);">💡 Coach Raj's Biomechanical Tip:</strong>
      <p style="color: #e2e8f0; margin-top: 2px;">${ex.trainerTip}</p>
    </div>
  `;

  modal.classList.add('active');
}

// Exercise Library Modal
function openExerciseLibraryModal() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  if (!modal || !body) return;

  const cards = FITSYNC_DATA.exerciseLibrary.map(item => `
    <div class="card-glass card-glass-interactive" style="padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;" onclick="alert('Viewing technique breakdown for ${item.name}')">
      <div>
        <strong style="color: #fff; font-size: 13px;">${item.name}</strong>
        <div style="font-size: 11px; color: var(--text-muted);">${item.muscle} • ${item.equipment}</div>
      </div>
      <span class="badge badge-fitness">${item.difficulty}</span>
    </div>
  `).join('');

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-family: var(--font-headline); font-size: 18px; color: #fff;">Exercise Library</h3>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>
    <div style="max-height: 400px; overflow-y: auto;">
      ${cards}
    </div>
  `;

  modal.classList.add('active');
}

// Food Safety Modal (Section 34)
function openFoodSafetyModal() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 20px;">🛡️</span>
        <h3 style="font-family: var(--font-headline); font-size: 17px; color: #fff;">Dietary Safety Check</h3>
      </div>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>

    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
      Check food items against your recorded allergies (Peanuts) and dietary preferences (Non-Vegetarian).
    </p>

    <div class="conflict-warning-card" style="margin-bottom: 12px;">
      <div class="conflict-icon">🔴</div>
      <div class="conflict-body">
        <h4>Potential Allergen Conflict Detected: Peanuts</h4>
        <p>"Peanut Butter, Granola Bars containing peanuts, or Satay Sauces are strictly flagged based on your allergy profile."</p>
      </div>
    </div>

    <div class="card-glass" style="margin-bottom: 12px;">
      <label class="input-label">Test any ingredient or dish name:</label>
      <input type="text" id="safetyTestInput" class="input-field" placeholder="e.g. Peanut Butter Toast, Whey Shake, Egg Whites..." value="Peanut Butter Sandwich" />
      <button id="btnRunSafetyTest" class="btn btn-secondary btn-sm" style="margin-top: 8px; width: 100%;">
        Run Allergen Scan
      </button>
    </div>

    <div id="safetyTestResult" style="padding: 10px; border-radius: var(--radius-sm); font-size: 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171;">
      🔴 <strong>Potential Conflict:</strong> Peanuts are listed in your allergy profile. Consuming this food may trigger allergic reactions. (Non-diagnostic alert)
    </div>
  `;

  modal.classList.add('active');

  document.getElementById('btnRunSafetyTest')?.addEventListener('click', () => {
    playHaptic('tap');
    const val = document.getElementById('safetyTestInput')?.value.toLowerCase() || '';
    const res = document.getElementById('safetyTestResult');
    if (val.includes('peanut')) {
      res.style.display = 'block';
      res.innerHTML = `🔴 <strong>Potential Conflict:</strong> Peanuts are listed in your allergy profile.`;
    } else {
      res.style.display = 'block';
      res.style.background = 'var(--fitness-container)';
      res.style.borderColor = 'var(--fitness-primary)';
      res.style.color = '#10b981';
      res.innerHTML = `🟢 <strong>Cleared:</strong> No matching allergen conflicts found for "${val}".`;
    }
  });
}

// Health Reports Vault Modal (Section 44-46)
function openHealthReportsModal() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  if (!modal || !body) return;

  const reportsList = state.reports.map(r => `
    <div class="card-glass" style="margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="badge badge-health">${r.fileType} • ${r.fileSize}</span>
          <h4 style="color: #fff; font-size: 13px; font-weight: 700; margin: 4px 0 2px;">${r.title}</h4>
          <p style="font-size: 11px; color: var(--text-muted);">${r.type} • Uploaded ${r.uploadDate}</p>
        </div>
      </div>
      <div style="font-size: 11px; color: #cbd5e1; background: var(--surface-2); padding: 6px 10px; border-radius: 6px; margin: 8px 0;">
        📊 <strong>Biomarker Highlights:</strong> ${r.highlights}
      </div>

      <!-- Privacy Controls (Section 46 & 64) -->
      <div style="border-top: 1px solid var(--surface-glass-border); padding-top: 8px; font-size: 11px;">
        <span style="color: #fff; font-weight: 600;">🔒 Patient Access Permissions:</span>
        <div style="display: flex; gap: 10px; margin-top: 4px; color: var(--text-secondary);">
          <span>${r.sharedWithDoctor ? '✓' : '✗'} Shared with Doctor Ananya</span>
          <span>${r.sharedWithPhysio ? '✓' : '✗'} Shared with Physio Sharma</span>
          <span style="color: var(--text-muted);">${r.sharedWithTrainer ? '✓' : '🔒 Hidden from Trainer'}</span>
        </div>
      </div>
    </div>
  `).join('');

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-family: var(--font-headline); font-size: 18px; color: #fff;">My Health Reports Vault</h3>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>
    <div style="max-height: 420px; overflow-y: auto;">
      ${reportsList}
    </div>
    <button class="btn btn-primary-fitness" style="width: 100%; margin-top: 10px;" onclick="document.getElementById('exerciseDetailModal').classList.remove('active'); window.openUploadReportModal();">
      ⬆️ Upload New Report (PDF / Image)
    </button>
  `;

  modal.classList.add('active');
}

// Upload Report Modal
window.openUploadReportModal = function() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-family: var(--font-headline); font-size: 18px; color: #fff;">Upload Health Record</h3>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;">
      <button class="btn btn-secondary btn-sm" onclick="showToast('Simulated Camera Photo Capture', '📷')">📷 Take Photo</button>
      <button class="btn btn-secondary btn-sm" onclick="showToast('Simulated Image Selected', '🖼️')">🖼️ Choose Image</button>
      <button class="btn btn-secondary btn-sm" onclick="showToast('Simulated PDF Document Selected', '📄')">📄 Upload PDF</button>
    </div>

    <div class="input-group">
      <label class="input-label">Report Name</label>
      <input type="text" id="upRepName" class="input-field" value="Post-Workout Cardiac Echo & ECG" />
    </div>
    <div class="input-group">
      <label class="input-label">Report Type</label>
      <select id="upRepType" class="input-field">
        <option>Cardiology / ECG</option>
        <option>Blood Panel</option>
        <option>Orthopedic MRI</option>
        <option>Physiotherapy Evaluation</option>
      </select>
    </div>

    <!-- Privacy Checkboxes (Section 46) -->
    <div class="card-glass" style="margin-bottom: 12px;">
      <div style="font-size: 11px; font-weight: 700; color: #fff; margin-bottom: 6px;">Explicit Sharing Consent:</div>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
        <input type="checkbox" checked /> Share with Doctor (Dr. Ananya Iyer)
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
        <input type="checkbox" checked /> Share with Physiotherapist (Dr. Ramesh Sharma)
      </label>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted);">
        <input type="checkbox" /> Share with Gym Trainer (Default: Off for privacy)
      </label>
    </div>

    <button id="btnSaveUploadedReport" class="btn btn-primary-fitness" style="width: 100%;">
      Save & Encrypt Report 🔒
    </button>
  `;

  modal.classList.add('active');

  document.getElementById('btnSaveUploadedReport')?.addEventListener('click', () => {
    playHaptic('success');
    state.reports.unshift({
      id: `rep_${Date.now()}`,
      title: document.getElementById('upRepName')?.value || 'New Medical Report',
      type: document.getElementById('upRepType')?.value || 'Cardiology',
      uploadDate: 'Just now',
      fileType: 'PDF',
      fileSize: '1.8 MB',
      lab: 'Metropolis Vadodara',
      sharedWithDoctor: true,
      sharedWithPhysio: true,
      sharedWithTrainer: false,
      highlights: 'Normal sinus rhythm, ejection fraction 62%, cleared for athletic overload.',
      notes: 'Uploaded by Aarav Shah.'
    });
    modal.classList.remove('active');
    showToast('Report uploaded and encrypted in Health Vault!', '📄');
    renderCurrentView();
  });
};

// Appointment Booking Modal (Section 42)
function openAppointmentBookingModal() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  const draft = state.appointmentDraft;
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-family: var(--font-headline); font-size: 18px; color: #fff;">Book Health Appointment</h3>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>

    <!-- Step 1: Selected Provider -->
    <div class="card-glass" style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px;">
      <img src="${draft.provider.avatar}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" />
      <div>
        <strong style="color: #fff; font-size: 14px;">${draft.provider.name}</strong>
        <div style="font-size: 11px; color: var(--health-accent);">${draft.provider.specialty}</div>
        <div style="font-size: 10px; color: var(--text-muted);">${draft.provider.clinic}</div>
      </div>
    </div>

    <!-- Step 2: Date & Slot Selection (Section 41-42) -->
    <div class="card-glass" style="margin-bottom: 12px;">
      <label class="input-label">Select Date:</label>
      <div style="display: flex; gap: 6px; margin: 6px 0 10px; overflow-x: auto;">
        ${['Today, Oct 7', 'Tomorrow, Oct 8', 'Oct 9, 2026', 'Oct 10, 2026'].map(d => `
          <button class="btn ${draft.date === d ? 'btn-primary-health' : 'btn-secondary'} btn-sm apt-date-btn" data-date="${d}">
            ${d}
          </button>
        `).join('')}
      </div>

      <label class="input-label">Available Slots:</label>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
        ${['10:00 AM', '11:30 AM', '04:00 PM', '05:30 PM'].map(t => `
          <button class="btn ${draft.time === t ? 'btn-primary-health' : 'btn-outline'} btn-sm apt-time-btn" data-time="${t}">
            ${t}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Step 4: Online vs In-Person -->
    <div class="card-glass" style="margin-bottom: 12px;">
      <label class="input-label">Consultation Mode:</label>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
        <button class="btn ${draft.type.includes('Online') ? 'btn-primary-health' : 'btn-secondary'} btn-sm apt-mode-btn" data-mode="Online Video Consultation">
          📹 Online Video
        </button>
        <button class="btn ${draft.type.includes('In-Person') ? 'btn-primary-health' : 'btn-secondary'} btn-sm apt-mode-btn" data-mode="In-Person Clinical Visit">
          🏥 In-Person
        </button>
      </div>
    </div>

    <button id="btnConfirmBookingNow" class="btn btn-primary-fitness" style="width: 100%;">
      Confirm Appointment (${draft.provider.consultationFee}) ✓
    </button>
  `;

  modal.classList.add('active');

  // Bind date/time/mode clicks
  modal.querySelectorAll('.apt-date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      draft.date = btn.dataset.date;
      playHaptic('tap');
      openAppointmentBookingModal();
    });
  });
  modal.querySelectorAll('.apt-time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      draft.time = btn.dataset.time;
      playHaptic('tap');
      openAppointmentBookingModal();
    });
  });
  modal.querySelectorAll('.apt-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      draft.type = btn.dataset.mode;
      playHaptic('tap');
      openAppointmentBookingModal();
    });
  });

  document.getElementById('btnConfirmBookingNow')?.addEventListener('click', () => {
    playHaptic('success');
    state.appointments.unshift({
      id: `apt_${Date.now()}`,
      providerId: draft.provider.id,
      providerName: draft.provider.name,
      providerRole: draft.provider.specialty,
      providerAvatar: draft.provider.avatar,
      clinic: draft.provider.clinic,
      date: draft.date,
      time: draft.time,
      type: draft.type,
      status: 'Upcoming',
      meetingLink: 'https://fitsync.health/telehealth/session-live-room',
      agenda: 'Clinical Consultation'
    });
    modal.classList.remove('active');
    showToast(`Appointment Confirmed with ${draft.provider.name} on ${draft.date} at ${draft.time}!`, '📅');
    renderCurrentView();
  });
}

// My Appointments Modal (Section 43)
function openAppointmentsModal() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  if (!modal || !body) return;

  const aptsHtml = state.appointments.map(a => `
    <div class="card-glass" style="margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <img src="${a.providerAvatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
          <div>
            <h4 style="color: #fff; font-size: 13px; font-weight: 700;">${a.providerName}</h4>
            <div style="font-size: 11px; color: var(--health-accent);">${a.providerRole}</div>
          </div>
        </div>
        <span class="badge badge-health">${a.status}</span>
      </div>

      <div style="margin: 8px 0; font-size: 11px; color: var(--text-secondary);">
        📅 ${a.date} at ${a.time} • <strong>${a.type}</strong>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 8px;">
        ${a.type.includes('Online') ? `
          <button class="btn btn-primary-health btn-sm" onclick="document.getElementById('exerciseDetailModal').classList.remove('active'); window.launchVideoCall();">
            Join Session 📹
          </button>
        ` : ''}
        <button class="btn btn-outline btn-sm" onclick="showToast('Reschedule request sent to clinic.', '📅')">
          Reschedule
        </button>
        <button class="btn btn-outline btn-sm" style="color: #f87171;" onclick="showToast('Appointment cancelled.', '✕')">
          Cancel
        </button>
      </div>
    </div>
  `).join('');

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-family: var(--font-headline); font-size: 18px; color: #fff;">My Health Appointments</h3>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>
    <div style="max-height: 420px; overflow-y: auto;">
      ${aptsHtml}
    </div>
  `;

  modal.classList.add('active');
}

// Progress Dashboard Modal (Section 50-52)
function openProgressModal() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-family: var(--font-headline); font-size: 18px; color: #fff;">My Biometric Progress</h3>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>

    <!-- Weight Trend SVG Line Graph -->
    <div class="card-glass" style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="color: #fff; font-size: 13px;">Bodyweight Trend (kg)</strong>
        <span class="badge badge-fitness">-2.1 kg Progress</span>
      </div>
      <svg viewBox="0 0 300 80" style="width: 100%; height: 80px;">
        <polyline fill="none" stroke="rgba(16, 185, 129, 0.3)" stroke-width="2" points="10,60 60,54 120,48 180,42 240,36 290,30" />
        <polyline fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" points="10,60 60,54 120,48 180,42 240,36 290,30" />
        <circle cx="290" cy="30" r="4" fill="#fff" stroke="#10b981" stroke-width="2" />
        <text x="250" y="24" fill="#10b981" font-size="11" font-weight="700">72.4 kg</text>
      </svg>
      <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">
        <span>Week 1 (74.5kg)</span>
        <span>Week 2</span>
        <span>Week 3</span>
        <span>Today (72.4kg)</span>
      </div>
    </div>

    <!-- Active Goals Progress Bars (Section 52) -->
    <div class="card-glass">
      <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 8px;">My Fitness Goals</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span>Bench Press: 80 kg → 90 kg</span>
            <span style="font-weight: 700; color: var(--fitness-primary);">82.5 kg (65%)</span>
          </div>
          <div class="tile-progress-bar"><div class="tile-progress-fill fill-emerald" style="width: 65%;"></div></div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span>Reach 150g Protein Daily</span>
            <span style="font-weight: 700; color: var(--health-primary);">112g (75%)</span>
          </div>
          <div class="tile-progress-bar"><div class="tile-progress-fill fill-cyan" style="width: 75%;"></div></div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span>Gym Attendance: 4 days / week</span>
            <span style="font-weight: 700; color: var(--status-warning);">5 days (125% - Streak!)</span>
          </div>
          <div class="tile-progress-bar"><div class="tile-progress-fill fill-orange" style="width: 100%;"></div></div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Notifications Drawer (Section 59)
function openNotificationsDrawer() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  if (!modal || !body) return;

  const notifsHtml = FITSYNC_DATA.notifications.map(n => `
    <div class="card-glass" style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <strong style="color: #fff; font-size: 13px;">${n.title}</strong>
        <span style="font-size: 10px; color: var(--text-muted);">${n.time}</span>
      </div>
      <p style="font-size: 11px; color: var(--text-secondary); margin: 3px 0 6px;">${n.desc}</p>
      <button class="btn btn-outline btn-sm" style="font-size: 10px; padding: 3px 8px;" onclick="showToast('Handled notification: ${n.title}', '✓')">
        ${n.actionText} →
      </button>
    </div>
  `).join('');

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-family: var(--font-headline); font-size: 18px; color: #fff;">Notification Center</h3>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>
    <div style="max-height: 400px; overflow-y: auto;">
      ${notifsHtml}
    </div>
  `;

  modal.classList.add('active');
}

// Global Search Overlay (Section 60)
function openSearchDrawer() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-family: var(--font-headline); font-size: 18px; color: #fff;">Global FitSync Search</h3>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>

    <input type="text" id="globalSearchQueryInput" class="input-field" placeholder="Search exercises, foods, trainers, doctors, gyms..." style="margin-bottom: 10px;" />

    <div style="display: flex; gap: 6px; overflow-x: auto; margin-bottom: 12px;">
      <span class="badge badge-fitness">All</span>
      <span class="badge badge-outline">Exercises</span>
      <span class="badge badge-outline">Foods</span>
      <span class="badge badge-outline">Trainers</span>
      <span class="badge badge-outline">Doctors</span>
    </div>

    <div style="font-size: 12px; color: var(--text-muted);">
      Quick suggestions:
      <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 6px;">
        <div class="card-glass" style="padding: 8px;">🏋️ Barbell Bench Press (Chest)</div>
        <div class="card-glass" style="padding: 8px;">🥗 Gourmet High-Protein Fitness Bowl</div>
        <div class="card-glass" style="padding: 8px;">👨‍🏫 Coach Raj Patel (Strength Coach)</div>
        <div class="card-glass" style="padding: 8px;">🩺 Dr. Ananya Iyer (Sports Physician)</div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Trainer Discovery Modal
function openTrainerDiscoveryModal() {
  const modal = document.getElementById('exerciseDetailModal');
  const body = document.getElementById('exerciseDetailBody');
  if (!modal || !body) return;

  const trainersList = FITSYNC_DATA.trainers.map(tr => `
    <div class="card-glass" style="margin-bottom: 10px;">
      <div style="display: flex; gap: 10px; align-items: flex-start;">
        <img src="${tr.avatar}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" />
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <strong style="color: #fff; font-size: 14px;">${tr.name}</strong>
            <span class="badge badge-fitness">★ ${tr.rating}</span>
          </div>
          <div style="font-size: 11px; color: var(--fitness-primary);">${tr.role}</div>
          <div style="font-size: 10px; color: var(--text-muted);">${tr.experience} • ${tr.certifications.join(', ')}</div>
          <p style="font-size: 11px; color: var(--text-secondary); margin: 4px 0;">${tr.bio}</p>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <button class="btn btn-primary-fitness btn-sm" onclick="showToast('Connected with Coach ${tr.name}!', '🤝')">Connect</button>
            <button class="btn btn-outline btn-sm" onclick="showToast('Message sent to Coach ${tr.name}', '💬')">Message</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-family: var(--font-headline); font-size: 18px; color: #fff;">Find a Gym Trainer</h3>
      <button class="icon-btn-pill" onclick="document.getElementById('exerciseDetailModal').classList.remove('active')">✕</button>
    </div>
    <div style="max-height: 420px; overflow-y: auto;">
      ${trainersList}
    </div>
  `;

  modal.classList.add('active');
}

// Expose Global Handlers for HTML Inlines
window.openAiDrawer = openAiDrawer;
window.closeAiDrawer = closeAiDrawer;
window.handleSendAiChat = handleSendAiChat;
window.launchVideoCall = launchVideoCall;
window.endVideoCall = endVideoCall;
window.playHaptic = playHaptic;
window.showToast = showToast;
window.openHealthReportsModal = openHealthReportsModal;
window.openAppointmentsModal = openAppointmentsModal;
window.openExerciseLibraryModal = openExerciseLibraryModal;
window.openFoodSafetyModal = openFoodSafetyModal;
