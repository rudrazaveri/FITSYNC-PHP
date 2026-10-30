'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserProfile,
  HealthAssessmentData,
  ComputedMetrics,
  Exercise,
  ExerciseSet,
  PredefinedDietPlan,
  Gym,
  WeekDay,
  Trainer,
  TrainerMessage,
  TrainerBooking,
  TrainerClientAthlete
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
import {
  WEEK_DAYS,
  getTodayDayName,
  getWorkoutForDay
} from '@/lib/initial-data';
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
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Zap,
  Info,
  Trash2,
  Minus,
  Scale,
  X,
  Calendar,
  RotateCcw,
  Edit3,
  MessageSquareText,
  Send,
  Clock,
  Phone,
  Mail,
  Award,
  Video,
  UserCheck,
  Check,
  Star,
  Users,
  ClipboardList,
  AlertTriangle,
  ArrowUpRight
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

  // Quick Stat Editing State (Age, Weight, Height, Goal, Activity)
  const [editingStats, setEditingStats] = useState({
    age: state.assessmentData?.age || 24,
    weightKg: state.assessmentData?.weightKg || 70,
    heightCm: state.assessmentData?.heightCm || 175,
    goal: state.assessmentData?.goal || 'Build Muscle',
    activity: state.assessmentData?.activity || 'Moderately Active'
  });

  // Month-wise Attendance Calendar State (0 = Current Month, -1 = Last Month, +1 = Next Month)
  const [attendanceMonthOffset, setAttendanceMonthOffset] = useState<number>(0);

  // Keep editingStats and draftAssessment synced when state changes
  useEffect(() => {
    if (state.assessmentData) {
      setEditingStats({
        age: state.assessmentData.age || 24,
        weightKg: state.assessmentData.weightKg || 70,
        heightCm: state.assessmentData.heightCm || 175,
        goal: state.assessmentData.goal || 'Build Muscle',
        activity: state.assessmentData.activity || 'Moderately Active'
      });
      setDraftAssessment(state.assessmentData);
    }
  }, [state.assessmentData]);

  // Daily Rollover Check: When date changes, reset daily trackers
  useEffect(() => {
    const todayDateStr = new Date().toLocaleDateString('en-CA');
    const todayDayName = getTodayDayName();

    if (state.lastActiveDate && state.lastActiveDate !== todayDateStr) {
      // Automatic day reset!
      updateState((prev) => ({
        ...prev,
        lastActiveDate: todayDateStr,
        selectedWorkoutDay: todayDayName,
        activeWorkout: JSON.parse(JSON.stringify(getWorkoutForDay(todayDayName))),
        userProfile: {
          ...prev.userProfile,
          waterLoggedMl: 0 // Reset daily hydration
        }
      }));
    }
  }, []);

  // New Meal Logging Draft State
  const [newMealType, setNewMealType] = useState('Lunch');
  const [newMealTitle, setNewMealTitle] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('550');
  const [newMealProtein, setNewMealProtein] = useState('40');
  const [newMealIngredients, setNewMealIngredients] = useState('');

  // Trainer Messaging & Interaction State
  const [chatInputText, setChatInputText] = useState('');
  const [chatCategory, setChatCategory] = useState<'general' | 'form_check' | 'nutrition' | 'schedule'>('general');
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [selectedTrainerForModal, setSelectedTrainerForModal] = useState<Trainer | null>(null);

  // Trainer 1-on-1 Booking Draft State
  const [bookingDate, setBookingDate] = useState('Tomorrow');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('05:30 PM');
  const [bookingFocus, setBookingFocus] = useState('Form Check & Technique Coaching');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Trainer Portal Specific State (For when userProfile.role === 'trainer')
  const [trainerSelectedMemberId, setTrainerSelectedMemberId] = useState<string>('ath_01');
  const [trainerPushSplitDay, setTrainerPushSplitDay] = useState<WeekDay>('Monday');
  const [trainerCoachReplyInput, setTrainerCoachReplyInput] = useState<string>('');

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
            showToast(`Welcome to FitSync AI, ${credentials.name}! Your account is ready. 🎉`, '🎉');
            return;
          }

          // B) DEMO ACCOUNT: Load Aarav Shah or Coach Raj Patel
          if (credentials.isDemo) {
            if (credentials.role === 'trainer') {
              const trainerState: AppState = {
                ...createDemoState(),
                userProfile: {
                  id: 'usr_coach_raj',
                  role: 'trainer',
                  fullName: 'Coach Raj Patel',
                  email: 'coach.raj@fitsync.health',
                  phone: '+91 98251 44321',
                  avatarUrl: '/assets/trainer_raj.jpg',
                  gymId: 'gym_fitzone_vadodara',
                  membershipTier: 'Senior Head Coach',
                  streakDays: 142,
                  waterLoggedMl: 2600,
                  waterTargetMl: 3500
                }
              };
              setState(trainerState);
              saveState(trainerState);
              showToast('Welcome to Gym Coach Portal, Coach Raj! 🏋️', '👋');
              return;
            }

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
  const todayDateStr = new Date().toLocaleDateString('en-CA');
  const todayDayName = getTodayDayName();

  // Filter meals: Today's fresh meals vs earlier days history
  const todayMeals = (state.loggedMeals || []).filter(
    (m) => !m.date || m.date === todayDateStr
  );
  const earlierMeals = (state.loggedMeals || []).filter(
    (m) => m.date && m.date !== todayDateStr
  );

  const totalCaloriesConsumed = todayMeals.reduce(
    (sum, m) => sum + (Number(m.calories) || 0),
    0
  );
  const calorieTarget = state.computedMetrics.calorieTarget || 2000;
  const caloriesRemaining = Math.max(0, calorieTarget - totalCaloriesConsumed);
  const caloriesPct = calorieTarget > 0 ? Math.min(100, Math.round((totalCaloriesConsumed / calorieTarget) * 100)) : 0;

  const totalProteinConsumed = todayMeals.reduce(
    (sum, m) => sum + (Number(m.protein) || 0),
    0
  );
  const proteinTarget = state.computedMetrics.proteinG || 140;
  const proteinRemaining = Math.max(0, proteinTarget - totalProteinConsumed);
  const proteinPct = proteinTarget > 0 ? Math.min(100, Math.round((totalProteinConsumed / proteinTarget) * 100)) : 0;

  // Manual Reset of Today's Trackers (Water & Today's Meals)
  const handleResetTodayTrackers = () => {
    haptics.playTap();
    updateState((prev) => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        waterLoggedMl: 0
      },
      loggedMeals: (prev.loggedMeals || []).filter((m) => m.date && m.date !== todayDateStr)
    }));
    showToast("Today's water and meal logs reset for a fresh start!", "🔄");
  };

  // Workout Split: Switch routine to selected day of week
  const handleSelectWorkoutDay = (day: WeekDay) => {
    haptics.playTap();
    const routine = getWorkoutForDay(day);
    updateState((prev) => ({
      ...prev,
      selectedWorkoutDay: day,
      activeWorkout: JSON.parse(JSON.stringify(routine))
    }));
    showToast(`Loaded ${day}'s workout: ${routine.title}`, '🏋️');
  };

  // Reset active workout sets to pending
  const handleResetWorkoutSets = () => {
    haptics.playTap();
    updateState((prev) => ({
      ...prev,
      activeWorkout: {
        ...prev.activeWorkout,
        exercises: prev.activeWorkout.exercises.map((ex) => ({
          ...ex,
          completedSets: ex.completedSets.map((s) => ({ ...s, status: 'pending' as const }))
        }))
      }
    }));
    showToast("Workout sets reset to fresh pending status for today!", "🔄");
  };

  // Option for changing user stats: Age, Weight, Height, Goal, Activity Level
  const handleSaveStats = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    haptics.playSuccess();
    const age = Math.max(14, Math.min(100, Number(editingStats.age) || 24));
    const weightKg = Math.max(30, Math.min(300, Number(editingStats.weightKg) || 70));
    const heightCm = Math.max(100, Math.min(250, Number(editingStats.heightCm) || 175));

    const updatedAssessment: HealthAssessmentData = {
      ...state.assessmentData,
      age,
      weightKg,
      heightCm,
      goal: editingStats.goal as any,
      activity: editingStats.activity as any
    };

    const newMetrics = calculateHealthMetrics(updatedAssessment);
    const newWaterTarget = Math.round(weightKg * 42);

    updateState((prev) => ({
      ...prev,
      assessmentData: updatedAssessment,
      computedMetrics: newMetrics,
      userProfile: {
        ...prev.userProfile,
        waterTargetMl: newWaterTarget
      }
    }));

    showToast(`Stats updated: ${weightKg}kg, ${heightCm}cm, age ${age}. Targets recalculated! 🎉`, '✅');
  };

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
    const dateStr = today.toLocaleDateString('en-CA');
    const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const records = state.attendanceRecords || [];
    const alreadyCheckedIn = records.some((r) => r.date === dateStr);

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

  // ---------------- TRAINER INTERACTION HANDLERS ----------------
  // Real Human Coach Reply Generator (strictly human-like coaching advice, NO AI)
  const getCoachHumanReply = (userText: string, category: string, coach: Trainer) => {
    const lower = userText.toLowerCase();
    const coachFirstName = coach.name.replace('Coach ', '');

    if (lower.includes('squat') || lower.includes('knee') || lower.includes('depth')) {
      return `Hey! On squats, keep your chest upright and screw your feet into the floor. If you feel any knee caving, push the knees slightly outward over your pinky toes. Let's do a 5-minute set check next time you're on the rack! — ${coachFirstName}`;
    }
    if (lower.includes('bench') || lower.includes('chest') || lower.includes('shoulder')) {
      return `Solid work on the pressing! Remember to retract and depress your scapulae before unracking. Keep your elbows tucked at roughly 45° so you load the pectorals rather than straining your anterior shoulder capsule. — ${coachFirstName}`;
    }
    if (lower.includes('protein') || lower.includes('diet') || lower.includes('meal') || lower.includes('calorie')) {
      return `Nutrition looks on track! Aim to get around 30-40g of quality protein in your post-workout meal within 2 hours. Drink plenty of water to help your muscles recover glycogen. — ${coachFirstName}`;
    }
    if (lower.includes('sore') || lower.includes('pain') || lower.includes('hurt') || lower.includes('rest')) {
      return `Listen to your body. Mild muscle soreness (DOMS) is normal, but sharp joint pain is not. Take 10 minutes for mobility work or foam rolling, and feel free to reduce the load by 15% today if needed. — ${coachFirstName}`;
    }
    if (lower.includes('book') || lower.includes('session') || lower.includes('meet') || lower.includes('slot')) {
      return `I'm on the gym floor today during my shift. You can book a 1-on-1 slot using the "Book Floor Session" button above, or just wave me down near the free-weights area! — ${coachFirstName}`;
    }
    return `Got your message! Great consistency lately. Keep focusing on controlled eccentrics and strict form on every rep. If you need a spot or a quick form check, let me know when you arrive at ${state.selectedGym.name}! — ${coachFirstName}`;
  };

  const handleSendTrainerMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    haptics.playTap();
    const userMsgText = chatInputText.trim();
    const currentCoach = state.selectedTrainer || state.trainers[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: TrainerMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      senderName: state.userProfile.fullName || 'You',
      text: userMsgText,
      timestamp: now.toISOString(),
      time: timeStr,
      category: chatCategory
    };

    // Update state with user message immediately
    updateState((prev) => ({
      ...prev,
      trainerMessages: [...prev.trainerMessages, userMessage]
    }));

    setChatInputText('');
    showToast(`Message sent to ${currentCoach.name}!`, '💬');

    // Simulate real coach responding back after a realistic 1.5s delay
    setTimeout(() => {
      haptics.playSuccess();
      const replyNow = new Date();
      const replyTimeStr = replyNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const coachReplyText = getCoachHumanReply(userMsgText, chatCategory, currentCoach);

      const coachMessage: TrainerMessage = {
        id: `msg_coach_${Date.now()}`,
        sender: 'trainer',
        senderName: currentCoach.name,
        text: coachReplyText,
        timestamp: replyNow.toISOString(),
        time: replyTimeStr,
        category: chatCategory
      };

      const newNotif = {
        id: `notif_${Date.now()}`,
        title: `Message from ${currentCoach.name}`,
        desc: coachReplyText.slice(0, 80) + '...',
        time: 'Just now',
        type: 'trainer' as const,
        actionText: 'View Chat',
        isRead: false
      };

      updateState((prev) => ({
        ...prev,
        trainerMessages: [...prev.trainerMessages, coachMessage],
        notifications: [newNotif, ...prev.notifications]
      }));

      showToast(`New reply from ${currentCoach.name}! 🏋️`, '💬');
    }, 1500);
  };

  const handleSelectTrainer = (trainer: Trainer) => {
    haptics.playSuccess();
    updateState((prev) => ({
      ...prev,
      selectedTrainer: trainer,
      userProfile: {
        ...prev.userProfile,
        assignedTrainerId: trainer.id
      }
    }));
    showToast(`Assigned ${trainer.name} as your primary gym coach!`, '🏋️');
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.playSuccess();
    const currentCoach = state.selectedTrainer || state.trainers[0];

    const newBooking: TrainerBooking = {
      id: `tb_${Date.now()}`,
      trainerId: currentCoach.id,
      trainerName: currentCoach.name,
      date: bookingDate,
      timeSlot: bookingTimeSlot,
      focusArea: bookingFocus,
      status: 'Confirmed',
      notes: bookingNotes.trim() || 'Floor consultation & form assessment'
    };

    updateState((prev) => ({
      ...prev,
      trainerBookings: [newBooking, ...prev.trainerBookings]
    }));

    setIsBookingModalOpen(false);
    setBookingNotes('');
    showToast(`Session booked with ${currentCoach.name} for ${bookingDate} at ${bookingTimeSlot}! 📅`, '✅');
  };

  const handleCancelBooking = (bookingId: string) => {
    haptics.playTap();
    updateState((prev) => ({
      ...prev,
      trainerBookings: prev.trainerBookings.filter((b) => b.id !== bookingId)
    }));
    showToast('Coaching session cancelled.', '🗑️');
  };

  // Trainer Dashboard Specific Actions (When role === 'trainer')
  const handleTrainerSendCoachMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerCoachReplyInput.trim()) return;

    haptics.playSuccess();
    const now = new Date();
    const newCoachMsg: TrainerMessage = {
      id: `msg_coach_portal_${Date.now()}`,
      sender: 'trainer',
      senderName: state.userProfile.fullName || 'Coach Raj Patel',
      text: trainerCoachReplyInput.trim(),
      timestamp: now.toISOString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'general'
    };

    updateState((prev) => ({
      ...prev,
      trainerMessages: [...prev.trainerMessages, newCoachMsg]
    }));

    setTrainerCoachReplyInput('');
    showToast('Message sent to assigned athletes! 🏋️', '💬');
  };

  const handleTrainerPushSplit = (member: TrainerClientAthlete) => {
    haptics.playSuccess();
    const targetRoutine = getWorkoutForDay(trainerPushSplitDay);

    // Update local client status and notification
    updateState((prev) => ({
      ...prev,
      trainerClients: prev.trainerClients.map((c) =>
        c.id === member.id ? { ...c, activeRoutineTitle: targetRoutine.title, status: 'Active on Floor' } : c
      ),
      activeWorkout: JSON.parse(JSON.stringify(targetRoutine))
    }));

    showToast(`Pushed "${targetRoutine.title}" routine to ${member.name}! 🚀`, '📋');
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

  const handleAskTrainerForExercise = (ex: Exercise) => {
    haptics.playSuccess();
    const currentCoach = state.selectedTrainer || state.trainers[0];
    const inquiryText = `Hi Coach ${currentCoach.name.replace('Coach ', '')}, I need a technique check on ${ex.name}. How can I improve my form or brace better on this?`;
    setChatCategory('form_check');
    setChatInputText(inquiryText);
    setActiveTab('trainer');
    showToast(`Drafted form check inquiry for Coach ${currentCoach.name.split(' ')[1] || 'Raj'}! 🏋️`, '💬');
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
    const newWaterTarget = Math.round((Number(draftAssessment.weightKg) || 70) * 42);
    updateState((prev) => ({
      ...prev,
      assessmentData: draftAssessment,
      computedMetrics: newMetrics,
      userProfile: {
        ...prev.userProfile,
        waterTargetMl: newWaterTarget
      }
    }));
    setIsAssessmentModalOpen(false);
    showToast('Health metrics and caloric targets updated!', '✅');
  };

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealTitle.trim()) return;

    haptics.playSuccess();
    const meal = {
      id: `m_${Date.now()}`,
      date: todayDateStr,
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

  const isTrainer = state.userProfile?.role === 'trainer';

  return (
    <div className="min-h-screen bg-canvas-base text-gray-100 flex flex-col pb-20 lg:pb-8">

      {/* 1. Global Navigation Bar */}
      <Navbar
        userProfile={state.userProfile}
        unreadNotificationsCount={state.notifications.filter((n) => !n.isRead).length}
        onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
        onLogout={handleLogout}
        onSelectTrainer={handleSelectTrainer}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className="space-y-6">

          {/* Sub-Tabs Selector */}
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              {(isTrainer
                ? (['home', 'roster', 'messages', 'splits'] as const)
                : (['home', 'workout', 'trainer', 'nutrition', 'profile'] as const)
              ).map((tab) => {
                const isActive = activeTab === tab;
                const label = isTrainer
                  ? (tab === 'home' ? 'Coach Overview' : tab === 'roster' ? 'Athlete Roster' : tab === 'messages' ? 'Athlete Inbox' : 'Workout Splits')
                  : (tab === 'trainer' ? 'Gym Coach' : tab);

                return (
                  <button
                    key={tab}
                    onClick={() => {
                      haptics.playTap();
                      setActiveTab(tab as any);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap flex items-center gap-1.5 ${isActive
                        ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                        : 'bg-surface-2 text-gray-400 hover:text-white'
                      }`}
                  >
                    {tab === 'trainer' && <MessageSquareText className="w-3.5 h-3.5" />}
                    {isTrainer && tab === 'roster' && <Users className="w-3.5 h-3.5" />}
                    {isTrainer && tab === 'messages' && <MessageSquareText className="w-3.5 h-3.5" />}
                    {isTrainer && tab === 'splits' && <ClipboardList className="w-3.5 h-3.5" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Assessment Re-evaluation Button (Hidden for trainers) */}
            {!isTrainer ? (
              <button
                onClick={() => {
                  haptics.playTap();
                  setDraftAssessment(state.assessmentData);
                  setIsAssessmentModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-healthcare-accent border border-healthcare-primary/30 transition"
              >
                <Activity className="w-3.5 h-3.5 text-healthcare-primary" />
                <span>Health Assessment</span>
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-fitness-primary bg-fitness-primary/10 border border-fitness-primary/30 px-3 py-1.5 rounded-xl font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>Head Strength Coach • FitZone Vadodara</span>
              </span>
            )}
          </div>

          {/* ======================================================== */}
          {/* TRAINER VIEW: DEDICATED GYM COACH PORTAL                */}
          {/* ======================================================== */}
          {isTrainer && activeTab !== 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Coach Strip Hero */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-fitness-primary shadow-glow-fitness flex-shrink-0">
                      <Image
                        src="/assets/trainer_raj.jpg"
                        alt="Coach Raj Patel"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30 uppercase tracking-wider">
                          Gym Trainer Portal
                        </span>
                        <span className="text-xs text-gray-400">FitZone Vadodara</span>
                      </div>
                      <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-white">
                        {state.userProfile.fullName}
                      </h1>
                      <p className="text-xs text-gray-400 mt-1">
                        Monitoring 24 assigned athletes, real-time gym floor sessions, technique inquiries &amp; workout progression.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/trainer/dashboard"
                      className="px-3.5 py-2 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Full Trainer Workspace</span>
                    </Link>
                    <span className="px-3.5 py-2 rounded-xl bg-surface-2 border border-surface-border text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>On Gym Floor Duty</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Coach Telemetry Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border text-center">
                  <div className="text-xs text-gray-400">Assigned Athletes</div>
                  <div className="font-headline font-extrabold text-2xl text-white mt-1">24</div>
                  <div className="text-[10px] text-fitness-primary">FitZone Roster</div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border text-center">
                  <div className="text-xs text-gray-400">Active on Floor Today</div>
                  <div className="font-headline font-extrabold text-2xl text-emerald-400 mt-1">
                    {state.trainerClients.filter(c => c.status === 'Active on Floor').length + 2}
                  </div>
                  <div className="text-[10px] text-gray-400">Turnstile Checked-in</div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border text-center">
                  <div className="text-xs text-gray-400">1-on-1 Sessions</div>
                  <div className="font-headline font-extrabold text-2xl text-healthcare-accent mt-1">
                    {state.trainerBookings.length}
                  </div>
                  <div className="text-[10px] text-gray-400">Floor Bookings</div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-1 border border-surface-border text-center">
                  <div className="text-xs text-gray-400">Pending Messages</div>
                  <div className="font-headline font-extrabold text-2xl text-amber-300 mt-1">
                    {state.trainerMessages.filter(m => m.sender === 'user').length}
                  </div>
                  <div className="text-[10px] text-gray-400">Athlete Inquiries</div>
                </div>
              </div>

              {/* Athlete Live Roster & Program Assignment */}
              <div className={`grid grid-cols-1 ${activeTab === 'home' ? 'lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>

                {/* Column 1 & 2: Athletes Roster & Routine Pusher */}
                {(activeTab === 'home' || activeTab === 'roster' || activeTab === 'splits') && (
                  <div className={`${activeTab === 'home' ? 'lg:col-span-2' : ''} space-y-6`}>

                    {/* Roster Table */}
                    <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-headline font-bold text-white text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-fitness-primary" /> Assigned Athletes Roster
                          </h3>
                          <p className="text-xs text-gray-400">Click any athlete to review their active routine or push a new split</p>
                        </div>
                        <span className="text-xs font-mono text-fitness-primary">
                          {state.trainerClients.length} Members
                        </span>
                      </div>

                      <div className="space-y-3">
                        {state.trainerClients.map((client) => {
                          const isSelected = trainerSelectedMemberId === client.id;
                          return (
                            <div
                              key={client.id}
                              onClick={() => {
                                haptics.playTap();
                                setTrainerSelectedMemberId(client.id);
                              }}
                              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isSelected
                                  ? 'bg-fitness-primary/10 border-fitness-primary shadow-glow-fitness'
                                  : 'bg-surface-2 border-surface-border hover:border-gray-500'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-fitness-primary/40 flex-shrink-0">
                                  <Image src={client.avatar} alt={client.name} fill className="object-cover" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <span>{client.name} ({client.age}y)</span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${client.status === 'Active on Floor'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : client.status === 'Needs Technique Check'
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-surface-3 text-gray-300'
                                      }`}>
                                      {client.status}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    Goal: <span className="text-white font-semibold">{client.goal}</span> • Weight: {client.currentWeight}
                                  </div>
                                  <div className="text-[11px] text-fitness-primary font-mono mt-0.5">
                                    Routine: {client.activeRoutineTitle}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTrainerPushSplit(client);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1"
                                >
                                  <ClipboardList className="w-3.5 h-3.5" />
                                  <span>Push Split</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Routine Split Selector for Selected Member */}
                    {(() => {
                      const selMember = state.trainerClients.find(c => c.id === trainerSelectedMemberId) || state.trainerClients[0];
                      return (
                        <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-healthcare-accent" /> Assign Workout Split for {selMember.name}
                              </h3>
                              <p className="text-xs text-gray-400">Select which daily routine to push directly to {selMember.name}&apos;s dashboard</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {WEEK_DAYS.map((day) => {
                              const isChosen = trainerPushSplitDay === day;
                              const routine = getWorkoutForDay(day);
                              return (
                                <button
                                  key={day}
                                  onClick={() => {
                                    haptics.playTap();
                                    setTrainerPushSplitDay(day);
                                  }}
                                  className={`p-3 rounded-xl border text-left transition ${isChosen
                                      ? 'bg-fitness-primary text-gray-950 font-bold border-fitness-primary shadow-glow-fitness'
                                      : 'bg-surface-2 border-surface-border text-gray-300 hover:text-white'
                                    }`}
                                >
                                  <div className="text-[11px] font-bold uppercase">{day}</div>
                                  <div className="text-xs truncate font-semibold mt-0.5">{routine.title}</div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => handleTrainerPushSplit(selMember)}
                              className="px-5 py-2.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm &amp; Push Routine to {selMember.name}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                )}

                {/* Column 3: Athlete Inquiries & Floor Bookings */}
                {(activeTab === 'home' || activeTab === 'messages') && (
                  <div className={`${activeTab === 'messages' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'}`}>

                    {/* Messages Channel with Athletes */}
                    <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4 flex flex-col h-[520px]">
                      <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                        <div className="font-headline font-bold text-white text-sm flex items-center gap-2">
                          <MessageSquareText className="w-4 h-4 text-fitness-primary" />
                          <span>Athlete Inquiries Stream</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">Live</span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                        {state.trainerMessages.map((m) => {
                          const isCoach = m.sender === 'trainer';
                          return (
                            <div
                              key={m.id}
                              className={`p-3 rounded-2xl border ${isCoach
                                  ? 'bg-fitness-primary/10 border-fitness-primary/40 text-gray-200'
                                  : 'bg-surface-2 border-surface-border text-gray-300'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white text-[11px]">{m.senderName}</span>
                                <span className="text-[10px] text-gray-500 font-mono">{m.time}</span>
                              </div>
                              <p className="leading-relaxed text-[11px]">{m.text}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick Reply Form */}
                      <form onSubmit={handleTrainerSendCoachMessage} className="pt-2 border-t border-surface-border space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={trainerCoachReplyInput}
                            onChange={(e) => setTrainerCoachReplyInput(e.target.value)}
                            placeholder="Send coaching cue to athletes..."
                            className="flex-1 bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
                          />
                          <button
                            type="submit"
                            disabled={!trainerCoachReplyInput.trim()}
                            className="px-3.5 py-2 bg-fitness-primary hover:bg-fitness-light disabled:opacity-50 text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Floor Session Bookings Queue */}
                    <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                      <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
                        <Clock className="w-4 h-4 text-healthcare-accent" /> Upcoming 1-on-1 Floor Bookings
                      </h3>

                      {state.trainerBookings.length === 0 ? (
                        <div className="p-4 text-center rounded-2xl bg-surface-2/60 text-xs text-gray-500 border border-dashed border-surface-border">
                          No upcoming bookings today.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {state.trainerBookings.map((b) => (
                            <div key={b.id} className="p-3.5 rounded-2xl bg-surface-2 border border-surface-border space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white">{b.focusArea}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary font-bold">
                                  {b.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {b.date} • {b.timeSlot}
                              </div>
                              {b.notes && (
                                <div className="text-[11px] text-gray-400 bg-surface-1 p-2 rounded-xl mt-1">
                                  Note: {b.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* ATHLETE VIEW: ONLY RENDERED WHEN USER IS NOT A TRAINER  */}
          {/* ======================================================== */}
          {!isTrainer && activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Daily Reset Status & Quick Action Banner */}
              <div className="p-3.5 rounded-2xl bg-surface-1 border border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-xl bg-fitness-primary/10 text-fitness-primary border border-fitness-primary/30">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="font-bold text-white">
                      {todayDayName}, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-gray-400 text-[11px] ml-2">
                      • Daily trackers reset automatically for today
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetTodayTrackers}
                    className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-gray-300 hover:text-white border border-surface-border text-[11px] font-semibold transition flex items-center gap-1"
                    title="Reset today's water and meal logs to 0"
                  >
                    <RotateCcw className="w-3 h-3 text-fitness-primary" />
                    <span>Reset Today&apos;s Trackers</span>
                  </button>
                </div>
              </div>

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
                      <h3 className="font-headline font-bold text-white text-lg">{todayDayName}&apos;s Workout Routine</h3>
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
          {!isTrainer && activeTab === 'workout' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Workout Top Bar */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">

                {/* 7-Day Workout Schedule Split Selector */}
                <div className="space-y-2 pb-3 border-b border-surface-border">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <Calendar className="w-3.5 h-3.5 text-fitness-primary" /> Daily Workout Split (7 Days)
                    </span>
                    <span className="text-[11px] text-fitness-primary font-mono">
                      Today: <strong className="text-white">{todayDayName}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = (state.selectedWorkoutDay || todayDayName) === day;
                      const isToday = day === todayDayName;
                      return (
                        <button
                          key={day}
                          onClick={() => handleSelectWorkoutDay(day)}
                          className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center justify-center border ${isSelected
                              ? 'bg-fitness-primary text-gray-950 font-bold border-fitness-primary shadow-glow-fitness'
                              : isToday
                                ? 'bg-surface-2 text-white border-fitness-primary/50'
                                : 'bg-surface-2/60 text-gray-400 border-surface-border hover:text-white hover:border-gray-500'
                            }`}
                        >
                          <span className="text-[10px] sm:text-xs font-semibold">{day.slice(0, 3)}</span>
                          {isToday && (
                            <span className={`text-[8px] sm:text-[9px] px-1 rounded-full uppercase tracking-wider font-extrabold ${isSelected ? 'bg-gray-950 text-fitness-primary' : 'bg-fitness-primary/20 text-fitness-primary'
                              }`}>
                              Today
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-fitness-primary uppercase tracking-wider">
                        {state.selectedWorkoutDay || todayDayName}&apos;s Routine
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-fitness-primary/10 text-fitness-primary border border-fitness-primary/25 font-semibold">
                        {state.selectedWorkoutDay === todayDayName ? 'Today Scheduled' : 'Daily Routine Preview'}
                      </span>
                    </div>
                    <h2 className="font-headline font-extrabold text-2xl text-white mt-1">
                      {state.activeWorkout.title}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      {state.activeWorkout.focus} • {state.activeWorkout.difficulty}
                    </p>
                  </div>

                  <div className="flex items-center flex-wrap gap-2.5">
                    <button
                      onClick={handleResetWorkoutSets}
                      className="px-3 py-2 bg-surface-2 hover:bg-surface-3 text-gray-300 hover:text-white font-semibold text-xs rounded-xl border border-surface-border transition flex items-center gap-1.5"
                      title="Reset completed sets to pending for today"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-fitness-primary" />
                      <span>Reset Sets</span>
                    </button>
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
                          onClick={() => handleAskTrainerForExercise(ex)}
                          className="px-3 py-1.5 rounded-xl bg-fitness-primary/15 hover:bg-fitness-primary/25 text-fitness-primary border border-fitness-primary/30 text-xs font-bold transition flex items-center gap-1"
                          title="Ask assigned gym coach for guidance"
                        >
                          <MessageSquareText className="w-3.5 h-3.5" />
                          <span>Ask Trainer</span>
                        </button>
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
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${s.status === 'completed'
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

          {/* ---------------- TAB: GYM TRAINER & COACH INTERACTION ---------------- */}
          {!isTrainer && activeTab === 'trainer' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Active Coach Banner */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-fitness-primary shadow-glow-fitness flex-shrink-0">
                      <Image
                        src={state.selectedTrainer?.avatar || '/assets/trainer_raj.jpg'}
                        alt={state.selectedTrainer?.name || 'Coach Raj Patel'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-fitness-primary/20 text-fitness-primary border border-fitness-primary/30 uppercase tracking-wider">
                          Assigned Gym Coach
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {state.selectedTrainer?.gymName || state.selectedGym.name}
                        </span>
                      </div>
                      <h2 className="font-headline font-extrabold text-2xl text-white">
                        {state.selectedTrainer?.name || 'Coach Raj Patel'}
                      </h2>
                      <p className="text-xs text-fitness-primary font-semibold mt-0.5">
                        {state.selectedTrainer?.role || 'Senior Strength & Hypertrophy Coach'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 max-w-xl line-clamp-2">
                        {state.selectedTrainer?.bio}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 mt-2.5">
                        <span className="flex items-center gap-1 font-semibold text-fitness-primary">
                          <Star className="w-3.5 h-3.5 fill-fitness-primary" /> {state.selectedTrainer?.rating || 4.9} ({state.selectedTrainer?.reviewsCount || 142} reviews)
                        </span>
                        <span>•</span>
                        <span>{state.selectedTrainer?.experience || '7+ Years Experience'}</span>
                        <span>•</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          {state.selectedTrainer?.availabilityStatus || 'On Floor'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-col items-stretch gap-2.5 flex-shrink-0">
                    <button
                      onClick={() => setIsBookingModalOpen(true)}
                      className="px-4 py-2.5 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book 1-on-1 Floor Session</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTrainerForModal(state.selectedTrainer || state.trainers[0]);
                        setIsTrainerModalOpen(true);
                      }}
                      className="px-4 py-2 bg-surface-2 hover:bg-surface-3 text-gray-200 hover:text-white font-semibold text-xs rounded-xl border border-surface-border transition flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-fitness-primary" />
                      <span>View Coach Credentials & Roster</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Two-Column Layout: Live Communication & Scheduled Floor Sessions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Column 1 & 2: Direct Coach Communication Channel */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4 flex flex-col h-[600px]">

                    {/* Chat Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-fitness-primary/50">
                          <Image
                            src={state.selectedTrainer?.avatar || '/assets/trainer_raj.jpg'}
                            alt={state.selectedTrainer?.name || 'Coach'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-headline font-bold text-white text-sm flex items-center gap-1.5">
                            <span>Direct Chat with {state.selectedTrainer?.name || 'Coach Raj'}</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Ask about compound form, set adjustments, or workout progressions
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            haptics.playTap();
                            setChatInputText("Coach, could you check my bench press elbow tuck on set 3?");
                            setChatCategory('form_check');
                          }}
                          className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-[11px] text-fitness-primary border border-fitness-primary/30 transition"
                        >
                          Quick Form Cue
                        </button>
                      </div>
                    </div>

                    {/* Messages Scroll View */}
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                      {state.trainerMessages.map((msg) => {
                        const isUser = msg.sender === 'user';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] font-bold text-gray-400">{msg.senderName}</span>
                              <span className="text-[9px] text-gray-500 font-mono">{msg.time}</span>
                              {msg.category === 'form_check' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-fitness-primary/10 text-fitness-primary border border-fitness-primary/20 font-semibold">
                                  Form Check
                                </span>
                              )}
                            </div>
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${isUser
                                  ? 'bg-fitness-primary text-gray-950 font-medium rounded-tr-sm shadow-glow-fitness'
                                  : 'bg-surface-2 text-gray-200 border border-surface-border rounded-tl-sm'
                                }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat Input & Fast Category Chips */}
                    <div className="pt-2 border-t border-surface-border space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-gray-400 font-medium">Topic:</span>
                        {(['general', 'form_check', 'nutrition', 'schedule'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              haptics.playTap();
                              setChatCategory(cat);
                            }}
                            className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold transition ${chatCategory === cat
                                ? 'bg-fitness-primary/20 text-fitness-primary border-fitness-primary'
                                : 'bg-surface-2 text-gray-400 border-surface-border hover:text-white'
                              }`}
                          >
                            {cat === 'general' ? 'General' : cat === 'form_check' ? 'Technique / Form' : cat === 'nutrition' ? 'Nutrition' : 'Scheduling'}
                          </button>
                        ))}
                      </div>

                      <form onSubmit={handleSendTrainerMessage} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={chatInputText}
                          onChange={(e) => setChatInputText(e.target.value)}
                          placeholder={`Message ${state.selectedTrainer?.name || 'Coach'} directly...`}
                          className="flex-1 bg-surface-2 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary transition"
                        />
                        <button
                          type="submit"
                          disabled={!chatInputText.trim()}
                          className="px-4 py-2.5 bg-fitness-primary hover:bg-fitness-light disabled:opacity-50 text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Send</span>
                        </button>
                      </form>
                    </div>

                  </div>
                </div>

                {/* Column 3: Scheduled 1-on-1 Sessions & Gym Trainer Roster */}
                <div className="space-y-6">

                  {/* Scheduled Sessions Card */}
                  <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-fitness-primary" /> Booked Floor Sessions
                      </h3>
                      <button
                        onClick={() => setIsBookingModalOpen(true)}
                        className="text-[11px] text-fitness-primary hover:underline font-semibold"
                      >
                        + Book New
                      </button>
                    </div>

                    {state.trainerBookings.length === 0 ? (
                      <div className="p-6 text-center rounded-2xl bg-surface-2/60 border border-dashed border-surface-border space-y-2">
                        <Clock className="w-7 h-7 text-gray-500 mx-auto" />
                        <div className="text-xs font-bold text-gray-300">No Sessions Booked</div>
                        <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                          Book a 1-on-1 floor appointment with your coach for technique analysis, spotter support, or workout splits.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {state.trainerBookings.map((b) => (
                          <div key={b.id} className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fitness-primary/15 text-fitness-primary border border-fitness-primary/30 uppercase">
                                  {b.status}
                                </span>
                                <h4 className="font-bold text-white text-xs mt-1.5">{b.focusArea}</h4>
                                <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-fitness-primary" /> {b.date} • {b.timeSlot}
                                </div>
                              </div>
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                className="p-1 rounded-lg text-gray-500 hover:text-red-400 transition"
                                title="Cancel Session"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {b.notes && (
                              <p className="text-[11px] text-gray-400 bg-surface-1/80 p-2 rounded-xl border border-surface-border/60">
                                {b.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Switch Home Gym Trainer */}
                  <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-3">
                    <h3 className="font-headline font-bold text-white text-base flex items-center gap-2">
                      <Award className="w-4 h-4 text-healthcare-accent" /> Available Gym Coaches
                    </h3>
                    <p className="text-xs text-gray-400">
                      You can switch or consult with any certified coach on the roster at {state.selectedGym.name}:
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {state.trainers.map((t) => {
                        const isCurrent = (state.selectedTrainer?.id || state.trainers[0].id) === t.id;
                        return (
                          <div
                            key={t.id}
                            className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${isCurrent
                                ? 'bg-fitness-primary/10 border-fitness-primary shadow-glow-fitness'
                                : 'bg-surface-2 border-surface-border hover:border-gray-500'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-fitness-primary/40 flex-shrink-0">
                                <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>{t.name}</span>
                                  {isCurrent && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-fitness-primary text-gray-950 font-bold">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400">{t.role}</div>
                                <div className="text-[10px] text-fitness-primary font-mono">{t.rating} ★ • {t.experience}</div>
                              </div>
                            </div>

                            {!isCurrent ? (
                              <button
                                onClick={() => handleSelectTrainer(t)}
                                className="px-3 py-1.5 rounded-xl bg-surface-3 hover:bg-fitness-primary hover:text-gray-950 text-xs font-bold text-white transition border border-surface-border"
                              >
                                Select
                              </button>
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-fitness-primary flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ---------------- TAB 3: NUTRITION ---------------- */}
          {!isTrainer && activeTab === 'nutrition' && (
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
                      Personalized daily targets tailored for <strong className="text-white">{state.assessmentData.goal}</strong> based on your physical metrics &amp; activity
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        haptics.playTap();
                        setActiveTab('profile');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-fitness-primary/40 text-xs text-fitness-primary font-semibold flex items-center gap-1.5 transition shadow-sm"
                      title="Edit Age, Weight, Height in Profile"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Change Stats (Weight/Age/Height)</span>
                    </button>
                    <span className="text-xs bg-surface-2 px-3 py-1.5 rounded-xl border border-surface-border text-gray-300">
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
                    {todayMeals.length} {todayMeals.length === 1 ? 'entry' : 'entries'} • {totalCaloriesConsumed} kcal total
                  </span>
                </div>

                {todayMeals.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-surface-2/60 border border-dashed border-surface-border space-y-2">
                    <Utensils className="w-8 h-8 text-gray-500 mx-auto" />
                    <div className="text-xs font-bold text-gray-300">No Meals Logged Yet Today</div>
                    <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                      Today started fresh with 0 kcal consumed. Use the &quot;Log Athletic Meal&quot; form above to record your nutrition for today!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayMeals.map((meal) => (
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

                {/* Earlier Days History Section */}
                {earlierMeals.length > 0 && (
                  <div className="pt-4 border-t border-surface-border space-y-2">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Earlier Logged History ({earlierMeals.length} past meals)
                    </div>
                    <div className="space-y-2 opacity-80">
                      {earlierMeals.slice(0, 5).map((meal) => (
                        <div key={meal.id} className="p-3 rounded-xl bg-surface-2/60 border border-surface-border flex items-center justify-between text-xs">
                          <div>
                            <span className="text-gray-300 font-semibold">{meal.title}</span>
                            <span className="text-[10px] text-gray-500 ml-2">{meal.date || 'Earlier'} • {meal.time}</span>
                          </div>
                          <span className="text-gray-400 font-mono">{meal.calories} kcal</span>
                        </div>
                      ))}
                    </div>
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

              {/* Quick Body Stats & Biometrics Editor */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-headline font-bold text-white text-lg flex items-center gap-2">
                      <Scale className="w-5 h-5 text-fitness-primary" /> Body Stats &amp; Physical Attributes
                    </h3>
                    <p className="text-xs text-gray-400">
                      Change your age, weight, or height anytime to update your caloric targets and macro goals.
                    </p>
                  </div>
                  <span className="text-[11px] text-fitness-primary bg-fitness-primary/10 border border-fitness-primary/30 px-2.5 py-1 rounded-full font-semibold self-start sm:self-auto">
                    Live Telemetry Sync
                  </span>
                </div>

                <form onSubmit={handleSaveStats} className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    {/* Weight Input with Steppers */}
                    <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2">
                      <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                        <span>Weight (kg)</span>
                        <span className="text-[10px] text-fitness-primary font-mono font-bold">{editingStats.weightKg} kg</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingStats(prev => ({ ...prev, weightKg: Math.max(30, +(prev.weightKg - 0.5).toFixed(1)) }))}
                          className="w-8 h-8 rounded-xl bg-surface-3 hover:bg-white/10 text-gray-300 font-bold flex items-center justify-center transition border border-surface-border"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          min="30"
                          max="250"
                          value={editingStats.weightKg}
                          onChange={(e) => setEditingStats(prev => ({ ...prev, weightKg: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-surface-1 border border-surface-border rounded-xl px-3 py-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-fitness-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingStats(prev => ({ ...prev, weightKg: Math.min(250, +(prev.weightKg + 0.5).toFixed(1)) }))}
                          className="w-8 h-8 rounded-xl bg-surface-3 hover:bg-white/10 text-gray-300 font-bold flex items-center justify-center transition border border-surface-border"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Height Input with Steppers */}
                    <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2">
                      <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                        <span>Height (cm)</span>
                        <span className="text-[10px] text-healthcare-accent font-mono font-bold">{editingStats.heightCm} cm</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingStats(prev => ({ ...prev, heightCm: Math.max(100, prev.heightCm - 1) }))}
                          className="w-8 h-8 rounded-xl bg-surface-3 hover:bg-white/10 text-gray-300 font-bold flex items-center justify-center transition border border-surface-border"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="100"
                          max="240"
                          value={editingStats.heightCm}
                          onChange={(e) => setEditingStats(prev => ({ ...prev, heightCm: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-surface-1 border border-surface-border rounded-xl px-3 py-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-fitness-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingStats(prev => ({ ...prev, heightCm: Math.min(240, prev.heightCm + 1) }))}
                          className="w-8 h-8 rounded-xl bg-surface-3 hover:bg-white/10 text-gray-300 font-bold flex items-center justify-center transition border border-surface-border"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Age Input with Steppers */}
                    <div className="p-4 rounded-2xl bg-surface-2 border border-surface-border space-y-2">
                      <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                        <span>Age (years)</span>
                        <span className="text-[10px] text-amber-300 font-mono font-bold">{editingStats.age} yrs</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingStats(prev => ({ ...prev, age: Math.max(14, prev.age - 1) }))}
                          className="w-8 h-8 rounded-xl bg-surface-3 hover:bg-white/10 text-gray-300 font-bold flex items-center justify-center transition border border-surface-border"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="14"
                          max="95"
                          value={editingStats.age}
                          onChange={(e) => setEditingStats(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-surface-1 border border-surface-border rounded-xl px-3 py-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-fitness-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingStats(prev => ({ ...prev, age: Math.min(95, prev.age + 1) }))}
                          className="w-8 h-8 rounded-xl bg-surface-3 hover:bg-white/10 text-gray-300 font-bold flex items-center justify-center transition border border-surface-border"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Goal & Activity Level */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Primary Goal</label>
                      <select
                        value={editingStats.goal}
                        onChange={(e) => setEditingStats(prev => ({ ...prev, goal: e.target.value as any }))}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary"
                      >
                        <option value="Build Muscle">Build Muscle (Hypertrophy Surplus)</option>
                        <option value="Lose Weight">Lose Weight (Fat Loss Deficit)</option>
                        <option value="Increase Strength">Increase Strength</option>
                        <option value="General Fitness">General Fitness</option>
                        <option value="Improve Endurance">Improve Endurance</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Activity Level</label>
                      <select
                        value={editingStats.activity}
                        onChange={(e) => setEditingStats(prev => ({ ...prev, activity: e.target.value as any }))}
                        className="w-full bg-surface-2 border border-surface-border rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary"
                      >
                        <option value="Sedentary">Sedentary (Little or no exercise)</option>
                        <option value="Lightly Active">Lightly Active (1-3 days/wk)</option>
                        <option value="Moderately Active">Moderately Active (3-5 days/wk)</option>
                        <option value="Very Active">Very Active (6-7 days/wk)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save &amp; Recalculate Daily Targets</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Biometrics Engine Summary */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline font-bold text-white text-lg">Biometric Health Calculations</h3>
                    <p className="text-xs text-gray-400">Personalized biometrics based on your body composition</p>
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
                  <span>Your personalized caloric burn and macro budget are dynamically calculated to support your current body weight, height, age, and fitness goal.</span>
                </div>
              </div>

              {/* Month-Wise Turnstile Attendance Heatmap & Calendar */}
              {(() => {
                const now = new Date();
                const activeAttendanceDate = new Date(now.getFullYear(), now.getMonth() + attendanceMonthOffset, 1);
                const currentMonthYear = activeAttendanceDate.getFullYear();
                const currentMonthIdx = activeAttendanceDate.getMonth(); // 0-11
                const currentMonthLabel = activeAttendanceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                const daysInSelectedMonth = new Date(currentMonthYear, currentMonthIdx + 1, 0).getDate();
                const firstDayOfWeek = new Date(currentMonthYear, currentMonthIdx, 1).getDay(); // 0=Sun, 1=Mon...
                const monthPrefix = `${currentMonthYear}-${(currentMonthIdx + 1).toString().padStart(2, '0')}`;

                const isViewingCurrentMonth = attendanceMonthOffset === 0;
                const todayDayNumber = now.getDate();
                const todayDateStr = now.toLocaleDateString('en-CA');

                // Filter attendance records strictly for the active viewing month
                const monthAttendanceRecords = (state.attendanceRecords || []).filter((r) => {
                  if (r.date) {
                    return r.date.startsWith(monthPrefix);
                  }
                  return attendanceMonthOffset === 0;
                });

                const daysElapsedInMonth = isViewingCurrentMonth ? Math.max(1, todayDayNumber) : daysInSelectedMonth;
                const consistencyPct = Math.min(100, Math.round((monthAttendanceRecords.length / daysElapsedInMonth) * 100));

                const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                return (
                  <div className="p-6 rounded-3xl bg-surface-1 border border-surface-border space-y-4">

                    {/* Header: Title & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline font-bold text-white text-lg">Gym Attendance &amp; Check-Ins</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-fitness-primary/15 text-fitness-primary border border-fitness-primary/30 font-semibold">
                            Month-Wise Calendar
                          </span>
                        </div>
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

                    {/* Month Switcher Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-surface-2 border border-surface-border">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            haptics.playTap();
                            setAttendanceMonthOffset((prev) => prev - 1);
                          }}
                          className="p-1.5 rounded-xl bg-surface-3 hover:bg-white/10 text-gray-300 hover:text-white transition border border-surface-border"
                          title="Previous Month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-3 py-1 font-headline font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-fitness-primary" />
                          <span>{currentMonthLabel}</span>
                        </div>
                        <button
                          onClick={() => {
                            haptics.playTap();
                            setAttendanceMonthOffset((prev) => prev + 1);
                          }}
                          className="p-1.5 rounded-xl bg-surface-3 hover:bg-white/10 text-gray-300 hover:text-white transition border border-surface-border"
                          title="Next Month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isViewingCurrentMonth && (
                          <button
                            onClick={() => {
                              haptics.playTap();
                              setAttendanceMonthOffset(0);
                            }}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-3 hover:bg-fitness-primary hover:text-gray-950 text-fitness-primary border border-fitness-primary/30 font-semibold transition"
                          >
                            Current Month
                          </button>
                        )}
                        <span className="text-[11px] text-gray-400 font-mono">
                          {daysInSelectedMonth} Days Total
                        </span>
                      </div>
                    </div>

                    {/* Attendance Metric Bar */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pb-2 border-b border-surface-border gap-2">
                      <span>
                        <strong className="text-white">{monthAttendanceRecords.length}</strong> Check-ins in {activeAttendanceDate.toLocaleDateString('en-US', { month: 'short' })}
                        {' '}({consistencyPct}% consistency)
                      </span>
                      <span className="text-fitness-primary font-bold">{state.selectedGym.name}</span>
                    </div>

                    {/* Weekday Labels */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
                      {weekdayNames.map((d) => (
                        <div key={d} className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Monthly Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {/* Blank offset cells for start of month */}
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`blank_${i}`} className="h-9 sm:h-10 rounded-xl bg-surface-2/20 border border-transparent" />
                      ))}

                      {/* Day cells for all days in month */}
                      {Array.from({ length: daysInSelectedMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dayDateStr = `${monthPrefix}-${dayNum.toString().padStart(2, '0')}`;
                        const record = (state.attendanceRecords || []).find(
                          (r) => r.date === dayDateStr || (isViewingCurrentMonth && r.dayNumber === dayNum)
                        );
                        const isVisited = Boolean(record);
                        const isToday = isViewingCurrentMonth && dayNum === todayDayNumber;
                        const isFuture = isViewingCurrentMonth && dayNum > todayDayNumber;

                        return (
                          <div
                            key={dayNum}
                            className={`h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center text-xs font-mono font-semibold transition border ${isVisited
                                ? 'bg-fitness-primary/20 text-fitness-primary border-fitness-primary/60 shadow-glow-fitness'
                                : isToday
                                  ? 'bg-surface-2 text-white border-healthcare-accent/80'
                                  : isFuture
                                    ? 'bg-surface-2/40 text-gray-600 border-surface-border'
                                    : 'bg-surface-2 text-gray-400 border-surface-border'
                              }`}
                            title={
                              isVisited
                                ? `Checked in: ${record?.gymName || state.selectedGym.name} on ${dayDateStr} (${record?.time || 'Recorded'})`
                                : isToday
                                  ? `Today - Day ${dayNum}`
                                  : `Day ${dayNum} - No check-in`
                            }
                          >
                            <span>{dayNum}</span>
                            {isVisited && (
                              <span className="w-1.5 h-1.5 rounded-full bg-fitness-primary mt-0.5" />
                            )}
                            {isToday && !isVisited && (
                              <span className="w-1.5 h-1.5 rounded-full bg-healthcare-accent mt-0.5 animate-pulse" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-[11px] text-gray-400 border-t border-surface-border/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-fitness-primary shadow-glow-fitness" />
                        <span>Attended ({monthAttendanceRecords.length})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-healthcare-accent" />
                        <span>Today</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                        <span>Rest / No Check-In</span>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>
          )}

        </div>
      </main>

      {/* 3. Floating Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isTrainer={isTrainer} />

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
                <p className="text-xs text-gray-400">Personalized Caloric Target &amp; Macro Allocation</p>
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

      {/* 9. Coach Credentials Modal */}
      {isTrainerModalOpen && selectedTrainerForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-2 border border-surface-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-fitness-primary/50">
                  <Image src={selectedTrainerForModal.avatar} alt={selectedTrainerForModal.name} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-white text-base">{selectedTrainerForModal.name}</h3>
                  <div className="text-xs text-fitness-primary">{selectedTrainerForModal.role}</div>
                </div>
              </div>
              <button onClick={() => setIsTrainerModalOpen(false)} className="text-gray-400 hover:text-white text-xs">Close</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-gray-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">Coach Biography</span>
                <p className="text-gray-300 leading-relaxed bg-surface-1 p-3 rounded-2xl border border-surface-border">
                  {selectedTrainerForModal.bio}
                </p>
              </div>

              <div>
                <span className="text-gray-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">Specializations</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTrainerForModal.specializations.map((spec) => (
                    <span key={spec} className="px-2.5 py-1 rounded-lg bg-surface-1 text-gray-200 border border-surface-border">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-gray-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">Certifications</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTrainerForModal.certifications.map((cert) => (
                    <span key={cert} className="px-2.5 py-1 rounded-lg bg-fitness-primary/10 text-fitness-primary border border-fitness-primary/30 font-semibold">
                      ✓ {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-border">
                <div className="bg-surface-1 p-3 rounded-xl border border-surface-border">
                  <div className="text-gray-400 text-[10px]">Weekly Floor Schedule</div>
                  <div className="text-white font-bold mt-0.5">{selectedTrainerForModal.weeklySchedule}</div>
                </div>
                <div className="bg-surface-1 p-3 rounded-xl border border-surface-border">
                  <div className="text-gray-400 text-[10px]">Assigned Athletes</div>
                  <div className="text-white font-bold mt-0.5">{selectedTrainerForModal.assignedMembersCount} Members Active</div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectTrainer(selectedTrainerForModal);
                    setIsTrainerModalOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs shadow-glow-fitness transition"
                >
                  Set as My Coach
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTrainerModalOpen(false);
                    setIsBookingModalOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-surface-1 hover:bg-surface-3 border border-surface-border text-xs font-semibold text-white transition"
                >
                  Book Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. Book 1-on-1 Session Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-2 border border-surface-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
              <div>
                <h3 className="font-headline font-bold text-white text-base">Book 1-on-1 Floor Session</h3>
                <p className="text-xs text-gray-400">With {state.selectedTrainer?.name || 'Coach Raj'}</p>
              </div>
              <button onClick={() => setIsBookingModalOpen(false)} className="text-gray-400 hover:text-white text-xs">Cancel</button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Select Day</label>
                <select
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-surface-1 border border-surface-border rounded-xl p-2.5 text-white"
                >
                  <option value="Today">Today (Same-day Floor Consultation)</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="Saturday">Saturday Floor Session</option>
                  <option value="Monday">Next Monday</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Select Time Slot</label>
                <select
                  value={bookingTimeSlot}
                  onChange={(e) => setBookingTimeSlot(e.target.value)}
                  className="w-full bg-surface-1 border border-surface-border rounded-xl p-2.5 text-white"
                >
                  <option value="07:00 AM">07:00 AM (Early Floor)</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="05:30 PM">05:30 PM (Peak Evening)</option>
                  <option value="07:00 PM">07:00 PM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Session Focus Area</label>
                <select
                  value={bookingFocus}
                  onChange={(e) => setBookingFocus(e.target.value)}
                  className="w-full bg-surface-1 border border-surface-border rounded-xl p-2.5 text-white"
                >
                  <option value="Form Check & Technique Coaching">Form Check &amp; Technique Coaching</option>
                  <option value="Bench Press & Chest Progression">Bench Press &amp; Chest Progression</option>
                  <option value="Squat Depth & Hip Opener Technique">Squat Depth &amp; Hip Opener Technique</option>
                  <option value="Deadlift Kinematics & Back Safety">Deadlift Kinematics &amp; Back Safety</option>
                  <option value="Workout Split Customization">Workout Split Customization</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-semibold">Notes / Questions for Coach</label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Would like spotter assistance on heavy top sets and review right shoulder mobility..."
                  className="w-full bg-surface-1 border border-surface-border rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-fitness-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold rounded-xl text-xs shadow-glow-fitness transition mt-2"
              >
                Confirm Coaching Appointment
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
