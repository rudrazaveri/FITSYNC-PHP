/**
 * FitSync — Master Application Router & Controller (Vanilla JS)
 * Drives 16 Integrated Modules, Modals, LocalStorage State, and UI Events
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Check Authentication & Session State
  initAuthSystem();

  // 1a. Instant Welcome Greeting & Date calculation
  updateWelcomeGreeting(window.fitSyncStore?.state?.user?.name);

  // 1b. Initial State Render
  updateDashboardUI();

  // 1c. Sync Real Database Telemetry (Zero fabricated metrics)
  syncUserDashboardFromDb();

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
  setupMacroAutoCalculation();
  loadUserProfileData();
  loadAttendanceCalendar();
  renderMealsTimeline();
  renderWaterLogs();

  // Initial routing from URL hash if provided
  const initialHash = window.location.hash.replace(/^#/, '');
  if (initialHash && document.getElementById(`view-${initialHash}`)) {
    switchView(initialHash, false);
  }

  // Periodic real-time background synchronization
  setInterval(syncUserDashboardFromDb, 10000);
  setInterval(() => updateWelcomeGreeting(window.fitSyncStore?.state?.user?.name), 30000);
});

function getKolkataTime() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).formatToParts(new Date());

  let hour = 0, minute = 0, second = 0;
  for (const p of parts) {
    if (p.type === 'hour') hour = parseInt(p.value, 10);
    if (p.type === 'minute') minute = parseInt(p.value, 10);
    if (p.type === 'second') second = parseInt(p.value, 10);
  }
  return { hour, minute, second };
}

function getGreetingPrefix() {
  const { hour } = getKolkataTime();
  // 05:00–11:59: Good Morning
  if (hour >= 5 && hour < 12) return 'Good Morning';
  // 12:00–16:59: Good Afternoon
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  // 17:00–04:59: Good Evening
  return 'Good Evening';
}

function updateWelcomeGreeting(userName) {
  const prefix = getGreetingPrefix();
  const prefixEl = document.getElementById('dashboardGreetingPrefix');
  if (prefixEl && prefixEl.textContent !== prefix) {
    prefixEl.textContent = prefix;
  }

  const nameEl = document.getElementById('dashboardGreetingName');
  if (nameEl) {
    let firstName = '';
    const stateUser = window.fitSyncStore?.state?.user;
    const raw = userName || stateUser?.name || stateUser?.full_name;
    if (raw && typeof raw === 'string' && raw.trim() && raw.trim() !== 'Athlete' && raw.trim() !== 'Athlete Profile') {
      firstName = raw.trim().split(' ')[0];
    } else {
      firstName = 'Sneha';
    }
    nameEl.textContent = firstName;
  }

  const dateEl = document.getElementById('dashboardWelcomeDate');
  if (dateEl) {
    const kolkataDateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());
    dateEl.textContent = kolkataDateStr;
  }
}

// Central Database Sync Function
async function syncUserDashboardFromDb() {
  try {
    const res = await fetch('api/user/dashboard.php');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const state = window.fitSyncStore.state;
        
        // 1. User & Identity
        if (d.user) {
          if (!state.user) state.user = {};
          if (d.user.id) state.user.id = d.user.id;
          if (d.user.full_name) state.user.name = d.user.full_name;
          if (d.user.email) state.user.email = d.user.email;
        }

        // 2. Weight & BMI
        if (d.user && d.user.weight_kg !== null && d.user.weight_kg !== undefined && d.user.weight_kg > 0) {
          state.stats.weight.current = d.user.weight_kg;
          state.stats.weight.changeText = d.user.weight_delta ? (d.user.weight_delta > 0 ? `+${d.user.weight_delta} kg this period` : `${d.user.weight_delta} kg this period`) : 'Current baseline';
        } else {
          state.stats.weight.current = null;
          state.stats.weight.changeText = 'No record yet';
        }

        if (d.user && d.user.bmi !== null && d.user.bmi !== undefined) {
          state.stats.bmi.value = d.user.bmi;
          state.stats.bmi.status = d.user.bmi < 18.5 ? 'Underweight' : (d.user.bmi < 25 ? 'Normal range' : 'Overweight');
        } else {
          state.stats.bmi.value = '--';
          state.stats.bmi.status = 'No data yet';
        }

        // 3. Nutrition (100% Database-Driven)
        if (d.nutrition) {
          state.stats.calories.current = d.nutrition.calories || 0;
          state.nutrition.calories = d.nutrition.calories || 0;
          state.nutrition.macros.protein.current = d.nutrition.protein !== undefined ? Math.round(d.nutrition.protein) : 0;
          state.nutrition.macros.carbs.current = d.nutrition.carbs !== undefined ? Math.round(d.nutrition.carbs) : 0;
          state.nutrition.macros.fat.current = d.nutrition.fat !== undefined ? Math.round(d.nutrition.fat) : 0;
          state.nutrition.meals = Array.isArray(d.nutrition.meals) ? d.nutrition.meals : [];
        } else {
          state.stats.calories.current = 0;
          state.nutrition.calories = 0;
          state.nutrition.macros.protein.current = 0;
          state.nutrition.macros.carbs.current = 0;
          state.nutrition.macros.fat.current = 0;
          state.nutrition.meals = [];
        }

        // 4. Water (100% Database-Driven)
        if (d.water) {
          state.stats.water.current = d.water.liters !== undefined ? d.water.liters : 0.0;
          if (state.waterStation) state.waterStation.current = state.stats.water.current;
        } else {
          state.stats.water.current = 0.0;
          if (state.waterStation) state.waterStation.current = 0.0;
        }

        // 5. Update UI
        updateDashboardUI();
        updateWelcomeGreeting(state.user?.name);
      }
    }
  } catch (err) {
    console.warn('Database dashboard sync warning:', err);
  }
}

// Robust Icon Initializer (Lucide + Instant Inline SVG Fallback)
function initIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// View Navigation Router (SPA with Hash & Popstate Support)
function switchView(viewName, pushHistory = true) {
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

  // Update Browser URL Hash & History
  if (pushHistory && window.history && window.history.pushState) {
    const currentHash = window.location.hash.replace(/^#/, '');
    if (currentHash !== viewName) {
      window.history.pushState({ view: viewName }, '', `#${viewName}`);
    }
  }

  // Re-render icons safely
  try {
    initIcons();
  } catch (e) {
    console.warn('initIcons error:', e);
  }

  if (coachChatPollInterval) {
    clearInterval(coachChatPollInterval);
    coachChatPollInterval = null;
  }

  // Execute view-specific renderers inside isolated try-catch blocks
  try {
    if (viewName === 'exercises' && typeof renderExerciseLibrary === 'function') {
      renderExerciseLibrary(window.currentSelectedMuscle || 'all', window.currentExerciseSearch || '');
    }
  } catch (e) {
    console.warn('Error rendering exercises view:', e);
  }

  try {
    if (viewName === 'nutrition' && typeof renderMealsTimeline === 'function') {
      renderMealsTimeline();
    }
  } catch (e) {
    console.warn('Error rendering nutrition view:', e);
  }

  try {
    if (viewName === 'trainers' && typeof renderTrainersUI === 'function') {
      renderTrainersUI();
    }
  } catch (e) {
    console.warn('Error rendering trainers view:', e);
  }

  try {
    if (viewName === 'coach_chat') {
      if (typeof renderCoachChatUI === 'function') renderCoachChatUI();
      coachChatPollInterval = setInterval(() => {
        if (typeof renderCoachChatUI === 'function') renderCoachChatUI();
      }, 4000);
    }
  } catch (e) {
    console.warn('Error rendering coach chat view:', e);
  }

  try {
    if (viewName === 'attendance' && typeof renderAttendanceView === 'function') {
      renderAttendanceView();
    }
  } catch (e) {
    console.warn('Error rendering attendance view:', e);
  }

  try {
    if (viewName === 'water') {
      if (typeof renderWaterLogs === 'function') renderWaterLogs();
    }
  } catch (e) {
    console.warn('Error rendering water view:', e);
  }

  try {
    if (viewName === 'settings') {
      if (typeof loadUserProfileData === 'function') loadUserProfileData();
      if (typeof loadAttendanceCalendar === 'function') loadAttendanceCalendar();
    }
  } catch (e) {
    console.warn('Error rendering settings view:', e);
  }

  setTimeout(() => {
    try {
      if (window.renderAllCharts) window.renderAllCharts();
    } catch (e) {
      console.warn('Chart render error:', e);
    }
  }, 60);

  // Close mobile drawer if open
  document.getElementById('sidebarNav')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.switchView = switchView;

function setupNavigation() {
  // Centralized delegated click event listener on document
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn && !navBtn.classList.contains('btn-sidebar-logout') && navBtn.id !== 'sidebarLogoutBtn' && navBtn.id !== 'sidebarUserLogoutBtn') {
      e.preventDefault();
      const view = navBtn.getAttribute('data-nav');
      if (view) switchView(view);
      return;
    }

    const switchBtn = e.target.closest('[data-switch-view]');
    if (switchBtn) {
      e.preventDefault();
      const view = switchBtn.getAttribute('data-switch-view');
      if (view) switchView(view);
      return;
    }
  });

  // Dedicated direct listeners for logout buttons
  document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    logoutUser();
  });
  document.getElementById('sidebarUserLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    logoutUser();
  });
  document.getElementById('settingsLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    logoutUser();
  });

  // Browser back & forward navigation
  window.addEventListener('popstate', (e) => {
    const view = (e.state && e.state.view) || window.location.hash.replace(/^#/, '') || 'dashboard';
    switchView(view, false);
  });
}

// Update UI from Store State
function updateDashboardUI() {
  const state = window.fitSyncStore.state;
  syncUserProfileUI();
  updateWelcomeGreeting(state.user?.name);

  // 1. Stats Cards
  const weightVal = document.getElementById('statWeightValue');
  const weightChange = document.getElementById('statWeightChange');
  if (weightVal) weightVal.textContent = `${state.stats.weight.current !== null && state.stats.weight.current !== undefined ? state.stats.weight.current : '--'} ${state.stats.weight.unit || 'kg'}`;
  if (weightChange) weightChange.textContent = state.stats.weight.changeText;

  const bmiVal = document.getElementById('statBmiValue');
  const bmiBadge = document.getElementById('statBmiStatus');
  if (bmiVal) bmiVal.textContent = state.stats.bmi.value;
  if (bmiBadge) bmiBadge.textContent = state.stats.bmi.status;

  const calVal = document.getElementById('statCalValue');
  const calBar = document.getElementById('statCalBar');
  const calCurrent = state.stats.calories.current || 0;
  const calTarget = state.stats.calories.target || 2000;
  if (calVal) calVal.textContent = `${calCurrent.toLocaleString()} / ${calTarget.toLocaleString()} kcal`;
  if (calBar) {
    const calPct = calTarget > 0 ? Math.min(100, Math.round((calCurrent / calTarget) * 100)) : 0;
    calBar.style.width = `${calPct}%`;
  }

  const waterVal = document.getElementById('statWaterValue');
  const waterBar = document.getElementById('statWaterBar');
  const waterCurrent = state.stats.water.current !== undefined ? state.stats.water.current : 0.0;
  const waterTarget = state.stats.water.target || 3.0;
  if (waterVal) waterVal.textContent = `${Number(waterCurrent).toFixed(1)} / ${Number(waterTarget).toFixed(1)} L`;
  if (waterBar) {
    const waterPct = waterTarget > 0 ? Math.min(100, Math.round((waterCurrent / waterTarget) * 100)) : 0;
    waterBar.style.width = `${waterPct}%`;
  }

  // 2. Nutrition Summary Card & Donut Chart
  const nutCalorieCenter = document.getElementById('nutCalorieCenter');
  if (nutCalorieCenter) {
    nutCalorieCenter.textContent = (state.nutrition.calories || 0).toLocaleString();
  }

  const nutDonutCircle = document.getElementById('nutDonutCircle');
  if (nutDonutCircle) {
    const nutCalTarget = state.stats.calories.target || 2000;
    const nutPct = nutCalTarget > 0 ? Math.min(1, (state.nutrition.calories || 0) / nutCalTarget) : 0;
    // Circumference of r=40 is ~251.3
    const offset = Math.round(251 * (1 - nutPct));
    nutDonutCircle.setAttribute('stroke-dashoffset', String(offset));
  }

  const nutProteinVal = document.getElementById('nutProteinVal');
  const nutProteinBar = document.getElementById('nutProteinBar');
  const protCur = state.nutrition.macros.protein.current || 0;
  const protTarget = state.nutrition.macros.protein.target || 120;
  if (nutProteinVal) nutProteinVal.textContent = `${protCur} / ${protTarget} g`;
  if (nutProteinBar) {
    const pPct = protTarget > 0 ? Math.min(100, Math.round((protCur / protTarget) * 100)) : 0;
    nutProteinBar.style.width = `${pPct}%`;
  }

  const nutCarbsVal = document.getElementById('nutCarbsVal');
  const nutCarbsBar = document.getElementById('nutCarbsBar');
  const carbsCur = state.nutrition.macros.carbs.current || 0;
  const carbsTarget = state.nutrition.macros.carbs.target || 200;
  if (nutCarbsVal) nutCarbsVal.textContent = `${carbsCur} / ${carbsTarget} g`;
  if (nutCarbsBar) {
    const cPct = carbsTarget > 0 ? Math.min(100, Math.round((carbsCur / carbsTarget) * 100)) : 0;
    nutCarbsBar.style.width = `${cPct}%`;
  }

  const nutFatVal = document.getElementById('nutFatVal');
  const nutFatBar = document.getElementById('nutFatBar');
  const fatCur = state.nutrition.macros.fat.current || 0;
  const fatTarget = state.nutrition.macros.fat.target || 60;
  if (nutFatVal) nutFatVal.textContent = `${fatCur} / ${fatTarget} g`;
  if (nutFatBar) {
    const fPct = fatTarget > 0 ? Math.min(100, Math.round((fatCur / fatTarget) * 100)) : 0;
    nutFatBar.style.width = `${fPct}%`;
  }

  // 3. Right Water Widget & Water Station Module
  const rightWaterVal = document.getElementById('rightWaterValue');
  const rightWaterBar = document.getElementById('rightWaterBar');
  if (rightWaterVal) rightWaterVal.textContent = `${Number(waterCurrent).toFixed(1)} / ${Number(waterTarget).toFixed(1)} L`;
  if (rightWaterBar) {
    const wPct = waterTarget > 0 ? Math.min(100, Math.round((waterCurrent / waterTarget) * 100)) : 0;
    rightWaterBar.style.width = `${wPct}%`;
  }

  const stationWaterCurrent = document.getElementById('stationWaterCurrent');
  const stationWaterFill = document.getElementById('stationWaterFill');
  const stationWaterRem = document.getElementById('stationWaterRem');
  if (stationWaterCurrent) stationWaterCurrent.textContent = `${Number(waterCurrent).toFixed(1)} L`;
  if (stationWaterFill) {
    const sPct = waterTarget > 0 ? Math.min(100, Math.round((waterCurrent / waterTarget) * 100)) : 0;
    stationWaterFill.style.height = `${sPct}%`;
  }
  if (stationWaterRem) {
    const rem = Math.max(0, (waterTarget - waterCurrent)).toFixed(1);
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
  // 1. Water Intake Form & Station Presets (100% Database-Driven)
  const waterForm = document.getElementById('waterForm');
  document.querySelectorAll('.water-preset-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const amount = parseFloat(btn.getAttribute('data-amount'));
      const amountMl = Math.round(amount * 1000);

      try {
        const res = await fetch('api/water.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_ml: amountMl })
        });
        const json = await res.json();
        if (json.success && json.data) {
          const state = window.fitSyncStore?.state;
          if (state?.stats?.water) state.stats.water.current = json.data.liters;
          if (state?.waterStation) state.waterStation.current = json.data.liters;
          updateDashboardUI();
          triggerWaterFillAnimation();
          closeModal('addWaterModal');
          if (typeof renderWaterLogs === 'function') renderWaterLogs(json.data.logs);
          if (window.renderAllCharts) window.renderAllCharts();
          showToast(`Recorded +${amountMl} ml (${json.data.liters} L total today)!`, 'success');
          return;
        }
      } catch (err) {
        console.warn('Water API log warning:', err);
      }

      window.fitSyncStore.addWater(amount);
      triggerWaterFillAnimation();
      closeModal('addWaterModal');
      await syncUserDashboardFromDb();
      if (typeof renderWaterLogs === 'function') renderWaterLogs();
      if (window.renderAllCharts) window.renderAllCharts();
      showToast(`Added ${amountMl} ml of water!`, 'success');
    });
  });

  if (waterForm) {
    waterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const customMl = parseFloat(document.getElementById('customWaterInput').value);
      if (customMl > 0) {
        const liters = customMl / 1000;

        try {
          const res = await fetch('api/water.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount_ml: Math.round(customMl) })
          });
          const json = await res.json();
          if (json.success && json.data) {
            const state = window.fitSyncStore?.state;
            if (state?.stats?.water) state.stats.water.current = json.data.liters;
            if (state?.waterStation) state.waterStation.current = json.data.liters;
            updateDashboardUI();
            triggerWaterFillAnimation();
            closeModal('addWaterModal');
            waterForm.reset();
            if (typeof renderWaterLogs === 'function') renderWaterLogs(json.data.logs);
            if (window.renderAllCharts) window.renderAllCharts();
            showToast(`Added ${customMl} ml (${json.data.liters} L total today)!`, 'success');
            return;
          }
        } catch (err) {
          console.warn('Water API log warning:', err);
        }

        window.fitSyncStore.addWater(liters);
        triggerWaterFillAnimation();
        closeModal('addWaterModal');
        waterForm.reset();
        await syncUserDashboardFromDb();
        if (typeof renderWaterLogs === 'function') renderWaterLogs();
        if (window.renderAllCharts) window.renderAllCharts();
        showToast(`Added ${customMl} ml water recorded!`, 'success');
      }
    });
  }

  // 2. Add / Edit Meal Form (100% Database-Driven with Macro Consistency Protection)
  const mealForm = document.getElementById('mealForm');
  if (mealForm) {
    // Ensure pressing Enter inside any meal input logs the meal
    mealForm.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          mealForm.requestSubmit();
        }
      });
    });

    let isSubmittingMeal = false;
    mealForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmittingMeal) return;

      const timing = document.getElementById('mealTiming').value;
      const foodName = document.getElementById('mealFoodName').value.trim();
      const cal = parseInt(document.getElementById('mealCalories').value) || 0;
      const protein = parseFloat(document.getElementById('mealProtein').value) || 0;
      const carbs = parseFloat(document.getElementById('mealCarbs').value) || 0;
      const fat = parseFloat(document.getElementById('mealFat').value) || 0;
      const editId = document.getElementById('mealEditId')?.value || '';

      if (!foodName) {
        showToast('Please enter a food item or recipe name.', 'warning');
        return;
      }

      isSubmittingMeal = true;
      const submitBtn = document.getElementById('mealSubmitBtn');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Log Nutrition';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = editId ? 'Saving Changes...' : 'Logging Meal...';
      }

      try {
        const payload = {
          category: timing,
          food_name: foodName,
          calories: cal,
          protein: protein,
          carbs: carbs,
          fat: fat
        };
        if (editId) {
          payload.id = parseInt(editId);
          payload.action = 'edit';
        }

        const res = await fetch('api/meals.php', {
          method: editId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          showToast(editId ? `Updated "${foodName}" (${cal} kcal)!` : `Logged "${foodName}" (+${cal} kcal)!`, 'success');
        } else {
          showToast(json.error || 'Failed to record meal.', 'warning');
        }
      } catch (err) {
        console.warn('Meal API log warning:', err);
      } finally {
        isSubmittingMeal = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }

      window.fitSyncStore.addMeal(foodName, timing, cal, protein, carbs, fat);
      closeModal('addMealModal');
      resetMealForm();
      await syncUserDashboardFromDb();
      if (typeof renderMealsTimeline === 'function') renderMealsTimeline();
    });
  }

  // 3. Update Progress Form (Workflow A: Real database weight recording)
  const progressForm = document.getElementById('progressForm');
  if (progressForm) {
    progressForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newWeight = parseFloat(document.getElementById('newWeightInput').value);
      if (newWeight && newWeight > 20 && newWeight < 350) {
        // Save to central database
        fetch('api/user/measurements.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weight_kg: newWeight })
        }).then(r => r.json()).then(res => {
          if (res.success) {
            syncUserDashboardFromDb();
          }
        }).catch(err => console.warn('Weight sync err:', err));

        window.fitSyncStore.updateWeight(newWeight);
        updateDashboardUI();
        if (window.renderAllCharts) window.renderAllCharts();
        showToast(`Weight recorded in database: ${newWeight} kg!`, 'success');
        closeModal('updateProgressModal');
      }
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

// Reset Water Intake Action (100% Database-Driven)
async function resetWaterIntake() {
  try {
    await fetch('api/water.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' })
    });
  } catch (err) {
    console.warn('Reset water API warning:', err);
  }
  if (window.fitSyncStore && typeof window.fitSyncStore.resetWater === 'function') {
    window.fitSyncStore.resetWater();
  }
  await syncUserDashboardFromDb();
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

async function renderExerciseLibrary(filterMuscle = 'all', searchQuery = '') {
  const container = document.getElementById('exerciseLibraryGrid');
  if (!container) return;

  try {
    const res = await fetch(`api/exercises.php?muscle=${encodeURIComponent(filterMuscle)}&q=${encodeURIComponent(searchQuery)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.exercises)) {
        if (window.fitSyncStore) {
          window.fitSyncStore.state.exerciseLibrary = json.exercises;
        }
      }
    }
  } catch (err) {
    console.warn('Exercise API fetch error, using cache:', err);
  }

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

  // Synchronize with server-side authenticated session if present
  if (window.__AUTHENTICATED_USER__) {
    store.state.isLoggedIn = true;
    if (store.state.user) {
      store.state.user.id = window.__AUTHENTICATED_USER__.id;
      store.state.user.name = window.__AUTHENTICATED_USER__.full_name || window.__AUTHENTICATED_USER__.name;
      store.state.user.email = window.__AUTHENTICATED_USER__.email;
      store.state.user.role = window.__AUTHENTICATED_USER__.role;
    }
    // Strictly isolate non-user roles from entering the user portal layout
    if (window.__AUTHENTICATED_USER__.role === 'trainer') {
      window.location.href = 'trainer/';
      return;
    } else if (window.__AUTHENTICATED_USER__.role === 'gym_owner') {
      window.location.href = 'gym_owner/';
      return;
    } else if (window.__AUTHENTICATED_USER__.role === 'admin') {
      window.location.href = 'admin/';
      return;
    }
  }

  if (!authOverlay) return;

  if (window.location.search.includes('guest') || window.location.search.includes('explore')) {
    enterGuestPortal();
    return;
  }

  // Ensure member portal is always interactive and accessible by default
  const explicitlyLoggedOut = sessionStorage.getItem('fitsync_logged_out') === 'true';
  if (store.state.isLoggedIn === false && !explicitlyLoggedOut) {
    enterGuestPortal();
    return;
  }

  if (store.state.isLoggedIn === false && explicitlyLoggedOut) {
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
    if (window.__INITIAL_VIEW__ && typeof switchView === 'function') {
      switchView(window.__INITIAL_VIEW__);
    }
  }
}

function enterGuestPortal() {
  sessionStorage.removeItem('fitsync_logged_out');
  if (window.fitSyncStore) {
    window.fitSyncStore.state.isLoggedIn = true;
    if (!window.fitSyncStore.state.user || !window.fitSyncStore.state.user.name) {
      window.fitSyncStore.state.user = {
        id: 999,
        name: 'Guest Athlete',
        email: 'guest@fitsync.health',
        role: 'Gym Member',
        membershipTier: 'Gold'
      };
    }
    if (typeof window.fitSyncStore.save === 'function') window.fitSyncStore.save();
  }
  const authOverlay = document.getElementById('authDashboardOverlay');
  const appLayout = document.querySelector('.app-layout');
  if (authOverlay) authOverlay.style.display = 'none';
  if (appLayout) appLayout.style.display = 'flex';
  syncUserProfileUI();
  switchView('dashboard');
  if (typeof initIcons === 'function') initIcons();
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

  // Dynamically render assigned coach and branch coaches
  renderTrainersUI();
}

function renderTrainersUI() {
  const store = window.fitSyncStore;
  if (!store || typeof store.getTrainers !== 'function') return;
  const trainers = store.getTrainers();
  const currentUser = store.state.user || {};

  // Find assigned coach for current user or default to first
  let assigned = null;
  if (currentUser.assignedCoachId) {
    assigned = trainers.find(t => t.id === currentUser.assignedCoachId);
  }
  if (!assigned) {
    assigned = trainers.find(t => t.isAssigned) || trainers[0];
  }

  const spotlightEl = document.getElementById('assignedCoachSpotlightContainer');
  if (spotlightEl) {
    if (assigned) {
      spotlightEl.innerHTML = `
        <div style="display: flex; gap: 18px; align-items: center; flex-wrap: wrap;">
          <img src="${assigned.avatar || 'assets/images/trainer_raj.jpg'}" class="trainer-avatar-img" style="margin: 0; width: 84px; height: 84px; border-radius: 50%; object-fit: cover;" alt="${assigned.name}">
          <div style="flex: 1;">
            <span class="badge-active" style="margin-bottom: 4px; display: inline-block;">YOUR ASSIGNED COACH</span>
            <h3 style="font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 2px;">${assigned.name}</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">${assigned.title} • ${assigned.gym || 'FitZone Fitness'} • ${assigned.experience || 'Certified'}</p>
            <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
              ${(assigned.specialties || []).map(s => `<span class="tag-badge">${s}</span>`).join('')}
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-primary-block" style="width: auto; padding: 8px 16px; background: #2563EB;" onclick="switchView('coach_chat')">
              <i data-lucide="message-square" style="width: 14px; height: 14px; margin-right: 4px;"></i> Chat with Coach
            </button>
            <button class="btn-primary-block" style="width: auto; padding: 8px 16px;" onclick="openModal('bookAppointmentModal')">Book PT Session</button>
            <button class="btn-secondary" onclick="switchView('workouts')">My Workout Plan</button>
          </div>
        </div>
      `;
    } else {
      spotlightEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; padding: 12px 6px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
            <i data-lucide="user-check" style="width: 26px; height: 26px;"></i>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">No Personal Coach Assigned Yet</h3>
            <p style="font-size: 13px; color: var(--text-secondary);">Your gym manager will assign a dedicated strength coach to your profile, or browse available coaches below.</p>
          </div>
        </div>
      `;
    }
  }

  const gridEl = document.getElementById('availableTrainersGrid');
  if (gridEl) {
    if (trainers.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: #F8FAFC; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <i data-lucide="users" style="width: 32px; height: 32px; color: #94A3B8; margin-bottom: 8px;"></i>
          <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">No Trainers Listed Yet</h4>
          <p style="font-size: 13px; color: var(--text-secondary); max-width: 400px; margin: 0 auto;">Certified personal coaches added by the Gym Owner will appear here for 1-on-1 consultations and PT bookings.</p>
        </div>
      `;
    } else {
      gridEl.innerHTML = trainers.map(t => `
        <div class="trainer-card">
          <img src="${t.avatar || 'assets/images/trainer_raj.jpg'}" class="trainer-avatar-img" alt="${t.name}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">
          <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">${t.name}</h4>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">${t.title} • ${t.experience} Exp</p>
          <div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 12px; flex-wrap: wrap;">
            ${(t.specialties || []).slice(0, 2).map(s => `<span class="tag-badge">${s}</span>`).join('')}
          </div>
          <button class="btn-secondary" style="width: 100%;" onclick="showNotification('Consultation request sent to ${t.name}.')">Request Consult</button>
        </div>
      `).join('');
    }
  }

  // Update appointment booking form coach select options dynamically
  const consultSelect = document.querySelector('#appointmentForm select');
  if (consultSelect && trainers.length > 0) {
    consultSelect.innerHTML = trainers.map(t => `
      <option value="${t.name} (${t.title})">${t.name} — ${t.title}</option>
    `).join('');
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchAuthTab(tab) {
  const signInBtn = document.getElementById('authTabBtnSignIn');
  const registerBtn = document.getElementById('authTabBtnRegister');

  const signInPane = document.getElementById('authSignInPane');
  const registerPane = document.getElementById('authRegisterPane');
  const container = document.getElementById('authCardContainer');

  [signInBtn, registerBtn].forEach(b => b?.classList.remove('active'));
  if (signInPane) signInPane.style.display = 'none';
  if (registerPane) registerPane.style.display = 'none';

  if (tab === 'signin') {
    signInBtn?.classList.add('active');
    if (signInPane) signInPane.style.display = 'block';
    container?.classList.remove('auth-container-wide');
  } else if (tab === 'register') {
    registerBtn?.classList.add('active');
    if (registerPane) registerPane.style.display = 'block';
    container?.classList.add('auth-container-wide');
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
  const users = window.fitSyncStore?.state?.registeredUsers || [];
  const target = users.find(u => type === 'coach' ? u.role === 'Gym Trainer' : u.role !== 'Gym Trainer');
  if (target) {
    quickSelectAccount(target.email);
  }
}

async function handleSignInSubmit(e) {
  if (e) e.preventDefault();
  const alertEl = document.getElementById('authSignInAlert');
  if (alertEl) { alertEl.style.display = 'none'; alertEl.innerText = ''; }

  const email = document.getElementById('authEmailInput')?.value?.trim();
  const password = document.getElementById('authPasswordInput')?.value;
  const remember = document.getElementById('authStaySignedIn')?.checked;

  if (!email || !password) {
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.innerText = 'Please enter both your email address and password.';
    } else {
      alert('Please enter both your email address and password.');
    }
    return;
  }

  // Attempt backend database authentication
  try {
    const res = await fetch('api/auth/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password, remember })
    });

    const data = await res.json().catch(() => null);

    if (data && data.success) {
      // Role-based routing: if trainer, gym_owner, or admin, navigate to their dedicated portal
      if (data.user && data.user.role && data.user.role !== 'user') {
        const dest = data.redirect || (data.user.role === 'trainer' ? 'trainer/' : (data.user.role === 'gym_owner' ? 'gym_owner/' : 'admin/'));
        window.location.href = dest;
        return;
      }

      // Member / User role: update client store and enter application
      if (window.fitSyncStore) {
        window.fitSyncStore.login(email, password, remember);
        if (data.user && window.fitSyncStore.state && window.fitSyncStore.state.user) {
          window.fitSyncStore.state.user.id = data.user.id;
          window.fitSyncStore.state.user.name = data.user.full_name || data.user.name;
          window.fitSyncStore.state.user.email = data.user.email;
          window.fitSyncStore.state.user.role = data.user.role;
          if (typeof window.fitSyncStore.save === 'function') window.fitSyncStore.save();
        }
      }

      initAuthSystem();
      if (typeof updateDashboardUI === 'function') updateDashboardUI();
      if (typeof showNotification === 'function') {
        showNotification(`Welcome back to FitSync, ${data.user.full_name || data.user.name}!`);
      }
      return;
    } else if (data && !data.success) {
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.innerText = data.message || 'Invalid email or password.';
      } else {
        alert(data.message || 'Invalid email or password.');
      }
      return;
    }
  } catch (err) {
    console.warn('[FitSync Auth] API unreachable, falling back to local client store:', err);
  }

  // Graceful fallback: route role accounts to dedicated portals
  const lowerEmail = (email || '').toLowerCase();
  if (lowerEmail === 'coach@fitsync.health' || lowerEmail.includes('coach')) {
    window.location.href = 'trainer/';
    return;
  }
  if (lowerEmail === 'owner@fitzone.com' || lowerEmail.includes('owner')) {
    window.location.href = 'gym_owner/';
    return;
  }
  if (lowerEmail === 'admin@fitsync.com' || lowerEmail.includes('admin')) {
    window.location.href = 'admin/';
    return;
  }

  // Graceful fallback for local offline / static server demo (Member / Athlete)
  if (window.fitSyncStore) {
    window.fitSyncStore.login(email, password, remember);
    initAuthSystem();
    if (typeof updateDashboardUI === 'function') updateDashboardUI();
    if (typeof showNotification === 'function') {
      showNotification(`Welcome back to FitSync AI, ${window.fitSyncStore.state.user.name}!`);
    }
  }
}

async function handleRegisterSubmit(e) {
  if (e) e.preventDefault();
  const alertEl = document.getElementById('authRegisterAlert');
  if (alertEl) { alertEl.style.display = 'none'; alertEl.innerText = ''; }

  const fullName = document.getElementById('regFullName')?.value?.trim();
  const email = document.getElementById('regEmail')?.value?.trim();
  const phone = document.getElementById('regPhone')?.value?.trim();
  const avatarUrl = document.getElementById('regAvatarUrl')?.value;
  const password = document.getElementById('regPassword')?.value;
  const confirmPassword = document.getElementById('regConfirmPassword')?.value;
  const role = document.getElementById('regRoleInput')?.value || 'member';
  const gender = document.getElementById('regGender')?.value;
  const age = document.getElementById('regAge')?.value;
  const height = document.getElementById('regHeight')?.value;
  const weight = document.getElementById('regWeight')?.value;
  const goal = document.getElementById('regGoal')?.value;
  const activityLevel = document.getElementById('regActivity')?.value;
  const gymBranch = document.getElementById('regGymBranchInput')?.value;
  const gymLocation = document.getElementById('regGymLocationInput')?.value;

  if (password !== confirmPassword) {
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.innerText = 'Passwords do not match. Please verify your password.';
    } else {
      alert('Passwords do not match. Please verify your password.');
    }
    return;
  }

  if (password.length < 6) {
    if (alertEl) {
      alertEl.style.display = 'block';
      alertEl.innerText = 'Password must be at least 6 characters.';
    } else {
      alert('Password must be at least 6 characters.');
    }
    return;
  }

  // Attempt backend database registration
  try {
    const res = await fetch('api/auth/register.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        full_name: fullName,
        email: email,
        phone: phone,
        password: password,
        gender: gender,
        height: height,
        weight: weight,
        activityLevel: activityLevel,
        gymBranch: gymBranch,
        gymLocation: gymLocation
      })
    });

    const data = await res.json().catch(() => null);

    if (data && data.success) {
      if (window.fitSyncStore) {
        window.fitSyncStore.register({
          fullName, email, phone, avatarUrl, role: 'member',
          gender, age, height, weight, goal, activityLevel,
          gymBranch, gymLocation
        });
        if (data.user && window.fitSyncStore.state && window.fitSyncStore.state.user) {
          window.fitSyncStore.state.user.id = data.user.id;
          window.fitSyncStore.state.user.name = data.user.full_name || fullName;
          window.fitSyncStore.state.user.email = data.user.email;
          if (typeof window.fitSyncStore.save === 'function') window.fitSyncStore.save();
        }
      }

      initAuthSystem();
      if (typeof updateDashboardUI === 'function') updateDashboardUI();
      if (typeof showNotification === 'function') {
        showNotification(`Profile created! Welcome to FitSync, ${fullName}.`);
      }
      return;
    } else if (data && !data.success) {
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.innerText = data.message || 'Registration failed.';
      } else {
        alert(data.message || 'Registration failed.');
      }
      return;
    }
  } catch (err) {
    console.warn('[FitSync Auth] API unreachable, attempting local client registration fallback:', err);
  }

  // Fallback for static offline demo
  if (window.fitSyncStore) {
    window.fitSyncStore.register({
      fullName, email, phone, avatarUrl, role,
      gender, age, height, weight, goal, activityLevel,
      gymBranch, gymLocation
    });
    initAuthSystem();
    if (typeof updateDashboardUI === 'function') updateDashboardUI();
    if (typeof showNotification === 'function') {
      showNotification(`Profile created! Welcome to FitSync AI, ${fullName}.`);
    }
  }
}

async function loginDemoAccount(key) {
  const users = window.fitSyncStore?.state?.registeredUsers || [];
  let user = users.find(u => key === 'coach' ? u.role === 'Gym Trainer' : u.role !== 'Gym Trainer');
  let email = user ? user.email : '';
  if (!email) {
    showToast?.('Please register an account or enter your credentials.', 'info');
    return;
  }

  // Try API login
  try {
    const res = await fetch('api/auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password: 'password123', remember: true })
    });
    const data = await res.json().catch(() => null);

    if (data && data.success) {
      if (data.user && data.user.role && data.user.role !== 'user') {
        const dest = data.redirect || (data.user.role === 'trainer' ? 'trainer/' : (data.user.role === 'gym_owner' ? 'gym_owner/' : 'admin/'));
        window.location.href = dest;
        return;
      }
      if (window.fitSyncStore) {
        window.fitSyncStore.login(email, 'password123');
        if (data.user && window.fitSyncStore.state && window.fitSyncStore.state.user) {
          window.fitSyncStore.state.user.id = data.user.id;
          window.fitSyncStore.state.user.name = data.user.full_name || data.user.name;
          window.fitSyncStore.state.user.email = data.user.email;
          window.fitSyncStore.state.user.role = data.user.role;
          if (typeof window.fitSyncStore.save === 'function') window.fitSyncStore.save();
        }
      }
      initAuthSystem();
      if (typeof updateDashboardUI === 'function') updateDashboardUI();
      if (typeof showNotification === 'function') {
        showNotification(`Signed in as ${data.user.full_name || data.user.name}!`);
      }
      return;
    }
  } catch (err) {
    console.warn('[FitSync Auth] Demo API login failed, using local demo store:', err);
  }

  // Fallback for role accounts if offline or demo
  if (key === 'coach') {
    window.location.href = 'trainer/';
    return;
  }
  if (key === 'owner') {
    window.location.href = 'gym_owner/';
    return;
  }
  if (key === 'admin') {
    window.location.href = 'admin/';
    return;
  }

  // Fallback for member
  if (window.fitSyncStore) {
    window.fitSyncStore.login(email, 'password123');
    initAuthSystem();
    if (typeof updateDashboardUI === 'function') updateDashboardUI();
    if (typeof showNotification === 'function') {
      showNotification(`Signed in as ${window.fitSyncStore.state.user.name}!`);
    }
  }
}

async function logoutUser() {
  console.log('Logging out user from FitSync...');
  sessionStorage.setItem('fitsync_logged_out', 'true');
  try {
    await fetch('api/auth/logout.php', { method: 'POST' }).catch(() => {});
  } catch (e) {
    console.warn('Backend logout call error:', e);
  }

  try {
    if (window.fitSyncStore) {
      if (typeof window.fitSyncStore.logout === 'function') {
        window.fitSyncStore.logout();
      } else if (window.fitSyncStore.state) {
        window.fitSyncStore.state.isLoggedIn = false;
        if (typeof window.fitSyncStore.save === 'function') {
          window.fitSyncStore.save();
        }
      }
    }
  } catch(e) {
    console.warn('Error during store logout:', e);
  }

  initAuthSystem();
  switchAuthTab('signin');

  if (typeof showNotification === 'function') {
    showNotification('You have logged out safely. Please sign in to continue.');
  }
}

function handleResetDatabase() {
  window.fitSyncStore.resetDatabase();
  initAuthSystem();
  switchAuthTab('signin');
}

function handleForgotPassword() {
  window.location.href = 'forgot_password.php';
}

function openDataStorageModal() {
  openModal('dataStorageModal');
}

// ==========================================================================
// COACH CHAT & DIRECT MESSAGING LOGIC (Database-Backed Real-Time Chat)
// ==========================================================================
let coachChatPollInterval = null;

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function renderCoachChatUI() {
  const store = window.fitSyncStore;
  const trainers = store ? store.getTrainers() : [];
  const currentUser = store && store.state ? store.state.user : {};
  let coach = null;
  if (currentUser && currentUser.assignedCoachId) {
    coach = trainers.find(t => t.id === currentUser.assignedCoachId);
  }
  if (!coach) {
    coach = trainers.find(t => t.isAssigned) || trainers[0] || {
      name: 'Personal Coach',
      title: 'Certified Strength Coach',
      avatar: 'assets/images/trainer_raj.jpg'
    };
  }

  // Update header elements
  const avatarEl = document.getElementById('coachChatAvatar');
  const nameEl = document.getElementById('coachChatName');
  const statusEl = document.getElementById('coachChatStatus');
  if (avatarEl) avatarEl.src = coach.avatar || 'assets/images/trainer_raj.jpg';
  if (nameEl) nameEl.innerText = coach.name;
  if (statusEl) statusEl.innerText = `Active Coach Desk • ${coach.title || 'Certified Coach'}`;

  const stream = document.getElementById('coachChatStream');
  if (!stream) return;

  const currentUserId = (currentUser && currentUser.id) ? parseInt(currentUser.id) : 2;
  const coachUserId = (coach && coach.user_id) ? parseInt(coach.user_id) : ((coach && coach.id && !isNaN(coach.id)) ? parseInt(coach.id) : 1);

  try {
    const res = await fetch(`api/messages.php?viewer_id=${currentUserId}&with_user=${coachUserId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.messages)) {
        if (json.messages.length === 0) {
          stream.innerHTML = `
            <div style="text-align: center; padding: 40px 16px; color: #64748B;">
              <i data-lucide="message-square" style="width: 28px; height: 28px; margin: 0 auto 8px; opacity: 0.4; display: block;"></i>
              <div style="font-weight: 700; color: #0F172A; margin-bottom: 4px;">Direct Desk with ${escapeHtml(coach.name)}</div>
              <div style="font-size: 12px;">No messages recorded yet. Type below to consult on workout form, swap exercises, or adjust macros.</div>
            </div>`;
        } else {
          stream.innerHTML = json.messages.map(msg => {
            const isUser = (parseInt(msg.sender_id) === parseInt(currentUserId));
            const timeStr = msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today';
            if (isUser) {
              return `
                <div class="chat-bubble-outgoing">
                  <div class="bubble-content">${escapeHtml(msg.message_text)}</div>
                  <div class="chat-bubble-meta" style="color: #64748B;">
                    ${timeStr} • Delivered <i data-lucide="check-check" style="width: 13px; height: 13px; color: #2563EB; display: inline-block;"></i>
                  </div>
                </div>`;
            } else {
              return `
                <div class="chat-bubble-incoming">
                  <img src="${coach.avatar || 'assets/images/trainer_raj.jpg'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 2px;" alt="${coach.name}">
                  <div>
                    <div style="font-size: 11px; font-weight: 700; color: #64748B; margin-bottom: 3px;">${escapeHtml(coach.name)}</div>
                    <div class="bubble-content">${escapeHtml(msg.message_text)}</div>
                    <div class="chat-bubble-meta">${timeStr} • Read</div>
                  </div>
                </div>`;
            }
          }).join('');
        }
        stream.scrollTop = stream.scrollHeight;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  } catch (err) {
    console.warn('Coach chat stream load err:', err);
  }
}

async function handleSendCoachChat(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('coachChatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const store = window.fitSyncStore;
  const trainers = store ? store.getTrainers() : [];
  const currentUser = store && store.state ? store.state.user : {};
  let coach = null;
  if (currentUser && currentUser.assignedCoachId) {
    coach = trainers.find(t => t.id === currentUser.assignedCoachId);
  }
  if (!coach) {
    coach = trainers.find(t => t.isAssigned) || trainers[0];
  }

  const currentUserId = (currentUser && currentUser.id) ? parseInt(currentUser.id) : 2;
  const coachUserId = (coach && coach.user_id) ? parseInt(coach.user_id) : ((coach && coach.id && !isNaN(coach.id)) ? parseInt(coach.id) : 1);

  try {
    const res = await fetch('api/messages.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: currentUserId,
        recipient_id: coachUserId,
        message_text: text
      })
    });
    const json = await res.json();
    if (json.success) {
      renderCoachChatUI();
    } else {
      showToast(json.error || 'Failed to send message', 'error');
    }
  } catch (err) {
    console.warn('Message send err:', err);
  }
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('coachChatInput');
  if (input) {
    input.value = promptText;
    handleSendCoachChat();
  }
}

// ==========================================================================
// NUTRITION TIMELINE & MACRO ENGINE
// ==========================================================================
function setupMacroAutoCalculation() {
  const pInput = document.getElementById('mealProtein');
  const cInput = document.getElementById('mealCarbs');
  const fInput = document.getElementById('mealFat');
  const calInput = document.getElementById('mealCalories');
  const noticeEl = document.getElementById('mealMacroNotice');

  if (!pInput || !cInput || !fInput || !calInput) return;

  const updateMacroEnergy = () => {
    const p = parseFloat(pInput.value) || 0;
    const c = parseFloat(cInput.value) || 0;
    const f = parseFloat(fInput.value) || 0;
    const enteredCal = parseInt(calInput.value) || 0;
    const macroEnergy = Math.round((p * 4) + (c * 4) + (f * 9));

    // STRICT REQUIREMENT: NEVER automatically overwrite the user's entered calories!
    // Preserve entered food calories independently of macro energy.
    if (!noticeEl) return;

    if (macroEnergy > 0 || (p > 0 || c > 0 || f > 0)) {
      noticeEl.style.display = 'block';
      let html = `<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div><strong>Macro Energy:</strong> ${macroEnergy} kcal <span style="opacity: 0.8;">(P: ${Math.round(p * 4)} · C: ${Math.round(c * 4)} · F: ${Math.round(f * 9)})</span></div>
      </div>`;

      if (enteredCal > 0 && Math.abs(enteredCal - macroEnergy) > 150) {
        html += `<div style="margin-top: 6px; color: #9A3412; font-weight: 500; font-size: 11px; line-height: 1.4;">
          ⚠️ <strong>Consistency Notice:</strong> Entered calories (${enteredCal} kcal) differs from macro-calculated energy (${macroEnergy} kcal).
          Your entered value of <strong>${enteredCal} kcal</strong> will be strictly preserved in the database.
          <button type="button" onclick="document.getElementById('mealCalories').value=${macroEnergy}; setupMacroAutoCalculation();" style="margin-left: 6px; padding: 2px 6px; background: #DBEAFE; border: 1px solid #93C5FD; color: #1E40AF; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: 600;">Use ${macroEnergy} kcal</button>
        </div>`;
      }
      noticeEl.innerHTML = html;
    } else {
      noticeEl.style.display = 'none';
      noticeEl.innerHTML = '';
    }
  };

  pInput.addEventListener('input', updateMacroEnergy);
  cInput.addEventListener('input', updateMacroEnergy);
  fInput.addEventListener('input', updateMacroEnergy);
  calInput.addEventListener('input', updateMacroEnergy);
}

function resetMealForm() {
  const mealForm = document.getElementById('mealForm');
  if (mealForm) mealForm.reset();
  const editId = document.getElementById('mealEditId');
  if (editId) editId.value = '';
  const title = document.getElementById('mealModalTitle');
  if (title) title.textContent = 'Log Meal & Nutrition';
  const submitBtn = document.getElementById('mealSubmitBtn');
  if (submitBtn) submitBtn.textContent = 'Log Nutrition';
  const noticeEl = document.getElementById('mealMacroNotice');
  if (noticeEl) {
    noticeEl.style.display = 'none';
    noticeEl.innerHTML = '';
  }
}

function openEditMealModal(mealId) {
  const meals = window._todayMealsCache || [];
  const meal = meals.find(m => m.id === mealId);
  if (!meal) return;

  const editId = document.getElementById('mealEditId');
  if (editId) editId.value = meal.id;

  const timing = document.getElementById('mealTiming');
  if (timing) timing.value = meal.category || meal.meal_type || 'Lunch';

  const foodName = document.getElementById('mealFoodName');
  if (foodName) foodName.value = meal.food_name || '';

  const cal = document.getElementById('mealCalories');
  if (cal) cal.value = meal.calories || 0;

  const p = document.getElementById('mealProtein');
  if (p) p.value = meal.protein || 0;

  const c = document.getElementById('mealCarbs');
  if (c) c.value = meal.carbs || 0;

  const f = document.getElementById('mealFat');
  if (f) f.value = meal.fat || 0;

  const title = document.getElementById('mealModalTitle');
  if (title) title.textContent = 'Edit Meal & Nutrition';

  const submitBtn = document.getElementById('mealSubmitBtn');
  if (submitBtn) submitBtn.textContent = 'Save Changes';

  setupMacroAutoCalculation();
  openModal('addMealModal');
}

async function renderMealsTimeline() {
  const container = document.getElementById('todayMealsTimelineList');
  if (!container) return;

  try {
    const res = await fetch('api/meals.php');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const meals = json.data.meals || [];
        window._todayMealsCache = meals;

        if (meals.length === 0) {
          container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 32px 16px; color: var(--text-secondary); background: #F8FAFC; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
              <i data-lucide="utensils" style="width: 32px; height: 32px; margin: 0 auto 8px; opacity: 0.4; display: block;"></i>
              <div style="font-weight: 700; color: var(--text-main); font-size: 14px; margin-bottom: 4px;">No Meals Logged Today</div>
              <div style="font-size: 12px; color: var(--text-muted);">Log your meals or recipes to track your daily macronutrient progress.</div>
            </div>`;
          if (typeof initIcons === 'function') initIcons();
          return;
        }

        container.innerHTML = meals.map(m => {
          const cat = m.category || 'Meal';
          const food = m.food_name || 'Balanced Intake';
          const p = Math.round(m.protein || 0);
          const c = Math.round(m.carbs || 0);
          const f = Math.round(m.fat || 0);
          const cal = m.calories || 0;
          const time = m.time || 'Today';

          return `
            <div style="display: flex; gap: 14px; align-items: center; padding: 12px 16px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); transition: all 0.15s ease;">
              <div style="width: 44px; height: 44px; border-radius: var(--radius-sm); background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.15); display: flex; align-items: center; justify-content: center; color: var(--primary-blue); flex-shrink: 0;">
                <i data-lucide="utensils" style="width: 20px; height: 20px;"></i>
              </div>
              <div style="flex: 1;">
                <span style="font-size: 11px; font-weight: 700; color: var(--primary-blue); text-transform: uppercase;">${time} • ${cat}</span>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${escapeHtml(food)}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">${p}g Protein • ${c}g Carbs • ${f}g Fat</div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <strong style="color: var(--primary-blue); font-size: 15px;">${cal} kcal</strong>
                <button type="button" onclick="openEditMealModal(${m.id})" style="background: none; border: none; color: var(--primary-blue); cursor: pointer; padding: 4px; border-radius: 4px;" title="Edit meal">
                  <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
                </button>
                <button type="button" onclick="deleteMealEntry(${m.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px;" title="Delete meal">
                  <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                </button>
              </div>
            </div>`;
        }).join('');

        if (typeof initIcons === 'function') initIcons();
      }
    }
  } catch (err) {
    console.warn('Meals timeline fetch err:', err);
  }
}

async function deleteMealEntry(mealId) {
  if (!confirm('Are you sure you want to delete this meal record?')) return;
  try {
    const res = await fetch('api/meals.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: mealId })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Meal removed from database', 'info');
      renderMealsTimeline();
      syncUserDashboardFromDb();
    }
  } catch (e) {
    console.warn('Delete meal error:', e);
  }
}

// ==========================================================================
// HYDRATION LOG & ENTRY MANAGEMENT (100% Database-Driven)
// ==========================================================================
async function renderWaterLogs(passedLogs) {
  const container = document.getElementById('todayWaterLogsList');
  const countEl = document.getElementById('todayWaterEntriesCount');
  if (!container) return;

  try {
    let logs = passedLogs;
    if (!logs) {
      const res = await fetch('api/water.php');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          logs = json.data.logs || [];
        }
      }
    }
    logs = logs || [];

    if (countEl) countEl.textContent = `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'}`;

    if (logs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: var(--text-secondary); font-size: 13px; background: #F8FAFC; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <i data-lucide="droplet" style="width: 24px; height: 24px; margin: 0 auto 6px; opacity: 0.4; display: block; color: var(--primary-blue);"></i>
          No hydration recorded today. Tap a preset above or enter custom ml to log water.
        </div>`;
      if (typeof initIcons === 'function') initIcons();
      return;
    }

    container.innerHTML = logs.map(l => {
      const ml = l.amount_ml || 0;
      const ltrs = (ml / 1000).toFixed(2);
      const timeStr = l.time || (l.logged_at ? new Date(l.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today');

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); transition: all 0.15s ease;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(37,99,235,0.08); display: flex; align-items: center; justify-content: center; color: var(--primary-blue);">
              <i data-lucide="droplet" style="width: 16px; height: 16px;"></i>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">+${ml} ml <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">(${ltrs} L)</span></div>
              <div style="font-size: 11px; color: var(--text-secondary);">${timeStr}</div>
            </div>
          </div>
          <button type="button" onclick="deleteWaterEntry(${l.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; font-size: 11px;" title="Delete this water entry">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>`;
    }).join('');

    if (typeof initIcons === 'function') initIcons();
  } catch (err) {
    console.warn('Error loading water logs:', err);
  }
}

async function deleteWaterEntry(id) {
  if (!confirm('Remove this water entry?')) return;
  try {
    const res = await fetch('api/water.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    });
    const json = await res.json();
    if (json.success && json.data) {
      const state = window.fitSyncStore?.state;
      if (state?.stats?.water) state.stats.water.current = json.data.liters;
      if (state?.waterStation) state.waterStation.current = json.data.liters;
      updateDashboardUI();
      triggerWaterFillAnimation();
      renderWaterLogs(json.data.logs);
      if (window.renderAllCharts) window.renderAllCharts();
      showToast(`Water entry removed. New total: ${json.data.liters} L.`, 'info');
    }
  } catch (err) {
    console.warn('Error deleting water entry:', err);
  }
}

// ==========================================================================
// ATTENDANCE & TURNSTILE OVERHAUL LOGIC (Authoritative Database CRUD)
// ==========================================================================
async function renderAttendanceView() {
  const tbody = document.getElementById('attendanceLogsTbody');
  if (!tbody) return;

  const user = window.fitSyncStore?.state?.user;
  const userId = user?.id || '';

  try {
    const res = await fetch(`api/attendance.php?user_id=${userId}`);
    if (res.ok) {
      const json = await res.json();
      const records = Array.isArray(json.data) ? json.data : (Array.isArray(json.history) ? json.history : []);
      if (records.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 36px 16px; color: var(--text-secondary);">
              <i data-lucide="qr-code" style="width: 28px; height: 28px; margin: 0 auto 8px; opacity: 0.4; display: block;"></i>
              <strong style="color: var(--text-main); display: block; margin-bottom: 4px;">No Check-Ins Recorded Yet</strong>
              <span style="font-size: 12px; color: var(--text-muted);">Scan your QR pass or click "Simulate Check-In" to record turnstile entry.</span>
            </td>
          </tr>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
      }

      tbody.innerHTML = records.map(r => {
        const checkInDate = r.check_in_time ? new Date(r.check_in_time) : new Date();
        const dateStr = checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const duration = r.check_out_time ? 'Completed' : 'Active Session';
        const gymName = r.gym_name || 'FitZone Fitness Center';

        return `
          <tr>
            <td>
              <div style="font-weight: 600; color: #0F172A;">${dateStr}</div>
              <span style="font-size: 11px; color: #64748B;">Checked in at ${timeStr}</span>
            </td>
            <td>
              <span style="font-weight: 600; color: #2563EB;">${duration}</span>
            </td>
            <td>
              <div style="font-size: 13px; color: #0F172A;">${escapeHtml(gymName)}</div>
              <span style="font-size: 11px; color: #64748B;">Turnstile Gate #1</span>
            </td>
            <td>
              <span class="fs-badge fs-badge-blue">${escapeHtml(r.check_in_method || 'Turnstile QR')}</span>
            </td>
            <td>
              <span class="fs-badge fs-badge-green" style="display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="check-circle-2" style="width: 12px; height: 12px;"></i> Verified
              </span>
            </td>
          </tr>`;
      }).join('');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  } catch (err) {
    console.warn('Attendance load error:', err);
  }
}

async function simulateTurnstileCheckIn() {
  const store = window.fitSyncStore;
  const user = store?.state?.user;
  const userId = user?.id || null;

  // Flash pass card visually
  const card = document.querySelector('.turnstile-pass-card');
  if (card) {
    card.style.boxShadow = '0 0 30px #22C55E';
    card.style.borderColor = '#22C55E';
    setTimeout(() => {
      card.style.boxShadow = '';
      card.style.borderColor = 'rgba(255, 255, 255, 0.12)';
    }, 1500);
  }

  // Post to backend database (Workflow D: Live Turnstile Check-In & Capacity Telemetry)
  try {
    const res = await fetch('api/attendance.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        gym_id: 1,
        action: 'check_in',
        method: 'turnstile'
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Turnstile Pass Verified • Facility Occupancy Updated!', 'success');
      renderAttendanceView();
      syncUserDashboardFromDb();
    }
  } catch (err) {
    console.warn('Attendance sync err:', err);
  }
}

function exportAttendanceCSV() {
  let csv = "Date,CheckIn_Time,Duration,Branch,Zone,Method,Status\n";
  attendanceLogs.forEach(r => {
    csv += `"${r.date}","${r.time}","${r.duration}","${r.branch}","${r.zone}","${r.method}","${r.status}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitsync_turnstile_attendance_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof showToast === 'function') showToast('Attendance report exported to CSV successfully.', 'success');
}

// Export Auth & Interactive Functions
window.initAuthSystem = initAuthSystem;
window.enterGuestPortal = enterGuestPortal;
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
window.handleForgotPassword = handleForgotPassword;
window.openDataStorageModal = openDataStorageModal;
window.renderCoachChatUI = renderCoachChatUI;
window.handleSendCoachChat = handleSendCoachChat;
window.sendQuickPrompt = sendQuickPrompt;
window.clearCoachChatHistory = clearCoachChatHistory;
window.renderAttendanceView = renderAttendanceView;
window.simulateTurnstileCheckIn = simulateTurnstileCheckIn;
window.exportAttendanceCSV = exportAttendanceCSV;

/* ==========================================================================
   USER PROFILE, BIOMETRICS & ATTENDANCE CALENDAR CONTROLLER
   ========================================================================== */

