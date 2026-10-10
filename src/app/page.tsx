'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  UserRole, 
  HealthAssessmentData, 
  ComputedMetrics, 
  Exercise, 
  Appointment, 
  HealthReport,
  PredefinedDietPlan
} from '@/types';
import { getInitialState, saveState, AppState } from '@/lib/store';
import { calculateHealthMetrics } from '@/lib/assessment-calculator';
import { haptics } from '@/lib/audio-haptics';
import { useToast } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import { BottomNav, MemberTab } from '@/components/BottomNav';
import { FloatingAiAssistant } from '@/components/FloatingAiAssistant';
import { TelehealthVideoRoom } from '@/components/TelehealthVideoRoom';
import { AppointmentBookingModal } from '@/components/AppointmentBookingModal';
import { HealthReportsModal } from '@/components/HealthReportsModal';
import { FoodSafetyModal } from '@/components/FoodSafetyModal';
import { ExerciseDetailModal } from '@/components/ExerciseDetailModal';
import { RestTimerWidget } from '@/components/RestTimerWidget';
import { 
  Dumbbell, 
  Utensils, 
  HeartPulse, 
  Sparkles, 
  Droplet, 
  Flame, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  Lock, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Activity, 
  Building2, 
  TrendingUp, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  Award,
  Zap,
  Info
} from 'lucide-react';

