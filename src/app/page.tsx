'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  UserProfile,
  HealthAssessmentData, 
  ComputedMetrics, 
  Exercise, 
  ExerciseSet,
  PredefinedDietPlan,
  Gym
} from '@/types';
import { 
  getInitialState, 
  saveState, 
  AppState, 
  createCleanUserState, 
  createDemoState, 
  saveRegisteredUserRecord, 
  findRegisteredUser,
  AttendanceRecord 
} from '@/lib/store';
import { calculateHealthMetrics } from '@/lib/assessment-calculator';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import { BottomNav, MemberTab } from '@/components/BottomNav';
import { AuthScreen, AuthUserCredentials } from '@/components/AuthScreen';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';
import { RestTimerWidget } from '@/components/RestTimerWidget';
import { 
  Dumbbell, 
  Utensils, 
  HeartPulse, 
  Sparkles, 
  Droplet, 
  Flame, 
  CheckCircle2, 
  Activity, 
  Building2, 
  Plus, 
  ChevronRight,
  Zap,
  Info,
  Trash2,
  Minus,
  Scale,
  X
} from 'lucide-react';

export default function FitSyncApp() {
  const { showToast } = useToast();
  const [state, setState] = useState<AppState>(getInitialState);
  const [mounted, setMounted] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<MemberTab>('home');

  // Modals & Drawers
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<Exercise | null>(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);

  // Assessment Wizard Draft State
  const [draftAssessment, setDraftAssessment] = useState<HealthAssessmentData>(state.assessmentData);

  // New Meal Logging Draft State
  const [newMealType, setNewMealType] = useState('Lunch');
  const [newMealTitle, setNewMealTitle] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('550');
  const [newMealProtein, setNewMealProtein] = useState('40');
  const [newMealIngredients, setNewMealIngredients] = useState('');

  // Manual Exercise Addition State
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('Chest');
  const [newExEquipment, setNewExEquipment] = useState('Dumbbell');
  const [newExSets, setNewExSets] = useState('3');
  const [newExReps, setNewExReps] = useState('10');
  const [newExWeight, setNewExWeight] = useState('20.0 kg');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state changes to storage
  const updateState = (updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  if (!mounted) return null;

  // 1. If user is not logged in, render Auth Screen
  if (!state.isAuthenticated) {
    return (
      <AuthScreen
        gyms={state.gyms}
        onAuthenticate={(credentials: AuthUserCredentials) => {
          // A) BRAND NEW REGISTRATION: Create 100% clean state with ZERO predefined meals, 0 hydration, 0 volume
          if (credentials.isNewRegistration && credentials.registrationParams) {
            const cleanState = createCleanUserState(credentials.registrationParams);
            saveRegisteredUserRecord({
              email: credentials.email.toLowerCase(),
              name: credentials.name || credentials.registrationParams.fullName,
              password: credentials.password || credentials.registrationParams.password,
              gymId: credentials.registrationParams.gym.id,
              registeredAt: new Date().toISOString(),
              state: cleanState
            });
            setState(cleanState);
            saveState(cleanState);
            showToast(`Welcome to FitSync AI, ${credentials.name}! Your account has started with a clean slate. 🎉`, '🎉');
            return;
          }

          // B) DEMO ACCOUNT: Load Aarav Shah's populated demo state
          if (credentials.isDemo) {
            const demoState = createDemoState();
            setState(demoState);
            saveState(demoState);
            showToast('Welcome to Demo Mode, Aarav! Sample data loaded. 👋', '👋');
            return;
          }

          // C) EXISTING REGISTERED USER SIGN IN
          const found = findRegisteredUser(credentials.email);
          if (found) {
            const restoredState: AppState = {
              ...found.state,
              isAuthenticated: true
            };
            setState(restoredState);
            saveState(restoredState);
            showToast(`Welcome back, ${found.name}! 🏋️`, '👋');
            return;
          }

          // D) FALLBACK: If email entered directly in sign in without prior registration, initialize clean state
          const fallbackCleanState = createCleanUserState({
            fullName: credentials.name || 'Athlete',
            email: credentials.email,
            gym: credentials.gym || state.gyms[0],
            goal: 'Build Muscle'
          });
          setState(fallbackCleanState);
          saveState(fallbackCleanState);
          showToast(`Welcome, ${credentials.name || 'Athlete'}! Your profile is ready.`, '👋');
        }}
      />
    );
  }

  // 2. Member Dashboard Handlers & Dynamic Telemetry
  const totalCaloriesConsumed = (state.loggedMeals || []).reduce(
    (sum, m) => sum + (Number(m.calories) || 0),
    0
  );
  const calorieTarget = state.computedMetrics.calorieTarget || 2000;
  const caloriesRemaining = Math.max(0, calorieTarget - totalCaloriesConsumed);
  const caloriesPct = calorieTarget > 0 ? Math.min(100, Math.round((totalCaloriesConsumed / calorieTarget) * 100)) : 0;

  const totalProteinConsumed = (state.loggedMeals || []).reduce(
    (sum, m) => sum + (Number(m.protein) || 0),
    0
  );
  const proteinTarget = state.computedMetrics.proteinG || 140;
  const proteinRemaining = Math.max(0, proteinTarget - totalProteinConsumed);
  const proteinPct = proteinTarget > 0 ? Math.min(100, Math.round((totalProteinConsumed / proteinTarget) * 100)) : 0;

  const handleLogHydration = () => {
    haptics.playTap();
    updateState((prev) => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        waterLoggedMl: Math.min(
          prev.userProfile.waterTargetMl,
          (prev.userProfile.waterLoggedMl || 0) + 250
        )
      }
    }));
    showToast('Logged +250ml pure hydration! 💧', '💧');
  };

  const handleDeleteMeal = (mealId: string) => {
    haptics.playTap();
    updateState((prev) => ({
      ...prev,
      loggedMeals: (prev.loggedMeals || []).filter((m) => m.id !== mealId)
    }));
    showToast('Meal removed from log.', '🗑️');
  };

  const handleCheckInToday = () => {
    haptics.playSuccess();
    const today = new Date();
    const dayNum = today.getDate();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const records = state.attendanceRecords || [];
    const alreadyCheckedIn = records.some(
      (r) => r.date === dateStr || r.dayNumber === dayNum
    );

    if (alreadyCheckedIn) {
      showToast('You are already checked in for today! 🏋️', '✓');
      return;
    }

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      date: dateStr,
      dayNumber: dayNum,
      time: timeStr,
      gymId: state.selectedGym.id,
      gymName: state.selectedGym.name
    };

    updateState((prev) => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        streakDays: Math.max(1, (prev.userProfile.streakDays || 0) + 1)
      },
      attendanceRecords: [...(prev.attendanceRecords || []), newRecord]
    }));

    showToast(`Checked in to ${state.selectedGym.name}! Streak updated 🔥`, '📍');
  };

  const calculateExerciseVolume = (ex: Exercise) => {
    return ex.completedSets
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => {
        const w = parseFloat(s.weight.replace(/[^0-9.]/g, '')) || 0;
        return sum + (s.reps * w);
      }, 0);
  };

  const totalWorkoutVolume = state.activeWorkout.exercises.reduce(
    (sum, ex) => sum + calculateExerciseVolume(ex),
    0
  );

  const totalCompletedSets = state.activeWorkout.exercises.reduce(
    (sum, ex) => sum + ex.completedSets.filter((s) => s.status === 'completed').length,
    0
  );

  const totalSetsCount = state.activeWorkout.exercises.reduce(
    (sum, ex) => sum + ex.completedSets.length,
    0
  );

  const handleUpdateSet = (
    exerciseId: string,
    setNumber: number,
    field: 'reps' | 'weight',
    value: any
  ) => {
    updateState((prev) => {
      const updatedExercises = prev.activeWorkout.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = ex.completedSets.map((s) => {
          if (s.set === setNumber) {
            if (field === 'reps') {
              const repsVal = typeof value === 'number' ? value : parseInt(value) || 0;
              return { ...s, reps: Math.max(0, repsVal) };
            } else {
              return { ...s, weight: value };
            }
          }
          return s;
        });
        return { ...ex, completedSets: updatedSets };
      });
      return {
        ...prev,
        activeWorkout: { ...prev.activeWorkout, exercises: updatedExercises }
      };
    });
  };

  const handleStepWeight = (exerciseId: string, setNumber: number, deltaKg: number) => {
    haptics.playTap();
    updateState((prev) => {
      const updatedExercises = prev.activeWorkout.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = ex.completedSets.map((s) => {
          if (s.set === setNumber) {
            const currentWeightVal = parseFloat(s.weight.replace(/[^0-9.]/g, '')) || 0;
            const nextWeight = Math.max(0, currentWeightVal + deltaKg);
            return {
              ...s,
              weight: `${nextWeight % 1 === 0 ? nextWeight.toFixed(0) : nextWeight.toFixed(1)} kg`
            };
          }
          return s;
        });
        return { ...ex, completedSets: updatedSets };
      });
      return {
        ...prev,
        activeWorkout: { ...prev.activeWorkout, exercises: updatedExercises }
      };
    });
  };

  const handleToggleSetCompletion = (exerciseId: string, setNumber: number) => {
    haptics.playSuccess();
    updateState((prev) => {
      const updatedExercises = prev.activeWorkout.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = ex.completedSets.map((s) => {
          if (s.set === setNumber) {
            return {
              ...s,
              status: s.status === 'completed' ? ('pending' as const) : ('completed' as const)
            };
          }
          return s;
        });
        return { ...ex, completedSets: updatedSets };
      });
      return {
        ...prev,
        activeWorkout: { ...prev.activeWorkout, exercises: updatedExercises }
      };
    });
    showToast(`Set ${setNumber} status updated!`, '💪');
  };

  const handleAddSet = (exerciseId: string) => {
    haptics.playTap();
    updateState((prev) => {
      const updatedExercises = prev.activeWorkout.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.completedSets[ex.completedSets.length - 1];
        const newSetNumber = ex.completedSets.length + 1;
        const newSet: ExerciseSet = {
          set: newSetNumber,
          reps: lastSet ? lastSet.reps : 10,
          weight: lastSet ? lastSet.weight : ex.targetWeight,
          status: 'pending'
        };
        return {
          ...ex,
          targetSets: newSetNumber,
          completedSets: [...ex.completedSets, newSet]
        };
      });
      return {
        ...prev,
        activeWorkout: { ...prev.activeWorkout, exercises: updatedExercises }
      };
    });
    showToast('Added new set to log!', '➕');
  };

  const handleRemoveSet = (exerciseId: string, setNumber: number) => {
    haptics.playTap();
    updateState((prev) => {
      const updatedExercises = prev.activeWorkout.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const filtered = ex.completedSets.filter((s) => s.set !== setNumber);
        const reindexed: ExerciseSet[] = filtered.map((s, idx) => ({ ...s, set: idx + 1 }));
        return {
          ...ex,
          targetSets: reindexed.length,
          completedSets: reindexed
        };
      });
      return {
        ...prev,
        activeWorkout: { ...prev.activeWorkout, exercises: updatedExercises }
      };
    });
    showToast('Set removed.', '🗑️');
  };

  const handleDeleteExercise = (exerciseId: string) => {
    haptics.playTap();
    updateState((prev) => ({
      ...prev,
      activeWorkout: {
        ...prev.activeWorkout,
        exercises: prev.activeWorkout.exercises.filter((ex) => ex.id !== exerciseId)
      }
    }));
    showToast('Exercise removed from session.', '🗑️');
  };

  const handleAddNewExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;
    haptics.playSuccess();
    const setsCount = Math.max(1, parseInt(newExSets) || 3);
    const repsCount = Math.max(1, parseInt(newExReps) || 10);
    const formattedWeight = newExWeight.trim() 
      ? (newExWeight.toLowerCase().includes('kg') ? newExWeight : `${newExWeight} kg`) 
      : '20.0 kg';

    const createdSets: ExerciseSet[] = Array.from({ length: setsCount }, (_, i) => ({
      set: i + 1,
      reps: repsCount,
      weight: formattedWeight,
      status: 'pending'
    }));

    const newExercise: Exercise = {
      id: `ex_${Date.now()}`,
      name: newExName.trim(),
      muscle: newExMuscle,
      equipment: newExEquipment,
      thumbnail: '/assets/logo.jpg',
      targetSets: setsCount,
      targetReps: `${repsCount}`,
      targetWeight: formattedWeight,
      restSeconds: 90,
      completedSets: createdSets,
      instructions: [
        `Execute ${newExName.trim()} with strict form through full range of motion.`,
        'Keep core and stabilizer muscles firmly braced throughout the set.',
        'Control the lowering phase and drive smoothly through the concentric contraction.'
      ],
      commonMistakes: 'Using excessive momentum or cutting range of motion.',
      trainerTip: 'Focus on mind-muscle connection and deliberate breathing tempo.'
    };

    updateState((prev) => ({
      ...prev,
      activeWorkout: {
        ...prev.activeWorkout,
        exercises: [...prev.activeWorkout.exercises, newExercise]
      }
    }));

    setIsAddExerciseModalOpen(false);
    setNewExName('');
    showToast(`Added ${newExercise.name} to workout!`, '🏋️');
  };

  const handleSaveAssessment = () => {
    haptics.playSuccess();
    const newMetrics = calculateHealthMetrics(draftAssessment);
    updateState((prev) => ({
      ...prev,
      assessmentData: draftAssessment,
      computedMetrics: newMetrics
    }));
    setIsAssessmentModalOpen(false);
    showToast('Health Metrics calculated with Mifflin-St Jeor formula!', '📊');
  };

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealTitle.trim()) return;

    haptics.playSuccess();
    const meal = {
      id: `m_${Date.now()}`,
      type: newMealType,
      title: newMealTitle.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      calories: parseInt(newMealCalories) || 500,
      protein: parseInt(newMealProtein) || 35,
      carbs: 55,
      fat: 15,
      ingredients: newMealIngredients.trim() || 'Custom athletic meal'
    };

    updateState((prev) => ({
      ...prev,
      loggedMeals: [meal, ...prev.loggedMeals]
    }));
    showToast(`Logged ${meal.title} successfully!`, '🍽️');
    setNewMealTitle('');
    setNewMealIngredients('');
  };

  const handleLogout = () => {
    haptics.playTap();
    updateState((prev) => ({
      ...prev,
      isAuthenticated: false
    }));
    showToast('Signed out successfully.', '👋');
  };

  return (
    <div className="min-h-screen bg-canvas-base text-gray-100 flex flex-col pb-20 lg:pb-8">
      
      {/* 1. Global Navigation Bar */}
      <Navbar
        userProfile={state.userProfile}
        unreadNotificationsCount={state.notifications.filter((n) => !n.isRead).length}
        onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className="space-y-6">

          {/* Sub-Tabs Selector */}
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              {(['home', 'workout', 'nutrition', 'profile'] as MemberTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    haptics.playTap();
                    setActiveTab(tab);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                      : 'bg-surface-2 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Assessment Re-evaluation Button */}
            <button
              onClick={() => {
                haptics.playTap();
                setDraftAssessment(state.assessmentData);
                setIsAssessmentModalOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-healthcare-accent border border-healthcare-primary/30 transition"
            >
              <Activity className="w-3.5 h-3.5 text-healthcare-primary" />
              <span>Health Assessment (BMR/TDEE)</span>
            </button>
          </div>

          {/* ---------------- TAB 1: HOME DASHBOARD ---------------- */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Hero Greeting Card */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30">
                        {state.selectedGym.name}
                      </span>
                      <span className="text-xs text-gray-400">{state.userProfile.membershipTier || 'Member'}</span>
                    </div>
                    <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-white">
                      Good Morning, {state.userProfile.fullName.split(' ')[0]}
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 max-w-lg">
                      Goal: <span className="text-white font-semibold">{state.assessmentData.goal}</span> • Daily Target: <span className="text-fitness-primary font-bold">{state.computedMetrics.calorieTarget} kcal</span> ({state.computedMetrics.recommendation})
                    </p>
                  </div>

                  {/* Streak & Score Widget */}
                  <div className="flex items-center gap-3">
                    <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-center min-w-[90px]">
                      <div className="flex items-center justify-center gap-1 text-status-warning font-bold text-lg">
                        <Flame className="w-5 h-5 fill-status-warning" />
                        <span>{state.userProfile.streakDays}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Day Streak</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-2 border border-healthcare-primary/30 text-center min-w-[90px]">
                      <div className="text-healthcare-accent font-bold text-lg font-mono">
                        {state.computedMetrics.fitnessScore}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Fitness Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Calories Progress Card */}
                <div className="p-5 rounded-2xl bg-surface-1 border border-surface-border space-y-3">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                      <Zap className="w-4 h-4 text-fitness-primary" /> Daily Energy
                    </span>
                    <span className="font-mono">{calorieTarget.toLocaleString()} kcal target</span>
                  </div>
                  <div className="text-2xl font-headline font-extrabold text-white">
                    {totalCaloriesConsumed.toLocaleString()} <span className="text-xs font-normal text-gray-400">/ {calorieTarget.toLocaleString()} kcal</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full bg-fitness-primary rounded-full transition-all duration-300" style={{ width: `${caloriesPct}%` }} />
                  </div>
                  <div className="text-[11px] text-gray-400 flex justify-between">
                    <span>Remaining: {caloriesRemaining.toLocaleString()} kcal</span>
                    <span className="text-fitness-primary font-semibold">{caloriesPct}% Hit</span>
                  </div>
                </div>

                {/* Protein Progress Card */}
                <div className="p-5 rounded-2xl bg-surface-1 border border-surface-border space-y-3">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                      <Dumbbell className="w-4 h-4 text-healthcare-accent" /> Protein Intake
                    </span>
                    <span className="font-mono">2.1g / kg target</span>
                  </div>
                  <div className="text-2xl font-headline font-extrabold text-white">
                    {totalProteinConsumed.toLocaleString()} <span className="text-xs font-normal text-gray-400">/ {proteinTarget.toLocaleString()}g</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full bg-healthcare-primary rounded-full transition-all duration-300" style={{ width: `${proteinPct}%` }} />
                  </div>
                  <div className="text-[11px] text-gray-400 flex justify-between">
                    <span>Remaining: {proteinRemaining.toLocaleString()}g</span>
                    <span className="text-healthcare-accent font-semibold">{proteinPct}% Hit</span>
                  </div>
                </div>

                {/* Interactive Hydration Logger */}
                <div className="p-5 rounded-2xl bg-surface-1 border border-surface-border space-y-3">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                      <Droplet className="w-4 h-4 text-cyan-400" /> Hydration
                    </span>
                    <span className="font-mono">{state.userProfile.waterTargetMl} ml</span>
                  </div>
                  <div className="text-2xl font-headline font-extrabold text-white">
                    {state.userProfile.waterLoggedMl || 0} <span className="text-xs font-normal text-gray-400">/ {state.userProfile.waterTargetMl} ml</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (((state.userProfile.waterLoggedMl || 0) / (state.userProfile.waterTargetMl || 3000)) * 100))}%` }} />
                  </div>
                  <button
                    onClick={handleLogHydration}
                    className="w-full py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log +250ml Water
                  </button>
                </div>

                {/* Active Goal & Branch Card */}
                <div className="p-5 rounded-2xl bg-surface-1 border border-surface-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-fitness-primary mb-2">
                      <Building2 className="w-4 h-4" /> Home Branch Active
                    </div>
                    <div className="text-xs text-gray-300">
                      Gym: <span className="font-bold text-white">{state.selectedGym.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      {state.selectedGym.location}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[11px] text-gray-400">
                    <span>Attendance Rate</span>
                    <span className="text-fitness-primary font-bold">{state.selectedGym.attendanceRate}</span>
                  </div>
                </div>

              </div>

              {/* Hero Workout Card */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-fitness-primary/15 text-fitness-primary border border-fitness-primary/30">
                      <Dumbbell className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-headline font-bold text-white text-lg">Today&apos;s Workout Routine</h3>
                      <p className="text-xs text-gray-400">{state.activeWorkout.title} • {state.activeWorkout.focus}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                    {state.activeWorkout.duration} • {state.activeWorkout.exercises.length} Exercises • {totalCompletedSets}/{totalSetsCount} Sets Done
                  </span>
                </div>

                {/* Exercises Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {state.activeWorkout.exercises.slice(0, 4).map((ex) => (
                    <div
                      key={ex.id}
                      onClick={() => setSelectedExerciseForModal(ex)}
                      className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border hover:border-fitness-primary/40 cursor-pointer transition flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-white/10 flex-shrink-0">
                        <Image src={ex.thumbnail} alt={ex.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{ex.name}</div>
                        <div className="text-[11px] text-gray-400">{ex.targetSets} sets × {ex.targetReps} reps</div>
                        <div className="text-[10px] text-fitness-primary font-mono">{ex.targetWeight}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Target Difficulty: <span className="text-white font-semibold">{state.activeWorkout.difficulty}</span>
                  </div>
                  <button
                    onClick={() => {
                      haptics.playTap();
                      setActiveTab('workout');
                    }}
                    className="px-5 py-2.5 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center gap-1.5"
                  >
                    <span>Open Workout Session</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ---------------- TAB 2: WORKOUT ---------------- */}
          {activeTab === 'workout' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Workout Top Bar */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-fitness-primary uppercase tracking-wider">
                        Active Training Session
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-fitness-primary/10 text-fitness-primary border border-fitness-primary/25 font-semibold">
                        Manual Logging Enabled
                      </span>
                    </div>
                    <h2 className="font-headline font-extrabold text-2xl text-white mt-1">
                      {state.activeWorkout.title}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      {state.activeWorkout.focus} • {state.activeWorkout.difficulty}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsAddExerciseModalOpen(true)}
                      className="px-4 py-2 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Exercise</span>
                    </button>
                    <RestTimerWidget initialSeconds={90} />
                  </div>
                </div>

                {/* Session Telemetry & Progress Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border">
                    <div className="text-[11px] text-gray-400">Total Volume Moved</div>
                    <div className="text-xl font-headline font-extrabold text-fitness-primary mt-0.5">
                      {totalWorkoutVolume.toLocaleString()} <span className="text-xs font-normal text-gray-400">kg</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Sum of completed sets × reps × weight</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border">
                    <div className="text-[11px] text-gray-400">Sets Completed</div>
                    <div className="text-xl font-headline font-extrabold text-white mt-0.5">
                      {totalCompletedSets} <span className="text-xs font-normal text-gray-400">/ {totalSetsCount} sets</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-1 mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-fitness-primary rounded-full transition-all duration-300"
                        style={{ width: `${totalSetsCount > 0 ? (totalCompletedSets / totalSetsCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border">
                    <div className="text-[11px] text-gray-400">Target Routine</div>
                    <div className="text-xl font-headline font-extrabold text-white mt-0.5">
                      {state.activeWorkout.exercises.length} <span className="text-xs font-normal text-gray-400">Exercises</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Estimated Duration: {state.activeWorkout.duration}</div>
                  </div>
                </div>
              </div>

              {/* Exercises List & Set Logger */}
              <div className="space-y-4">
                {state.activeWorkout.exercises.map((ex) => (
                  <div key={ex.id} className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                    
                    {/* Exercise Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden relative border border-white/10 flex-shrink-0">
                          <Image src={ex.thumbnail} alt={ex.name} fill className="object-cover" />
                        </div>
                        <div>
                          <h3 className="font-headline font-bold text-white text-base">{ex.name}</h3>
                          <div className="text-xs text-gray-400">{ex.muscle} • {ex.equipment}</div>
                          <div className="text-[11px] text-fitness-primary font-semibold mt-0.5">
                            Target: {ex.targetSets} sets × {ex.targetReps} reps @ {ex.targetWeight}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedExerciseForModal(ex)}
                          className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-gray-300 border border-surface-border transition flex items-center gap-1"
                        >
                          <Info className="w-3.5 h-3.5 text-fitness-primary" />
                          <span>Exercise Guide</span>
                        </button>
                        {state.activeWorkout.exercises.length > 1 && (
                          <button
                            onClick={() => handleDeleteExercise(ex.id)}
                            className="p-1.5 rounded-xl bg-surface-2 hover:bg-red-500/15 text-gray-400 hover:text-red-400 border border-surface-border transition"
                            title="Remove exercise from today's workout"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Set-by-Set Logging Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead>
                          <tr className="border-b border-surface-border text-gray-400 font-medium">
                            <th className="pb-2 pl-2 w-20">Set</th>
                            <th className="pb-2 w-44">Reps</th>
                            <th className="pb-2 w-48">Weight</th>
                            <th className="pb-2 text-right pr-2">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {ex.completedSets.map((s) => (
                            <tr key={s.set} className="hover:bg-white/[0.02] transition">
                              
                              {/* Set Label */}
                              <td className="py-2.5 pl-2 font-mono font-bold text-white">
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-surface-2 border border-surface-border text-xs">
                                  Set {s.set}
                                </span>
                              </td>

                              {/* Reps Stepper */}
                              <td className="py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSet(ex.id, s.set, 'reps', Math.max(1, s.reps - 1))}
                                    className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-surface-3 text-gray-300 hover:text-white flex items-center justify-center border border-surface-border transition active:scale-95"
                                    title="Decrease Reps"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    max="200"
                                    value={s.reps}
                                    onChange={(e) => handleUpdateSet(ex.id, s.set, 'reps', parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-surface-2 border border-surface-border rounded-lg text-white focus:outline-none focus:border-fitness-primary transition"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSet(ex.id, s.set, 'reps', s.reps + 1)}
                                    className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-surface-3 text-gray-300 hover:text-white flex items-center justify-center border border-surface-border transition active:scale-95"
                                    title="Increase Reps"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <span className="text-[11px] text-gray-400">reps</span>
                                </div>
                              </td>

                              {/* Weight Stepper */}
                              <td className="py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStepWeight(ex.id, s.set, -2.5)}
                                    className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-surface-3 text-gray-300 hover:text-white flex items-center justify-center border border-surface-border transition active:scale-95 text-xs font-bold"
                                    title="Decrease Weight (-2.5 kg)"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="text"
                                    value={s.weight}
                                    onChange={(e) => handleUpdateSet(ex.id, s.set, 'weight', e.target.value)}
                                    className="w-24 px-2 py-1 text-center font-mono font-bold text-xs bg-surface-2 border border-surface-border rounded-lg text-fitness-primary focus:outline-none focus:border-fitness-primary transition"
                                    placeholder="0 kg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleStepWeight(ex.id, s.set, 2.5)}
                                    className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-surface-3 text-gray-300 hover:text-white flex items-center justify-center border border-surface-border transition active:scale-95 text-xs font-bold"
                                    title="Increase Weight (+2.5 kg)"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              {/* Action Button */}
                              <td className="py-2.5 text-right pr-2">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleToggleSetCompletion(ex.id, s.set)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                      s.status === 'completed'
                                        ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                                        : 'bg-surface-2 text-gray-400 hover:text-white border border-surface-border'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{s.status === 'completed' ? 'Done' : 'Mark Done'}</span>
                                  </button>
                                  {ex.completedSets.length > 1 && (
                                    <button
                                      onClick={() => handleRemoveSet(ex.id, s.set)}
                                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                      title="Remove this set"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Exercise Card Footer */}
                    <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-surface-border/60">
                      <button
                        onClick={() => handleAddSet(ex.id)}
                        className="px-3.5 py-1.5 rounded-xl border border-dashed border-fitness-primary/50 text-fitness-primary hover:bg-fitness-primary/10 text-xs font-semibold flex items-center gap-1.5 transition self-start"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Set {ex.completedSets.length + 1}</span>
                      </button>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Sets: <strong className="text-white">{ex.completedSets.filter(s => s.status === 'completed').length} / {ex.completedSets.length}</strong></span>
                        <span>Volume: <strong className="font-mono text-fitness-primary">{calculateExerciseVolume(ex).toLocaleString()} kg</strong></span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ---------------- TAB 3: NUTRITION ---------------- */}
          {activeTab === 'nutrition' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Daily Caloric Target Summary */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-fitness-primary uppercase tracking-wider">
                      Macro Engine & Energy
                    </span>
                    <h2 className="font-headline font-bold text-2xl text-white mt-0.5">
                      Daily Caloric Target: {state.computedMetrics.calorieTarget} kcal
                    </h2>
                    <p className="text-xs text-gray-400">
                      Calculated for <strong className="text-white">{state.assessmentData.goal}</strong> using Mifflin-St Jeor formula
                    </p>
                  </div>
                  <div className="text-right sm:text-left">
                    <span className="text-xs bg-surface-2 px-3 py-1 rounded-full border border-surface-border text-gray-300">
                      Active: <strong className="text-white">{state.activeDietPlan.title}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-center">
                    <div className="text-xs text-gray-400">Calories</div>
                    <div className="font-headline font-bold text-xl text-white mt-1">{state.computedMetrics.calorieTarget}</div>
                    <div className="text-[10px] text-fitness-primary">Daily Budget</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-center">
                    <div className="text-xs text-gray-400">Protein Target</div>
                    <div className="font-headline font-bold text-xl text-healthcare-accent mt-1">{state.computedMetrics.proteinG}g</div>
                    <div className="text-[10px] text-gray-400">2.1g / kg bodyweight</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-center">
                    <div className="text-xs text-gray-400">Carbohydrates</div>
                    <div className="font-headline font-bold text-xl text-amber-300 mt-1">{state.computedMetrics.carbsG}g</div>
                    <div className="text-[10px] text-gray-400">Glycogen Replenish</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-center">
                    <div className="text-xs text-gray-400">Healthy Fats</div>
                    <div className="font-headline font-bold text-xl text-purple-300 mt-1">{state.computedMetrics.fatG}g</div>
                    <div className="text-[10px] text-gray-400">Hormonal Support</div>
                  </div>
                </div>
              </div>

              {/* Log Athletic Meal Form */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                <h3 className="font-headline font-bold text-white text-lg flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-fitness-primary" /> Log Athletic Meal
                </h3>
                <form onSubmit={handleAddMeal} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Meal Type</label>
                    <select
                      value={newMealType}
                      onChange={(e) => setNewMealType(e.target.value)}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack / Pre-Workout">Snack / Pre-Workout</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-gray-400">Meal Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Grilled Chicken, Brown Rice & Broccoli"
                      value={newMealTitle}
                      onChange={(e) => setNewMealTitle(e.target.value)}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Calories (kcal)</label>
                    <input
                      type="number"
                      value={newMealCalories}
                      onChange={(e) => setNewMealCalories(e.target.value)}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Protein (grams)</label>
                    <input
                      type="number"
                      value={newMealProtein}
                      onChange={(e) => setNewMealProtein(e.target.value)}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1 flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold rounded-xl text-xs shadow-glow-fitness transition"
                    >
                      + Save Meal Entry
                    </button>
                  </div>
                </form>
              </div>

              {/* Logged Meals List */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline font-bold text-white text-lg">Today&apos;s Recorded Meals</h3>
                  <span className="text-xs text-gray-400 font-mono">
                    {state.loggedMeals.length} {state.loggedMeals.length === 1 ? 'entry' : 'entries'} • {totalCaloriesConsumed} kcal total
                  </span>
                </div>

                {state.loggedMeals.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-surface-2/60 border border-dashed border-surface-border space-y-2">
                    <Utensils className="w-8 h-8 text-gray-500 mx-auto" />
                    <div className="text-xs font-bold text-gray-300">No Meals Logged Yet Today</div>
                    <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                      Use the &quot;Log Athletic Meal&quot; form above to record your breakfast, lunch, or post-workout nutrition.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {state.loggedMeals.map((meal) => (
                      <div key={meal.id} className="p-4 rounded-2xl bg-surface-2 border border-surface-border flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{meal.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-3 text-gray-300 font-mono">
                              {meal.type} • {meal.time}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1">{meal.ingredients}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-bold font-mono text-fitness-primary">{meal.calories} kcal</div>
                            <div className="text-[11px] text-healthcare-accent">{meal.protein}g Protein</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete this meal log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ---------------- TAB 4: PROFILE & BIOMETRICS ---------------- */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Profile Summary Card */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-3xl overflow-hidden relative border-2 border-fitness-primary shadow-glow-fitness flex-shrink-0 flex items-center justify-center bg-surface-2">
                  {state.userProfile.avatarUrl ? (
                    <Image src={state.userProfile.avatarUrl} alt={state.userProfile.fullName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-fitness-primary to-healthcare-accent flex items-center justify-center text-gray-950 font-extrabold text-2xl font-headline select-none">
                      {state.userProfile.fullName ? state.userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left">
                  <h2 className="font-headline font-extrabold text-2xl text-white">{state.userProfile.fullName}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {state.assessmentData.age} Years • {state.assessmentData.heightCm} cm • {state.assessmentData.weightKg} kg • {state.selectedGym.name}
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                    <span className="text-xs bg-surface-2 px-3 py-1 rounded-full border border-surface-border">
                      Goal: <strong className="text-white">{state.assessmentData.goal}</strong>
                    </span>
                    <span className="text-xs bg-surface-2 px-3 py-1 rounded-full border border-surface-border">
                      Tier: <strong className="text-fitness-primary">{state.userProfile.membershipTier || 'Platinum Elite'}</strong>
                    </span>
                    <span className="text-xs bg-surface-2 px-3 py-1 rounded-full border border-surface-border">
                      Streak: <strong className="text-status-warning">{state.userProfile.streakDays} Days 🔥</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Biometrics Engine Summary */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline font-bold text-white text-lg">Biometric Health Calculations</h3>
                    <p className="text-xs text-gray-400">Computed using Mifflin-St Jeor & U.S. Navy Body Fat Model</p>
                  </div>
                  <button
                    onClick={() => {
                      setDraftAssessment(state.assessmentData);
                      setIsAssessmentModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-fitness-primary text-gray-950 font-bold text-xs shadow-glow-fitness"
                  >
                    Update Assessment
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-center">
                    <div className="text-xs text-gray-400">BMI</div>
                    <div className="font-headline font-bold text-lg text-white mt-1">{state.computedMetrics.bmi}</div>
                    <div className="text-[10px] text-fitness-primary font-semibold">{state.computedMetrics.bmiCategory}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-center">
                    <div className="text-xs text-gray-400">BMR</div>
                    <div className="font-headline font-bold text-lg text-white mt-1">{state.computedMetrics.bmr} kcal</div>
                    <div className="text-[10px] text-gray-400">Basal Rest Metabolic</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-center">
                    <div className="text-xs text-gray-400">TDEE</div>
                    <div className="font-headline font-bold text-lg text-white mt-1">{state.computedMetrics.tdee} kcal</div>
                    <div className="text-[10px] text-gray-400">Daily Total Expenditure</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-center">
                    <div className="text-xs text-gray-400">Body Fat Est.</div>
                    <div className="font-headline font-bold text-lg text-white mt-1">{state.computedMetrics.bodyFatEst}</div>
                    <div className="text-[10px] text-healthcare-accent">Navy Model</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface-2 border border-white/5 flex items-start gap-2.5 text-xs text-gray-400">
                  <Info className="w-4 h-4 text-healthcare-primary flex-shrink-0 mt-0.5" />
                  <span>Athletic wellness calculations. Mifflin-St Jeor formula calculates resting metabolic rate adjusted by activity level and training goals.</span>
                </div>
              </div>

              {/* Monthly Turnstile Attendance Heatmap */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-headline font-bold text-white text-lg">Gym Attendance & Check-Ins</h3>
                    <p className="text-xs text-gray-400">Turnstile check-in telemetry at {state.selectedGym.name}</p>
                  </div>

                  {/* Real Interactive Check In Button */}
                  <button
                    onClick={handleCheckInToday}
                    className="px-4 py-2 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check In to Gym Today</span>
                  </button>
                </div>

                {/* Attendance Metric Bar */}
                <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-surface-border">
                  <span>
                    <strong className="text-white">{(state.attendanceRecords || []).length}</strong> Check-ins this month
                    {new Date().getDate() > 0 && ` (${Math.min(100, Math.round(((state.attendanceRecords || []).length / new Date().getDate()) * 100))}% consistency)`}
                  </span>
                  <span className="text-fitness-primary font-bold">{state.selectedGym.name}</span>
                </div>

                {/* Monthly Heatmap Grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const dayNum = i + 1;
                    const isVisited = (state.attendanceRecords || []).some((r) => r.dayNumber === dayNum);
                    return (
                      <div
                        key={i}
                        className={`h-9 rounded-xl flex items-center justify-center text-xs font-mono font-semibold transition ${
                          isVisited
                            ? 'bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/50 shadow-glow-fitness'
                            : 'bg-surface-2 text-gray-600 border border-surface-border'
                        }`}
                        title={isVisited ? `Checked in on Day ${dayNum}` : `Day ${dayNum} - No check-in`}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* 3. Floating Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 4. Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={selectedExerciseForModal}
        onClose={() => setSelectedExerciseForModal(null)}
      />

      {/* 5. Health Assessment Re-evaluation Wizard Modal */}
      {isAssessmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-2 border border-surface-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
              <div>
                <h3 className="font-headline font-bold text-white text-lg">Health Assessment</h3>
                <p className="text-xs text-gray-400">Mifflin-St Jeor BMR & Athletic Energy Engine</p>
              </div>
              <button onClick={() => setIsAssessmentModalOpen(false)} className="text-gray-400 hover:text-white text-xs">Cancel</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Age</label>
                  <input
                    type="number"
                    value={draftAssessment.age}
                    onChange={(e) => setDraftAssessment({ ...draftAssessment, age: parseInt(e.target.value) || 20 })}
                    className="w-full bg-surface-1 border border-surface-border rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={draftAssessment.weightKg}
                    onChange={(e) => setDraftAssessment({ ...draftAssessment, weightKg: parseFloat(e.target.value) || 70 })}
                    className="w-full bg-surface-1 border border-surface-border rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={draftAssessment.heightCm}
                    onChange={(e) => setDraftAssessment({ ...draftAssessment, heightCm: parseFloat(e.target.value) || 175 })}
                    className="w-full bg-surface-1 border border-surface-border rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Primary Goal</label>
                  <select
                    value={draftAssessment.goal}
                    onChange={(e) => setDraftAssessment({ ...draftAssessment, goal: e.target.value as any })}
                    className="w-full bg-surface-1 border border-surface-border rounded-xl p-2.5 text-white"
                  >
                    <option value="Build Muscle">Build Muscle (+250 kcal surplus)</option>
                    <option value="Lose Weight">Lose Weight (-500 kcal deficit)</option>
                    <option value="Increase Strength">Increase Strength</option>
                    <option value="General Fitness">General Fitness</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Activity Level</label>
                <select
                  value={draftAssessment.activity}
                  onChange={(e) => setDraftAssessment({ ...draftAssessment, activity: e.target.value as any })}
                  className="w-full bg-surface-1 border border-surface-border rounded-xl p-2.5 text-white"
                >
                  <option value="Sedentary">Sedentary (1.2× BMR)</option>
                  <option value="Lightly Active">Lightly Active (1.375× BMR)</option>
                  <option value="Moderately Active">Moderately Active (1.55× BMR)</option>
                  <option value="Very Active">Very Active (1.725× BMR)</option>
                </select>
              </div>

              <button
                onClick={handleSaveAssessment}
                className="w-full py-3 bg-fitness-primary text-gray-950 font-bold rounded-xl text-xs shadow-glow-fitness mt-2"
              >
                Compute & Update Biometrics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add Custom Exercise Modal */}
      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-2 border border-surface-border w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-fitness-primary/15 text-fitness-primary border border-fitness-primary/30">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-white text-base">Add Exercise</h3>
                  <p className="text-[11px] text-gray-400">Log custom exercises to today&apos;s workout</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddExerciseModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400">Popular Suggestions</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Incline Dumbbell Press', muscle: 'Chest', eq: 'Dumbbell' },
                  { name: 'Lat Pulldown', muscle: 'Back', eq: 'Cable' },
                  { name: 'Dumbbell Lateral Raise', muscle: 'Shoulders', eq: 'Dumbbell' },
                  { name: 'Leg Press', muscle: 'Legs', eq: 'Machine' },
                  { name: 'Cable Bicep Curls', muscle: 'Arms', eq: 'Cable' },
                  { name: 'Hanging Leg Raises', muscle: 'Core', eq: 'Bodyweight' }
                ].map((sugg) => (
                  <button
                    key={sugg.name}
                    type="button"
                    onClick={() => {
                      setNewExName(sugg.name);
                      setNewExMuscle(sugg.muscle);
                      setNewExEquipment(sugg.eq);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-surface-1 hover:bg-surface-3 border border-surface-border text-[11px] text-gray-300 hover:text-fitness-primary transition"
                  >
                    + {sugg.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddNewExercise} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Exercise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overhead Dumbbell Tricep Extension"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-1 border border-surface-border text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Target Muscle</label>
                  <select
                    value={newExMuscle}
                    onChange={(e) => setNewExMuscle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-surface-border text-xs text-white focus:outline-none focus:border-fitness-primary"
                  >
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Legs">Legs</option>
                    <option value="Arms">Arms</option>
                    <option value="Core">Core</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Equipment</label>
                  <select
                    value={newExEquipment}
                    onChange={(e) => setNewExEquipment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-surface-border text-xs text-white focus:outline-none focus:border-fitness-primary"
                  >
                    <option value="Barbell">Barbell</option>
                    <option value="Dumbbell">Dumbbell</option>
                    <option value="Cable">Cable</option>
                    <option value="Machine">Machine</option>
                    <option value="Bodyweight">Bodyweight</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Sets</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newExSets}
                    onChange={(e) => setNewExSets(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-surface-border text-xs text-white focus:outline-none focus:border-fitness-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Reps/Set</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newExReps}
                    onChange={(e) => setNewExReps(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-surface-border text-xs text-white focus:outline-none focus:border-fitness-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Weight</label>
                  <input
                    type="text"
                    required
                    placeholder="25.0 kg"
                    value={newExWeight}
                    onChange={(e) => setNewExWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-surface-border text-xs text-white focus:outline-none focus:border-fitness-primary"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddExerciseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-1 hover:bg-surface-3 border border-surface-border text-xs font-semibold text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition"
                >
                  Add to Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Notifications Drawer */}
      {isNotificationsDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-surface-2 border-l border-surface-border shadow-2xl p-5 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
            <h3 className="font-headline font-bold text-white text-base">Notifications</h3>
            <button onClick={() => setIsNotificationsDrawerOpen(false)} className="text-gray-400 hover:text-white text-xs">Close</button>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1">
            {state.notifications.map((n) => (
              <div key={n.id} className="p-3.5 rounded-2xl bg-surface-1 border border-surface-border space-y-1 text-xs">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>{n.title}</span>
                  <span className="text-[10px] text-gray-400 font-normal">{n.time}</span>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