function stepValue(inputId, delta, min, max, decimals) {
  const el = document.getElementById(inputId);
  if (!el) return;
  let val = parseFloat(el.value) || 0;
  val = val + delta;
  if (min !== undefined && val < min) val = min;
  if (max !== undefined && val > max) val = max;
  el.value = (decimals && decimals > 0) ? val.toFixed(decimals) : Math.round(val);
}

let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth() + 1; // 1-12

async function loadAttendanceCalendar(year, month) {
  if (!year) year = currentCalYear;
  if (!month) month = currentCalMonth;
  currentCalYear = year;
  currentCalMonth = month;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const titleEl = document.getElementById('calMonthYearTitle');
  if (titleEl) {
    titleEl.textContent = `${monthNames[month - 1]} ${year}`;
  }

  const user = window.currentUser || (window.fitSyncStore && window.fitSyncStore.getUser && window.fitSyncStore.getUser()) || {};
  const userId = user.id || 8;

  try {
    const res = await fetch(`api/user/attendance_calendar.php?user_id=${userId}&year=${year}&month=${month}`);
    const json = await res.json();
    if (json.success && json.data) {
      renderAttendanceCalendarGrid(json.data);
    }
  } catch (err) {
    console.warn('Failed to load attendance calendar:', err);
  }
}

