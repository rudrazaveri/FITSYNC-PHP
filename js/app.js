/**
 * FitSync — Master Application Router & Controller (Vanilla JS)
 * Drives 16 Integrated Modules, Modals, LocalStorage State, and UI Events
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Check Authentication & Session State
  initAuthSystem();

  // 1b. Initial State Render
  updateDashboardUI();

  // 2. Setup Routing & Cross-page navigation
  setupNavigation();

  // 3. Render Charts
  if (window.renderAllCharts) {
    window.renderAllCharts();
  }

  // 4. Initialize Lucide Icons & SVG fallbacks
  initIcons();

  // 5. Setup Event Listeners & Timers
  setupEventListeners();
  setupRestTimer();
  setupAssessmentLiveCalculator();
  initWorkoutPlannerModule();
  setupHeaderRestTimer();
  initExerciseLibraryModule();
});

// Robust Icon Initializer (Lucide + Instant Inline SVG Fallback)
function initIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// View Navigation Router
function switchView(viewName) {
  if (!viewName) return;

  // Deactivate all view containers
  document.querySelectorAll('.view-container').forEach(view => {
    view.classList.remove('active');
  });

  // Activate target view
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
  } else {
    console.warn(`View "view-${viewName}" not found, falling back to dashboard.`);
    document.getElementById('view-dashboard')?.classList.add('active');
    viewName = 'dashboard';
  }

  // Update sidebar active link state
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    if (item.getAttribute('data-nav') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Show/Hide Right Dashboard Panel (only show on dashboard view for clean focus on other pages)
  const rightPanel = document.querySelector('.dashboard-right');
  if (rightPanel) {
    if (viewName === 'dashboard') {
      rightPanel.style.display = 'flex';
    } else {
      rightPanel.style.display = 'none';
    }
  }

  // Re-render icons and charts if needed
  initIcons();
  if (viewName === 'exercises') {
    renderExerciseLibrary(currentSelectedMuscle || 'all', currentExerciseSearch || '');
  }
  setTimeout(() => {
    if (window.renderAllCharts) window.renderAllCharts();
  }, 60);

  // Close mobile drawer if open
  document.getElementById('sidebarNav')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupNavigation() {
  // Sidebar navigation items
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-nav');
      if (view) {
        switchView(view);
      }
    });
  });

  // In-page navigation links [data-switch-view]
  document.querySelectorAll('[data-switch-view]').forEach(elem => {
    elem.addEventListener('click', (e) => {
      e.preventDefault();
      const view = elem.getAttribute('data-switch-view');
      if (view) switchView(view);
    });
  });
}

// Update UI from Store State
function updateDashboardUI() {
  const state = window.fitSyncStore.state;
  syncUserProfileUI();

  // 1. Stats Cards
  const weightVal = document.getElementById('statWeightValue');
  const weightChange = document.getElementById('statWeightChange');
  if (weightVal) weightVal.textContent = `${state.stats.weight.current} ${state.stats.weight.unit}`;
  if (weightChange) weightChange.textContent = state.stats.weight.changeText;

  const bmiVal = document.getElementById('statBmiValue');
  const bmiBadge = document.getElementById('statBmiStatus');
  if (bmiVal) bmiVal.textContent = state.stats.bmi.value;
  if (bmiBadge) bmiBadge.textContent = state.stats.bmi.status;

  const calVal = document.getElementById('statCalValue');
  const calBar = document.getElementById('statCalBar');
  if (calVal) calVal.textContent = `${state.stats.calories.current.toLocaleString()} / ${state.stats.calories.target.toLocaleString()} kcal`;
  if (calBar) {
    const calPct = Math.min(100, Math.round((state.stats.calories.current / state.stats.calories.target) * 100));
    calBar.style.width = `${calPct}%`;
  }

  const waterVal = document.getElementById('statWaterValue');
  const waterBar = document.getElementById('statWaterBar');
  if (waterVal) waterVal.textContent = `${state.stats.water.current} / ${state.stats.water.target} L`;
  if (waterBar) {
    const waterPct = Math.min(100, Math.round((state.stats.water.current / state.stats.water.target) * 100));
    waterBar.style.width = `${waterPct}%`;
  }

  // 2. Nutrition Summary Card
  const nutCalorieCenter = document.getElementById('nutCalorieCenter');
  if (nutCalorieCenter) nutCalorieCenter.textContent = `${state.nutrition.calories.toLocaleString()} kcal`;

  const nutProteinVal = document.getElementById('nutProteinVal');
  const nutProteinBar = document.getElementById('nutProteinBar');
  if (nutProteinVal) nutProteinVal.textContent = `${state.nutrition.macros.protein.current} / ${state.nutrition.macros.protein.target} g`;
  if (nutProteinBar) {
    const pPct = Math.min(100, Math.round((state.nutrition.macros.protein.current / state.nutrition.macros.protein.target) * 100));
    nutProteinBar.style.width = `${pPct}%`;
  }

  const nutCarbsVal = document.getElementById('nutCarbsVal');
  const nutCarbsBar = document.getElementById('nutCarbsBar');
  if (nutCarbsVal) nutCarbsVal.textContent = `${state.nutrition.macros.carbs.current} / ${state.nutrition.macros.carbs.target} g`;
  if (nutCarbsBar) {
    const cPct = Math.min(100, Math.round((state.nutrition.macros.carbs.current / state.nutrition.macros.carbs.target) * 100));
    nutCarbsBar.style.width = `${cPct}%`;
  }

  const nutFatVal = document.getElementById('nutFatVal');
  const nutFatBar = document.getElementById('nutFatBar');
  if (nutFatVal) nutFatVal.textContent = `${state.nutrition.macros.fat.current} / ${state.nutrition.macros.fat.target} g`;
  if (nutFatBar) {
    const fPct = Math.min(100, Math.round((state.nutrition.macros.fat.current / state.nutrition.macros.fat.target) * 100));
    nutFatBar.style.width = `${fPct}%`;
  }

  // 3. Right Water Widget & Water Station Module
  const rightWaterVal = document.getElementById('rightWaterValue');
  const rightWaterBar = document.getElementById('rightWaterBar');
  if (rightWaterVal) rightWaterVal.textContent = `${state.stats.water.current} / ${state.stats.water.target} L`;
  if (rightWaterBar) {
    const wPct = Math.min(100, Math.round((state.stats.water.current / state.stats.water.target) * 100));
    rightWaterBar.style.width = `${wPct}%`;
  }

  const stationWaterCurrent = document.getElementById('stationWaterCurrent');
  const stationWaterFill = document.getElementById('stationWaterFill');
  const stationWaterRem = document.getElementById('stationWaterRem');
  if (stationWaterCurrent) stationWaterCurrent.textContent = `${state.stats.water.current} L`;
  if (stationWaterFill) {
    const sPct = Math.min(100, Math.round((state.stats.water.current / state.stats.water.target) * 100));
    stationWaterFill.style.height = `${sPct}%`;
  }
  if (stationWaterRem) {
    const rem = Math.max(0, (state.stats.water.target - state.stats.water.current)).toFixed(1);
    stationWaterRem.textContent = `${rem} L`;
  }

  // 4. Goal Ring
  const goalCircle = document.getElementById('goalProgressCircle');
  const goalPctText = document.getElementById('goalProgressText');
  if (goalCircle) {
    const circumference = 264;
    const offset = circumference - (circumference * state.goal.progressPercent) / 100;
    goalCircle.style.strokeDashoffset = offset;
  }
  if (goalPctText) {
    goalPctText.textContent = `${state.goal.progressPercent}%`;
  }

  // 5. Attendance Module Stats
  const attMonthlyVisits = document.getElementById('attMonthlyVisits');
  const attStreak = document.getElementById('attStreak');
  const attConsistency = document.getElementById('attConsistency');
  if (attMonthlyVisits) attMonthlyVisits.textContent = `${state.attendance.monthlyVisits} / ${state.attendance.targetVisits} Days`;
  if (attStreak) attStreak.textContent = `${state.attendance.currentStreak} Days 🔥`;
  if (attConsistency) attConsistency.textContent = `${state.attendance.consistencyPct}%`;
}

// Event Listeners for Quick Action Buttons, Modals, Forms
function setupEventListeners() {
  // Mobile Sidebar Toggle
  const mobileToggle = document.getElementById('mobileNavToggle');
  const sidebar = document.getElementById('sidebarNav');
  const overlay = document.getElementById('sidebarOverlay');

  if (mobileToggle && sidebar && overlay) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Quick Action Buttons
  document.getElementById('actionLogWorkout')?.addEventListener('click', () => openModal('workoutModal'));
  document.getElementById('actionAddMeal')?.addEventListener('click', () => openModal('addMealModal'));
  document.getElementById('actionAddWater')?.addEventListener('click', () => openModal('addWaterModal'));
  document.getElementById('actionUpdateProgress')?.addEventListener('click', () => openModal('updateProgressModal'));
  document.getElementById('actionBookAppointment')?.addEventListener('click', () => openModal('bookAppointmentModal'));
  document.getElementById('actionUploadReport')?.addEventListener('click', () => openModal('uploadReportModal'));

  // Today's Workout Button
  document.getElementById('startWorkoutBtn')?.addEventListener('click', () => openModal('workoutModal'));

  // View Details Links
  document.getElementById('rightAddWaterLink')?.addEventListener('click', () => openModal('addWaterModal'));

  // Attendance Check-in Simulation
  document.getElementById('simulateCheckInBtn')?.addEventListener('click', () => {
    window.fitSyncStore.recordAttendance();
    updateDashboardUI();
    showToast('✅ Turnstile Unlocked! Attendance registered at FitZone Gym.', 'success');
  });

  // Modal Close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });

  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // Keyboard ESC to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });

  // Setup Form Handlers
  setupFormHandlers();
}

// Trigger Realistic Glass Water Filling Animation
function triggerWaterFillAnimation() {
  const glassWrapper = document.getElementById('glassStationWrapper');
  if (!glassWrapper) return;
  glassWrapper.classList.remove('water-filling');
  void glassWrapper.offsetWidth; // force browser layout reflow
  glassWrapper.classList.add('water-filling');
  setTimeout(() => {
    glassWrapper.classList.remove('water-filling');
  }, 1200);
}

function setupFormHandlers() {
  // 1. Water Intake Form & Station Presets
  const waterForm = document.getElementById('waterForm');
  document.querySelectorAll('.water-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseFloat(btn.getAttribute('data-amount'));
      window.fitSyncStore.addWater(amount);
      triggerWaterFillAnimation();
      updateDashboardUI();
      if (window.renderAllCharts) window.renderAllCharts();
      showToast(`Added ${amount * 1000} ml of water!`, 'success');
      closeModal('addWaterModal');
    });
  });

  if (waterForm) {
    waterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const customMl = parseFloat(document.getElementById('customWaterInput').value);
      if (customMl > 0) {
        const liters = customMl / 1000;
        window.fitSyncStore.addWater(liters);
        triggerWaterFillAnimation();
        updateDashboardUI();
        if (window.renderAllCharts) window.renderAllCharts();
        showToast(`Added ${customMl} ml water recorded!`, 'success');
        closeModal('addWaterModal');
      }
    });
  }

  // 2. Add Meal Form
  const mealForm = document.getElementById('mealForm');
  if (mealForm) {
    mealForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const timing = document.getElementById('mealTiming').value;
      const foodName = document.getElementById('mealFoodName').value;
      const cal = parseInt(document.getElementById('mealCalories').value) || 0;
      const protein = parseInt(document.getElementById('mealProtein').value) || 0;
      const carbs = parseInt(document.getElementById('mealCarbs').value) || 0;
      const fat = parseInt(document.getElementById('mealFat').value) || 0;

      window.fitSyncStore.addMeal(foodName, timing, cal, protein, carbs, fat);
      updateDashboardUI();
      showToast(`Logged "${foodName}" (+${cal} kcal)!`, 'success');
      closeModal('addMealModal');
      mealForm.reset();
    });
  }

  // 3. Update Progress Form
  const progressForm = document.getElementById('progressForm');
  if (progressForm) {
    progressForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newWeight = document.getElementById('newWeightInput').value;
      if (newWeight) {
        window.fitSyncStore.updateWeight(newWeight);
        updateDashboardUI();
        if (window.renderAllCharts) window.renderAllCharts();
        showToast(`Weight updated to ${newWeight} kg!`, 'success');
        closeModal('updateProgressModal');
      }
    });
  }

  // 4. Book Appointment Form
  const appointmentForm = document.getElementById('appointmentForm');
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const doctor = document.getElementById('appointmentDoctor').value;
      const date = document.getElementById('appointmentDate').value;
      const time = document.getElementById('appointmentTime').value;

      showToast(`Appointment booked with ${doctor} for ${date} at ${time}!`, 'success');
      closeModal('bookAppointmentModal');
      appointmentForm.reset();
    });
  }

  // 5. Upload Report Form
  const uploadForm = document.getElementById('uploadReportForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const reportName = document.getElementById('reportCategory').value;
      showToast(`Document "${reportName}" encrypted and saved to Vault!`, 'success');
      closeModal('uploadReportModal');
    });
  }

  // 6. User Settings Profile Form
  const settingsForm = document.getElementById('settingsProfileForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('setFullName').value;
      const phone = document.getElementById('setPhone').value;
      const emergency = document.getElementById('setEmergency').value;
      window.fitSyncStore.updateUserProfile({
        name: fullName,
        phone: phone,
        emergencyContact: emergency
      });
      showToast('Profile settings saved successfully!', 'success');
    });
  }
}

// Live Biometric Calculator (Mifflin-St Jeor Formula) for Assessment Module
function setupAssessmentLiveCalculator() {
  const form = document.getElementById('fullAssessmentForm');
  if (!form) return;

  const ageInput = document.getElementById('asAge');
  const genderInput = document.getElementById('asGender');
  const heightInput = document.getElementById('asHeight');
  const weightInput = document.getElementById('asWeight');
  const waistInput = document.getElementById('asWaist');
  const neckInput = document.getElementById('asNeck');
  const hipInput = document.getElementById('asHip');
  const actInput = document.getElementById('asActivity');
  const goalInput = document.getElementById('asGoal');

  function recompute() {
    const age = parseFloat(ageInput?.value) || 24;
    const gender = genderInput?.value || 'female';
    const height = parseFloat(heightInput?.value) || 168;
    const weight = parseFloat(weightInput?.value) || 62.5;
    const waist = parseFloat(waistInput?.value) || 74;
    const neck = parseFloat(neckInput?.value) || 32;
    const hip = parseFloat(hipInput?.value) || 94;
    const activity = parseFloat(actInput?.value) || 1.55;
    const goal = goalInput?.value || 'muscle_gain';

    // BMI
    const hm = height / 100;
    const bmi = parseFloat((weight / (hm * hm)).toFixed(1));

    // BMR (Mifflin-St Jeor)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'female') {
      bmr -= 161;
    } else {
      bmr += 5;
    }
    bmr = Math.round(bmr);

    // TDEE
    const tdee = Math.round(bmr * activity);

    // Goal Calorie Target
    let targetCal = tdee;
    if (goal === 'muscle_gain') targetCal += 250;
    else if (goal === 'fat_loss') targetCal = Math.max(1200, tdee - 400);

    // Macros
    const proteinG = Math.round(weight * 2.0);
    const fatG = Math.round((targetCal * 0.25) / 9);
    const carbsG = Math.round((targetCal - (proteinG * 4) - (fatG * 9)) / 4);

    // U.S. Navy Body Fat Estimate
    let bodyFat = 22.0;
    if (gender === 'female' && waist && hip && neck && height) {
      bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    } else if (waist && neck && height) {
      bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    }
    bodyFat = Math.max(8, Math.min(50, parseFloat(bodyFat.toFixed(1))));

    // Update Live Display Elements
    document.getElementById('asResBmi') && (document.getElementById('asResBmi').textContent = bmi);
    document.getElementById('asResBmr') && (document.getElementById('asResBmr').textContent = `${bmr.toLocaleString()} kcal`);
    document.getElementById('asResTdee') && (document.getElementById('asResTdee').textContent = `${tdee.toLocaleString()} kcal`);
    document.getElementById('asResTarget') && (document.getElementById('asResTarget').textContent = `${targetCal.toLocaleString()} kcal`);
    document.getElementById('asResMacros') && (document.getElementById('asResMacros').textContent = `${proteinG}g P • ${carbsG}g C • ${fatG}g F`);
    document.getElementById('asResBodyFat') && (document.getElementById('asResBodyFat').textContent = `${bodyFat}%`);

    return { bmi, bmr, tdee, targetCalories: targetCal, targetProtein: proteinG, targetCarbs: carbsG, targetFat: fatG, bodyFatPct: bodyFat };
  }

  [ageInput, genderInput, heightInput, weightInput, waistInput, neckInput, hipInput, actInput, goalInput].forEach(el => {
    if (el) el.addEventListener('input', recompute);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const computed = recompute();
    window.fitSyncStore.saveAssessment(computed);
    updateDashboardUI();
    showToast('Biometric assessment saved to your FitSync health profile!', 'success');
  });

  recompute();
}

// Modal Open / Close Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Rest Timer Engine for Workout Session Modal
let timerSeconds = 60;
let timerRunning = false;
let timerInterval = null;

function setupRestTimer() {
  const display = document.getElementById('modalTimerDisplay');
  const startBtn = document.getElementById('modalTimerStartBtn');
  const resetBtn = document.getElementById('modalTimerResetBtn');

  if (!display || !startBtn || !resetBtn) return;

  function updateDisplay() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  startBtn.addEventListener('click', () => {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.textContent = 'Start';
    } else {
      timerRunning = true;
      startBtn.textContent = 'Pause';
      timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
          timerSeconds--;
          updateDisplay();
        } else {
          clearInterval(timerInterval);
          timerRunning = false;
          startBtn.textContent = 'Start';
          timerSeconds = 60;
          updateDisplay();
          showToast('🔔 Rest interval complete! Ready for next set.', 'info');
        }
      }, 1000);
    }
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 60;
    startBtn.textContent = 'Start';
    updateDisplay();
  });

  document.querySelectorAll('.timer-chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.textContent = 'Start';
      timerSeconds = parseInt(chip.getAttribute('data-sec')) || 60;
      updateDisplay();
    });
  });

  updateDisplay();
}

// Toast Feedback Notification
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-msg">${message}</span>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global functions for inline HTML event handlers
window.switchView = switchView;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.initIcons = initIcons;
window.triggerWaterFillAnimation = triggerWaterFillAnimation;

// =========================================================================
// 7-DAY WORKOUT SPLIT PLANNER & DAY TRAVELLER CONTROLLER
// =========================================================================

let currentWorkoutDay = 'tue'; // Default to Tuesday matching reference preview
let headerRestSeconds = 90;
let headerTimerRunning = false;
let headerTimerInterval = null;

function initWorkoutPlannerModule() {
  const dayButtons = document.querySelectorAll('#wkDaysStrip .wk-day-btn');
  dayButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const day = btn.getAttribute('data-day');
      if (day) {
        selectWorkoutDay(day);
      }
    });
  });

  // Initial load
  selectWorkoutDay(currentWorkoutDay);
}

function selectWorkoutDay(dayKey) {
  currentWorkoutDay = dayKey;

  // Update 7-day strip active classes
  document.querySelectorAll('#wkDaysStrip .wk-day-btn').forEach(btn => {
    if (btn.getAttribute('data-day') === dayKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Get plan data from store or default fallback
  let plan = null;
  if (window.fitSyncStore && typeof window.fitSyncStore.getWorkoutPlan === 'function') {
    plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  }
  if (!plan && window.DEFAULT_FITSYNC_DATA && window.DEFAULT_FITSYNC_DATA.workoutPlans) {
    plan = window.DEFAULT_FITSYNC_DATA.workoutPlans[dayKey];
  }
  if (!plan) return;

  // Update routine titles and badges
  const badgeEl = document.getElementById('wkRoutineBadge');
  const subBadgeEl = document.getElementById('wkRoutineSubBadge');
  const titleEl = document.getElementById('wkRoutineTitle');
  const taglineEl = document.getElementById('wkRoutineTagline');
  const scheduledBadgeEl = document.getElementById('wkScheduledBadge');
  const statTargetEl = document.getElementById('wkStatTarget');
  const statDurationEl = document.getElementById('wkStatDuration');

  if (badgeEl) badgeEl.textContent = plan.badge || `${dayKey.toUpperCase()}'S ROUTINE`;
  if (subBadgeEl) subBadgeEl.textContent = plan.subBadge || 'Daily Routine Preview';
  if (titleEl) titleEl.textContent = plan.title || 'Workout Session';
  if (taglineEl) taglineEl.textContent = plan.tagline || '';
  
  const exCount = plan.exercises ? plan.exercises.length : 0;
  if (scheduledBadgeEl) scheduledBadgeEl.textContent = `${exCount} Exercises Scheduled`;
  if (statTargetEl) statTargetEl.textContent = `${exCount} Exercises`;
  if (statDurationEl) statDurationEl.textContent = `Estimated Duration: ${plan.duration || '45 mins'}`;

  // Render Exercise Cards
  renderWorkoutExercises(plan);

  // Update stats summary cards
  updateWorkoutStats(plan);

  // Initialize Lucide icons inside newly rendered exercise cards
  initIcons();
}

function updateWorkoutStats(plan) {
  if (!plan || !plan.exercises) return;

  let totalVolume = 0;
  let totalSets = 0;
  let completedSets = 0;

  plan.exercises.forEach(ex => {
    if (ex.sets) {
      ex.sets.forEach(s => {
        totalSets++;
        if (s.done) {
          completedSets++;
          const numWeight = (s.weight === 'Bodyweight' || s.weight === 0 || s.weight === '0') ? 0 : (parseFloat(s.weight) || 0);
          totalVolume += (s.reps || 0) * numWeight;
        }
      });
    }
  });

  const volEl = document.getElementById('wkStatVolume');
  const setsEl = document.getElementById('wkStatSets');
  const setsSubEl = document.getElementById('wkStatSetsSub');

  if (volEl) volEl.textContent = `${Math.round(totalVolume).toLocaleString()} kg`;
  if (setsEl) setsEl.textContent = `${completedSets} / ${totalSets} sets`;
  if (setsSubEl) {
    const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    setsSubEl.textContent = `${pct}% of routine completed`;
  }
}

function renderWorkoutExercises(plan) {
  const container = document.getElementById('wkExercisesContainer');
  if (!container) return;

  if (!plan.exercises || plan.exercises.length === 0) {
    container.innerHTML = `
      <div class="fs-card" style="text-align: center; padding: 32px; color: var(--text-secondary);">
        <i data-lucide="coffee" style="width: 32px; height: 32px; margin-bottom: 8px; color: var(--primary-blue);"></i>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main);">Rest & Muscle Recovery Day</h4>
        <p style="font-size: 13px; margin-top: 4px;">No intense lifting scheduled for ${plan.dayName}. Focus on hydration, mobility, and recovery nutrition.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = plan.exercises.map((ex, exIdx) => {
    let exCompletedSets = 0;
    let exVolume = 0;
    (ex.sets || []).forEach(s => {
      if (s.done) {
        exCompletedSets++;
        const numWeight = (s.weight === 'Bodyweight' || s.weight === 0 || s.weight === '0') ? 0 : (parseFloat(s.weight) || 0);
        exVolume += (s.reps || 0) * numWeight;
      }
    });

    const rowsHtml = (ex.sets || []).map((set, setIdx) => {
      const isBw = set.weight === 'Bodyweight' || set.weight === 0 || set.weight === '0' || set.weight === '0.0 kg';
      const displayWeight = isBw ? 'Bodyweight' : `${parseFloat(set.weight).toFixed(1)} kg`;

      return `
      <tr class="${set.done ? 'set-completed' : ''}" id="row-${plan.dayKey}-${exIdx}-${setIdx}">
        <td><span class="wk-set-pill">Set ${set.set}</span></td>
        <td>
          <div class="wk-stepper-box">
            <button type="button" class="wk-stepper-btn" onclick="stepReps(this, -1, '${plan.dayKey}', ${exIdx}, ${setIdx})">-</button>
            <span class="wk-step-input" id="rep-val-${plan.dayKey}-${exIdx}-${setIdx}">${set.reps}</span>
            <button type="button" class="wk-stepper-btn" onclick="stepReps(this, 1, '${plan.dayKey}', ${exIdx}, ${setIdx})">+</button>
            <span class="wk-unit-label">reps</span>
          </div>
        </td>
        <td>
          <div class="wk-stepper-box">
            <button type="button" class="wk-stepper-btn" onclick="stepWeight(this, -2.5, '${plan.dayKey}', ${exIdx}, ${setIdx})">-</button>
            <span class="wk-step-input wk-weight-num ${isBw ? 'wk-weight-bodyweight' : ''}" id="wt-val-${plan.dayKey}-${exIdx}-${setIdx}">${displayWeight}</span>
            <button type="button" class="wk-stepper-btn" onclick="stepWeight(this, 2.5, '${plan.dayKey}', ${exIdx}, ${setIdx})">+</button>
          </div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="btn-mark-done ${set.done ? 'completed' : ''}" id="btn-done-${plan.dayKey}-${exIdx}-${setIdx}" onclick="toggleSetDone(this, '${plan.dayKey}', ${exIdx}, ${setIdx})">
              <i data-lucide="${set.done ? 'check-circle' : 'circle'}" style="width: 13px; height: 13px;"></i>
              <span>${set.done ? 'Completed ✓' : 'Mark Done'}</span>
            </button>
            <button type="button" class="wk-trash-btn" onclick="deleteSet('${plan.dayKey}', ${exIdx}, ${setIdx})" title="Remove Set">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `}).join('');

    return `
      <div class="wk-exercise-card">
        <div class="wk-ex-header">
          <div class="wk-ex-left">
            <img src="${ex.image || 'assets/images/bench_press.jpg'}" alt="${ex.name}" class="wk-ex-thumb" onerror="this.src='assets/images/bench_press.jpg'">
            <div>
              <h4 class="wk-ex-title">${ex.name}</h4>
              <p class="wk-ex-subtitle">${ex.muscle} • ${ex.equipment}</p>
              <span class="wk-ex-target-pill">${ex.target || 'Target: 4 sets × 10-12 reps'}</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" class="wk-pill-btn" onclick="openModal('bookAppointmentModal')">
              <i data-lucide="message-square" style="width: 12px; height: 12px;"></i> Ask Trainer
            </button>
            <button type="button" class="wk-pill-btn" onclick="switchView('exercises')">
              <i data-lucide="help-circle" style="width: 12px; height: 12px;"></i> Exercise Guide
            </button>
            <button type="button" class="wk-trash-btn" onclick="deleteExercise('${plan.dayKey}', ${exIdx})" title="Remove Exercise">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>

        <table class="wk-set-table">
          <thead>
            <tr>
              <th style="width: 15%;">Set</th>
              <th style="width: 32%;">Reps</th>
              <th style="width: 33%;">Weight</th>
              <th style="width: 20%;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="wk-ex-footer">
          <button type="button" class="wk-btn-add-set" onclick="addSetToExercise('${plan.dayKey}', ${exIdx})">
            <i data-lucide="plus" style="width: 13px; height: 13px;"></i> Add Set ${(ex.sets || []).length + 1}
          </button>
          <div class="wk-ex-footer-stats" id="ex-summary-${plan.dayKey}-${exIdx}">
            <span>Sets: <strong>${exCompletedSets}/${(ex.sets || []).length}</strong></span>
            <span style="margin: 0 6px; color: var(--border-color);">•</span>
            <span>Volume: <strong>${Math.round(exVolume).toLocaleString()} kg</strong></span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleSetDone(btn, dayKey, exIdx, setIdx) {
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises[exIdx] || !plan.exercises[exIdx].sets[setIdx]) return;

  const setObj = plan.exercises[exIdx].sets[setIdx];
  setObj.done = !setObj.done;

  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);

  const row = document.getElementById(`row-${dayKey}-${exIdx}-${setIdx}`);
  const doneBtn = document.getElementById(`btn-done-${dayKey}-${exIdx}-${setIdx}`);

  if (setObj.done) {
    if (row) row.classList.add('set-completed');
    if (doneBtn) {
      doneBtn.classList.add('completed');
      doneBtn.innerHTML = '<i data-lucide="check-circle" style="width: 13px; height: 13px;"></i> <span>Completed ✓</span>';
    }
    // Automatically launch rest timer countdown!
    startHeaderRestTimer(90);
    showToast(`🎉 Set ${setObj.set} marked complete! Rest timer countdown (90s) started.`, 'success');
  } else {
    if (row) row.classList.remove('set-completed');
    if (doneBtn) {
      doneBtn.classList.remove('completed');
      doneBtn.innerHTML = '<i data-lucide="circle" style="width: 13px; height: 13px;"></i> <span>Mark Done</span>';
    }
  }

  // Update summary stats
  updateWorkoutStats(plan);

  // Update exercise footer
  let exCompletedSets = 0;
  let exVolume = 0;
  plan.exercises[exIdx].sets.forEach(s => {
    if (s.done) {
      exCompletedSets++;
      exVolume += (s.reps || 0) * (s.weight || 0);
    }
  });
  const summaryEl = document.getElementById(`ex-summary-${dayKey}-${exIdx}`);
  if (summaryEl) {
    summaryEl.innerHTML = `<span>Sets: <strong>${exCompletedSets}/${plan.exercises[exIdx].sets.length}</strong></span><span style="margin: 0 6px; color: var(--border-color);">•</span><span>Volume: <strong>${Math.round(exVolume).toLocaleString()} kg</strong></span>`;
  }

  initIcons();
}

function stepReps(btn, delta, dayKey, exIdx, setIdx) {
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises[exIdx] || !plan.exercises[exIdx].sets[setIdx]) return;

  const setObj = plan.exercises[exIdx].sets[setIdx];
  setObj.reps = Math.max(1, (setObj.reps || 10) + delta);
  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);

  const repValEl = document.getElementById(`rep-val-${dayKey}-${exIdx}-${setIdx}`);
  if (repValEl) repValEl.textContent = setObj.reps;

  updateWorkoutStats(plan);
}

function stepWeight(btn, delta, dayKey, exIdx, setIdx) {
  let plan = window.fitSyncStore && typeof window.fitSyncStore.getWorkoutPlan === 'function'
    ? window.fitSyncStore.getWorkoutPlan(dayKey)
    : (window.DEFAULT_FITSYNC_DATA?.workoutPlans[dayKey]);
  if (!plan || !plan.exercises[exIdx] || !plan.exercises[exIdx].sets[setIdx]) return;

  const setObj = plan.exercises[exIdx].sets[setIdx];
  let cur = (setObj.weight === 'Bodyweight' || setObj.weight === 0 || setObj.weight === '0') ? 0 : (parseFloat(setObj.weight) || 0);
  let next = cur + delta;
  if (next <= 0) {
    setObj.weight = 'Bodyweight';
  } else {
    setObj.weight = parseFloat(next.toFixed(1));
  }

  if (window.fitSyncStore && typeof window.fitSyncStore.saveWorkoutPlan === 'function') {
    window.fitSyncStore.saveWorkoutPlan(dayKey, plan);
  }

  const wtValEl = document.getElementById(`wt-val-${dayKey}-${exIdx}-${setIdx}`);
  if (wtValEl) {
    const isBw = setObj.weight === 'Bodyweight';
    wtValEl.textContent = isBw ? 'Bodyweight' : `${setObj.weight.toFixed(1)} kg`;
    if (isBw) {
      wtValEl.classList.add('wk-weight-bodyweight');
    } else {
      wtValEl.classList.remove('wk-weight-bodyweight');
    }
  }

  updateWorkoutStats(plan);
}

function addSetToExercise(dayKey, exIdx) {
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises[exIdx]) return;

  const ex = plan.exercises[exIdx];
  const lastSet = ex.sets && ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : { reps: 10, weight: 50 };
  const newSetNum = (ex.sets ? ex.sets.length : 0) + 1;

  ex.sets.push({
    set: newSetNum,
    reps: lastSet.reps,
    weight: lastSet.weight,
    done: false
  });

  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);
  selectWorkoutDay(dayKey);
  showToast(`Added Set ${newSetNum} to ${ex.name}`, 'info');
}

function deleteSet(dayKey, exIdx, setIdx) {
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises[exIdx]) return;

  plan.exercises[exIdx].sets.splice(setIdx, 1);
  // Re-number sets
  plan.exercises[exIdx].sets.forEach((s, idx) => {
    s.set = idx + 1;
  });

  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);
  selectWorkoutDay(dayKey);
  showToast('Set removed.', 'info');
}

function deleteExercise(dayKey, exIdx) {
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises) return;

  const removed = plan.exercises.splice(exIdx, 1);
  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);
  selectWorkoutDay(dayKey);
  showToast(`Removed exercise: ${removed[0]?.name || ''}`, 'info');
}

function resetWorkoutSets() {
  const plan = window.fitSyncStore.getWorkoutPlan(currentWorkoutDay);
  if (!plan || !plan.exercises) return;

  plan.exercises.forEach(ex => {
    (ex.sets || []).forEach(s => {
      s.done = false;
    });
  });

  window.fitSyncStore.saveWorkoutPlan(currentWorkoutDay, plan);
  selectWorkoutDay(currentWorkoutDay);
  showToast(`All sets reset to 0 for ${plan.badge || 'this routine'}.`, 'info');
}

function promptAddExercise() {
  const name = prompt('Enter exercise name to add to this routine (e.g. Standing Overhead Press):');
  if (!name || !name.trim()) return;

  const plan = window.fitSyncStore.getWorkoutPlan(currentWorkoutDay);
  if (!plan) return;

  if (!plan.exercises) plan.exercises = [];
  plan.exercises.push({
    id: 'ex_' + Date.now(),
    name: name.trim(),
    muscle: 'Full Body Compound',
    equipment: 'Free Weights / Machine',
    image: 'assets/images/bench_press.jpg',
    target: 'Target: 4 sets × 10 reps @ 50.0 kg',
    sets: [
      { set: 1, reps: 10, weight: 40.0, done: false },
      { set: 2, reps: 10, weight: 45.0, done: false },
      { set: 3, reps: 8, weight: 50.0, done: false }
    ]
  });

  window.fitSyncStore.saveWorkoutPlan(currentWorkoutDay, plan);
  selectWorkoutDay(currentWorkoutDay);
  showToast(`Added ${name} to routine!`, 'success');
}

// Routine Header Rest Timer Engine
function setupHeaderRestTimer() {
  updateHeaderTimerDisplay();
}

function updateHeaderTimerDisplay() {
  const clock = document.getElementById('wkHeaderTimerDisplay');
  if (!clock) return;
  const mins = Math.floor(headerRestSeconds / 60);
  const secs = headerRestSeconds % 60;
  clock.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function toggleHeaderRestTimer() {
  if (headerTimerRunning) {
    pauseHeaderRestTimer();
  } else {
    resumeHeaderRestTimer();
  }
}

function resumeHeaderRestTimer() {
  if (headerTimerRunning) return;
  headerTimerRunning = true;

  const btn = document.getElementById('wkHeaderTimerToggle');
  if (btn) btn.innerHTML = '<i data-lucide="pause" style="width: 12px; height: 12px;"></i>';
  initIcons();

  headerTimerInterval = setInterval(() => {
    if (headerRestSeconds > 0) {
      headerRestSeconds--;
      updateHeaderTimerDisplay();
    } else {
      pauseHeaderRestTimer();
      headerRestSeconds = 90;
      updateHeaderTimerDisplay();
      showToast('🔔 Rest Interval Complete! Begin your next set.', 'info');
    }
  }, 1000);
}

function pauseHeaderRestTimer() {
  clearInterval(headerTimerInterval);
  headerTimerRunning = false;
  const btn = document.getElementById('wkHeaderTimerToggle');
  if (btn) btn.innerHTML = '<i data-lucide="play" style="width: 12px; height: 12px;"></i>';
  initIcons();
}

function startHeaderRestTimer(seconds = 90) {
  clearInterval(headerTimerInterval);
  headerRestSeconds = seconds;
  updateHeaderTimerDisplay();
  resumeHeaderRestTimer();
}

function setHeaderRestPreset(seconds) {
  clearInterval(headerTimerInterval);
  headerTimerRunning = false;
  headerRestSeconds = seconds;
  const btn = document.getElementById('wkHeaderTimerToggle');
  if (btn) btn.innerHTML = '<i data-lucide="play" style="width: 12px; height: 12px;"></i>';
  updateHeaderTimerDisplay();
  initIcons();
}

function resetHeaderRestTimer() {
  clearInterval(headerTimerInterval);
  headerTimerRunning = false;
  headerRestSeconds = 90;
  const btn = document.getElementById('wkHeaderTimerToggle');
  if (btn) btn.innerHTML = '<i data-lucide="play" style="width: 12px; height: 12px;"></i>';
  updateHeaderTimerDisplay();
  initIcons();
}

// Reset Water Intake Action
function resetWaterIntake() {
  if (window.fitSyncStore && typeof window.fitSyncStore.resetWater === 'function') {
    window.fitSyncStore.resetWater();
  }
  updateDashboardUI();
  const stationWaterFill = document.getElementById('stationWaterFill');
  if (stationWaterFill) {
    stationWaterFill.style.height = '0%';
  }
  showToast('💧 Water intake reset to 0.0 L for today.', 'info');
}

// Global functions for inline HTML event handlers
window.initWorkoutPlannerModule = initWorkoutPlannerModule;
window.selectWorkoutDay = selectWorkoutDay;
window.toggleSetDone = toggleSetDone;
window.stepReps = stepReps;
window.stepWeight = stepWeight;
window.addSetToExercise = addSetToExercise;
window.deleteSet = deleteSet;
window.deleteExercise = deleteExercise;
window.resetWorkoutSets = resetWorkoutSets;
window.promptAddExercise = promptAddExercise;
window.toggleHeaderRestTimer = toggleHeaderRestTimer;
window.setHeaderRestPreset = setHeaderRestPreset;
window.resetHeaderRestTimer = resetHeaderRestTimer;
window.startHeaderRestTimer = startHeaderRestTimer;
window.resetWaterIntake = resetWaterIntake;

// =========================================================================
// INTERACTIVE HUMAN ANATOMY & EXERCISE LIBRARY CONTROLLER
// =========================================================================

let currentSelectedMuscle = 'all';
let currentExerciseSearch = '';
let currentAnatomyView = 'front';

function initExerciseLibraryModule() {
  // 1. Setup SVG Muscle Group Click & Hover Listeners
  const svgMuscleGroups = document.querySelectorAll('.muscle-group');
  svgMuscleGroups.forEach(group => {
    const muscle = group.getAttribute('data-muscle');
    if (!muscle) return;

    // Hover highlight
    group.addEventListener('mouseenter', () => {
      highlightMuscleOnDiagram(muscle, true);
    });

    group.addEventListener('mouseleave', () => {
      highlightMuscleOnDiagram(muscle, false);
    });

    // Click to select/filter
    group.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentSelectedMuscle === muscle) {
        selectMuscle('all');
      } else {
        selectMuscle(muscle);
      }
    });
  });

  // 2. Setup Filter Chips
  const filterChips = document.querySelectorAll('#exerciseFilterChips .filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const muscle = chip.getAttribute('data-muscle') || 'all';
      selectMuscle(muscle);
    });
  });

  // 3. Setup Live Search Input
  const searchInput = document.getElementById('exerciseSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentExerciseSearch = e.target.value.trim().toLowerCase();
      renderExerciseLibrary(currentSelectedMuscle, currentExerciseSearch);
    });
  }

  // 4. Initial Render
  selectMuscle('all');
}

function setAnatomyView(view) {
  currentAnatomyView = view;
  const wrapper = document.getElementById('anatomyDiagramWrapper');
  if (wrapper) {
    wrapper.setAttribute('data-active-view', view);
  }

  // Update button active classes
  document.querySelectorAll('.anatomy-toggle-pill').forEach(btn => {
    btn.classList.remove('active');
  });

  if (view === 'front') {
    document.getElementById('btnAnatomyFront')?.classList.add('active');
  } else if (view === 'back') {
    document.getElementById('btnAnatomyBack')?.classList.add('active');
  } else {
    document.getElementById('btnAnatomyBoth')?.classList.add('active');
  }
  initIcons();
}

function highlightMuscleOnDiagram(muscleKey, isHover) {
  const groups = document.querySelectorAll(`.muscle-group[data-muscle="${muscleKey}"]`);
  groups.forEach(g => {
    if (isHover) {
      g.classList.add('highlighted');
    } else {
      g.classList.remove('highlighted');
    }
  });
}

function selectMuscle(muscleKey) {
  currentSelectedMuscle = muscleKey || 'all';

  // 1. Sync anatomy diagram active classes across both SVGs
  document.querySelectorAll('.muscle-group').forEach(g => {
    const m = g.getAttribute('data-muscle');
    if (currentSelectedMuscle !== 'all' && m === currentSelectedMuscle) {
      g.classList.add('active');
    } else {
      g.classList.remove('active');
    }
  });

  // 2. Auto-switch diagram view if the selected muscle is predominantly on the other side
  const biomechanics = window.MUSCLE_BIOMECHANICS || {};
  const muscleInfo = biomechanics[currentSelectedMuscle] || biomechanics['all'];

  if (currentAnatomyView !== 'both') {
    if (muscleInfo && muscleInfo.view === 'posterior' && currentAnatomyView !== 'back') {
      setAnatomyView('back');
    } else if (muscleInfo && muscleInfo.view === 'anterior' && currentAnatomyView !== 'front') {
      setAnatomyView('front');
    }
  }

  // 3. Update the Anatomy Info Card Banner
  updateAnatomyInfoBanner(currentSelectedMuscle, muscleInfo);

  // 4. Update Filter Chips active state
  document.querySelectorAll('#exerciseFilterChips .filter-chip').forEach(chip => {
    const chipMuscle = chip.getAttribute('data-muscle') || 'all';
    if (chipMuscle === currentSelectedMuscle) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  // 5. Render Exercise Grid
  renderExerciseLibrary(currentSelectedMuscle, currentExerciseSearch);
}

function updateAnatomyInfoBanner(muscleKey, muscleInfo) {
  const allExercises = window.fitSyncStore ? window.fitSyncStore.getExerciseLibrary() : [];
  let matchingCount = allExercises.length;
  if (muscleKey !== 'all') {
    matchingCount = allExercises.filter(ex => ex.muscleGroup === muscleKey).length;
  }

  const titleEl = document.getElementById('anatomyMuscleTitle');
  const latinEl = document.getElementById('anatomyMuscleLatin');
  const funcEl = document.getElementById('anatomyMuscleFunction');
  const synEl = document.getElementById('anatomyMuscleSynergists');
  const planeEl = document.getElementById('anatomyMusclePlane');
  const counterEl = document.getElementById('anatomyExerciseCounter');

  if (muscleInfo) {
    if (titleEl) titleEl.textContent = muscleInfo.name || "Musculoskeletal System";
    if (latinEl) latinEl.textContent = muscleInfo.latin || "Anatomia";
    if (funcEl) funcEl.textContent = muscleInfo.function || "";
    if (synEl) synEl.textContent = muscleInfo.synergists || "Full Body Kinetic Chain";
    if (planeEl) {
      planeEl.textContent = muscleInfo.view === 'both' ? 'Multi-Planar' : (muscleInfo.view === 'anterior' ? 'Frontal / Sagittal' : 'Posterior Sagittal');
    }
  }

  if (counterEl) {
    counterEl.textContent = `${matchingCount} Exercise${matchingCount === 1 ? '' : 's'} Available`;
  }
}

function renderExerciseLibrary(filterMuscle = 'all', searchQuery = '') {
  const container = document.getElementById('exerciseLibraryGrid');
  if (!container) return;

  const allExercises = window.fitSyncStore ? window.fitSyncStore.getExerciseLibrary() : [];
  let filtered = allExercises;

  // Filter by muscle group
  if (filterMuscle && filterMuscle !== 'all') {
    filtered = filtered.filter(ex => ex.muscleGroup === filterMuscle);
  }

  // Filter by search query
  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(ex => {
      const name = (ex.name || '').toLowerCase();
      const muscle = (ex.muscle || '').toLowerCase();
      const equip = (ex.equipment || '').toLowerCase();
      const diff = (ex.difficulty || '').toLowerCase();
      const cues = (ex.cues || '').toLowerCase();
      return name.includes(q) || muscle.includes(q) || equip.includes(q) || diff.includes(q) || cues.includes(q);
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; background: #FFFFFF; border: 1px dashed var(--border-color); border-radius: var(--radius-lg); padding: 48px 24px; text-align: center;">
        <div style="font-size: 36px; margin-bottom: 10px;">🔍</div>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">No exercises found matching criteria</h4>
        <p style="font-size: 13px; color: var(--text-secondary); max-width: 400px; margin: 0 auto 16px auto;">Try clearing your search query or selecting a different muscle group from the anatomy diagram.</p>
        <button type="button" class="btn-primary-block" style="width: auto; margin: 0 auto; padding: 8px 18px;" onclick="document.getElementById('exerciseSearchInput').value=''; currentExerciseSearch=''; selectMuscle('all');">
          Reset Filter & Search
        </button>
      </div>
    `;
    initIcons();
    return;
  }

  let html = '';
  filtered.forEach(ex => {
    const diffClass = ex.difficulty === 'Beginner' ? 'diff-beginner' : (ex.difficulty === 'Advanced' ? 'diff-advanced' : 'diff-intermediate');
    html += `
      <div class="ex-library-card">
        <div class="ex-library-card-img-wrap" onclick="showExerciseDetailModal('${ex.id}')">
          <img src="${ex.image || 'assets/images/ex_flat_bench.jpg'}" class="ex-library-card-img" alt="${ex.name}" onerror="this.src='assets/images/ex_flat_bench.jpg'">
          <span class="ex-library-diff-badge ${diffClass}">${ex.difficulty || 'Intermediate'}</span>
        </div>
        <div class="ex-library-muscle-tag" title="${ex.muscle}">
          ${ex.muscle}
        </div>
        <h4 class="ex-library-title" onclick="showExerciseDetailModal('${ex.id}')" style="cursor: pointer;">
          ${ex.name}
        </h4>
        <p class="ex-library-cues">${ex.cues || 'Maintain rigid kinetic alignment and focus on eccentric stretch.'}</p>
        <div class="ex-library-tags-row">
          <span class="tag-badge">${ex.equipment || 'Gym Equipment'}</span>
          <span class="tag-badge">${ex.type || 'Compound'}</span>
        </div>
        <div class="ex-library-actions">
          <button type="button" class="ex-btn-guide" onclick="showExerciseDetailModal('${ex.id}')">
            <i data-lucide="book-open" style="width: 13px; height: 13px;"></i> Guide
          </button>
          <button type="button" class="ex-btn-add" onclick="quickAddExerciseToRoutine('${ex.id}')" title="Add to Today's Routine">
            <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add to Routine
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  initIcons();
}

function showExerciseDetailModal(exId) {
  const allExercises = window.fitSyncStore ? window.fitSyncStore.getExerciseLibrary() : [];
  const ex = allExercises.find(item => item.id === exId) || allExercises[0];
  if (!ex) return;

  const titleEl = document.getElementById('exModalTitle');
  const imgEl = document.getElementById('exModalImage');
  const diffEl = document.getElementById('exModalDifficultyTag');
  const muscleBadgeEl = document.getElementById('exModalMuscleBadge');
  const typeBadgeEl = document.getElementById('exModalTypeBadge');
  const equipBadgeEl = document.getElementById('exModalEquipBadge');
  const cuesEl = document.getElementById('exModalCues');
  const targetSetsEl = document.getElementById('exModalTargetSets');
  const addBtn = document.getElementById('exModalAddBtn');

  if (titleEl) titleEl.textContent = ex.name;
  if (imgEl) {
    imgEl.src = ex.image || 'assets/images/ex_flat_bench.jpg';
    imgEl.onerror = () => { imgEl.src = 'assets/images/ex_flat_bench.jpg'; };
  }
  if (diffEl) {
    diffEl.textContent = ex.difficulty || 'Intermediate';
    diffEl.className = 'tag-badge ' + (ex.difficulty === 'Beginner' ? 'diff-beginner' : (ex.difficulty === 'Advanced' ? 'diff-advanced' : 'diff-intermediate'));
  }
  if (muscleBadgeEl) muscleBadgeEl.textContent = `Target: ${ex.muscle}`;
  if (typeBadgeEl) typeBadgeEl.textContent = ex.type || 'Compound Movement';
  if (equipBadgeEl) equipBadgeEl.textContent = ex.equipment || 'Free Weights';
  if (cuesEl) cuesEl.textContent = ex.cues || 'Maintain proper form and control throughout.';
  if (targetSetsEl) {
    targetSetsEl.textContent = ex.type === 'Compound' ? '4 Sets • 6-10 Reps • 90-120s Rest' : '3-4 Sets • 10-15 Reps • 60s Rest';
  }

  if (addBtn) {
    addBtn.onclick = () => {
      quickAddExerciseToRoutine(ex.id);
      closeModal('exerciseDetailModal');
    };
  }

  openModal('exerciseDetailModal');
  initIcons();
}

function quickAddExerciseToRoutine(exId) {
  const allExercises = window.fitSyncStore ? window.fitSyncStore.getExerciseLibrary() : [];
  const ex = allExercises.find(item => item.id === exId);
  if (!ex) return;

  const dayKey = currentWorkoutDay || 'tue';
  const plan = window.fitSyncStore ? window.fitSyncStore.getWorkoutPlan(dayKey) : null;
  if (!plan) return;

  if (!plan.exercises) plan.exercises = [];

  const defaultSets = [
    { set: 1, reps: 10, weight: 50.0, done: false },
    { set: 2, reps: 10, weight: 55.0, done: false },
    { set: 3, reps: 8, weight: 60.0, done: false }
  ];

  plan.exercises.push({
    id: `ex_${Date.now()}`,
    name: ex.name,
    muscle: ex.muscle,
    equipment: ex.equipment,
    image: ex.image || 'assets/images/ex_flat_bench.jpg',
    target: `Target: 3 sets × 8–10 reps`,
    sets: defaultSets
  });

  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);
  if (typeof renderWorkoutPlan === 'function') {
    renderWorkoutPlan(plan);
  }
  showToast(`✅ Added "${ex.name}" to ${plan.dayName}'s Routine!`, 'success');
}

// Global exports for inline HTML handlers
window.initExerciseLibraryModule = initExerciseLibraryModule;
window.setAnatomyView = setAnatomyView;
window.selectMuscle = selectMuscle;
window.highlightMuscleOnDiagram = highlightMuscleOnDiagram;
window.renderExerciseLibrary = renderExerciseLibrary;
window.showExerciseDetailModal = showExerciseDetailModal;
window.quickAddExerciseToRoutine = quickAddExerciseToRoutine;


// ==========================================================================
// FitSync AI — Authentication & Session Controller
// ==========================================================================

function initAuthSystem() {
  const store = window.fitSyncStore;
  if (!store) return;

  const authOverlay = document.getElementById('authDashboardOverlay');
  const appLayout = document.querySelector('.app-layout');

  if (!authOverlay) return;

  if (store.state.isLoggedIn === false) {
    // Show Auth Dashboard, hide app layout
    authOverlay.style.display = 'flex';
    if (appLayout) appLayout.style.display = 'none';
    renderRegisteredAccountsChips();
    initIcons();
  } else {
    // Show App Layout, hide auth dashboard
    authOverlay.style.display = 'none';
    if (appLayout) appLayout.style.display = 'flex';
    syncUserProfileUI();
  }
}

function syncUserProfileUI() {
  const user = window.fitSyncStore?.state?.user;
  if (!user) return;

  // Sidebar User Badge
  const sbName = document.getElementById('sidebarUserName');
  const sbRole = document.getElementById('sidebarUserRole');
  const sbAvatar = document.getElementById('sidebarAvatarImg');
  if (sbName) sbName.textContent = user.name;
  if (sbRole) sbRole.textContent = user.role || 'Member · Premium';
  if (sbAvatar && user.avatar) sbAvatar.src = user.avatar;

  // Dashboard Welcome Greeting
  const dashGreeting = document.getElementById('dashboardGreetingName');
  if (dashGreeting) {
    const firstName = user.name.split(' ')[0] || user.name;
    dashGreeting.textContent = firstName;
  }

  // Settings View Fields
  const setFullName = document.getElementById('setFullName');
  const setEmail = document.getElementById('setEmail');
  const setPhone = document.getElementById('setPhone');
  const setAvatar = document.getElementById('settingsAvatarImg');
  const setUserName = document.getElementById('settingsUserName');
  const setSessionUser = document.getElementById('settingsSessionUser');
  const setSessionEmail = document.getElementById('settingsSessionEmail');

  if (setFullName) setFullName.value = user.name;
  if (setEmail) setEmail.value = user.email;
  if (setPhone && user.phone) setPhone.value = user.phone;
  if (setAvatar && user.avatar) setAvatar.src = user.avatar;
  if (setUserName) setUserName.textContent = user.name;
  if (setSessionUser) setSessionUser.textContent = user.name;
  if (setSessionEmail) setSessionEmail.textContent = user.email;
}

function switchAuthTab(tab) {
  const signInBtn = document.getElementById('authTabBtnSignIn');
  const registerBtn = document.getElementById('authTabBtnRegister');
  const demoBtn = document.getElementById('authTabBtnDemo');

  const signInPane = document.getElementById('authSignInPane');
  const registerPane = document.getElementById('authRegisterPane');
  const demoPane = document.getElementById('authDemoPane');
  const container = document.getElementById('authCardContainer');

  [signInBtn, registerBtn, demoBtn].forEach(b => b?.classList.remove('active'));
  if (signInPane) signInPane.style.display = 'none';
  if (registerPane) registerPane.style.display = 'none';
  if (demoPane) demoPane.style.display = 'none';

  if (tab === 'signin') {
    signInBtn?.classList.add('active');
    if (signInPane) signInPane.style.display = 'block';
    container?.classList.remove('auth-container-wide');
  } else if (tab === 'register') {
    registerBtn?.classList.add('active');
    if (registerPane) registerPane.style.display = 'block';
    container?.classList.add('auth-container-wide');
  } else if (tab === 'demo') {
    demoBtn?.classList.add('active');
    if (demoPane) demoPane.style.display = 'block';
    container?.classList.remove('auth-container-wide');
  }
  initIcons();
}

function selectRegisterRole(role) {
  const roleInput = document.getElementById('regRoleInput');
  const memberCard = document.getElementById('roleCardMember');
  const trainerCard = document.getElementById('roleCardTrainer');
  const submitBtn = document.getElementById('regSubmitBtn');

  if (roleInput) roleInput.value = role;

  if (role === 'trainer') {
    trainerCard?.classList.add('active');
    memberCard?.classList.remove('active');
    if (submitBtn) {
      submitBtn.innerHTML = 'Create Trainer Profile & Enter FitSync <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>';
    }
  } else {
    memberCard?.classList.add('active');
    trainerCard?.classList.remove('active');
    if (submitBtn) {
      submitBtn.innerHTML = 'Create Athlete Profile & Enter FitSync <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>';
    }
  }
  initIcons();
}

function selectHomeGym(branchName, location, index) {
  document.getElementById('regGymBranchInput').value = branchName;
  document.getElementById('regGymLocationInput').value = location;
  for (let i = 0; i < 3; i++) {
    const card = document.getElementById(`gymBranch${i}`);
    if (card) {
      if (i === index) card.classList.add('active');
      else card.classList.remove('active');
    }
  }
  initIcons();
}

function renderRegisteredAccountsChips() {
  const list = document.getElementById('registeredAccountsList');
  if (!list) return;

  const users = window.fitSyncStore?.state?.registeredUsers || [];
  if (users.length === 0) {
    list.innerHTML = '<span style="font-size:12px; color:#64748B;">No accounts saved yet. Register below.</span>';
    return;
  }

  list.innerHTML = users.map((u, idx) => {
    const icon = u.role === 'Gym Trainer' ? 'award' : 'user';
    const tag = u.tag || (u.role === 'Gym Trainer' ? 'Trainer' : 'Athlete');
    const shortName = u.name.split(' ')[0].toLowerCase();
    const isActive = idx === 0 ? 'active' : '';
    return `<button type="button" class="auth-account-chip ${isActive}" onclick="quickSelectAccount('${u.email}')">
      <i data-lucide="${icon}" style="width:13px; height:13px;"></i> ${shortName} (${tag})
    </button>`;
  }).join('');

  initIcons();
}

function quickSelectAccount(email) {
  const emailInput = document.getElementById('authEmailInput');
  const passwordInput = document.getElementById('authPasswordInput');
  if (emailInput) emailInput.value = email;
  if (passwordInput) passwordInput.value = 'password123';

  // Highlight chip
  document.querySelectorAll('.auth-account-chip').forEach(chip => {
    if (chip.textContent.toLowerCase().includes(email.split('@')[0].split('.')[0].toLowerCase())) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

function quickFillAccount(type) {
  if (type === 'athlete') {
    quickSelectAccount('ritika@fitsync.health');
  } else if (type === 'coach') {
    quickSelectAccount('coach@fitsync.health');
  }
}

function handleSignInSubmit(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('authEmailInput')?.value;
  const password = document.getElementById('authPasswordInput')?.value;
  const remember = document.getElementById('authStaySignedIn')?.checked;

  if (!email) {
    alert('Please enter your email address.');
    return;
  }

  window.fitSyncStore.login(email, password, remember);
  initAuthSystem();
  updateDashboardUI();
  showNotification(`Welcome back to FitSync AI, ${window.fitSyncStore.state.user.name}!`);
}

function handleRegisterSubmit(e) {
  if (e) e.preventDefault();
  const fullName = document.getElementById('regFullName')?.value;
  const email = document.getElementById('regEmail')?.value;
  const phone = document.getElementById('regPhone')?.value;
  const avatarUrl = document.getElementById('regAvatarUrl')?.value;
  const password = document.getElementById('regPassword')?.value;
  const confirmPassword = document.getElementById('regConfirmPassword')?.value;
  const role = document.getElementById('regRoleInput')?.value;
  const gender = document.getElementById('regGender')?.value;
  const age = document.getElementById('regAge')?.value;
  const height = document.getElementById('regHeight')?.value;
  const weight = document.getElementById('regWeight')?.value;
  const goal = document.getElementById('regGoal')?.value;
  const activityLevel = document.getElementById('regActivity')?.value;
  const gymBranch = document.getElementById('regGymBranchInput')?.value;
  const gymLocation = document.getElementById('regGymLocationInput')?.value;

  if (password !== confirmPassword) {
    alert('Passwords do not match. Please verify your password.');
    return;
  }

  window.fitSyncStore.register({
    fullName,
    email,
    phone,
    avatarUrl,
    role,
    gender,
    age,
    height,
    weight,
    goal,
    activityLevel,
    gymBranch,
    gymLocation
  });

  initAuthSystem();
  updateDashboardUI();
  showNotification(`Profile created! Welcome to FitSync AI, ${fullName}.`);
}

function loginDemoAccount(key) {
  if (key === 'ritika') {
    window.fitSyncStore.login('ritika@fitsync.health', 'password123');
  } else if (key === 'coach') {
    window.fitSyncStore.login('coach@fitsync.health', 'password123');
  } else if (key === 'aarav') {
    window.fitSyncStore.login('aarav@fitsync.health', 'password123');
  } else {
    window.fitSyncStore.login('isha.kulkarni@fitsync.com', 'password123');
  }
  initAuthSystem();
  updateDashboardUI();
  showNotification(`Signed in as ${window.fitSyncStore.state.user.name}!`);
}

function logoutUser() {
  if (confirm('Are you sure you want to log out of FitSync?')) {
    window.fitSyncStore.logout();
    initAuthSystem();
    switchAuthTab('signin');
    showNotification('You have logged out safely.');
  }
}

function handleResetDatabase() {
  if (confirm('Wipe local database and start completely fresh? All custom logs will be cleared.')) {
    window.fitSyncStore.resetDatabase();
    initAuthSystem();
    switchAuthTab('signin');
    const banner = document.getElementById('cleanDbBanner');
    if (banner) banner.style.display = 'flex';
    showNotification('Local database has been wiped. Clean Mode active.');
  }
}

function dismissCleanBanner() {
  const banner = document.getElementById('cleanDbBanner');
  if (banner) banner.style.display = 'none';
}

function handleForgotPassword() {
  alert('Demo Password Reset: All accounts use "password123", or you can 1-Click Demo Sign In anytime!');
}

function openDataStorageModal() {
  openModal('dataStorageModal');
}

// Export Auth Functions
window.initAuthSystem = initAuthSystem;
window.syncUserProfileUI = syncUserProfileUI;
window.switchAuthTab = switchAuthTab;
window.selectRegisterRole = selectRegisterRole;
window.selectHomeGym = selectHomeGym;
window.quickSelectAccount = quickSelectAccount;
window.quickFillAccount = quickFillAccount;
window.handleSignInSubmit = handleSignInSubmit;
window.handleRegisterSubmit = handleRegisterSubmit;
window.loginDemoAccount = loginDemoAccount;
window.logoutUser = logoutUser;
window.handleResetDatabase = handleResetDatabase;
window.dismissCleanBanner = dismissCleanBanner;
window.handleForgotPassword = handleForgotPassword;
window.openDataStorageModal = openDataStorageModal;
