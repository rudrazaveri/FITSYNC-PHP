// FitSync AI — Core Persistent Data Store
'use client';

import { 
  UserProfile, 
  HealthAssessmentData, 
  ComputedMetrics, 
  Gym, 
  WorkoutRoutine, 
  PredefinedDietPlan, 
  NotificationItem
} from '@/types';
import { 
  INITIAL_GYMS, 
  INITIAL_WORKOUT_ROUTINE, 
  PREDEFINED_DIET_PLANS, 
  INITIAL_NOTIFICATIONS 
} from './initial-data';
import { calculateHealthMetrics } from './assessment-calculator';

const STORAGE_KEY = 'fitsync_ai_state_v2';

export interface AppState {
  isAuthenticated: boolean;
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
}

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

export function getInitialState(): AppState {
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      userProfile: DEFAULT_USER,
      assessmentData: DEFAULT_ASSESSMENT,
      computedMetrics: DEFAULT_METRICS,
      gyms: INITIAL_GYMS,
      selectedGym: INITIAL_GYMS[0],
      activeWorkout: INITIAL_WORKOUT_ROUTINE,
      predefinedDietPlans: PREDEFINED_DIET_PLANS,
      activeDietPlan: PREDEFINED_DIET_PLANS[0],
      loggedMeals: DEFAULT_LOGGED_MEALS,
      notifications: INITIAL_NOTIFICATIONS
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        isAuthenticated: typeof parsed.isAuthenticated === 'boolean' ? parsed.isAuthenticated : false,
        userProfile: parsed.userProfile || DEFAULT_USER,
        assessmentData: parsed.assessmentData || DEFAULT_ASSESSMENT,
        computedMetrics: parsed.computedMetrics || DEFAULT_METRICS,
        gyms: parsed.gyms || INITIAL_GYMS,
        selectedGym: parsed.selectedGym || INITIAL_GYMS[0],
        activeWorkout: parsed.activeWorkout || INITIAL_WORKOUT_ROUTINE,
        predefinedDietPlans: parsed.predefinedDietPlans || PREDEFINED_DIET_PLANS,
        activeDietPlan: parsed.activeDietPlan || PREDEFINED_DIET_PLANS[0],
        loggedMeals: parsed.loggedMeals || DEFAULT_LOGGED_MEALS,
        notifications: parsed.notifications || INITIAL_NOTIFICATIONS
      };
    }
  } catch (e) {
    console.error('Failed to load state from storage', e);
  }

  return {
    isAuthenticated: false,
    userProfile: DEFAULT_USER,
    assessmentData: DEFAULT_ASSESSMENT,
    computedMetrics: DEFAULT_METRICS,
    gyms: INITIAL_GYMS,
    selectedGym: INITIAL_GYMS[0],
    activeWorkout: INITIAL_WORKOUT_ROUTINE,
    predefinedDietPlans: PREDEFINED_DIET_PLANS,
    activeDietPlan: PREDEFINED_DIET_PLANS[0],
    loggedMeals: DEFAULT_LOGGED_MEALS,
    notifications: INITIAL_NOTIFICATIONS
  };
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}