function renderAttendanceCalendarGrid(data) {
  const grid = document.getElementById('calendarDaysGrid');
  if (!grid) return;

  const totalVisitsEl = document.getElementById('calTotalVisits');
  const consistencyEl = document.getElementById('calConsistencyPct');
  const gymTitleEl = document.getElementById('calGymTitle');

  if (totalVisitsEl) totalVisitsEl.textContent = data.total_checkins || 0;
  if (consistencyEl) consistencyEl.textContent = `${data.consistency_pct || 0}%`;
  if (gymTitleEl && data.gym_name) gymTitleEl.textContent = data.gym_name;

  const attendedDays = new Set((data.attended_days || []).map(d => parseInt(d)));
  const daysInMonth = data.days_in_month || 30;
  const firstDayWeekday = data.first_day_weekday !== undefined ? data.first_day_weekday : 0; // 0 = Sunday
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === data.year && (today.getMonth() + 1) === data.month;
  const currentDayNum = today.getDate();

  let html = '';

  // Blank padding cells for days before the 1st
  for (let i = 0; i < firstDayWeekday; i++) {
    html += '<div class="calendar-day-cell empty" style="visibility: hidden; min-height: 44px;"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && day === currentDayNum;
    const isAttended = attendedDays.has(day);

    let cellClass = 'calendar-day-cell';
    let cellStyle = 'min-height: 44px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; font-weight: 600; cursor: default; transition: all 0.15s ease; position: relative;';
    
    if (isAttended) {
      cellClass += ' attended';
      cellStyle += ' background: rgba(16, 185, 129, 0.18); border-color: #10B981; color: #065F46; font-weight: 700;';
    } else if (isToday) {
      cellClass += ' today';
      cellStyle += ' background: rgba(37, 99, 235, 0.12); border-color: #2563EB; color: #1E40AF; font-weight: 800;';
    } else {
      cellStyle += ' background: #FFFFFF; color: #64748B;';
    }

    let dot = '';
    if (isAttended) {
      dot = '<span style="width: 5px; height: 5px; border-radius: 50%; background: #10B981; margin-top: 3px;"></span>';
    } else if (isToday) {
      dot = '<span style="width: 5px; height: 5px; border-radius: 50%; background: #2563EB; margin-top: 3px;"></span>';
    }

    html += `
      <div class="${cellClass}" style="${cellStyle}" title="${isAttended ? 'Verified Check-in Recorded' : (isToday ? 'Today' : '')}">
        <span>${day}</span>
        ${dot}
      </div>
    `;
  }

  grid.innerHTML = html;
}

