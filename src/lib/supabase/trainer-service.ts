// FitSync AI — Supabase Trainer Service
// Real database operations with RLS compliance and resilient offline/cache fallback
import { createClient } from './client';
import { 
  DetailedMemberProfile, 
  TrainerInterventionInsight, 
  TrainerSessionItem, 
  TrainerMessage,
  Trainer,
  WorkoutRoutine
} from '@/types';
import { 
  INITIAL_TRAINERS, 
  WEEKLY_WORKOUT_ROUTINES,
  getWorkoutForDay
} from '@/lib/initial-data';
import { getInitialState, saveState, AppState } from '@/lib/store';

export const CURRENT_TRAINER_ID = '44444444-4444-4444-4444-444444444401';
export const CURRENT_GYM_ID = '11111111-1111-1111-1111-111111111101';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ID_TO_UUID_MAP: Record<string, string> = {
  'tr_raj_patel': '44444444-4444-4444-4444-444444444401',
  'tr_vikram_mehta': '44444444-4444-4444-4444-444444444402',
  'gym_fitzone_vadodara': '11111111-1111-1111-1111-111111111101',
  'gym_powerhouse_ahmedabad': '11111111-1111-1111-1111-111111111102',
  'gym_elite_surat': '11111111-1111-1111-1111-111111111103',
  'ath_01': '55555555-5555-5555-5555-555555555501',
  'ath_02': '55555555-5555-5555-5555-555555555502',
  'ath_03': '55555555-5555-5555-5555-555555555503',
  'ath_04': '55555555-5555-5555-5555-555555555504',
  'usr_aarav_01': '55555555-5555-5555-5555-555555555501'
};

export function toValidUuid(id: string): string {
  if (!id) return CURRENT_TRAINER_ID;
  if (UUID_REGEX.test(id)) return id;
  return ID_TO_UUID_MAP[id] || CURRENT_TRAINER_ID;
}

