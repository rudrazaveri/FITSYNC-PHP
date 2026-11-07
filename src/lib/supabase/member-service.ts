// FitSync AI — Supabase Member Service
// Live synchronization between Vercel deployed client and Supabase cloud tables
import { createClient } from './client';
import { NewUserRegistrationParams } from '@/lib/store';
import { toValidUuid } from './trainer-service';

export const MemberService = {
  // 1. Sync User Registration to Supabase (user_profiles & member_health_profiles)
  async syncRegistration(params: NewUserRegistrationParams, userId: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const validUserId = toValidUuid(userId);
      const isTrainer = params.role === 'trainer';

      // Insert or upsert user_profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: validUserId,
          full_name: params.fullName.trim(),
          email: params.email.trim().toLowerCase(),
          role: params.role || 'member',
          phone: params.mobile || params.phone || '',
          mobile: params.mobile || params.phone || '',
          avatar_url: params.avatarUrl || '',
          membership_tier: `${params.gym?.name || 'FitZone'} Member`
        }, { onConflict: 'id' });

      if (profileError) {
        console.warn('Supabase user_profile sync notice:', profileError.message);
      }

      // If member, insert health profile
      if (!isTrainer) {
        const { error: healthError } = await supabase
          .from('member_health_profiles')
          .upsert({
            user_id: validUserId,
            age: params.age || 24,
            gender: params.gender || 'Male',
            height_cm: params.heightCm || 175,
            weight_kg: params.weightKg || 70,
            activity_level: params.activity || 'Moderately Active',
            fitness_goal: params.goal || 'Build Muscle',
            dietary_preference: params.diet || 'Non-Vegetarian'
          }, { onConflict: 'user_id' });

        if (healthError) {
          console.warn('Supabase member_health_profiles sync notice:', healthError.message);
        }
      }

      return true;
    } catch (e) {
      console.warn('Supabase registration sync fallback (using local persistence):', e);
      return false;
    }
  },

  // 2. Sync Logged Meal to Supabase (logged_meals)
  async syncLoggedMeal(userId: string, meal: {
    type: string;
    title: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients?: string;
  }): Promise<boolean> {
    const supabase = createClient();
    try {
      const validUserId = toValidUuid(userId);
      const { error } = await supabase
        .from('logged_meals')
        .insert({
          user_id: validUserId,
          meal_type: meal.type,
          title: meal.title,
          calories: Math.round(meal.calories),
          protein_g: Math.round(meal.protein),
          carbs_g: Math.round(meal.carbs),
          fat_g: Math.round(meal.fat),
          food_items: meal.ingredients || meal.title
        });

      if (error) {
        console.warn('Supabase logged_meals sync notice:', error.message);
      }
      return !error;
    } catch (e) {
      return false;
    }
  },

  // 3. Sync Hydration Log to Supabase (hydration_logs)
  async syncHydration(userId: string, amountMl: number): Promise<boolean> {
    const supabase = createClient();
    try {
      const validUserId = toValidUuid(userId);
      const { error } = await supabase
        .from('hydration_logs')
        .insert({
          user_id: validUserId,
          amount_ml: amountMl
        });

      return !error;
    } catch (e) {
      return false;
    }
  },

  // 4. Sync Biometric Progress Log to Supabase (member_progress_logs)
  async syncProgressLog(userId: string, log: {
    date: string;
    weightKg: number;
    waistCm?: number;
    chestCm?: number;
    bicepsCm?: number;
    note?: string;
  }): Promise<boolean> {
    const supabase = createClient();
    try {
      const validUserId = toValidUuid(userId);
      const { error } = await supabase
        .from('member_progress_logs')
        .insert({
          user_id: validUserId,
          date: log.date,
          weight_kg: log.weightKg,
          waist_cm: log.waistCm || null,
          chest_cm: log.chestCm || null,
          biceps_cm: log.bicepsCm || null,
          note: log.note || ''
        });

      return !error;
    } catch (e) {
      return false;
    }
  },

  // 5. Sync Membership Request to Supabase (membership_requests)
  async syncMembershipRequest(userId: string, gymId: string, gymName: string, planName: string, price: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const validUserId = toValidUuid(userId);
      const validGymId = toValidUuid(gymId);
      const { error } = await supabase
        .from('membership_requests')
        .insert({
          user_id: validUserId,
          gym_id: validGymId,
          gym_name: gymName,
          plan_name: planName,
          price: price,
          status: 'Active'
        });

      return !error;
    } catch (e) {
      return false;
    }
  },

  // 6. Sync Trainer Connection Request to Supabase (trainer_connection_requests)
  async syncTrainerConnectionRequest(
    memberId: string,
    memberName: string,
    trainerId: string,
    trainerName: string,
    message?: string
  ): Promise<boolean> {
    const supabase = createClient();
    try {
      const validMemberId = toValidUuid(memberId);
      const validTrainerId = toValidUuid(trainerId);
      const { error } = await supabase
        .from('trainer_connection_requests')
        .insert({
          member_id: validMemberId,
          member_name: memberName,
          trainer_id: validTrainerId,
          trainer_name: trainerName,
          status: 'Connected',
          message: message || 'Connected via FitSync Discovery'
        });

      return !error;
    } catch (e) {
      return false;
    }
  },

  // 7. Sync Completed Workout Session (workout_sessions)
  async syncWorkoutSession(
    memberId: string,
    routineTitle: string,
    volumeKg: number,
    durationMins: number
  ): Promise<boolean> {
    const supabase = createClient();
    try {
      const validMemberId = toValidUuid(memberId);
      const { error } = await supabase
        .from('workout_sessions')
        .insert({
          member_id: validMemberId,
          routine_title: routineTitle,
          date: new Date().toLocaleDateString('en-CA'),
          volume_kg: volumeKg,
          duration_minutes: durationMins,
          status: 'completed'
        });

      return !error;
    } catch (e) {
      return false;
    }
  }
};