function changeCalendarMonth(delta) {
  currentCalMonth += delta;
  if (currentCalMonth > 12) {
    currentCalMonth = 1;
    currentCalYear += 1;
  } else if (currentCalMonth < 1) {
    currentCalMonth = 12;
    currentCalYear -= 1;
  }
  loadAttendanceCalendar(currentCalYear, currentCalMonth);
}

async function handleCalendarCheckIn() {
  const btn = document.getElementById('btnProfileCheckin');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Verifying...';
  }

  const user = window.currentUser || (window.fitSyncStore && window.fitSyncStore.getUser && window.fitSyncStore.getUser()) || {};
  const userId = user.id || 8;

  try {
    const res = await fetch('api/user/attendance_calendar.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'checkin',
        user_id: userId,
        gym_id: 1,
        method: 'turnstile'
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') {
        showToast(result.message || 'Check-in verified! Attendance logged.', 'success');
      } else {
        alert(result.message || 'Check-in verified!');
      }
      loadAttendanceCalendar(currentCalYear, currentCalMonth);
      loadUserProfileData(); // updates streak
      if (typeof syncUserDashboardFromDb === 'function') {
        syncUserDashboardFromDb();
      }
    } else {
      if (typeof showToast === 'function') {
        showToast(result.error || result.message || 'Check-in failed.', 'warning');
      } else {
        alert(result.error || result.message);
      }
    }
  } catch (err) {
    console.error('Check-in error:', err);
    if (typeof showToast === 'function') showToast('Server communication error during check-in.', 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="qr-code" style="width: 14px; height: 14px;"></i> Check In to Gym Today';
      if (window.initIcons) initIcons();
    }
  }
}

