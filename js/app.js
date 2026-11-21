/**
 * FitSync — Master Application Router & Controller (Vanilla JS)
 * Drives 16 Integrated Modules, Modals, LocalStorage State, and UI Events
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial State Render
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

  // Get plan data from store
  const plan = window.fitSyncStore ? window.fitSyncStore.getWorkoutPlan(dayKey) : null;
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
          totalVolume += (s.reps || 0) * (s.weight || 0);
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
        exVolume += (s.reps || 0) * (s.weight || 0);
      }
    });

    const rowsHtml = (ex.sets || []).map((set, setIdx) => `
      <tr class="${set.done ? 'set-completed' : ''}" id="row-${plan.dayKey}-${exIdx}-${setIdx}">
        <td><span class="wk-set-tag">Set ${set.set}</span></td>
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
            <span class="wk-step-input wk-weight-num" id="wt-val-${plan.dayKey}-${exIdx}-${setIdx}">${parseFloat(set.weight).toFixed(1)} kg</span>
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
    `).join('');

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
  const plan = window.fitSyncStore.getWorkoutPlan(dayKey);
  if (!plan || !plan.exercises[exIdx] || !plan.exercises[exIdx].sets[setIdx]) return;

  const setObj = plan.exercises[exIdx].sets[setIdx];
  setObj.weight = Math.max(0, parseFloat(((setObj.weight || 0) + delta).toFixed(1)));
  window.fitSyncStore.saveWorkoutPlan(dayKey, plan);

  const wtValEl = document.getElementById(`wt-val-${dayKey}-${exIdx}-${setIdx}`);
  if (wtValEl) wtValEl.textContent = `${setObj.weight.toFixed(1)} kg`;

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
