/**
 * FitSync — Supabase Client Connector & Cloud Synchronization
 * Connects the vanilla JavaScript SPA to your Supabase PostgreSQL backend.
 */

(function () {
  const STORAGE_KEY_URL = 'fitsync_supabase_url';
  const STORAGE_KEY_KEY = 'fitsync_supabase_key';

  // Read saved credentials or environment defaults
  let sbUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  let sbKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  let client = null;

  function initClient() {
    if (window.supabase && typeof window.supabase.createClient === 'function' && sbUrl && sbKey) {
      try {
        client = window.supabase.createClient(sbUrl, sbKey);
        updateStatusBadge(true);
        console.log('[FitSync Supabase] Client initialized successfully with:', sbUrl);
      } catch (err) {
        console.warn('[FitSync Supabase] Failed to initialize client:', err);
        updateStatusBadge(false, 'Config Error');
      }
    } else {
      updateStatusBadge(false, 'Not Connected');
    }
  }

  function updateStatusBadge(isConnected, customMsg) {
    const badge = document.getElementById('supabaseConnectionBadge');
    const indicator = document.getElementById('supabaseStatusIndicator');
    const urlInput = document.getElementById('sbProjectUrl');
    const keyInput = document.getElementById('sbAnonKey');

    if (urlInput && sbUrl && !urlInput.value) urlInput.value = sbUrl;
    if (keyInput && sbKey && !keyInput.value) keyInput.value = sbKey;

    if (badge) {
      if (isConnected) {
        badge.className = 'badge badge-success';
        badge.textContent = '● Connected to Supabase';
        badge.style.background = '#DCFCE7';
        badge.style.color = '#16A34A';
      } else {
        badge.className = 'badge badge-neutral';
        badge.textContent = customMsg ? `● ${customMsg}` : '● LocalStorage Mode';
        badge.style.background = '#F1F5F9';
        badge.style.color = '#64748B';
      }
    }

    if (indicator) {
      indicator.style.background = isConnected ? '#16A34A' : '#94A3B8';
    }
  }

  // Test connection to Supabase instance
  async function testConnection(testUrl, testKey) {
    const url = testUrl || sbUrl;
    const key = testKey || sbKey;

    if (!url || !key) {
      return { success: false, message: 'Please provide both Project URL and Anon API Key.' };
    }

    if (!window.supabase) {
      return { success: false, message: 'Supabase JS library not loaded. Check your internet connection.' };
    }

    try {
      const tempClient = window.supabase.createClient(url, key);
      // Query the gyms table or rest endpoint
      const { data, error } = await tempClient.from('gyms').select('id, name').limit(1);

      if (error) {
        // If table doesn't exist yet, but credentials authenticated:
        if (error.code === '42P01') {
          return {
            success: true,
            warning: true,
            message: 'Authenticated with Supabase! Table "gyms" not found yet. Please run the SQL migration in Supabase SQL Editor.'
          };
        }
        return { success: false, message: error.message || 'Authentication failed.' };
      }

      return {
        success: true,
        message: 'Successfully connected to Supabase PostgreSQL!',
        data: data
      };
    } catch (err) {
      return { success: false, message: err.message || 'Connection error.' };
    }
  }

  // Save new credentials
  function saveCredentials(newUrl, newKey) {
    sbUrl = (newUrl || '').trim();
    sbKey = (newKey || '').trim();

    localStorage.setItem(STORAGE_KEY_URL, sbUrl);
    localStorage.setItem(STORAGE_KEY_KEY, sbKey);

    initClient();
  }

  // Sync Log Water to Supabase
  async function syncWaterLog(amountMl) {
    if (!client) return;
    try {
      const user = window.fitSyncStore?.state?.user;
      await client.from('water_logs').insert([
        {
          amount_ml: Math.round(amountMl),
          logged_at: new Date().toISOString()
        }
      ]);
      console.log('[FitSync Supabase] Synced water log:', amountMl, 'ml');
    } catch (e) {
      console.warn('[FitSync Supabase] Water sync error:', e);
    }
  }

  // Sync Log Meal to Supabase
  async function syncMealLog(mealData) {
    if (!client) return;
    try {
      await client.from('nutrition_logs').insert([
        {
          meal_type: mealData.timing || 'Snack',
          food_name: mealData.foodName,
          calories: mealData.cal,
          protein_g: mealData.protein,
          carbs_g: mealData.carbs,
          fat_g: mealData.fat,
          logged_at: new Date().toISOString()
        }
      ]);
      console.log('[FitSync Supabase] Synced meal log:', mealData.foodName);
    } catch (e) {
      console.warn('[FitSync Supabase] Meal sync error:', e);
    }
  }

  // Sync Progress Weight to Supabase
  async function syncWeightLog(weightKg) {
    if (!client) return;
    try {
      await client.from('progress_metrics').insert([
        {
          metric_name: 'weight',
          metric_value: parseFloat(weightKg),
          unit: 'kg',
          logged_at: new Date().toISOString()
        }
      ]);
      console.log('[FitSync Supabase] Synced weight metric:', weightKg, 'kg');
    } catch (e) {
      console.warn('[FitSync Supabase] Weight sync error:', e);
    }
  }

  // Sync Attendance to Supabase
  async function syncAttendance(gymName) {
    if (!client) return;
    try {
      await client.from('turnstile_attendance').insert([
        {
          turnstile_id: 'TS-KOTHRUD-01',
          method: 'qr_turnstile',
          checked_in_at: new Date().toISOString()
        }
      ]);
      console.log('[FitSync Supabase] Synced attendance check-in');
    } catch (e) {
      console.warn('[FitSync Supabase] Attendance sync error:', e);
    }
  }

  // Sync Biometric Assessment to Supabase
  async function syncAssessment(computed) {
    if (!client) return;
    try {
      await client.from('member_health_profiles').insert([
        {
          bmi: computed.bmi,
          bmr_kcal: computed.bmr,
          tdee_kcal: computed.tdee,
          target_calories: computed.targetCalories,
          target_protein_g: computed.targetProtein,
          target_carbs_g: computed.targetCarbs,
          target_fat_g: computed.targetFat,
          body_fat_pct: computed.bodyFatPct,
          updated_at: new Date().toISOString()
        }
      ]);
      console.log('[FitSync Supabase] Synced assessment profile');
    } catch (e) {
      console.warn('[FitSync Supabase] Assessment sync error:', e);
    }
  }

  // Wire UI Form Handlers
  function setupUI() {
    initClient();

    const form = document.getElementById('supabaseConfigForm');
    const testBtn = document.getElementById('btnTestSupabase');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('sbProjectUrl').value;
        const key = document.getElementById('sbAnonKey').value;

        saveCredentials(url, key);
        const testRes = await testConnection(url, key);

        if (testRes.success) {
          updateStatusBadge(true);
          window.showToast?.('Connected to Supabase PostgreSQL successfully!', 'success');
        } else {
          updateStatusBadge(false, 'Auth Error');
          window.showToast?.(`Supabase Error: ${testRes.message}`, 'error');
        }
      });
    }

    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        const url = document.getElementById('sbProjectUrl').value;
        const key = document.getElementById('sbAnonKey').value;

        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';

        const res = await testConnection(url, key);

        testBtn.disabled = false;
        testBtn.textContent = 'Test Connection';

        if (res.success) {
          updateStatusBadge(true);
          window.showToast?.(res.message, res.warning ? 'info' : 'success');
        } else {
          updateStatusBadge(false, 'Auth Failed');
          window.showToast?.(res.message, 'error');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', setupUI);

  // Expose global connector
  window.fitSyncSupabase = {
    getClient: () => client,
    testConnection,
    saveCredentials,
    syncWaterLog,
    syncMealLog,
    syncWeightLog,
    syncAttendance,
    syncAssessment,
    updateStatusBadge
  };
})();