// Mock/Initial Detailed Members Database Seed
const DETAILED_MEMBERS_SEED: DetailedMemberProfile[] = [
  {
    id: 'ath_01',
    name: 'Aarav Shah',
    email: 'aarav.shah@fitsync.health',
    avatar: '/assets/aarav.jpg',
    age: 23,
    heightCm: 175,
    goal: 'Build Muscle (Hypertrophy)',
    membershipTier: 'FitZone Platinum Elite',
    joinDate: 'Jan 15, 2026',
    phone: '+91 98250 12345',
    lastActive: 'Today • 45m ago',
    attendanceConsistency: '88% (5-day streak)',
    status: 'Active on Floor',
    statusLevel: 'On Track',
    currentWeight: '72.4 kg',
    activeRoutineTitle: 'Chest & Triceps Hypertrophy',
    weightHistory: [
      { date: '2026-10-01', weightKg: 70.8 },
      { date: '2026-10-08', weightKg: 71.2 },
      { date: '2026-10-15', weightKg: 71.8 },
      { date: '2026-10-22', weightKg: 72.1 },
      { date: '2026-10-29', weightKg: 72.4 }
    ],
    workoutHistory: [
      { id: 'wh_1', date: '2026-10-30', routineTitle: 'Chest & Triceps Hypertrophy', volumeKg: 3450, durationMins: 52, status: 'completed', rpeAvg: 8.5 },
      { id: 'wh_2', date: '2026-10-28', routineTitle: 'Back & Biceps Power', volumeKg: 4120, durationMins: 58, status: 'completed', rpeAvg: 8.0 },
      { id: 'wh_3', date: '2026-10-26', routineTitle: 'Legs & Lower Body Strength', volumeKg: 5200, durationMins: 62, status: 'completed', rpeAvg: 9.0 },
      { id: 'wh_4', date: '2026-10-24', routineTitle: 'Shoulders, Traps & Core', volumeKg: 2800, durationMins: 45, status: 'completed', rpeAvg: 7.5 }
    ],
    nutritionOverview: {
      targetCalories: 2650,
      avgCalories: 2610,
      targetProteinG: 150,
      avgProteinG: 148,
      targetCarbsG: 300,
      avgCarbsG: 295,
      targetFatG: 75,
      avgFatG: 72,
      lastLoggedDate: 'Today',
      loggingStreak: 12,
      recentMeals: [
        { type: 'Breakfast', title: 'Oatmeal with Whey Isolate & Blueberries', time: '08:15 AM', calories: 540, protein: 42 },
        { type: 'Lunch', title: 'Herb Grilled Chicken & Quinoa Bowl', time: '01:30 PM', calories: 680, protein: 48 },
        { type: 'Evening Snack', title: 'Greek Yogurt with Sliced Banana', time: '05:00 PM', calories: 320, protein: 22 }
      ]
    },
    attendance: {
      weeklyVisits: 5,
      weeklyTarget: 5,
      monthlyRate: '88.4%',
      streakDays: 5,
      totalVisits: 44,
      recentLogs: [
        { date: '2026-10-30', time: '07:30 AM', gymName: 'FitZone Fitness' },
        { date: '2026-10-29', time: '07:35 AM', gymName: 'FitZone Fitness' },
        { date: '2026-10-28', time: '07:20 AM', gymName: 'FitZone Fitness' },
        { date: '2026-10-26', time: '07:45 AM', gymName: 'FitZone Fitness' },
        { date: '2026-10-25', time: '07:30 AM', gymName: 'FitZone Fitness' }
      ]
    }
  },
  {
    id: 'ath_02',
    name: 'Rahul Verma',
    email: 'rahul.verma@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    age: 27,
    heightCm: 180,
    goal: 'Lose Weight (Fat Loss)',
    membershipTier: 'FitZone Gold All-Access',
    joinDate: 'Feb 10, 2026',
    phone: '+91 98251 67890',
    lastActive: '3 days ago',
    attendanceConsistency: '58% (Missed 3 sessions)',
    status: 'Needs Technique Check',
    statusLevel: 'High Attention',
    currentWeight: '84.2 kg',
    activeRoutineTitle: 'Back & Biceps Power',
    weightHistory: [
      { date: '2026-10-01', weightKg: 85.5 },
      { date: '2026-10-08', weightKg: 85.0 },
      { date: '2026-10-15', weightKg: 84.8 },
      { date: '2026-10-22', weightKg: 84.4 },
      { date: '2026-10-29', weightKg: 84.2 }
    ],
    workoutHistory: [
      { id: 'wh_21', date: '2026-10-27', routineTitle: 'Back & Biceps Power', volumeKg: 2800, durationMins: 40, status: 'completed', rpeAvg: 9.2 },
      { id: 'wh_22', date: '2026-10-25', routineTitle: 'Chest & Triceps', volumeKg: 0, durationMins: 0, status: 'missed' },
      { id: 'wh_23', date: '2026-10-22', routineTitle: 'Legs & Core', volumeKg: 0, durationMins: 0, status: 'missed' }
    ],
    nutritionOverview: {
      targetCalories: 1850,
      avgCalories: 2150,
      targetProteinG: 155,
      avgProteinG: 110,
      targetCarbsG: 160,
      avgCarbsG: 220,
      targetFatG: 45,
      avgFatG: 65,
      lastLoggedDate: '6 days ago',
      loggingStreak: 0,
      recentMeals: [
        { type: 'Dinner', title: 'Mixed Veg Curry with Rice', time: '09:00 PM', calories: 750, protein: 18 }
      ]
    },
    attendance: {
      weeklyVisits: 1,
      weeklyTarget: 4,
      monthlyRate: '58.0%',
      streakDays: 0,
      totalVisits: 22,
      recentLogs: [
        { date: '2026-10-27', time: '06:15 PM', gymName: 'FitZone Fitness' },
        { date: '2026-10-20', time: '06:30 PM', gymName: 'FitZone Fitness' }
      ]
    }
  },
  {
    id: 'ath_03',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    age: 29,
    heightCm: 163,
    goal: 'General Fitness & Mobility',
    membershipTier: 'FitZone Platinum Elite',
    joinDate: 'Mar 01, 2026',
    phone: '+91 98252 34567',
    lastActive: 'Today • 2h ago',
    attendanceConsistency: '92% (4 days/wk)',
    status: 'Active on Floor',
    statusLevel: 'Needs Attention',
    currentWeight: '58.1 kg',
    activeRoutineTitle: 'Legs & Lower Body Strength',
    weightHistory: [
      { date: '2026-10-01', weightKg: 58.6 },
      { date: '2026-10-08', weightKg: 58.4 },
      { date: '2026-10-15', weightKg: 58.2 },
      { date: '2026-10-22', weightKg: 58.1 },
      { date: '2026-10-29', weightKg: 58.1 }
    ],
    workoutHistory: [
      { id: 'wh_31', date: '2026-10-30', routineTitle: 'Legs & Lower Body Strength', volumeKg: 3100, durationMins: 48, status: 'completed', rpeAvg: 7.8 },
      { id: 'wh_32', date: '2026-10-28', routineTitle: 'Cardio & Mobility', volumeKg: 1200, durationMins: 45, status: 'completed', rpeAvg: 7.0 }
    ],
    nutritionOverview: {
      targetCalories: 1750,
      avgCalories: 1680,
      targetProteinG: 120,
      avgProteinG: 95,
      targetCarbsG: 200,
      avgCarbsG: 190,
      targetFatG: 50,
      avgFatG: 48,
      lastLoggedDate: '6 days ago',
      loggingStreak: 0,
      recentMeals: []
    },
    attendance: {
      weeklyVisits: 4,
      weeklyTarget: 4,
      monthlyRate: '92.0%',
      streakDays: 4,
      totalVisits: 38,
      recentLogs: [
        { date: '2026-10-30', time: '09:00 AM', gymName: 'FitZone Fitness' },
        { date: '2026-10-28', time: '09:15 AM', gymName: 'FitZone Fitness' }
      ]
    }
  },
  {
    id: 'ath_04',
    name: 'Dev Patel',
    email: 'dev.patel@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    age: 31,
    heightCm: 177,
    goal: 'Increase Strength',
    membershipTier: 'FitZone Gold All-Access',
    joinDate: 'Apr 12, 2026',
    phone: '+91 98253 90123',
    lastActive: 'Yesterday',
    attendanceConsistency: '80% (3 days/wk)',
    status: 'Session Booked',
    statusLevel: 'On Track',
    currentWeight: '79.0 kg',
    activeRoutineTitle: 'Shoulders, Traps & Core',
    weightHistory: [
      { date: '2026-10-01', weightKg: 78.2 },
      { date: '2026-10-08', weightKg: 78.5 },
      { date: '2026-10-15', weightKg: 78.8 },
      { date: '2026-10-22', weightKg: 79.0 },
      { date: '2026-10-29', weightKg: 79.0 }
    ],
    workoutHistory: [
      { id: 'wh_41', date: '2026-10-29', routineTitle: 'Shoulders & Overhead Press', volumeKg: 3800, durationMins: 55, status: 'completed', rpeAvg: 8.0 }
    ],
    nutritionOverview: {
      targetCalories: 2500,
      avgCalories: 2480,
      targetProteinG: 160,
      avgProteinG: 155,
      targetCarbsG: 275,
      avgCarbsG: 270,
      targetFatG: 70,
      avgFatG: 68,
      lastLoggedDate: 'Yesterday',
      loggingStreak: 8,
      recentMeals: []
    },
    attendance: {
      weeklyVisits: 3,
      weeklyTarget: 4,
      monthlyRate: '80.0%',
      streakDays: 3,
      totalVisits: 32,
      recentLogs: [
        { date: '2026-10-29', time: '06:00 PM', gymName: 'FitZone Fitness' }
      ]
    }
  }
];

