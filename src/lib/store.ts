// FitSync AI — Core Persistent Data Store
'use client';

import { 
  UserProfile, 
  HealthAssessmentData, 
  ComputedMetrics, 
  Gym, 
  WorkoutRoutine, 
  PredefinedDietPlan, 
  NotificationItem,
  WeekDay,
  Trainer,
  TrainerMessage,
  TrainerBooking
} from '@/types';
import { 
  INITIAL_GYMS, 
  INITIAL_WORKOUT_ROUTINE, 
  WEEKLY_WORKOUT_ROUTINES,
  getTodayDayName,
  getWorkoutForDay,
  PREDEFINED_DIET_PLANS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_TRAINERS,
  INITIAL_TRAINER_MESSAGES,
  INITIAL_TRAINER_BOOKINGS
} from './initial-data';
import { calculateHealthMetrics } from './assessment-calculator';

export const STORAGE_KEY = 'fitsync_ai_state_v2';
export const REGISTERED_USERS_KEY = 'fitsync_ai_registered_users_v2';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1-31
  time: string; // HH:MM AM/PM
  gymId: string;
  gymName: string;
}

export interface AppState {
  isAuthenticated: boolean;
  isDemoUser?: boolean;
  lastActiveDate: string; // YYYY-MM-DD
  selectedWorkoutDay: WeekDay;
  userProfile: UserProfile;
  assessmentData: HealthAssessmentData;
  computedMetrics: ComputedMetrics;
  gyms: Gym[];
  selectedGym: Gym;
  activeWorkout: WorkoutRoutine;
  predefinedDietPlans: PredefinedDietPlan[];
  activeDietPlan: PredefinedDietPlan;
  loggedMeals: {
    id: string;
    date?: string; // YYYY-MM-DD
    type: string;
    title: string;
    time: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string;
  }[];
  notifications: NotificationItem[];
  attendanceRecords: AttendanceRecord[];
  trainers: Trainer[];
  selectedTrainer: Trainer;
  trainerMessages: TrainerMessage[];
  trainerBookings: TrainerBooking[];
}

export interface RegisteredUserRecord {
  email: string;
  name: string;
  password?: string;
  gymId: string;
  registeredAt: string;
  state: AppState;
}

export interface NewUserRegistrationParams {
  fullName: string;
  email: string;
  password?: string;
  gym: Gym;
  goal?: 'Build Muscle' | 'Lose Weight' | 'Increase Strength' | 'Improve Endurance' | 'General Fitness';
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  heightCm?: number;
  weightKg?: number;
  activity?: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extremely Active';
  diet?: 'Non-Vegetarian' | 'Vegetarian' | 'Eggetarian' | 'Vegan';
}

// ---------------- DEMO USER (AARAV SHAH) DEFAULTS ----------------
const DEFAULT_ASSESSMENT: HealthAssessmentData = {
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
  allergies: ['Peanuts'],
  restrictions: ['Low Sodium']
};

const DEFAULT_METRICS = calculateHealthMetrics(DEFAULT_ASSESSMENT);

const DEFAULT_USER: UserProfile = {
  id: 'usr_aarav_01',
  role: 'member',
  fullName: 'Aarav Shah',
  email: 'aarav.shah@fitsync.health',
  phone: '+91 98250 12345',
  avatarUrl: '/assets/aarav.jpg',
  gymId: 'gym_fitzone_vadodara',
  membershipTier: 'FitZone Platinum Elite',
  streakDays: 5,
  waterLoggedMl: 2400,
  waterTargetMl: 3300
};

const DEFAULT_LOGGED_MEALS = [
  {
    id: 'meal_1',
    type: 'Breakfast',
    title: 'Oatmeal with Whey Isolate & Blueberries',
    time: '08:15 AM',
    calories: 540,
    protein: 42,
    carbs: 68,
    fat: 12,
    ingredients: 'Rolled oats (80g), whey isolate (30g), almond milk'
  },
  {
    id: 'meal_2',
    type: 'Lunch',
    title: 'Herb Grilled Chicken & Quinoa Fitness Bowl',
    time: '01:30 PM',
    calories: 680,
    protein: 48,
    carbs: 64,
    fat: 22,
    ingredients: 'Grilled chicken breast (180g), tri-color quinoa, avocado, sweet potato'
  }
];

const DEMO_ATTENDANCE_DAYS = [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 26];
const DEMO_ATTENDANCE: AttendanceRecord[] = DEMO_ATTENDANCE_DAYS.map((day) => ({
  id: `att_demo_${day}`,
  date: `2026-10-${day.toString().padStart(2, '0')}`,
  dayNumber: day,
  time: '07:30 AM',
  gymId: 'gym_fitzone_vadodara',
  gymName: 'FitZone Fitness'
}));