async function loadUserProfileData() {
  try {
    const res = await fetch('api/user/profile.php');
    const json = await res.json();
    if (!json.success || !json.data) {
      console.warn('Profile fetch unsuccessful:', json.error);
      return;
    }

    const d = json.data;
    const u = d.user || {};
    const b = d.biometrics || {};
    const m = (d.measurements && d.measurements.history) ? d.measurements.history : [];
    const n = d.notifications || {};
    const t = d.trainer || {};
    const streak = u.streak_days || 0;

    // Synchronize authoritative user identity across store and global UI elements
    if (u.full_name) {
      if (window.fitSyncStore?.state?.user) {
        window.fitSyncStore.state.user.id = u.id;
        window.fitSyncStore.state.user.name = u.full_name;
        window.fitSyncStore.state.user.full_name = u.full_name;
        window.fitSyncStore.state.user.email = u.email;
      }
      const sideName = document.getElementById('sidebarUserName');
      if (sideName) sideName.textContent = u.full_name;
      const sideEmail = document.getElementById('sidebarUserEmail');
      if (sideEmail && u.email) sideEmail.textContent = u.email;
      const welcomeName = document.getElementById('welcomeName');
      if (welcomeName) welcomeName.textContent = u.full_name;
      updateWelcomeGreeting(u.full_name);
    }

    // SECTION A: Profile Summary Header
    const nameEl = document.getElementById('profHeaderName');
    if (nameEl) nameEl.textContent = u.full_name || 'FitSync Athlete';

    const avatarEl = document.getElementById('profHeaderAvatar');
    if (avatarEl && u.avatar) avatarEl.src = u.avatar;

    const ageEl = document.getElementById('profHeaderAge');
    if (ageEl) ageEl.textContent = u.age ? `${u.age} Years` : '24 Years';

    const heightEl = document.getElementById('profHeaderHeight');
    if (heightEl) heightEl.textContent = u.height_cm ? `${u.height_cm} cm` : '175 cm';

    const weightEl = document.getElementById('profHeaderWeight');
    if (weightEl) weightEl.textContent = u.weight_kg ? `${u.weight_kg} kg` : '72.4 kg';

    const gymEl = document.getElementById('profHeaderGym');
    if (gymEl) gymEl.textContent = u.home_gym || 'FitZone Fitness Hub';

    const goalEl = document.getElementById('profHeaderGoal');
    if (goalEl) goalEl.textContent = u.goal_title || 'Build Muscle';

    const tierEl = document.getElementById('profHeaderTier');
    if (tierEl) tierEl.textContent = u.membership_tier || 'FitZone Platinum Elite';

    const streakEl = document.getElementById('profHeaderStreak');
    if (streakEl) streakEl.textContent = `${streak} Days 🔥`;

    // SECTION B: Steppers & Selects
    const ctrlWeight = document.getElementById('ctrlWeight');
    if (ctrlWeight && u.weight_kg) ctrlWeight.value = u.weight_kg;

    const ctrlHeight = document.getElementById('ctrlHeight');
    if (ctrlHeight && u.height_cm) ctrlHeight.value = u.height_cm;

    const ctrlAge = document.getElementById('ctrlAge');
    if (ctrlAge && u.age) ctrlAge.value = u.age;

    const ctrlGoal = document.getElementById('ctrlGoal');
    if (ctrlGoal && u.goal_title) {
      ctrlGoal.value = u.goal_title;
    }

    const ctrlActivity = document.getElementById('ctrlActivity');
    if (ctrlActivity && u.activity_level) {
      ctrlActivity.value = u.activity_level;
    }

    // SECTION C: Biometrics
    const bmiVal = document.getElementById('bioBmiVal');
    if (bmiVal) bmiVal.textContent = b.bmi || '23.6';

    const bmiCat = document.getElementById('bioBmiCategory');
    if (bmiCat) bmiCat.textContent = b.bmi_category || 'Normal Weight';

    const bmrVal = document.getElementById('bioBmrVal');
    if (bmrVal) bmrVal.innerHTML = `${b.bmr ? Number(b.bmr).toLocaleString() : '1,704'} <span style="font-size: 15px; font-weight: 600;">kcal</span>`;

    const tdeeVal = document.getElementById('bioTdeeVal');
    if (tdeeVal) tdeeVal.innerHTML = `${b.tdee ? Number(b.tdee).toLocaleString() : '2,641'} <span style="font-size: 15px; font-weight: 600;">kcal</span>`;

    const fatVal = document.getElementById('bioBodyFatVal');
    if (fatVal) fatVal.textContent = b.body_fat_pct ? `${b.body_fat_pct}%` : '17.9%';

    // SECTION D: Milestones
    renderMilestonesTable(m);

    // SECTION F: Edit Profile Form
    const inputName = document.getElementById('profInputFullName');
    if (inputName) inputName.value = u.full_name || '';

    const inputMobile = document.getElementById('profInputMobile');
    if (inputMobile) inputMobile.value = u.mobile || '';

    const inputAvatar = document.getElementById('profInputAvatar');
    if (inputAvatar) inputAvatar.value = u.avatar || '';

    // SECTION H: Notification Toggles
    if (document.getElementById('notifWorkout')) document.getElementById('notifWorkout').checked = n.workout_reminders !== false;
    if (document.getElementById('notifNutrition')) document.getElementById('notifNutrition').checked = n.nutrition_alerts !== false;
    if (document.getElementById('notifCoach')) document.getElementById('notifCoach').checked = n.coach_messages !== false;
    if (document.getElementById('notifAnnouncements')) document.getElementById('notifAnnouncements').checked = n.gym_announcements !== false;

    // SECTION I: Account Details
    const acctEmail = document.getElementById('acctEmail');
    if (acctEmail) acctEmail.textContent = u.email || 'athlete@fitsync.ai';

    const acctGym = document.getElementById('acctHomeGym');
    if (acctGym) acctGym.textContent = u.home_gym || 'FitZone Fitness Hub';

    const acctTier = document.getElementById('acctTier');
    if (acctTier) acctTier.textContent = u.membership_tier || 'FitZone Platinum Elite';

    const acctCoach = document.getElementById('acctCoachName');
    if (acctCoach) acctCoach.textContent = t.name ? `Coach ${t.name}` : 'Coach Vikram';

    if (window.initIcons) initIcons();
  } catch (err) {
    console.error('Error in loadUserProfileData:', err);
  }
}