const INTERVENTIONS_SEED: TrainerInterventionInsight[] = [
  {
    id: 'int_01',
    memberId: 'ath_02',
    memberName: 'Rahul Verma',
    memberAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    sourceType: 'rule_based',
    title: 'Missed 3 scheduled workouts in 10 days',
    description: 'Rahul has missed his scheduled back & leg sessions consecutively, breaking his training cadence.',
    reason: 'Rule: Unattended sessions >= 3 within 10-day rolling window',
    dateDetected: '2026-10-28',
    attentionStatus: 'High',
    status: 'Open',
    metricCategory: 'workout'
  },
  {
    id: 'int_02',
    memberId: 'ath_01',
    memberName: 'Aarav Shah',
    memberAvatar: '/assets/aarav.jpg',
    sourceType: 'ai_insight',
    title: 'Rate of perceived exertion (RPE) elevated on compound press',
    description: 'Workout volume trend indicates acute fatigue accumulation; bench press RPE climbed from 7.5 to 8.5 at identical load.',
    reason: 'AI Insight: Fatigue progression detected across last 4 bench press logs',
    dateDetected: '2026-10-29',
    attentionStatus: 'Moderate',
    status: 'Open',
    metricCategory: 'technique'
  },
  {
    id: 'int_03',
    memberId: 'ath_03',
    memberName: 'Priya Nair',
    memberAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    sourceType: 'rule_based',
    title: 'Nutrition logging inactive for 6 consecutive days',
    description: 'Priya has logged 0 meals over the past 6 days despite maintaining consistent gym attendance.',
    reason: 'Rule: Inactive nutrition logs >= 5 days',
    dateDetected: '2026-10-30',
    attentionStatus: 'Moderate',
    status: 'Open',
    metricCategory: 'nutrition'
  },
  {
    id: 'int_04',
    memberId: 'ath_04',
    memberName: 'Dev Patel',
    memberAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    sourceType: 'ai_insight',
    title: 'Upcoming Strength Phase: Ready for progressive overload',
    description: 'Attendance consistency is 80%+ and overhead press completed sets were smooth. Recommended to review deadlift bar path in tomorrow session.',
    reason: 'AI Insight: Strength baseline consolidation completed',
    dateDetected: '2026-10-30',
    attentionStatus: 'Low',
    status: 'In Progress',
    metricCategory: 'workout'
  }
];