export function createDemoState(): AppState {
  const todayDateStr = new Date().toLocaleDateString('en-CA');
  const todayDayName = getTodayDayName();
  const demoMeals = DEFAULT_LOGGED_MEALS.map((m) => ({
    ...m,
    date: todayDateStr
  }));

  return {
    isAuthenticated: true,
    isDemoUser: true,
    lastActiveDate: todayDateStr,
    selectedWorkoutDay: todayDayName,
    userProfile: { ...DEFAULT_USER },
    assessmentData: { ...DEFAULT_ASSESSMENT },
    computedMetrics: { ...DEFAULT_METRICS },
    gyms: INITIAL_GYMS,
    selectedGym: INITIAL_GYMS[0],
    activeWorkout: JSON.parse(JSON.stringify(getWorkoutForDay(todayDayName))),
    predefinedDietPlans: PREDEFINED_DIET_PLANS,
    activeDietPlan: PREDEFINED_DIET_PLANS[0],
    loggedMeals: [...demoMeals],
    notifications: [...INITIAL_NOTIFICATIONS],
    attendanceRecords: [...DEMO_ATTENDANCE],
    trainers: INITIAL_TRAINERS,
    selectedTrainer: INITIAL_TRAINERS[0],
    trainerMessages: [...INITIAL_TRAINER_MESSAGES],
    trainerBookings: [...INITIAL_TRAINER_BOOKINGS]
  };
}

// ---------------- NEWLY REGISTERED USER CLEAN STATE ----------------
// Creates a clean state with NO PREDEFINED MEALS, 0 hydration, 0 volume moved,
// fresh pending workout sets, and personalized body metrics.
export function createCleanUserState(params: NewUserRegistrationParams): AppState {
  const todayDateStr = new Date().toLocaleDateString('en-CA');
  const todayDayName = getTodayDayName();

  const age = params.age && params.age > 0 ? params.age : 24;
  const heightCm = params.heightCm && params.heightCm > 0 ? params.heightCm : 175;
  const weightKg = params.weightKg && params.weightKg > 0 ? params.weightKg : 70;
  const gender = params.gender || 'Male';
  const activity = params.activity || 'Moderately Active';
  const goal = params.goal || 'Build Muscle';
  const diet = params.diet || 'Non-Vegetarian';

  const assessment: HealthAssessmentData = {
    age,
    gender,
    heightCm,
    weightKg,
    activity,
    frequency: '3–4 days/week',
    goal,
    diet,
    allergies: [],
    restrictions: []
  };

  const metrics = calculateHealthMetrics(assessment);
  const waterTarget = Math.round(weightKg * 42);

  // Today's scheduled workout routine with fresh pending sets
  const todayRoutine = getWorkoutForDay(todayDayName);
  const freshExercises = todayRoutine.exercises.map((ex) => ({
    ...ex,
    completedSets: ex.completedSets.map((s, idx) => ({
      ...s,
      set: idx + 1,
      status: 'pending' as const
    }))
  }));

  const freshWorkout: WorkoutRoutine = {
    ...todayRoutine,
    exercises: freshExercises
  };

  // Select suitable diet plan based on goal
  let targetVariantKey = 'muscle_gain';
  if (goal === 'Lose Weight') targetVariantKey = 'fat_loss';
  else if (goal === 'General Fitness' || goal === 'Improve Endurance') targetVariantKey = 'general_fitness';
  else if (goal === 'Increase Strength') targetVariantKey = 'strength';

  const matchingPlan = PREDEFINED_DIET_PLANS.find(
    (p) => p.targetGoal === targetVariantKey
  ) || PREDEFINED_DIET_PLANS[0];

  const gym = params.gym || INITIAL_GYMS[0];

  const userProfile: UserProfile = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role: 'member',
    fullName: params.fullName.trim(),
    email: params.email.trim().toLowerCase(),
    phone: '',
    avatarUrl: '', // Clean empty avatar triggers dynamic initial avatar
    gymId: gym.id,
    membershipTier: `${gym.name} Member`,
    streakDays: 1, // Fresh Day 1
    waterLoggedMl: 0, // Clean start: 0 ml
    waterTargetMl: waterTarget
  };

  const freshNotifications: NotificationItem[] = [
    {
      id: `notif_${Date.now()}`,
      title: `Welcome to ${gym.name}!`,
      desc: `Hi ${params.fullName.split(' ')[0]}, your personal athletic profile has been initialized with clean daily trackers. Track your meals, hydration, and gym workouts right here.`,
      time: 'Just now',
      type: 'gym',
      actionText: 'Get Started',
      isRead: false
    }
  ];

  return {
    isAuthenticated: true,
    isDemoUser: false,
    lastActiveDate: todayDateStr,
    selectedWorkoutDay: todayDayName,
    userProfile,
    assessmentData: assessment,
    computedMetrics: metrics,
    gyms: INITIAL_GYMS,
    selectedGym: gym,
    activeWorkout: freshWorkout,
    predefinedDietPlans: PREDEFINED_DIET_PLANS,
    activeDietPlan: matchingPlan,
    loggedMeals: [], // 100% EMPTY! NO PREDEFINED MEALS!
    notifications: freshNotifications,
    attendanceRecords: [], // 100% EMPTY! NO PREDEFINED ATTENDANCE!
    trainers: INITIAL_TRAINERS,
    selectedTrainer: INITIAL_TRAINERS[0],
    trainerMessages: [
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'trainer',
        senderName: INITIAL_TRAINERS[0].name,
        text: `Welcome to ${gym.name}! I'm Coach ${INITIAL_TRAINERS[0].name.replace('Coach ', '')}, your dedicated strength coach. Whenever you need form checks, workout adjustments, or coaching, send me a message right here!`,
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'general'
      }
    ],
    trainerBookings: []
  };
}