export default function FitSyncApp() {
  const { showToast } = useToast();
  const [state, setState] = useState<AppState>(getInitialState);
  const [mounted, setMounted] = useState(false);

  // Active Navigation
  const [currentRole, setCurrentRole] = useState<UserRole>('member');
  const [activeMemberTab, setActiveMemberTab] = useState<MemberTab>('home');

  // Modals & Drawers
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isVideoRoomOpen, setIsVideoRoomOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isFoodSafetyOpen, setIsFoodSafetyOpen] = useState(false);
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<Exercise | null>(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);

  // Active Telehealth Video Partner
  const [activeVideoSession, setActiveVideoSession] = useState<{
    name: string;
    role: string;
    avatar: string;
    agenda: string;
  }>({
    name: 'Dr. Ramesh Sharma',
    role: 'Consultant Physiotherapist',
    avatar: '/assets/physio_sharma.jpg',
    agenda: 'Shoulder Impingement & Kinetic Motion Analysis'
  });

  // Assessment Wizard Draft State
  const [assessmentStep, setAssessmentStep] = useState(1);
  const [draftAssessment, setDraftAssessment] = useState<HealthAssessmentData>(state.assessmentData);

  // New Meal Logging Draft State
  const [newMealType, setNewMealType] = useState('Lunch');
  const [newMealTitle, setNewMealTitle] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('550');
  const [newMealProtein, setNewMealProtein] = useState('40');
  const [newMealIngredients, setNewMealIngredients] = useState('');

  // New Reaction Draft State
  const [reactionFood, setReactionFood] = useState('');
  const [reactionSymptom, setReactionSymptom] = useState('Abdominal Bloating');
  const [reactionSeverity, setReactionSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');

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

  // Handlers for Member Features
  const handleLogHydration = () => {
    haptics.playTap();
    updateState((prev) => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        waterLoggedMl: Math.min(prev.userProfile.waterTargetMl, prev.userProfile.waterLoggedMl + 250)
      }
    }));
    showToast('Logged +250ml pure hydration! 💧', '💧');
  };

  const handleToggleSetCompletion = (exerciseId: string, setNumber: number) => {
    haptics.playTap();
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
    showToast(`Set ${setNumber} toggled!`, '💪');
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
    showToast('Health Assessment recalculated with Mifflin-St Jeor formulas!', '📊');
  };

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealTitle.trim()) return;

    // Check allergen conflict
    const lower = (newMealTitle + ' ' + newMealIngredients).toLowerCase();
    const hasPeanut = lower.includes('peanut');
    if (hasPeanut && state.assessmentData.allergies.includes('Peanuts')) {
      haptics.playTap();
      setIsFoodSafetyOpen(true);
      return;
    }

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

  const handleAddFoodReaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reactionFood.trim()) return;

    haptics.playTap();
    const existingCount = state.foodReactionLogs.filter((r) => r.food.toLowerCase() === reactionFood.toLowerCase()).length + 1;
    const isPattern = existingCount >= 3;

    const newLog = {
      id: `fr_${Date.now()}`,
      food: reactionFood.trim(),
      consumedAt: 'Just now',
      reaction: reactionSymptom,
      severity: reactionSeverity,
      recurrenceCount: existingCount,
      notes: `Reported ${reactionSymptom} after consuming ${reactionFood}.`,
      patternDetected: isPattern,
      aiObservation: isPattern
        ? `Recurrence Pattern: You have logged ${reactionSymptom} across ${existingCount} separate entries for ${reactionFood}. Consider lactose-free or hypoallergenic substitutions.`
        : undefined,
      disclaimer: 'Automated pattern observation. Non-diagnostic.'
    };

    updateState((prev) => ({
      ...prev,
      foodReactionLogs: [newLog, ...prev.foodReactionLogs]
    }));
    showToast('Food reaction symptom recorded.', '🛡️');
    setReactionFood('');
  };

  const handleStartTelehealth = (providerName: string, role: string, avatar: string, agenda: string) => {
    haptics.playTap();
    setActiveVideoSession({ name: providerName, role, avatar, agenda });
    setIsVideoRoomOpen(true);
  };

  return (
    <div className="min-h-screen bg-canvas-base text-gray-100 flex flex-col pb-20 lg:pb-8">
      
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={(r) => {
          setCurrentRole(r);
          showToast(`Switched portal view to ${r.replace('_', ' ')}`, '🔄');
        }}
        unreadNotificationsCount={state.notifications.filter((n) => !n.isRead).length}
        onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">

        {/* =========================================================================
            ROLE: MEMBER VIEW
           ========================================================================= */}
        {currentRole === 'member' && (
          <div className="space-y-6">

            {/* Sub-Tabs Selector for Member */}
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                {(['home', 'workout', 'nutrition', 'health', 'profile'] as MemberTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      haptics.playTap();
                      setActiveMemberTab(tab);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                      activeMemberTab === tab
                        ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                        : 'bg-surface-2 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab === 'health' ? 'Health Hub' : tab}
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

            {/* ---------------- MEMBER TAB: HOME ---------------- */}
            {activeMemberTab === 'home' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Hero Greeting Card */}
                <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30">
                          {state.selectedGym.name}
                        </span>
                        <span className="text-xs text-gray-400">Platinum Elite Member</span>
                      </div>
                      <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-white">
                        Good Morning, Aarav
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
                      <span className="font-mono">{state.computedMetrics.calorieTarget} kcal target</span>
                    </div>
                    <div className="text-2xl font-headline font-extrabold text-white">
                      1,840 <span className="text-xs font-normal text-gray-400">/ {state.computedMetrics.calorieTarget} kcal</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-fitness-primary rounded-full" style={{ width: `${(1840 / state.computedMetrics.calorieTarget) * 100}%` }} />
                    </div>
                    <div className="text-[11px] text-gray-400 flex justify-between">
                      <span>Remaining: {state.computedMetrics.calorieTarget - 1840} kcal</span>
                      <span className="text-fitness-primary font-semibold">69% Hit</span>
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
                      112 <span className="text-xs font-normal text-gray-400">/ {state.computedMetrics.proteinG}g</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-healthcare-primary rounded-full" style={{ width: `${(112 / state.computedMetrics.proteinG) * 100}%` }} />
                    </div>
                    <div className="text-[11px] text-gray-400 flex justify-between">
                      <span>Remaining: {state.computedMetrics.proteinG - 112}g</span>
                      <span className="text-healthcare-accent font-semibold">75% Hit</span>
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
                      {state.userProfile.waterLoggedMl} <span className="text-xs font-normal text-gray-400">/ {state.userProfile.waterTargetMl} ml</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${(state.userProfile.waterLoggedMl / state.userProfile.waterTargetMl) * 100}%` }} />
                    </div>
                    <button
                      onClick={handleLogHydration}
                      className="w-full py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log +250ml Water
                    </button>
                  </div>

                  {/* Allergen & Safety Shield */}
                  <div className="p-5 rounded-2xl bg-surface-1 border border-surface-border flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-status-danger mb-2">
                        <ShieldAlert className="w-4 h-4" /> Dietary Safety Active
                      </div>
                      <div className="text-xs text-gray-300">
                        Documented Allergen: <span className="font-bold text-white">Peanuts</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        Automatic scan runs on all food entries to prevent cross-contamination.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsFoodSafetyOpen(true)}
                      className="w-full mt-3 py-1.5 rounded-xl bg-status-danger/15 hover:bg-status-danger/25 border border-status-danger/30 text-red-300 text-xs font-bold transition"
                    >
                      Open Allergen Scanner
                    </button>
                  </div>

                </div>

                {/* Hero Workout & Upcoming Telehealth Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Hero Workout Card (2 Cols) */}
                  <div className="lg:col-span-2 p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-fitness-primary/15 text-fitness-primary border border-fitness-primary/30">
                          <Dumbbell className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="font-headline font-bold text-white text-lg">Today&apos;s Workout Routine</h3>
                          <p className="text-xs text-gray-400">Push Pattern • Upper Body Hypertrophy</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                        {state.activeWorkout.duration} • 5 Exercises
                      </span>
                    </div>

                    {/* Predefined Routine Exercises Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {state.activeWorkout.exercises.slice(0, 4).map((ex) => (
                        <div
                          key={ex.id}
                          onClick={() => setSelectedExerciseForModal(ex)}
                          className="p-3 rounded-2xl bg-surface-2 border border-surface-border hover:border-fitness-primary/40 cursor-pointer transition flex items-center gap-3"
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
                        Assigned by <span className="text-white font-semibold">Coach Raj Patel</span>
                      </div>
                      <button
                        onClick={() => setActiveMemberTab('workout')}
                        className="px-5 py-2.5 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center gap-1.5"
                      >
                        <span>Start Workout Session</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Upcoming Telehealth & AI Drawer Trigger (1 Col) */}
                  <div className="space-y-4">
                    
                    {/* Telehealth Card */}
                    <div className="p-5 rounded-3xl bg-surface-1 border border-healthcare-primary/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-healthcare-accent uppercase tracking-wider flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" /> Upcoming Telehealth
                        </span>
                        <span className="text-[11px] text-gray-400">05:30 PM Today</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden relative border border-healthcare-primary">
                          <Image src="/assets/physio_sharma.jpg" alt="Dr. Ramesh Sharma" fill className="object-cover" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Dr. Ramesh Sharma</div>
                          <div className="text-xs text-gray-400">Consultant Physiotherapist</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-300 bg-surface-2 p-2.5 rounded-xl border border-surface-border">
                        Agenda: Shoulder impingement screen & bench bar path.
                      </div>
                      <button
                        onClick={() => handleStartTelehealth('Dr. Ramesh Sharma', 'Consultant Physiotherapist', '/assets/physio_sharma.jpg', 'Shoulder Impingement & Kinetic Motion Analysis')}
                        className="w-full py-2.5 bg-healthcare-primary hover:bg-cyan-400 text-gray-950 font-bold text-xs rounded-xl shadow-glow-healthcare transition flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4" /> Join Encrypted Video Room
                      </button>
                    </div>

                    {/* AI Coach Card */}
                    <div className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-ai-gradient text-white shadow-glow-nebula">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Ask FitSync AI</div>
                          <div className="text-[11px] text-gray-400">Exercise Cues & Recovery Guidance</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Have questions about lifting mechanics, DOMS recovery, or hydration?
                      </p>
                      <button
                        onClick={() => {
                          haptics.playTap();
                          setIsAiOpen(true);
                        }}
                        className="w-full py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-surface-border text-xs text-white font-semibold transition"
                      >
                        Open Assistant Drawer ✨
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ---------------- MEMBER TAB: WORKOUT ---------------- */}
            {activeMemberTab === 'workout' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Workout Top Bar */}
                <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-fitness-primary uppercase tracking-wider">
                      Standard Workout Program
                    </span>
                    <h2 className="font-headline font-extrabold text-2xl text-white mt-0.5">
                      {state.activeWorkout.title}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      {state.activeWorkout.focus} • {state.activeWorkout.difficulty}
                    </p>
                  </div>

                  {/* Rest Timer Widget */}
                  <div className="w-full md:w-auto">
                    <RestTimerWidget initialSeconds={90} />
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

                        <button
                          onClick={() => setSelectedExerciseForModal(ex)}
                          className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-gray-300 border border-surface-border transition flex items-center gap-1"
                        >
                          <Info className="w-3.5 h-3.5 text-fitness-primary" />
                          <span>Exercise Guide</span>
                        </button>
                      </div>

                      {/* Set-by-Set Logging Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-surface-border text-gray-400 font-medium">
                              <th className="pb-2 pl-2">Set</th>
                              <th className="pb-2">Target Reps</th>
                              <th className="pb-2">Weight</th>
                              <th className="pb-2 text-right pr-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-border/50">
                            {ex.completedSets.map((s) => (
                              <tr key={s.set} className="hover:bg-white/5 transition">
                                <td className="py-2.5 pl-2 font-bold text-white">Set {s.set}</td>
                                <td className="py-2.5 text-gray-300 font-mono">{s.reps} reps</td>
                                <td className="py-2.5 text-fitness-primary font-mono font-bold">{s.weight}</td>
                                <td className="py-2.5 text-right pr-2">
                                  <button
                                    onClick={() => handleToggleSetCompletion(ex.id, s.set)}
                                    className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 ml-auto ${
                                      s.status === 'completed'
                                        ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                                        : 'bg-surface-2 text-gray-400 border border-surface-border hover:text-white'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{s.status === 'completed' ? 'Completed' : 'Pending'}</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ---------------- MEMBER TAB: NUTRITION ---------------- */}
            {activeMemberTab === 'nutrition' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Predefined Diet Plan Banner */}
                <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-fitness-primary uppercase tracking-wider">
                          Certified Predefined Diet Plan
                        </span>
                        <span className="text-[10px] bg-fitness-primary/20 text-fitness-primary px-2 py-0.5 rounded font-bold">
                          Mapped to: {state.assessmentData.goal}
                        </span>
                      </div>
                      <h2 className="font-headline font-extrabold text-2xl text-white mt-1">
                        {state.activeDietPlan.title}
                      </h2>
                      <p className="text-xs text-gray-400 mt-1 max-w-xl">
                        {state.activeDietPlan.description}
                      </p>
                    </div>

                    {/* Variant Selector */}
                    <div className="flex items-center gap-2">
                      {state.predefinedDietPlans.map((dp) => (
                        <button
                          key={dp.id}
                          onClick={() => {
                            haptics.playTap();
                            updateState((prev) => ({ ...prev, activeDietPlan: dp }));
                            showToast(`Active diet plan switched to ${dp.title}`, '🥗');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            state.activeDietPlan.id === dp.id
                              ? 'bg-fitness-primary text-gray-950'
                              : 'bg-surface-2 text-gray-400 border border-surface-border'
                          }`}
                        >
                          {dp.dietaryVariant.replace('_', '-')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plan Daily Macronutrient Splits */}
                  <div className="grid grid-cols-4 gap-3 pt-3 border-t border-surface-border">
                    <div className="text-center p-2 rounded-xl bg-surface-2">
                      <div className="text-xs text-gray-400">Calories</div>
                      <div className="font-mono font-bold text-white text-sm">{state.activeDietPlan.dailyCalories} kcal</div>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-surface-2">
                      <div className="text-xs text-healthcare-accent">Protein</div>
                      <div className="font-mono font-bold text-white text-sm">{state.activeDietPlan.proteinG}g</div>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-surface-2">
                      <div className="text-xs text-amber-400">Carbs</div>
                      <div className="font-mono font-bold text-white text-sm">{state.activeDietPlan.carbsG}g</div>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-surface-2">
                      <div className="text-xs text-red-400">Fats</div>
                      <div className="font-mono font-bold text-white text-sm">{state.activeDietPlan.fatG}g</div>
                    </div>
                  </div>
                </div>

                {/* Predefined Meals List */}
                <div className="space-y-4">
                  <h3 className="font-headline font-bold text-white text-lg">
                    Predefined Daily Meals & Portions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.activeDietPlan.meals.map((m, idx) => (
                      <div key={idx} className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-fitness-primary uppercase tracking-wider">
                            {m.type}
                          </span>
                          <span className="text-xs font-mono font-bold text-white">
                            {m.calories} kcal ({m.protein}g Protein)
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{m.title}</h4>
                        <p className="text-xs text-gray-300 leading-relaxed bg-surface-2 p-2.5 rounded-xl border border-white/5">
                          {m.ingredients}
                        </p>
                        <div className="text-[11px] text-gray-400">
                          <strong className="text-gray-300">Substitution: </strong>
                          {m.alternatives}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real Meal Logger & Adverse Reaction Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Daily Meal Logger */}
                  <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                    <h3 className="font-headline font-bold text-white text-lg flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-fitness-primary" /> Log Consumed Meal
                    </h3>
                    <form onSubmit={handleAddMeal} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={newMealType}
                          onChange={(e) => setNewMealType(e.target.value)}
                          className="bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fitness-primary"
                        >
                          <option value="Breakfast">Breakfast</option>
                          <option value="Lunch">Lunch</option>
                          <option value="Evening Snack">Evening Snack</option>
                          <option value="Dinner">Dinner</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Meal Title (e.g., Grilled Chicken Bowl)"
                          value={newMealTitle}
                          onChange={(e) => setNewMealTitle(e.target.value)}
                          required
                          className="bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Calories (kcal)"
                          value={newMealCalories}
                          onChange={(e) => setNewMealCalories(e.target.value)}
                          className="bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
                        />
                        <input
                          type="number"
                          placeholder="Protein (g)"
                          value={newMealProtein}
                          onChange={(e) => setNewMealProtein(e.target.value)}
                          className="bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Ingredients (e.g. Chicken breast, sweet potato, peanut butter)"
                        value={newMealIngredients}
                        onChange={(e) => setNewMealIngredients(e.target.value)}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold rounded-xl shadow-glow-fitness transition"
                      >
                        Log Meal to Daily Record
                      </button>
                    </form>

                    {/* Recently Logged Meals */}
                    <div className="pt-2 border-t border-surface-border space-y-2">
                      <div className="text-xs font-semibold text-gray-400">Recently Logged Today:</div>
                      {state.loggedMeals.slice(0, 3).map((lm) => (
                        <div key={lm.id} className="p-2.5 rounded-xl bg-surface-2 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white">{lm.title}</div>
                            <div className="text-[11px] text-gray-400">{lm.type} • {lm.time}</div>
                          </div>
                          <span className="font-mono text-fitness-primary font-semibold">{lm.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Food Adverse Reaction Tracker */}
                  <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                    <h3 className="font-headline font-bold text-white text-lg flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-status-warning" /> Food Reaction & Pattern Engine
                    </h3>
                    <form onSubmit={handleAddFoodReaction} className="space-y-3 text-xs">
                      <input
                        type="text"
                        placeholder="Food Item (e.g., Dairy Milk, Whey Protein)"
                        value={reactionFood}
                        onChange={(e) => setReactionFood(e.target.value)}
                        required
                        className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-status-warning"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={reactionSymptom}
                          onChange={(e) => setReactionSymptom(e.target.value)}
                          className="bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-status-warning"
                        >
                          <option value="Abdominal Bloating">Abdominal Bloating</option>
                          <option value="Acid Reflux">Acid Reflux</option>
                          <option value="Cramping">Cramping</option>
                          <option value="Nausea">Nausea</option>
                          <option value="Skin Flush / Hives">Skin Flush / Hives</option>
                        </select>
                        <select
                          value={reactionSeverity}
                          onChange={(e) => setReactionSeverity(e.target.value as 'Mild' | 'Moderate' | 'Severe')}
                          className="bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-status-warning"
                        >
                          <option value="Mild">Mild</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Severe">Severe</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-status-warning hover:bg-amber-400 text-gray-950 font-bold rounded-xl transition"
                      >
                        Record Symptom
                      </button>
                    </form>

                    {/* Pattern Insights List */}
                    <div className="pt-2 border-t border-surface-border space-y-2.5">
                      <div className="text-xs font-semibold text-gray-400">Observed Patterns:</div>
                      {state.foodReactionLogs.map((fr) => (
                        <div key={fr.id} className="p-3 rounded-2xl bg-surface-2 border border-surface-border space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{fr.food}</span>
                            <span className="text-[10px] font-bold text-status-warning bg-status-warning/10 px-2 py-0.5 rounded">
                              {fr.reaction} ({fr.severity})
                            </span>
                          </div>
                          {fr.patternDetected && (
                            <div className="text-[11px] text-amber-200/90 bg-status-warning/10 p-2 rounded-xl border border-status-warning/30">
                              ⚠️ {fr.aiObservation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ---------------- MEMBER TAB: HEALTH HUB ---------------- */}
            {activeMemberTab === 'health' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Health Hub Hero Bar */}
                <div className="p-6 rounded-3xl bg-surface-1 border border-healthcare-primary/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-healthcare-accent uppercase tracking-wider">
                      Clinical Healthcare Integration
                    </span>
                    <h2 className="font-headline font-extrabold text-2xl text-white mt-0.5">
                      Sports Medicine & Physical Therapy
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 max-w-lg">
                      Book consultations, attend encrypted telehealth video examinations, and manage your sovereign medical records.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsBookingOpen(true)}
                      className="px-4 py-2.5 bg-healthcare-primary hover:bg-cyan-400 text-gray-950 font-bold text-xs rounded-xl shadow-glow-healthcare transition flex items-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4" /> Book Consultation
                    </button>
                    <button
                      onClick={() => setIsReportsOpen(true)}
                      className="px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-white font-bold text-xs rounded-xl border border-surface-border transition flex items-center gap-1.5"
                    >
                      <Lock className="w-4 h-4 text-healthcare-primary" /> Medical Vault
                    </button>
                  </div>
                </div>

                {/* Specialists Directory */}
                <div className="space-y-4">
                  <h3 className="font-headline font-bold text-white text-lg">
                    Accredited Healthcare Specialists
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.healthcareProviders.map((p) => (
                      <div key={p.id} className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden relative border border-healthcare-primary/50 flex-shrink-0">
                            <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-headline font-bold text-white text-base">{p.name}</h4>
                              <span className="text-[10px] font-bold bg-healthcare-primary/15 text-healthcare-accent px-2 py-0.5 rounded border border-healthcare-primary/30">
                                {p.qualifications}
                              </span>
                            </div>
                            <div className="text-xs text-healthcare-accent font-medium mt-0.5">{p.specialty}</div>
                            <div className="text-[11px] text-gray-400 mt-1">{p.clinic}</div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed bg-surface-2 p-3 rounded-2xl border border-white/5">
                          {p.bio}
                        </p>

                        <div className="pt-2 flex items-center justify-between border-t border-surface-border text-xs">
                          <div>
                            <span className="text-gray-400">Consult Fee: </span>
                            <span className="font-bold text-white">{p.consultationFee}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartTelehealth(p.name, p.role, p.avatar, 'Live Telehealth Movement Check')}
                              className="px-3 py-1.5 bg-surface-2 hover:bg-surface-3 text-healthcare-accent rounded-xl border border-healthcare-primary/40 text-xs font-semibold flex items-center gap-1"
                            >
                              <Video className="w-3.5 h-3.5" /> Video Call
                            </button>
                            <button
                              onClick={() => setIsBookingOpen(true)}
                              className="px-3 py-1.5 bg-healthcare-primary hover:bg-cyan-400 text-gray-950 rounded-xl text-xs font-bold shadow-glow-healthcare"
                            >
                              Book Slot
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduled Appointments Table */}
                <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                  <h3 className="font-headline font-bold text-white text-lg">
                    Your Scheduled Consultations
                  </h3>
                  <div className="space-y-3">
                    {state.appointments.map((apt) => (
                      <div key={apt.id} className="p-4 rounded-2xl bg-surface-2 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden relative border border-white/10">
                            <Image src={apt.providerAvatar} alt={apt.providerName} fill className="object-cover" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{apt.providerName}</div>
                            <div className="text-xs text-gray-400">{apt.date} • {apt.time} ({apt.type})</div>
                            <div className="text-[11px] text-healthcare-accent mt-0.5">{apt.agenda}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-healthcare-primary/15 text-healthcare-accent border border-healthcare-primary/30">
                            {apt.status}
                          </span>
                          {apt.type === 'Online Video Consultation' && (
                            <button
                              onClick={() => handleStartTelehealth(apt.providerName, apt.providerRole, apt.providerAvatar, apt.agenda)}
                              className="px-3 py-1.5 bg-healthcare-primary hover:bg-cyan-400 text-gray-950 font-bold text-xs rounded-xl shadow-glow-healthcare flex items-center gap-1"
                            >
                              <Video className="w-3.5 h-3.5" /> Enter Room
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ---------------- MEMBER TAB: PROFILE ---------------- */}
            {activeMemberTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Profile Summary Card */}
                <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden relative border-2 border-fitness-primary shadow-glow-fitness">
                    <Image src="/assets/aarav.jpg" alt="Aarav Shah" fill className="object-cover" />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="font-headline font-extrabold text-2xl text-white">Aarav Shah</h2>
                    <p className="text-xs text-gray-400 mt-0.5">23 Years • 175 cm • 72.4 kg • FitZone Vadodara</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                      <span className="text-xs bg-surface-2 px-3 py-1 rounded-full border border-surface-border">
                        Goal: <strong className="text-white">Muscle Gain</strong>
                      </span>
                      <span className="text-xs bg-surface-2 px-3 py-1 rounded-full border border-surface-border">
                        Allergies: <strong className="text-status-danger">Peanuts</strong>
                      </span>
                      <span className="text-xs bg-surface-2 px-3 py-1 rounded-full border border-surface-border">
                        Tier: <strong className="text-fitness-primary">Platinum Elite</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Biometrics Engine Summary */}
                <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline font-bold text-white text-lg">Biometric Calculations</h3>
                      <p className="text-xs text-gray-400">Computed using Mifflin-St Jeor & U.S. Navy Body Fat Model</p>
                    </div>
                    <button
                      onClick={() => {
                        setDraftAssessment(state.assessmentData);
                        setIsAssessmentModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-fitness-primary text-gray-950 font-bold text-xs"
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
                      <div className="text-[10px] text-gray-400">Total Daily Expenditure</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border text-center">
                      <div className="text-xs text-gray-400">Body Fat Est.</div>
                      <div className="font-headline font-bold text-lg text-white mt-1">{state.computedMetrics.bodyFatEst}</div>
                      <div className="text-[10px] text-healthcare-accent">Navy Circumference</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-2 border border-white/5 flex items-start gap-2.5 text-xs text-gray-400">
                    <Info className="w-4 h-4 text-healthcare-primary flex-shrink-0 mt-0.5" />
                    <span>Non-diagnostic athletic wellness calculations. Always consult licensed sports physicians for clinical endocrine or metabolic management.</span>
                  </div>
                </div>

                {/* Attendance Heatmap & Stats */}
                <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                  <h3 className="font-headline font-bold text-white text-lg">Monthly Turnstile Attendance</h3>
                  <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-surface-border">
                    <span>18 Check-ins this month (86.4% consistency)</span>
                    <span className="text-fitness-primary font-bold">FitZone Alkapuri Branch</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {Array.from({ length: 28 }).map((_, i) => {
                      const isVisited = (i + 1) % 3 !== 0;
                      return (
                        <div
                          key={i}
                          className={`h-9 rounded-xl flex items-center justify-center text-xs font-mono font-semibold transition ${
                            isVisited
                              ? 'bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/40'
                              : 'bg-surface-2 text-gray-600 border border-surface-border'
                          }`}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* =========================================================================
            ROLE: TRAINER VIEW (Coach Raj Patel)
           ========================================================================= */}
        {currentRole === 'trainer' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden relative border-2 border-fitness-primary shadow-glow-fitness">
                  <Image src="/assets/trainer_raj.jpg" alt="Coach Raj Patel" fill className="object-cover" />
                </div>
                <div>
                  <h2 className="font-headline font-bold text-2xl text-white">Coach Raj Patel</h2>
                  <p className="text-xs text-gray-400">Senior Strength Coach • FitZone Vadodara Branch</p>
                  <div className="text-[11px] text-fitness-primary font-semibold mt-1">
                    24 Assigned Members • 14 Active Today • 4 Today Sessions
                  </div>
                </div>
              </div>
            </div>

            {/* Trainer Intervention Intelligence */}
            <div className="space-y-3">
              <h3 className="font-headline font-bold text-white text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-status-warning" />
                Automated Member Attention Intelligence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {state.trainerInterventions.map((int) => (
                  <div key={int.id} className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        int.statusColor === 'red' ? 'bg-status-danger/20 text-red-300 border border-status-danger/40' : 'bg-status-warning/20 text-amber-300 border border-status-warning/40'
                      }`}>
                        {int.status}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">Last Workout: {int.lastWorkout}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden relative border border-white/10">
                        <Image src={int.memberAvatar} alt={int.memberName} fill className="object-cover" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{int.memberName}</div>
                        <div className="text-[11px] text-gray-400">{int.currentWeight}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-300 bg-surface-2 p-2.5 rounded-xl border border-white/5">
                      <strong>Issue: </strong>{int.issue}
                    </div>
                    <div className="text-[11px] text-emerald-200 bg-fitness-primary/10 p-2.5 rounded-xl border border-fitness-primary/30">
                      💡 <strong>Action: </strong>{int.aiRecommendation}
                    </div>
                    <button
                      onClick={() => showToast(`Sent intervention coaching note to ${int.memberName}`, '📩')}
                      className="w-full py-2 bg-surface-2 hover:bg-surface-3 border border-surface-border text-xs text-white font-bold rounded-xl transition"
                    >
                      Send Coaching Nudge
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Member Roster */}
            <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
              <h3 className="font-headline font-bold text-white text-lg">Active Member Roster (FitZone Vadodara)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-gray-400">
                      <th className="pb-3">Member</th>
                      <th className="pb-3">Goal</th>
                      <th className="pb-3">Compliance</th>
                      <th className="pb-3">Current Routine</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    <tr className="hover:bg-white/5 transition">
                      <td className="py-3 flex items-center gap-2.5 font-bold text-white">
                        <div className="w-8 h-8 rounded-full overflow-hidden relative">
                          <Image src="/assets/aarav.jpg" alt="Aarav" fill className="object-cover" />
                        </div>
                        Aarav Shah (23)
                      </td>
                      <td className="py-3 text-gray-300">Muscle Gain (+3kg)</td>
                      <td className="py-3 text-fitness-primary font-bold">88% (5-Day Streak)</td>
                      <td className="py-3 text-gray-300">Chest & Triceps Hypertrophy</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => showToast('Updated Aarav Shah workout load target to 82.5kg', '🏋️')}
                          className="px-3 py-1 bg-fitness-primary text-gray-950 font-bold rounded-lg text-xs"
                        >
                          Approve Progression
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            ROLE: DOCTOR VIEW (Dr. Ananya Iyer)
           ========================================================================= */}
        {currentRole === 'doctor' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-surface-1 border border-healthcare-primary/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden relative border-2 border-healthcare-primary shadow-glow-healthcare">
                  <Image src="/assets/doctor_iyer.jpg" alt="Dr. Ananya Iyer" fill className="object-cover" />
                </div>
                <div>
                  <h2 className="font-headline font-bold text-2xl text-white">Dr. Ananya Iyer, MD</h2>
                  <p className="text-xs text-healthcare-accent">Sports Medicine Physician • OrthoSports Medical Center</p>
                  <div className="text-[11px] text-gray-400 mt-1">MBBS, MD Sports Medicine • Verified Provider ID #MED-8492</div>
                </div>
              </div>
            </div>

            {/* Doctor Sovereign Medical Records (Only Consented Reports Visible!) */}
            <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-bold text-white text-lg">Consented Patient Health Reports</h3>
                  <p className="text-xs text-gray-400">Filtered by database RLS: Patients who enabled &ldquo;Share with Doctor&rdquo;</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-healthcare-primary/15 text-healthcare-accent border border-healthcare-primary/30 font-bold">
                  HIPAA & Consent Enforced
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.healthReports.filter((r) => r.sharedWithDoctor).map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{r.title}</span>
                      <span className="text-[10px] bg-healthcare-primary/20 text-healthcare-accent px-2 py-0.5 rounded font-bold">
                        Consent Granted
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{r.type} • Patient: Aarav Shah • {r.uploadDate}</div>
                    <div className="text-xs text-gray-300 bg-surface-1 p-2.5 rounded-xl border border-white/5">
                      {r.highlights}
                    </div>
                    <button
                      onClick={() => showToast(`Downloaded encrypted lab report: ${r.title}`, '📄')}
                      className="w-full py-1.5 bg-healthcare-primary/20 hover:bg-healthcare-primary/30 text-healthcare-accent text-xs font-bold rounded-xl transition"
                    >
                      Download Encrypted Lab File
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ROLE: PHYSIOTHERAPIST VIEW (Dr. Ramesh Sharma)
           ========================================================================= */}
        {currentRole === 'physiotherapist' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-surface-1 border border-healthcare-primary/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden relative border-2 border-healthcare-primary shadow-glow-healthcare">
                  <Image src="/assets/physio_sharma.jpg" alt="Dr. Ramesh Sharma" fill className="object-cover" />
                </div>
                <div>
                  <h2 className="font-headline font-bold text-2xl text-white">Dr. Ramesh Sharma, MPT</h2>
                  <p className="text-xs text-healthcare-accent">Sports Biomechanics & Kinematic Rehabilitation Specialist</p>
                  <div className="text-[11px] text-gray-400 mt-1">Renew Physio Vadodara • 8 Years Clinical Experience</div>
                </div>
              </div>
            </div>

            {/* Movement Kinematics Tracker */}
            <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
              <h3 className="font-headline font-bold text-white text-lg">Active Patient Kinematics (Aarav Shah)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border">
                  <div className="text-xs text-gray-400">Rotator Cuff External Rotation</div>
                  <div className="text-xl font-bold font-mono text-healthcare-accent mt-1">85° / 90°</div>
                  <div className="text-[10px] text-fitness-primary mt-1 font-semibold">Optimal Mobility Recaptured</div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border">
                  <div className="text-xs text-gray-400">Thoracic Spine Extension</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">32°</div>
                  <div className="text-[10px] text-gray-400 mt-1">Sufficient Arch Stability</div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border">
                  <div className="text-xs text-gray-400">Subacromial Impingement Screen</div>
                  <div className="text-xl font-bold font-mono text-fitness-primary mt-1">Negative (Clear)</div>
                  <div className="text-[10px] text-fitness-primary mt-1 font-semibold">Cleared for Bench Press</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ROLE: GYM ADMIN VIEW (FitZone Vadodara)
           ========================================================================= */}
        {currentRole === 'gym_admin' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-fitness-primary uppercase tracking-wider">Branch Operator Portal</span>
                <h2 className="font-headline font-bold text-2xl text-white mt-0.5">FitZone Fitness — Alkapuri, Vadodara</h2>
                <p className="text-xs text-gray-400 mt-1">Turnstile Attendance • Trainer Load • Membership Billing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-surface-1 border border-surface-border text-center">
                <div className="text-xs text-gray-400">Total Enrolled Members</div>
                <div className="font-headline font-bold text-2xl text-white mt-1">482</div>
                <div className="text-[10px] text-fitness-primary font-bold">+18 This Month</div>
              </div>
              <div className="p-5 rounded-2xl bg-surface-1 border border-surface-border text-center">
                <div className="text-xs text-gray-400">Turnstile Active Today</div>
                <div className="font-headline font-bold text-2xl text-fitness-primary mt-1">215</div>
                <div className="text-[10px] text-gray-400">Peak Capacity 62%</div>
              </div>
              <div className="p-5 rounded-2xl bg-surface-1 border border-surface-border text-center">
                <div className="text-xs text-gray-400">Certified Trainers</div>
                <div className="font-headline font-bold text-2xl text-white mt-1">8</div>
                <div className="text-[10px] text-gray-400">All CSCS Certified</div>
              </div>
              <div className="p-5 rounded-2xl bg-surface-1 border border-surface-border text-center">
                <div className="text-xs text-gray-400">Monthly Attendance Rate</div>
                <div className="font-headline font-bold text-2xl text-healthcare-accent mt-1">86.4%</div>
                <div className="text-[10px] text-fitness-primary font-bold">Top 5% Network-wide</div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ROLE: PLATFORM ADMIN VIEW (Multi-Gym Network)
           ========================================================================= */}
        {currentRole === 'platform_admin' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border">
              <span className="text-xs font-bold text-healthcare-accent uppercase tracking-wider">Enterprise Network</span>
              <h2 className="font-headline font-bold text-2xl text-white mt-0.5">Multi-Gym Network Director Overview</h2>
              <p className="text-xs text-gray-400 mt-1">Cross-City Tenant Isolation (Vadodara • Ahmedabad • Surat)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {state.gyms.map((g) => (
                <div key={g.id} className="p-5 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{g.name}</span>
                    <span className="text-xs font-bold text-fitness-primary">{g.city}</span>
                  </div>
                  <div className="text-xs text-gray-400">{g.location} • {g.rating}★ ({g.reviewsCount} reviews)</div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-surface-border">
                    <div>Members: <strong className="text-white">{g.totalMembers}</strong></div>
                    <div>Trainers: <strong className="text-white">{g.availableTrainers}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* 3. Floating Bottom Navigation for Member Tab switching */}
      {currentRole === 'member' && (
        <BottomNav activeTab={activeMemberTab} onTabChange={(t) => setActiveMemberTab(t)} />
      )}

      {/* 4. Persistent Floating AI Assistant Drawer */}
      <FloatingAiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

      {/* 5. Telehealth Fullscreen Video Consultation Room */}
      <TelehealthVideoRoom
        isOpen={isVideoRoomOpen}
        onClose={() => setIsVideoRoomOpen(false)}
        providerName={activeVideoSession.name}
        providerRole={activeVideoSession.role}
        providerAvatar={activeVideoSession.avatar}
        agenda={activeVideoSession.agenda}
      />

      {/* 6. Real Appointment Booking Modal with Double-Booking Prevention */}
      <AppointmentBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        providers={state.healthcareProviders}
        existingAppointments={state.appointments}
        onBookAppointment={(newApt) => {
          updateState((prev) => ({
            ...prev,
            appointments: [newApt, ...prev.appointments]
          }));
        }}
      />

      {/* 7. Sovereign Health Reports Modal with Explicit Consent Matrix */}
      <HealthReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        reports={state.healthReports}
        onUpdateReport={(upd) => {
          updateState((prev) => ({
            ...prev,
            healthReports: prev.healthReports.map((r) => (r.id === upd.id ? upd : r))
          }));
        }}
        onAddReport={(newRep) => {
          updateState((prev) => ({
            ...prev,
            healthReports: [newRep, ...prev.healthReports]
          }));
        }}
      />

      {/* 8. Food Safety & Allergen Scanner Modal */}
      <FoodSafetyModal
        isOpen={isFoodSafetyOpen}
        onClose={() => setIsFoodSafetyOpen(false)}
        userAllergies={state.assessmentData.allergies}
      />

      {/* 9. Exercise Detail Demonstration Modal */}
      <ExerciseDetailModal
        exercise={selectedExerciseForModal}
        onClose={() => setSelectedExerciseForModal(null)}
      />

      {/* 10. Health Assessment Re-evaluation Wizard Modal */}
      {isAssessmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-2 border border-surface-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
              <div>
                <h3 className="font-headline font-bold text-white text-lg">Health & Fitness Assessment</h3>
                <p className="text-xs text-gray-400">Mifflin-St Jeor BMR & Athletic Calorie Engine</p>
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
                Compute & Update Target Telemetry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Notifications Drawer */}
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