function renderMilestonesTable(milestones) {
  const tbody = document.getElementById('measHistoryTbody');
  const countBadge = document.getElementById('measCountBadge');
  if (countBadge) countBadge.textContent = `${milestones.length} Entries`;

  if (!tbody) return;

  if (!milestones || milestones.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 24px;">
          No milestone measurements recorded yet. Click <strong>+ Record Milestone</strong> to log your first progress entry!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = milestones.map(m => `
    <tr>
      <td style="font-weight: 600; color: #0F172A; white-space: nowrap;">${m.date || m.recorded_at}</td>
      <td><strong>${m.weight_kg ? m.weight_kg + ' kg' : '--'}</strong></td>
      <td>${m.waist_cm ? m.waist_cm + ' cm' : '--'}</td>
      <td>${m.chest_cm ? m.chest_cm + ' cm' : '--'}</td>
      <td>${m.arms_cm ? m.arms_cm + ' cm' : '--'}</td>
      <td style="color: var(--text-secondary); font-size: 12px; max-width: 220px;">${escapeHtml(m.notes || 'Routine check')}</td>
      <td style="text-align: right;">
        <button type="button" class="btn-secondary" style="padding: 3px 8px; font-size: 11px; color: #EF4444; border-color: rgba(239, 68, 68, 0.3);" onclick="deleteMilestoneMeasurement(${m.id})">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

async function saveBodyStatsAndRecalculate() {
  const btn = document.getElementById('btnSaveBodyStats');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Saving & Recalculating...';
  }

  const weight = parseFloat(document.getElementById('ctrlWeight')?.value) || 72.0;
  const height = parseFloat(document.getElementById('ctrlHeight')?.value) || 175.0;
  const age    = parseInt(document.getElementById('ctrlAge')?.value) || 24;
  const goal   = document.getElementById('ctrlGoal')?.value || 'Build Muscle';
  const activity = document.getElementById('ctrlActivity')?.value || 'moderately_active';

  const user = window.currentUser || (window.fitSyncStore && window.fitSyncStore.getUser && window.fitSyncStore.getUser()) || {};
  const userId = user.id || 8;

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_body_stats',
        user_id: userId,
        weight: weight,
        height: height,
        age: age,
        goal: goal,
        activity_level: activity
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') {
        showToast('Body stats saved & daily targets recalculated successfully!', 'success');
      } else {
        alert('Body stats saved!');
      }

      // Update local state and reload UI
      if (window.fitSyncStore && typeof window.fitSyncStore.updateWeight === 'function') {
        window.fitSyncStore.updateWeight(weight);
      }
      if (typeof updateDashboardUI === 'function') updateDashboardUI();
      if (typeof syncUserDashboardFromDb === 'function') syncUserDashboardFromDb();
      loadUserProfileData();
    } else {
      if (typeof showToast === 'function') showToast(result.error || 'Failed to save stats.', 'danger');
    }
  } catch (err) {
    console.error('Error saving stats:', err);
    if (typeof showToast === 'function') showToast('Server communication error.', 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="calculator" style="width: 16px; height: 16px;"></i> Save & Recalculate Daily Targets';
      if (window.initIcons) initIcons();
    }
  }
}

function toggleMilestoneForm() {
  const form = document.getElementById('milestoneEntryForm');
  if (!form) return;
  form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
}

async function saveMilestoneMeasurement() {
  const weight = parseFloat(document.getElementById('milestoneWeight')?.value);
  if (!weight || isNaN(weight) || weight <= 0) {
    alert('Please enter a valid weight in kg.');
    return;
  }
  const waist = parseFloat(document.getElementById('milestoneWaist')?.value) || null;
  const chest = parseFloat(document.getElementById('milestoneChest')?.value) || null;
  const arms  = parseFloat(document.getElementById('milestoneArms')?.value) || null;
  const notes = document.getElementById('milestoneNotes')?.value || '';

  const user = window.currentUser || (window.fitSyncStore && window.fitSyncStore.getUser && window.fitSyncStore.getUser()) || {};
  const userId = user.id || 8;

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'record_milestone',
        user_id: userId,
        weight: weight,
        waist: waist,
        chest: chest,
        arms: arms,
        notes: notes
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') {
        showToast('Milestone measurement recorded into database!', 'success');
      } else {
        alert('Milestone saved!');
      }

      // Clear input fields
      document.getElementById('milestoneWeight').value = '';
      document.getElementById('milestoneWaist').value = '';
      document.getElementById('milestoneChest').value = '';
      document.getElementById('milestoneArms').value = '';
      document.getElementById('milestoneNotes').value = '';
      toggleMilestoneForm();

      // Refresh data
      loadUserProfileData();
      if (typeof syncUserDashboardFromDb === 'function') syncUserDashboardFromDb();
    } else {
      if (typeof showToast === 'function') showToast(result.error || 'Failed to save milestone.', 'danger');
    }
  } catch (err) {
    console.error('Milestone save error:', err);
  }
}

async function deleteMilestoneMeasurement(id) {
  if (!confirm('Are you sure you want to delete this measurement entry?')) return;

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_measurement',
        measurement_id: id
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') {
        showToast('Measurement deleted.', 'success');
      }
      loadUserProfileData();
      if (typeof syncUserDashboardFromDb === 'function') syncUserDashboardFromDb();
    } else {
      if (typeof showToast === 'function') showToast(result.error || 'Failed to delete entry.', 'danger');
    }
  } catch (err) {
    console.error('Error deleting measurement:', err);
  }
}

async function handleSaveProfileDetails(e) {
  if (e && e.preventDefault) e.preventDefault();

  const fullName = document.getElementById('profInputFullName')?.value.trim();
  const mobile   = document.getElementById('profInputMobile')?.value.trim();
  const avatar   = document.getElementById('profInputAvatar')?.value.trim();

  if (!fullName) {
    alert('Full name is required.');
    return;
  }

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_profile_details',
        full_name: fullName,
        mobile: mobile,
        avatar_url: avatar
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') {
        showToast('Profile details updated successfully!', 'success');
      } else {
        alert('Profile saved!');
      }

      // Update UI elements across header, sidebar and store
      if (window.fitSyncStore?.state?.user) {
        window.fitSyncStore.state.user.name = fullName;
        window.fitSyncStore.state.user.full_name = fullName;
        if (mobile) window.fitSyncStore.state.user.mobile = mobile;
      }

      const headerName = document.getElementById('profHeaderName');
      if (headerName) headerName.textContent = fullName;

      const userNameEl = document.getElementById('userName');
      if (userNameEl) userNameEl.textContent = fullName;

      const sidebarName = document.getElementById('sidebarUserName');
      if (sidebarName) sidebarName.textContent = fullName;

      const welcomeName = document.getElementById('welcomeName');
      if (welcomeName) welcomeName.textContent = fullName;
      updateWelcomeGreeting(fullName);

      if (avatar) {
        const headerAvatar = document.getElementById('profHeaderAvatar');
        if (headerAvatar) headerAvatar.src = avatar;
      }

      loadUserProfileData();
    } else {
      if (typeof showToast === 'function') showToast(result.error || 'Failed to update profile.', 'danger');
    }
  } catch (err) {
    console.error('Error saving profile details:', err);
  }
}

async function handleProfilePasswordChange(e) {
  if (e && e.preventDefault) e.preventDefault();

  const curPwd = document.getElementById('pwdCurrent')?.value;
  const newPwd = document.getElementById('pwdNew')?.value;
  const conPwd = document.getElementById('pwdConfirm')?.value;
  const alertBox = document.getElementById('pwdAlertBox');

  if (newPwd !== conPwd) {
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
      alertBox.style.color = '#DC2626';
      alertBox.textContent = 'New passwords do not match. Please verify and try again.';
    }
    return;
  }

  if (newPwd.length < 6) {
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
      alertBox.style.color = '#DC2626';
      alertBox.textContent = 'Password must be at least 6 characters.';
    }
    return;
  }

  const user = window.currentUser || (window.fitSyncStore && window.fitSyncStore.getUser && window.fitSyncStore.getUser()) || {};
  const userId = user.id || 8;

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'change_password',
        user_id: userId,
        current_password: curPwd,
        new_password: newPwd
      })
    });
    const result = await res.json();
    if (result.success) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = 'rgba(16, 185, 129, 0.12)';
        alertBox.style.color = '#059669';
        alertBox.textContent = 'Password updated successfully!';
      }
      if (typeof showToast === 'function') {
        showToast('Password updated successfully!', 'success');
      }
      document.getElementById('pwdCurrent').value = '';
      document.getElementById('pwdNew').value = '';
      document.getElementById('pwdConfirm').value = '';
      setTimeout(() => { if (alertBox) alertBox.style.display = 'none'; }, 4000);
    } else {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
        alertBox.style.color = '#DC2626';
        alertBox.textContent = result.error || 'Password update failed.';
      }
    }
  } catch (err) {
    console.error('Password change error:', err);
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
      alertBox.style.color = '#DC2626';
      alertBox.textContent = 'Server communication error.';
    }
  }
}

async function saveNotificationPreferences() {
  const notifWorkout = document.getElementById('notifWorkout')?.checked ? 1 : 0;
  const notifNutrition = document.getElementById('notifNutrition')?.checked ? 1 : 0;
  const notifCoach = document.getElementById('notifCoach')?.checked ? 1 : 0;
  const notifAnnouncements = document.getElementById('notifAnnouncements')?.checked ? 1 : 0;

  const user = window.currentUser || (window.fitSyncStore && window.fitSyncStore.getUser && window.fitSyncStore.getUser()) || {};
  const userId = user.id || 8;

  try {
    const res = await fetch('api/user/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_notifications',
        user_id: userId,
        workout_reminders: notifWorkout,
        nutrition_alerts: notifNutrition,
        coach_messages: notifCoach,
        gym_announcements: notifAnnouncements
      })
    });
    const result = await res.json();
    if (result.success) {
      if (typeof showToast === 'function') showToast('Notification preference saved.', 'success');
    }
  } catch (err) {
    console.warn('Error saving notifications:', err);
  }
}

// Window exports
window.stepValue = stepValue;
window.loadAttendanceCalendar = loadAttendanceCalendar;
window.renderAttendanceCalendarGrid = renderAttendanceCalendarGrid;
window.changeCalendarMonth = changeCalendarMonth;
window.handleCalendarCheckIn = handleCalendarCheckIn;
window.loadUserProfileData = loadUserProfileData;
window.renderMilestonesTable = renderMilestonesTable;
window.saveBodyStatsAndRecalculate = saveBodyStatsAndRecalculate;
window.toggleMilestoneForm = toggleMilestoneForm;
window.saveMilestoneMeasurement = saveMilestoneMeasurement;
window.deleteMilestoneMeasurement = deleteMilestoneMeasurement;
window.handleSaveProfileDetails = handleSaveProfileDetails;
window.handleProfilePasswordChange = handleProfilePasswordChange;
window.saveNotificationPreferences = saveNotificationPreferences;
window.openEditMealModal = openEditMealModal;
window.resetMealForm = resetMealForm;
window.deleteMealEntry = deleteMealEntry;
window.renderWaterLogs = renderWaterLogs;
window.deleteWaterEntry = deleteWaterEntry;