// ---------------- REGISTERED USERS REGISTRY ----------------
export function getRegisteredUsers(): Record<string, RegisteredUserRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to read registered users registry', e);
    return {};
  }
}

export function saveRegisteredUserRecord(record: RegisteredUserRecord) {
  if (typeof window === 'undefined') return;
  try {
    const users = getRegisteredUsers();
    users[record.email.toLowerCase()] = record;
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save registered user record', e);
  }
}

export function findRegisteredUser(email: string): RegisteredUserRecord | null {
  if (!email) return null;
  const users = getRegisteredUsers();
  return users[email.trim().toLowerCase()] || null;
}

// ---------------- GET & SAVE APP STATE ----------------
export function getInitialState(): AppState {
  const todayDateStr = new Date().toLocaleDateString('en-CA');
  const todayDayName = getTodayDayName();

  if (typeof window === 'undefined') {
    const demo = createDemoState();
    return { ...demo, isAuthenticated: false };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const isNewDay = parsed.lastActiveDate && parsed.lastActiveDate !== todayDateStr;

      const userProfile = parsed.userProfile || DEFAULT_USER;
      if (isNewDay) {
        userProfile.waterLoggedMl = 0; // Daily reset: hydration starts fresh today!
      }

      const selectedWorkoutDay: WeekDay = isNewDay ? todayDayName : (parsed.selectedWorkoutDay || todayDayName);
      const activeWorkout = isNewDay 
        ? JSON.parse(JSON.stringify(getWorkoutForDay(todayDayName)))
        : (parsed.activeWorkout || JSON.parse(JSON.stringify(getWorkoutForDay(selectedWorkoutDay))));

      return {
        ...parsed,
        isAuthenticated: typeof parsed.isAuthenticated === 'boolean' ? parsed.isAuthenticated : false,
        lastActiveDate: todayDateStr,
        selectedWorkoutDay,
        userProfile,
        activeWorkout,
        gyms: parsed.gyms || INITIAL_GYMS,
        selectedGym: parsed.selectedGym || INITIAL_GYMS[0],
        predefinedDietPlans: parsed.predefinedDietPlans || PREDEFINED_DIET_PLANS,
        activeDietPlan: parsed.activeDietPlan || PREDEFINED_DIET_PLANS[0],
        loggedMeals: Array.isArray(parsed.loggedMeals) ? parsed.loggedMeals : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        attendanceRecords: Array.isArray(parsed.attendanceRecords) ? parsed.attendanceRecords : [],
        trainers: Array.isArray(parsed.trainers) && parsed.trainers.length > 0 ? parsed.trainers : INITIAL_TRAINERS,
        selectedTrainer: parsed.selectedTrainer || INITIAL_TRAINERS[0],
        trainerMessages: Array.isArray(parsed.trainerMessages) ? parsed.trainerMessages : [...INITIAL_TRAINER_MESSAGES],
        trainerBookings: Array.isArray(parsed.trainerBookings) ? parsed.trainerBookings : [...INITIAL_TRAINER_BOOKINGS]
      };
    }
  } catch (e) {
    console.error('Failed to load state from storage', e);
  }

  const demo = createDemoState();
  return { ...demo, isAuthenticated: false };
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // If this is an authenticated registered user (not demo), keep registry updated
    if (state.isAuthenticated && !state.isDemoUser && state.userProfile?.email) {
      const email = state.userProfile.email.toLowerCase();
      const users = getRegisteredUsers();
      if (users[email]) {
        users[email].state = state;
        users[email].name = state.userProfile.fullName;
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
      }
    }
  } catch (e) {
    console.error('Failed to save state', e);
  }
}