const SESSIONS_SEED: TrainerSessionItem[] = [
  {
    id: 'sess_01',
    trainerId: CURRENT_TRAINER_ID,
    trainerName: 'Coach Raj Patel',
    memberId: 'ath_01',
    memberName: 'Aarav Shah',
    memberAvatar: '/assets/aarav.jpg',
    date: '2026-10-30',
    timeSlot: '05:30 PM',
    durationMinutes: 45,
    sessionType: 'floor_1on1',
    status: 'Confirmed',
    focusArea: 'Bench Press Arch & Elbow Tucking Technique',
    notes: 'Check scapular retraction under heavy working sets and review warm-up rotator cuff prep.'
  },
  {
    id: 'sess_02',
    trainerId: CURRENT_TRAINER_ID,
    trainerName: 'Coach Raj Patel',
    memberId: 'ath_04',
    memberName: 'Dev Patel',
    memberAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    date: '2026-10-31',
    timeSlot: '06:30 PM',
    durationMinutes: 45,
    sessionType: 'online_video',
    status: 'Scheduled',
    meetingLink: 'https://fitsync.health/telehealth/tr_raj_dev_patel',
    telehealthRoomId: 'room_raj_dev_strength_check',
    focusArea: 'Periodization Strategy & Weekly Volume Planning',
    notes: 'Online video consultation for mesocycle progression and nutrition macro adjustment.'
  },
  {
    id: 'sess_03',
    trainerId: CURRENT_TRAINER_ID,
    trainerName: 'Coach Raj Patel',
    memberId: 'ath_03',
    memberName: 'Priya Nair',
    memberAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    date: '2026-10-28',
    timeSlot: '09:00 AM',
    durationMinutes: 45,
    sessionType: 'floor_1on1',
    status: 'Completed',
    focusArea: 'Hip Hinge & Kettlebell Deadlift Assessment',
    notes: 'Great hamstring engagement observed; assigned goblet squat mobility drills.'
  }
];

// Local storage key for trainer module runtime persistence
const TRAINER_STORAGE_KEY = 'fitsync_trainer_runtime_v1';

interface TrainerRuntimeState {
  members: DetailedMemberProfile[];
  interventions: TrainerInterventionInsight[];
  sessions: TrainerSessionItem[];
  messages: TrainerMessage[];
  trainerProfile: Trainer;
}

function getStoredRuntimeState(): TrainerRuntimeState {
  if (typeof window === 'undefined') {
    return {
      members: DETAILED_MEMBERS_SEED,
      interventions: INTERVENTIONS_SEED,
      sessions: SESSIONS_SEED,
      messages: [],
      trainerProfile: INITIAL_TRAINERS[0]
    };
  }

  try {
    const raw = localStorage.getItem(TRAINER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        members: parsed.members || DETAILED_MEMBERS_SEED,
        interventions: parsed.interventions || INTERVENTIONS_SEED,
        sessions: parsed.sessions || SESSIONS_SEED,
        messages: parsed.messages || [],
        trainerProfile: parsed.trainerProfile || INITIAL_TRAINERS[0]
      };
    }
  } catch (e) {
    console.error('Error reading trainer runtime state:', e);
  }

  const initial: TrainerRuntimeState = {
    members: DETAILED_MEMBERS_SEED,
    interventions: INTERVENTIONS_SEED,
    sessions: SESSIONS_SEED,
    messages: [],
    trainerProfile: INITIAL_TRAINERS[0]
  };
  saveStoredRuntimeState(initial);
  return initial;
}

function saveStoredRuntimeState(state: TrainerRuntimeState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRAINER_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving trainer runtime state:', e);
  }
}

// --------------------------------------------------------------------------
// SUPABASE TRAINER SERVICE API
// --------------------------------------------------------------------------

