/**
 * FitSync AI — Core Client-Side Interactivity
 * Includes: Workout Rest Timer, Audio alerts (Web Audio API), Dynamic Form Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  initRestTimer();
  initAssessmentLiveCalculator();
});

// 1. Audio Beep using Web Audio API (No external sound files required)
function playBeep(freq = 600, duration = 0.25) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn('Audio Context not allowed before user gesture:', e);
  }
}

// 2. Workout Rest Timer Engine
let timerInterval = null;
let remainingSeconds = 60;
let defaultDuration = 60;
let isTimerRunning = false;

function initRestTimer() {
  const display = document.getElementById('restTimerDisplay');
  const startBtn = document.getElementById('timerStartBtn');
  const resetBtn = document.getElementById('timerResetBtn');
  const add30Btn = document.getElementById('timerAdd30Btn');

  if (!display) return;

  function updateDisplay() {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  window.setRestDuration = function(seconds) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    defaultDuration = seconds;
    remainingSeconds = seconds;
    updateDisplay();
    if (startBtn) startBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
  };

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (isTimerRunning) {
        // Pause
        clearInterval(timerInterval);
        isTimerRunning = false;
        startBtn.innerHTML = '<i class="bi bi-play-fill"></i> Resume';
      } else {
        // Start
        if (remainingSeconds <= 0) remainingSeconds = defaultDuration;
        isTimerRunning = true;
        startBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
        
        timerInterval = setInterval(() => {
          if (remainingSeconds > 0) {
            remainingSeconds--;
            updateDisplay();
            if (remainingSeconds <= 3 && remainingSeconds > 0) {
              playBeep(440, 0.1); // Short warning beep
            }
          } else {
            clearInterval(timerInterval);
            isTimerRunning = false;
            startBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
            playBeep(880, 0.6); // Finish long beep
            alert('🔔 Rest time is over! Ready for your next set.');
          }
        }, 1000);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearInterval(timerInterval);
      isTimerRunning = false;
      remainingSeconds = defaultDuration;
      updateDisplay();
      if (startBtn) startBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
    });
  }

  if (add30Btn) {
    add30Btn.addEventListener('click', () => {
      remainingSeconds += 30;
      updateDisplay();
    });
  }

  updateDisplay();
}

// 3. Live Assessment Calculator (Mifflin-St Jeor Formula)
function initAssessmentLiveCalculator() {
  const form = document.getElementById('assessmentForm');
  if (!form) return;

  const ageInput = document.getElementById('calcAge');
  const genderInput = document.getElementById('calcGender');
  const heightInput = document.getElementById('calcHeight');
  const weightInput = document.getElementById('calcWeight');
  const activityInput = document.getElementById('calcActivity');

  const bmrDisplay = document.getElementById('previewBmr');
  const tdeeDisplay = document.getElementById('previewTdee');
  const bmiDisplay = document.getElementById('previewBmi');

  function calculate() {
    const age = parseFloat(ageInput?.value) || 25;
    const gender = genderInput?.value || 'male';
    const height = parseFloat(heightInput?.value) || 175;
    const weight = parseFloat(weightInput?.value) || 72;
    const activity = parseFloat(activityInput?.value) || 1.375;

    // BMI: kg / (m^2)
    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    // Mifflin-St Jeor BMR Formula:
    // Men: (10 × weight) + (6.25 × height) - (5 × age) + 5
    // Women: (10 × weight) + (6.25 × height) - (5 × age) - 161
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'female') {
      bmr -= 161;
    } else {
      bmr += 5;
    }
    bmr = Math.round(bmr);

    // TDEE = BMR × Activity Multiplier
    const tdee = Math.round(bmr * activity);

    if (bmrDisplay) bmrDisplay.textContent = bmr.toLocaleString() + ' kcal';
    if (tdeeDisplay) tdeeDisplay.textContent = tdee.toLocaleString() + ' kcal';
    if (bmiDisplay) bmiDisplay.textContent = bmi;
  }

  [ageInput, genderInput, heightInput, weightInput, activityInput].forEach(elem => {
    if (elem) elem.addEventListener('input', calculate);
  });

  calculate();
}
