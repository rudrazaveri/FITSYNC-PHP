// FitSync AI — TypeScript Definitions

export type UserRole = 
  | 'member' 
  | 'trainer' 
  | 'doctor' 
  | 'physiotherapist' 
  | 'gym_admin' 
  | 'platform_admin';

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 
  | 'sedentary' 
  | 'lightly_active' 
  | 'moderately_active' 
  | 'very_active' 
  | 'extremely_active';

export type FitnessGoal = 
  | 'muscle_gain' 
  | 'fat_loss' 
  | 'strength' 
  | 'endurance' 
  | 'general_fitness';

export type DietaryPreference = 
  | 'vegetarian' 
  | 'eggetarian' 
  | 'non_vegetarian' 
  | 'vegan';

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  gymId?: string;
  assignedTrainerId?: string;
  membershipTier?: string;
  streakDays: number;
  waterLoggedMl: number;
  waterTargetMl: number;
}

export interface HealthAssessmentData {
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  heightCm: number;
  weightKg: number;
  waistCm?: number;
  neckCm?: number;
  hipCm?: number;
  activity: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extremely Active';
  frequency: string;
  goal: 'Build Muscle' | 'Lose Weight' | 'Increase Strength' | 'Improve Endurance' | 'General Fitness';
  diet: 'Non-Vegetarian' | 'Vegetarian' | 'Eggetarian' | 'Vegan';
  allergies: string[];
  restrictions: string[];
}

export interface ComputedMetrics {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  calorieTarget: number;
  recommendation: string;
  proteinG: number;
  carbsG: number;
  fatG: number;
  hydrationTargetL: number;
  bodyFatEst: string;
  fitnessScore: number;
  activityScore: number;
  strengthScore: number;
  consistencyScore: number;
  nutritionScore: number;
}

export interface Gym {
  id: string;
  name: string;
  city: string;
  location: string;
  distance: string;
  rating: number;
  reviewsCount: number;
  availableTrainers: number;
  totalMembers: number;
  activeToday: number;
  attendanceRate: string;
  features: string[];
  membershipTiers: {
    name: string;
    price: string;
    access: string;
  }[];
}

export interface ExerciseSet {
  set: number;
  reps: number;
  weight: string;
  status: 'completed' | 'pending';
}

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  thumbnail: string;
  difficulty?: string;
  type?: string;
  targetSets: number;
  targetReps: string;
  targetWeight: string;
  restSeconds: number;
  completedSets: ExerciseSet[];
  instructions: string[];
  commonMistakes: string;
  trainerTip: string;
}

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface WorkoutRoutine {
  id: string;
  title: string;
  focus: string;
  duration: string;
  totalExercises: number;
  difficulty: string;
  day?: WeekDay;
  exercises: Exercise[];
}

export interface Meal {
  id: string;
  date?: string; // YYYY-MM-DD
  type: 'Breakfast' | 'Lunch' | 'Evening Snack' | 'Dinner' | 'Pre-Workout Snack';
  title: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string;
  image?: string;
}

export interface PredefinedDietPlan {
  id: string;
  title: string;
  targetGoal: FitnessGoal;
  dietaryVariant: DietaryPreference;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  description: string;
  meals: {
    type: string;
    title: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string;
    alternatives: string;
  }[];
}

export interface FoodReactionLog {
  id: string;
  food: string;
  consumedAt: string;
  reaction: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'None';
  recurrenceCount: number;
  notes: string;
  patternDetected: boolean;
  aiObservation?: string;
  disclaimer?: string;
}

export interface HealthcareProvider {
  id: string;
  name: string;
  role: string;
  type: 'doctor' | 'physiotherapist';
  specialty: string;
  qualifications: string;
  clinic: string;
  location: string;
  experience: string;
  rating: number;
  reviewsCount: number;
  avatar: string;
  consultationFee: string;
  bio: string;
  availableDays: string[];
  weeklyTimeSlots: Record<string, string[]>;
  consultationTypes: string[];
}

export interface Appointment {
  id: string;
  providerId: string;
  providerName: string;
  providerRole: string;
  providerAvatar: string;
  clinic: string;
  date: string;
  time: string;
  type: 'Online Video Consultation' | 'In-Person Clinical Visit';
  status: 'Upcoming' | 'Confirmed' | 'Completed' | 'Cancelled';
  meetingLink?: string | null;
  agenda: string;
  notes?: string;
}

export interface HealthReport {
  id: string;
  title: string;
  type: string;
  uploadDate: string;
  fileType: string;
  fileSize: string;
  lab: string;
  sharedWithDoctor: boolean;
  sharedWithPhysio: boolean;
  sharedWithTrainer: boolean;
  highlights: string;
  notes: string;
}

export interface TrainerIntervention {
  id: string;
  memberName: string;
  memberAge: number;
  memberAvatar: string;
  status: string;
  statusColor: 'red' | 'yellow' | 'green';
  issue: string;
  aiRecommendation: string;
  lastWorkout: string;
  currentWeight: string;
  attendanceTrend: string;
}

export interface Trainer {
  id: string;
  name: string;
  gymId: string;
  gymName: string;
  role: string;
  avatar: string;
  experience: string;
  rating: number;
  reviewsCount: number;
  specializations: string[];
  certifications: string[];
  bio: string;
  assignedMembersCount: number;
  availabilityStatus: string;
  weeklySchedule: string;
  phone?: string;
  email?: string;
}

export interface TrainerMessage {
  id: string;
  sender: 'user' | 'trainer';
  senderName: string;
  text: string;
  timestamp: string; // ISO or readable
  time: string; // e.g. "10:30 AM"
  category?: 'general' | 'form_check' | 'nutrition' | 'schedule';
}

export interface TrainerClientAthlete {
  id: string;
  name: string;
  email: string;
  avatar: string;
  age: number;
  goal: string;
  lastActive: string;
  attendanceConsistency: string;
  status: 'Active on Floor' | 'Rest Day' | 'Needs Technique Check' | 'Session Booked';
  currentWeight: string;
  activeRoutineTitle: string;
}

export interface TrainerBooking {
  id: string;
  trainerId: string;
  trainerName: string;
  date: string;
  timeSlot: string;
  focusArea: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'health' | 'workout' | 'nutrition' | 'gym' | 'trainer';
  actionText: string;
  isRead?: boolean;
}

export type PlatformMode = 'standard' | 'enterprise';