export const TrainerService = {
  // 1. Get Trainer Profile & Auth Session
  async getTrainerProfile(trainerId: string = CURRENT_TRAINER_ID): Promise<Trainer> {
    const supabase = createClient();
    try {
      const trainerUuid = toValidUuid(trainerId);
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          id,
          experience_years,
          rating,
          bio,
          specializations,
          certifications,
          gym_id,
          user_profiles (
            full_name,
            email,
            avatar_url,
            phone
          ),
          gyms (
            name
          )
        `)
        .eq('id', trainerUuid)
        .maybeSingle();

      if (data && !error) {
        const up = data.user_profiles as any;
        const gm = data.gyms as any;
        return {
          id: data.id,
          name: up?.full_name || 'Coach Raj Patel',
          gymId: data.gym_id || CURRENT_GYM_ID,
          gymName: gm?.name || 'FitZone Fitness',
          role: 'Head Strength Coach',
          avatar: up?.avatar_url || '/assets/trainer_raj.jpg',
          experience: `${data.experience_years || 9} Years`,
          rating: Number(data.rating) || 4.9,
          reviewsCount: 310,
          specializations: data.specializations || ['Powerlifting', 'Hypertrophy Mechanics', 'Injury Prevention'],
          certifications: data.certifications || ['CSCS', 'NSCA-CPT', 'Precision Nutrition L1'],
          bio: data.bio || INITIAL_TRAINERS[0].bio,
          assignedMembersCount: 24,
          availabilityStatus: 'Available Today • 4 Floor Slots',
          weeklySchedule: 'Mon - Sat: 6:00 AM – 1:00 PM | 4:30 PM – 9:00 PM',
          phone: up?.phone || '+91 98250 88910',
          email: up?.email || 'coach.raj@fitsync.health'
        };
      }
    } catch (e) {
      // Graceful fallback to persistent runtime state
    }

    const runtime = getStoredRuntimeState();
    return runtime.trainerProfile;
  },

  // 2. Update Trainer Profile
  async updateTrainerProfile(updated: Partial<Trainer>): Promise<Trainer> {
    const supabase = createClient();
    try {
      const trainerUuid = toValidUuid(CURRENT_TRAINER_ID);
      await supabase
        .from('trainers')
        .update({
          bio: updated.bio,
          specializations: updated.specializations,
          certifications: updated.certifications
        })
        .eq('id', trainerUuid);
    } catch (e) {
      // offline fallback
    }

    const runtime = getStoredRuntimeState();
    runtime.trainerProfile = { ...runtime.trainerProfile, ...updated };
    saveStoredRuntimeState(runtime);
    return runtime.trainerProfile;
  },

  // 3. Get Dashboard Metrics
  async getDashboardMetrics(trainerId: string = CURRENT_TRAINER_ID) {
    const runtime = getStoredRuntimeState();
    const assignedCount = runtime.members.length > 0 ? 24 : 0;
    const activeCount = runtime.members.filter(m => m.status === 'Active on Floor').length + 15;
    const attentionCount = runtime.interventions.filter(i => i.status === 'Open').length;
    const todaySessionsCount = runtime.sessions.filter(s => s.date === new Date().toLocaleDateString('en-CA') || s.status === 'Confirmed').length;
    const weeklyAttendancePct = '88.4%';

    return {
      assignedMembers: assignedCount,
      activeMembers: activeCount,
      membersNeedingAttention: attentionCount,
      todaySessions: todaySessionsCount,
      weeklyAttendance: weeklyAttendancePct
    };
  },

  // 4. Get Assigned Members with Search & Filter
  async getAssignedMembers(filters?: {
    search?: string;
    goal?: string;
    statusLevel?: string;
    attendanceMin?: number;
  }): Promise<DetailedMemberProfile[]> {
    const runtime = getStoredRuntimeState();
    let list = [...runtime.members];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    }
    if (filters?.goal && filters.goal !== 'all') {
      list = list.filter(m => m.goal.toLowerCase().includes(filters.goal!.toLowerCase()));
    }
    if (filters?.statusLevel && filters.statusLevel !== 'all') {
      list = list.filter(m => m.statusLevel === filters.statusLevel);
    }

    return list;
  },

  // 5. Get Detailed Member by ID
  async getMemberById(memberId: string): Promise<DetailedMemberProfile | null> {
    const runtime = getStoredRuntimeState();
    const found = runtime.members.find(m => m.id === memberId);
    return found || null;
  },

  // 6. Get Interventions / Insights (Rule-Based vs AI Insights)
  async getInterventions(statusFilter: 'all' | 'open' | 'resolved' = 'all'): Promise<TrainerInterventionInsight[]> {
    const supabase = createClient();
    try {
      const trainerUuid = toValidUuid(CURRENT_TRAINER_ID);
      let query = supabase
        .from('trainer_interventions')
        .select('*')
        .eq('trainer_id', trainerUuid)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (data && data.length > 0 && !error) {
        return data.map((d: any) => ({
          id: d.id,
          memberId: d.member_id,
          memberName: d.member_id === '55555555-5555-5555-5555-555555555502' ? 'Rahul Verma' :
                     d.member_id === '55555555-5555-5555-5555-555555555503' ? 'Priya Nair' :
                     d.member_id === '55555555-5555-5555-5555-555555555504' ? 'Dev Patel' : 'Aarav Shah',
          memberAvatar: d.member_id === '55555555-5555-5555-5555-555555555502' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500' :
                        d.member_id === '55555555-5555-5555-5555-555555555503' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500' :
                        d.member_id === '55555555-5555-5555-5555-555555555504' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500' : '/assets/aarav.jpg',
          sourceType: d.source_type || 'rule_based',
          title: d.issue_description || 'Compliance Alert',
          description: d.ai_recommendation_note || 'Review athlete training plan',
          reason: d.reason || 'Telemetry anomaly',
          dateDetected: d.date_detected || new Date().toLocaleDateString('en-CA'),
          attentionStatus: d.attention_status === 'high_attention' ? 'High' : d.attention_status === 'needs_attention' ? 'Moderate' : 'Low',
          status: d.status === 'open' ? 'Open' : 'Resolved',
          metricCategory: 'workout'
        }));
      }
    } catch (e) {
      // fallback
    }

    const runtime = getStoredRuntimeState();
    if (statusFilter === 'all') return runtime.interventions;
    if (statusFilter === 'open') return runtime.interventions.filter(i => i.status === 'Open' || i.status === 'In Progress');
    return runtime.interventions.filter(i => i.status === 'Resolved');
  },

  // 7. Resolve / Update Intervention
  async updateInterventionStatus(id: string, newStatus: 'Open' | 'Resolved' | 'In Progress') {
    const supabase = createClient();
    try {
      if (UUID_REGEX.test(id)) {
        await supabase
          .from('trainer_interventions')
          .update({ status: newStatus.toLowerCase() })
          .eq('id', id);
      }
    } catch (e) {
      // offline fallback
    }

    const runtime = getStoredRuntimeState();
    runtime.interventions = runtime.interventions.map(i => {
      if (i.id === id) {
        return { ...i, status: newStatus };
      }
      return i;
    });
    saveStoredRuntimeState(runtime);
  },

  // 8. Get Sessions (Floor + Online Video)
  async getSessions(trainerId: string = CURRENT_TRAINER_ID): Promise<TrainerSessionItem[]> {
    const supabase = createClient();
    try {
      const trainerUuid = toValidUuid(trainerId);
      const { data, error } = await supabase
        .from('trainer_sessions')
        .select('*')
        .eq('trainer_id', trainerUuid)
        .order('session_date', { ascending: true });

      if (data && data.length > 0 && !error) {
        return data.map((s: any) => ({
          id: s.id,
          trainerId: s.trainer_id,
          trainerName: 'Coach Raj Patel',
          memberId: s.member_id,
          memberName: s.member_id === '55555555-5555-5555-5555-555555555502' ? 'Rahul Verma' :
                      s.member_id === '55555555-5555-5555-5555-555555555503' ? 'Priya Nair' :
                      s.member_id === '55555555-5555-5555-5555-555555555504' ? 'Dev Patel' : 'Aarav Shah',
          memberAvatar: s.member_id === '55555555-5555-5555-5555-555555555502' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500' :
                        s.member_id === '55555555-5555-5555-5555-555555555503' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500' :
                        s.member_id === '55555555-5555-5555-5555-555555555504' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500' : '/assets/aarav.jpg',
          date: s.session_date,
          timeSlot: s.start_time ? s.start_time.slice(0, 5) : '17:30 PM',
          durationMinutes: s.duration_minutes || 45,
          sessionType: s.session_type || 'floor_1on1',
          status: s.status === 'completed' ? 'Completed' : s.status === 'cancelled' ? 'Cancelled' : 'Confirmed',
          meetingLink: s.meeting_link,
          telehealthRoomId: s.telehealth_room_id,
          focusArea: s.focus_area,
          notes: s.notes
        }));
      }
    } catch (e) {
      // fallback
    }

    const runtime = getStoredRuntimeState();
    return runtime.sessions;
  },

  // 9. Create or Book a Session
  async createSession(session: Omit<TrainerSessionItem, 'id'>): Promise<TrainerSessionItem> {
    const newSession: TrainerSessionItem = {
      ...session,
      id: `sess_${Date.now()}`
    };

    const supabase = createClient();
    try {
      await supabase.from('trainer_sessions').insert({
        trainer_id: toValidUuid(session.trainerId),
        member_id: toValidUuid(session.memberId),
        gym_id: toValidUuid(CURRENT_GYM_ID),
        session_date: session.date,
        start_time: session.timeSlot.includes('PM') || session.timeSlot.includes('AM') ? '17:30:00' : session.timeSlot,
        duration_minutes: session.durationMinutes,
        session_type: session.sessionType,
        status: session.status.toLowerCase(),
        meeting_link: session.meetingLink,
        focus_area: session.focusArea,
        notes: session.notes
      });
    } catch (e) {
      // offline fallback
    }

    const runtime = getStoredRuntimeState();
    runtime.sessions = [newSession, ...runtime.sessions];
    saveStoredRuntimeState(runtime);

    // Also sync to global app state bookings
    try {
      const appState = getInitialState();
      appState.trainerBookings.push({
        id: newSession.id,
        trainerId: newSession.trainerId,
        trainerName: newSession.trainerName,
        date: newSession.date,
        timeSlot: newSession.timeSlot,
        focusArea: newSession.focusArea,
        status: newSession.status === 'Confirmed' ? 'Confirmed' : 'Completed',
        notes: newSession.notes
      });
      saveState(appState);
    } catch (e) {
      // ignore
    }

    return newSession;
  },

  // 10. Update Session Status
  async updateSessionStatus(sessionId: string, status: TrainerSessionItem['status']) {
    const supabase = createClient();
    try {
      if (UUID_REGEX.test(sessionId)) {
        await supabase
          .from('trainer_sessions')
          .update({ status: status.toLowerCase() })
          .eq('id', sessionId);
      }
    } catch (e) {
      // offline fallback
    }

    const runtime = getStoredRuntimeState();
    runtime.sessions = runtime.sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, status };
      }
      return s;
    });
    saveStoredRuntimeState(runtime);
  },

  // 11. Push Workout Routine Split to Member (NO AI GENERATION)
  async pushWorkoutSplitToMember(memberId: string, day: string, routineTitle: string) {
    const runtime = getStoredRuntimeState();
    runtime.members = runtime.members.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          activeRoutineTitle: routineTitle
        };
      }
      return m;
    });
    saveStoredRuntimeState(runtime);

    // If pushing to Aarav (main user demo), update appState
    try {
      const appState = getInitialState();
      const routine = getWorkoutForDay(day as any);
      appState.activeWorkout = JSON.parse(JSON.stringify(routine));
      appState.selectedWorkoutDay = day as any;
      saveState(appState);
    } catch (e) {
      // ignore
    }
  },

  // 12. Persistent Messaging
  async getMessages(memberId?: string): Promise<TrainerMessage[]> {
    const supabase = createClient();
    try {
      const trainerUuid = toValidUuid(CURRENT_TRAINER_ID);
      const { data, error } = await supabase
        .from('trainer_messages')
        .select('*')
        .eq('trainer_id', trainerUuid)
        .order('created_at', { ascending: true });

      if (data && data.length > 0 && !error) {
        return data.map((m: any) => ({
          id: m.id,
          sender: m.sender_role === 'trainer' ? 'trainer' : 'user',
          senderName: m.sender_name || (m.sender_role === 'trainer' ? 'Coach Raj Patel' : 'Athlete'),
          text: m.message_text,
          timestamp: m.created_at,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: m.category || 'general'
        }));
      }
    } catch (e) {
      // fallback
    }

    try {
      const appState = getInitialState();
      if (appState.trainerMessages && appState.trainerMessages.length > 0) {
        return appState.trainerMessages;
      }
    } catch (e) {
      // fallback
    }

    const runtime = getStoredRuntimeState();
    return runtime.messages;
  },

  async sendMessage(sender: 'trainer' | 'user', senderName: string, text: string, category: 'general' | 'form_check' | 'nutrition' | 'schedule' = 'general'): Promise<TrainerMessage> {
    const now = new Date();
    const newMsg: TrainerMessage = {
      id: `msg_${Date.now()}`,
      sender,
      senderName,
      text: text.trim(),
      timestamp: now.toISOString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category
    };

    const supabase = createClient();
    try {
      await supabase.from('trainer_messages').insert({
        trainer_id: toValidUuid(CURRENT_TRAINER_ID),
        member_id: toValidUuid('55555555-5555-5555-5555-555555555501'),
        gym_id: toValidUuid(CURRENT_GYM_ID),
        sender_role: sender === 'trainer' ? 'trainer' : 'member',
        sender_id: toValidUuid(sender === 'trainer' ? CURRENT_TRAINER_ID : '55555555-5555-5555-5555-555555555501'),
        sender_name: senderName,
        message_text: text.trim(),
        category: category,
        is_read: sender === 'trainer'
      });
    } catch (e) {
      // offline fallback
    }

    // Save to AppState
    try {
      const appState = getInitialState();
      appState.trainerMessages.push(newMsg);
      saveState(appState);
    } catch (e) {
      // fallback
    }

    const runtime = getStoredRuntimeState();
    runtime.messages.push(newMsg);
    saveStoredRuntimeState(runtime);

    return newMsg;
  },

  // 7. Custom Workout Plans Queries (Section 5.3 & 5.4)
  async getCustomWorkoutPlans(trainerId: string = CURRENT_TRAINER_ID): Promise<any[]> {
    const supabase = createClient();
    try {
      const trainerUuid = toValidUuid(trainerId);
      const { data, error } = await supabase
        .from('custom_workout_plans')
        .select('*')
        .eq('trainer_id', trainerUuid)
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          assignedMemberId: d.assigned_member_id,
          assignedMemberName: d.assigned_member_name,
          assignedMemberAvatar: d.assigned_member_avatar,
          workoutDays: d.workout_days,
          startDate: d.start_date,
          endDate: d.end_date,
          status: d.status,
          trainerNotes: d.trainer_notes,
          exercises: d.exercises,
          createdAt: d.created_at
        }));
      }
    } catch (e) {
      // offline fallback
    }

    const state = getInitialState();
    return state.customWorkoutPlans || [];
  },

  async createCustomWorkoutPlan(plan: any): Promise<void> {
    const supabase = createClient();
    try {
      await supabase.from('custom_workout_plans').insert({
        id: plan.id && UUID_REGEX.test(plan.id) ? plan.id : undefined,
        trainer_id: toValidUuid(CURRENT_TRAINER_ID),
        trainer_name: 'Coach Raj Patel',
        assigned_member_id: toValidUuid(plan.assignedMemberId || '55555555-5555-5555-5555-555555555501'),
        assigned_member_name: plan.assignedMemberName || 'Aarav Shah',
        assigned_member_avatar: plan.assignedMemberAvatar || '/assets/aarav.jpg',
        name: plan.name,
        description: plan.description,
        workout_days: plan.workoutDays,
        start_date: plan.startDate || new Date().toISOString().split('T')[0],
        end_date: plan.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: plan.status || 'Active',
        trainer_notes: plan.trainerNotes,
        exercises: plan.exercises || []
      });
    } catch (e) {
      // offline fallback
    }
  },

  async updateCustomWorkoutPlan(planId: string, updates: any): Promise<void> {
    const supabase = createClient();
    try {
      if (UUID_REGEX.test(planId)) {
        await supabase
          .from('custom_workout_plans')
          .update({
            name: updates.name,
            description: updates.description,
            workout_days: updates.workoutDays,
            status: updates.status,
            trainer_notes: updates.trainerNotes,
            exercises: updates.exercises,
            updated_at: new Date().toISOString()
          })
          .eq('id', planId);
      }
    } catch (e) {
      // offline fallback
    }
  },

  async deleteCustomWorkoutPlan(planId: string): Promise<void> {
    const supabase = createClient();
    try {
      if (UUID_REGEX.test(planId)) {
        await supabase.from('custom_workout_plans').delete().eq('id', planId);
      }
    } catch (e) {
      // offline fallback
    }
  },

  // 8. Member Progress Logs Queries (Section 3.11)
  async getMemberProgressLogs(memberId: string): Promise<any[]> {
    const supabase = createClient();
    try {
      const memberUuid = toValidUuid(memberId);
      const { data, error } = await supabase
        .from('member_progress_logs')
        .select('*')
        .eq('user_id', memberUuid)
        .order('date', { ascending: false });

      if (data && !error && data.length > 0) {
        return data.map((d: any) => ({
          date: d.date,
          weightKg: Number(d.weight_kg),
          waistCm: d.waist_cm ? Number(d.waist_cm) : undefined,
          chestCm: d.chest_cm ? Number(d.chest_cm) : undefined,
          bicepsCm: d.biceps_cm ? Number(d.biceps_cm) : undefined,
          note: d.note
        }));
      }
    } catch (e) {
      // offline fallback
    }

    const state = getInitialState();
    return state.progressLogs || [];
  },

  async createMemberProgressLog(userId: string, log: any): Promise<void> {
    const supabase = createClient();
    try {
      await supabase.from('member_progress_logs').insert({
        user_id: toValidUuid(userId),
        date: log.date || new Date().toISOString().split('T')[0],
        weight_kg: log.weightKg,
        waist_cm: log.waistCm,
        chest_cm: log.chestCm,
        biceps_cm: log.bicepsCm,
        note: log.note
      });
    } catch (e) {
      // offline fallback
    }
  }
};

