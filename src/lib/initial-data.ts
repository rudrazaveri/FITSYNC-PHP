// FitSync AI — Seed Database Records & Standard Programs
import { 
  Gym, 
  WorkoutRoutine, 
  PredefinedDietPlan, 
  HealthcareProvider, 
  Appointment, 
  HealthReport, 
  FoodReactionLog, 
  TrainerIntervention, 
  NotificationItem,
  Exercise
} from '@/types';

export const INITIAL_GYMS: Gym[] = [
  {
    id: "gym_fitzone_vadodara",
    name: "FitZone Fitness",
    city: "Vadodara",
    location: "Alkapuri, Vadodara",
    distance: "1.2 km",
    rating: 4.9,
    reviewsCount: 380,
    availableTrainers: 8,
    totalMembers: 482,
    activeToday: 215,
    attendanceRate: "86.4%",
    features: ["24/7 Access", "Eleiko Olympic Racks", "Physio Clinic On-Premise", "Juice & Nutrition Bar"],
    membershipTiers: [
      { name: "Silver Basic", price: "₹2,499/mo", access: "Gym floor access & lockers" },
      { name: "Gold All-Access", price: "₹3,999/mo", access: "Gym floor + Group Classes + Sauna" },
      { name: "Platinum Elite", price: "₹5,499/mo", access: "Full Access + 2 Trainer Sessions/mo + Recovery Zone" }
    ]
  },
  {
    id: "gym_powerhouse_ahmedabad",
    name: "PowerHouse Gym",
    city: "Ahmedabad",
    location: "SG Highway, Ahmedabad",
    distance: "84 km",
    rating: 4.8,
    reviewsCount: 520,
    availableTrainers: 12,
    totalMembers: 620,
    activeToday: 310,
    attendanceRate: "88.1%",
    features: ["Indoor Turf Track", "Cryotherapy Chamber", "Olympic Swimming Pool"],
    membershipTiers: [
      { name: "Standard", price: "₹2,999/mo", access: "Strength & Turf Floor" },
      { name: "Pro Athlete", price: "₹5,999/mo", access: "All-Access + Pool & Cryo" }
    ]
  },
  {
    id: "gym_elite_surat",
    name: "Elite Fitness Studio",
    city: "Surat",
    location: "Vesu, Surat",
    distance: "142 km",
    rating: 4.7,
    reviewsCount: 290,
    availableTrainers: 6,
    totalMembers: 390,
    activeToday: 168,
    attendanceRate: "81.5%",
    features: ["Biomechanics Lab", "Pilates Reformers", "Sauna & Ice Bath"],
    membershipTiers: [
      { name: "Studio Pass", price: "₹3,499/mo", access: "Reformer & Kinetic Studio" }
    ]
  }
];

export const INITIAL_EXERCISES: Exercise[] = [
  {
    id: "ex_bench_press",
    name: "Barbell Bench Press",
    muscle: "Chest (Mid/Lower Pectorals), Triceps, Front Deltoid",
    equipment: "Barbell & Flat Bench",
    thumbnail: "/assets/bench_press.jpg",
    difficulty: "Intermediate",
    type: "Compound Strength",
    targetSets: 4,
    targetReps: "8–10",
    targetWeight: "82.5 kg",
    restSeconds: 120,
    completedSets: [
      { set: 1, reps: 10, weight: "75.0 kg", status: "completed" },
      { set: 2, reps: 8, weight: "82.5 kg", status: "completed" },
      { set: 3, reps: 8, weight: "82.5 kg", status: "pending" },
      { set: 4, reps: 8, weight: "82.5 kg", status: "pending" }
    ],
    instructions: [
      "Lie flat on the bench with eyes aligned directly under the barbell.",
      "Grip the bar slightly wider than shoulder-width with straight wrists.",
      "Unrack, retract shoulder blades, and plant feet firmly into the floor.",
      "Lower bar under control to mid-sternum, tucking elbows at 45 degrees.",
      "Drive upward through heels and chest to full extension without lifting hips."
    ],
    commonMistakes: "Bouncing barbell off ribs, flaring elbows out to 90 degrees, lifting hips off bench.",
    trainerTip: "Keep leg drive engaged continuously to stabilize your thoracic arch."
  },
  {
    id: "ex_incline_db_press",
    name: "Incline Dumbbell Press",
    muscle: "Upper Chest (Clavicular Head), Anterior Deltoid",
    equipment: "Dumbbells & 30° Incline Bench",
    thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Hypertrophy",
    targetSets: 3,
    targetReps: "10–12",
    targetWeight: "28.0 kg (each)",
    restSeconds: 90,
    completedSets: [
      { set: 1, reps: 12, weight: "26.0 kg", status: "pending" },
      { set: 2, reps: 10, weight: "28.0 kg", status: "pending" },
      { set: 3, reps: 10, weight: "28.0 kg", status: "pending" }
    ],
    instructions: [
      "Set adjustable bench to approximately 30 degrees.",
      "Kick dumbbells to shoulder height using knees as you recline.",
      "Press upward smoothly, converging weights without clacking.",
      "Lower under control feeling a deep stretch across upper pec fibers."
    ],
    commonMistakes: "Setting bench too steep (>45° shifts load to shoulders), short partial reps.",
    trainerTip: "Pause for a split-second at full stretch to maximize muscle fiber recruitment."
  },
  {
    id: "ex_cable_fly",
    name: "Standing Cable Pec Fly",
    muscle: "Sternal Chest, Peak Contraction",
    equipment: "Dual Cable Pulley",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Isolation",
    targetSets: 3,
    targetReps: "12–15",
    targetWeight: "15.0 kg / side",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 15, weight: "15.0 kg", status: "pending" },
      { set: 2, reps: 14, weight: "15.0 kg", status: "pending" },
      { set: 3, reps: 12, weight: "15.0 kg", status: "pending" }
    ],
    instructions: [
      "Set pulleys at chest level, step forward into a staggered stance.",
      "Maintain a soft bend in elbows as if hugging a wide barrel.",
      "Bring handles together in front of sternum, squeezing chest for 1 second."
    ],
    commonMistakes: "Turning the movement into a pressing motion, bending elbows excessively.",
    trainerTip: "Focus on bringing your inner biceps together rather than just your hands."
  },
  {
    id: "ex_tricep_pushdown",
    name: "Rope Cable Tricep Pushdown",
    muscle: "Triceps (Lateral & Medial Heads)",
    equipment: "High Cable & Rope Attachment",
    thumbnail: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Isolation",
    targetSets: 4,
    targetReps: "12–15",
    targetWeight: "25.0 kg",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 15, weight: "22.5 kg", status: "pending" },
      { set: 2, reps: 13, weight: "25.0 kg", status: "pending" },
      { set: 3, reps: 12, weight: "25.0 kg", status: "pending" },
      { set: 4, reps: 12, weight: "25.0 kg", status: "pending" }
    ],
    instructions: [
      "Attach rope to high pulley, lean forward slightly at the hips.",
      "Keep elbows pinned against ribcage.",
      "Extend down to full lockout, spreading rope ends apart at the bottom."
    ],
    commonMistakes: "Letting elbows drift forward, swinging torso for momentum.",
    trainerTip: "Isolate hinge movement strictly at the elbow joint for peak triceps burn."
  },
  {
    id: "ex_overhead_extension",
    name: "Overhead Dumbbell Extension",
    muscle: "Triceps Long Head",
    equipment: "Single Heavy Dumbbell",
    thumbnail: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Isolation",
    targetSets: 3,
    targetReps: "10–12",
    targetWeight: "24.0 kg",
    restSeconds: 75,
    completedSets: [
      { set: 1, reps: 12, weight: "22.0 kg", status: "pending" },
      { set: 2, reps: 11, weight: "24.0 kg", status: "pending" },
      { set: 3, reps: 10, weight: "24.0 kg", status: "pending" }
    ],
    instructions: [
      "Hold dumbbell vertically behind head with both hands cupping upper plate.",
      "Lower dumbbell under control until full stretch is felt in long tricep head.",
      "Extend arms vertically overhead without flaring elbows outward."
    ],
    commonMistakes: "Arching lower back severely, flaring elbows too wide.",
    trainerTip: "Keep abdominal wall tightly braced to protect your lumbar spine."
  }
];

export const INITIAL_WORKOUT_ROUTINE: WorkoutRoutine = {
  id: "wt_chest_triceps_01",
  title: "Chest & Triceps Hypertrophy",
  focus: "Push Movement Pattern • Upper Body Mass",
  duration: "45 mins",
  totalExercises: 5,
  difficulty: "Intermediate / Advanced",
  exercises: INITIAL_EXERCISES
};

export const PREDEFINED_DIET_PLANS: PredefinedDietPlan[] = [
  {
    id: "diet_muscle_gain_nonveg",
    title: "Muscle-Gain Hypertrophy Plan (Non-Veg)",
    targetGoal: "muscle_gain",
    dietaryVariant: "non_vegetarian",
    dailyCalories: 2650,
    proteinG: 150,
    carbsG: 300,
    fatG: 75,
    description: "High-protein surplus diet engineered for maximum lean mass accretion and post-workout glycogen replenishment.",
    meals: [
      {
        type: "Breakfast",
        title: "Oatmeal with Whey Isolate & Blueberries",
        calories: 540,
        protein: 42,
        carbs: 68,
        fat: 12,
        ingredients: "Rolled oats (80g), 1 scoop whey isolate (30g), almond milk (250ml), blueberries (50g), chia seeds (10g)",
        alternatives: "Substitute whey with 4 boiled egg whites + 1 whole egg."
      },
      {
        type: "Lunch",
        title: "Herb Grilled Chicken & Quinoa Fitness Bowl",
        calories: 680,
        protein: 48,
        carbs: 64,
        fat: 22,
        ingredients: "Grilled chicken breast (180g), tri-color quinoa (150g), avocado (50g), sweet potato (100g), baby spinach",
        alternatives: "Substitute chicken breast with tandoori bhetki fish (200g)."
      },
      {
        type: "Evening Snack",
        title: "Low-Fat Greek Yogurt & Banana Crunch",
        calories: 320,
        protein: 22,
        carbs: 48,
        fat: 4,
        ingredients: "Low-fat Greek yogurt (200g), 1 sliced banana, 1 tsp raw honey",
        alternatives: "Substitute yogurt with 1 scoop casein protein + apple slices."
      },
      {
        type: "Dinner",
        title: "Tandoori Fish Skewers with Brown Basmati",
        calories: 610,
        protein: 45,
        carbs: 65,
        fat: 16,
        ingredients: "Marinated fish fillet (200g), brown basmati rice (160g), steamed broccoli & bell peppers",
        alternatives: "Substitute fish with roasted chicken breast or spiced paneer."
      }
    ]
  },
  {
    id: "diet_muscle_gain_veg",
    title: "Muscle-Gain Hypertrophy Plan (Vegetarian)",
    targetGoal: "muscle_gain",
    dietaryVariant: "vegetarian",
    dailyCalories: 2650,
    proteinG: 145,
    carbsG: 305,
    fatG: 75,
    description: "High-protein lacto-vegetarian plan utilizing paneer, Greek yogurt, legumes, and whey protein.",
    meals: [
      {
        type: "Breakfast",
        title: "Paneer Bhurji with Multigrain Toast",
        calories: 530,
        protein: 38,
        carbs: 55,
        fat: 18,
        ingredients: "Fresh low-fat paneer (150g), onions, tomatoes, 2 slices multigrain toast, green tea",
        alternatives: "Substitute paneer with spiced scrambled tofu (180g)."
      },
      {
        type: "Lunch",
        title: "Spiced Chickpea & Paneer Macro Bowl",
        calories: 700,
        protein: 46,
        carbs: 72,
        fat: 22,
        ingredients: "Boiled chickpeas (180g), grilled paneer (100g), brown rice (150g), cucumber-mint salad",
        alternatives: "Substitute paneer with boiled edamame + lentils."
      },
      {
        type: "Evening Snack",
        title: "Whey Protein Shake with Roasted Chana",
        calories: 340,
        protein: 32,
        carbs: 42,
        fat: 5,
        ingredients: "1 scoop whey protein isolate in cold water, roasted chana (50g)",
        alternatives: "Substitute whey with plant pea protein."
      },
      {
        type: "Dinner",
        title: "Yellow Dal Tadka & Tofu Stir-Fry with Roti",
        calories: 620,
        protein: 42,
        carbs: 74,
        fat: 16,
        ingredients: "Moong dal (1 cup), firm tofu (150g), 2 whole wheat rotis, mixed vegetables",
        alternatives: "Substitute tofu with soya chunks (50g dry wt)."
      }
    ]
  },
  {
    id: "diet_fat_loss_nonveg",
    title: "Calorie-Deficit Fat Loss Plan (Non-Veg)",
    targetGoal: "fat_loss",
    dietaryVariant: "non_vegetarian",
    dailyCalories: 1850,
    proteinG: 155,
    carbsG: 160,
    fatG: 45,
    description: "Satiety-optimized deficit diet prioritizing lean animal proteins, fibrous vegetables, and moderate low-GI carbohydrates.",
    meals: [
      {
        type: "Breakfast",
        title: "Egg White Omelet with Spinach & Whole Toast",
        calories: 380,
        protein: 36,
        carbs: 32,
        fat: 8,
        ingredients: "4 egg whites + 1 whole egg, baby spinach, mushrooms, 1 slice whole wheat toast",
        alternatives: "Substitute eggs with 150g low-fat cottage cheese."
      },
      {
        type: "Lunch",
        title: "Lemon Herb Chicken Breast & Garden Greens",
        calories: 520,
        protein: 48,
        carbs: 45,
        fat: 14,
        ingredients: "Grilled chicken breast (200g), boiled sweet potato (120g), huge arugula & cucumber salad with balsamic",
        alternatives: "Substitute chicken breast with grilled cod or pomfret."
      },
      {
        type: "Evening Snack",
        title: "Whey Isolate & Sliced Apple with Cinnamon",
        calories: 220,
        protein: 26,
        carbs: 24,
        fat: 2,
        ingredients: "1 scoop whey isolate with water, 1 crisp apple",
        alternatives: "Substitute apple with 1 cup watermelon."
      },
      {
        type: "Dinner",
        title: "Steamed Fish with Sautéed Asparagus & Quinoa",
        calories: 460,
        protein: 45,
        carbs: 38,
        fat: 12,
        ingredients: "Steamed white fish (200g), cooked quinoa (80g), sautéed asparagus & zucchini in 1 tsp olive oil",
        alternatives: "Substitute fish with roasted turkey breast."
      }
    ]
  }
];

export const INITIAL_HEALTHCARE_PROVIDERS: HealthcareProvider[] = [
  {
    id: "doc_ananya_iyer",
    name: "Dr. Ananya Iyer",
    role: "Sports Medicine Physician",
    type: "doctor",
    specialty: "Exercise Physiology & Joint Orthopedics",
    qualifications: "MBBS, MD (Sports Medicine)",
    clinic: "OrthoSports Performance Medical Center",
    location: "Vadodara / Telehealth Online",
    experience: "9 Years",
    rating: 4.95,
    reviewsCount: 210,
    avatar: "/assets/doctor_iyer.jpg",
    consultationFee: "₹1,200",
    bio: "Specializes in joint biomechanics, athletic endocrinology panels, and rapid post-injury training clearance.",
    availableDays: ["Monday", "Wednesday", "Thursday", "Saturday"],
    weeklyTimeSlots: {
      "Monday": ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"],
      "Wednesday": ["04:00 PM", "05:00 PM", "06:00 PM"],
      "Thursday": ["10:00 AM", "11:00 AM", "01:30 PM"]
    },
    consultationTypes: ["Online Video Consultation", "In-Person Clinical Visit"]
  },
  {
    id: "pt_ramesh_sharma",
    name: "Dr. Ramesh Sharma",
    role: "Consultant Physiotherapist",
    type: "physiotherapist",
    specialty: "Sports Biomechanics & Kinematic Rehab",
    qualifications: "BPT, MPT (Sports Biomechanics)",
    clinic: "Renew Physio & Sports Recovery Center",
    location: "Vadodara / Telehealth Online",
    experience: "8 Years",
    rating: 4.92,
    reviewsCount: 185,
    avatar: "/assets/physio_sharma.jpg",
    consultationFee: "₹900",
    bio: "Expert in kinematic gait analysis, rotator cuff rehabilitation, dry needling, and gym-specific movement retraining.",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    weeklyTimeSlots: {
      "Monday": ["10:00 AM", "01:00 PM", "05:30 PM"],
      "Wednesday": ["04:00 PM", "05:30 PM", "06:30 PM"],
      "Thursday": ["10:00 AM", "11:30 AM", "02:00 PM"]
    },
    consultationTypes: ["Online Video Consultation", "In-Person Movement Assessment"]
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "apt_01",
    providerId: "pt_ramesh_sharma",
    providerName: "Dr. Ramesh Sharma",
    providerRole: "Consultant Physiotherapist",
    providerAvatar: "/assets/physio_sharma.jpg",
    clinic: "Renew Physio & Sports Recovery Center",
    date: "Today, Oct 10",
    time: "05:30 PM",
    type: "Online Video Consultation",
    status: "Upcoming",
    meetingLink: "https://fitsync.health/telehealth/session-pt-9482",
    agenda: "Right shoulder impingement screen & overhead bench press bar path assessment",
    notes: "Patient reported mild pinching sensation during overhead extension sets."
  },
  {
    id: "apt_02",
    providerId: "doc_ananya_iyer",
    providerName: "Dr. Ananya Iyer",
    providerRole: "Sports Medicine Physician",
    providerAvatar: "/assets/doctor_iyer.jpg",
    clinic: "OrthoSports Performance Medical Center",
    date: "Oct 15, 2026",
    time: "10:30 AM",
    type: "In-Person Clinical Visit",
    status: "Confirmed",
    agenda: "Quarterly athletic bloodwork biomarker review & hormonal health clearance"
  }
];

export const INITIAL_HEALTH_REPORTS: HealthReport[] = [
  {
    id: "rep_01",
    title: "Comprehensive Athletic Blood Biomarkers",
    type: "Hematology & Endocrinology Panel",
    uploadDate: "Sep 22, 2026",
    fileType: "PDF",
    fileSize: "2.4 MB",
    lab: "Metropolis Healthcare Vadodara",
    sharedWithDoctor: true,
    sharedWithPhysio: false,
    sharedWithTrainer: false,
    highlights: "Hemoglobin 15.2 g/dL (Optimal), Ferritin 124 ng/mL, Testosterone 710 ng/dL, Fasting Glucose 88 mg/dL",
    notes: "Cleared by Dr. Iyer for progressive overload training."
  },
  {
    id: "rep_02",
    title: "Shoulder Rotator Cuff Diagnostic Ultrasound",
    type: "Imaging & Radiology",
    uploadDate: "Aug 14, 2026",
    fileType: "PDF",
    fileSize: "4.8 MB",
    lab: "Baroda Diagnostic Imaging Institute",
    sharedWithDoctor: true,
    sharedWithPhysio: true,
    sharedWithTrainer: false,
    highlights: "Mild subacromial bursal thickening without full-thickness tendon tear. Recommended conservative PT.",
    notes: "Direct access granted to Dr. Ramesh Sharma for rehab program adjustments."
  }
];

export const INITIAL_FOOD_REACTION_LOGS: FoodReactionLog[] = [
  {
    id: "fr_01",
    food: "Dairy Milk (Full Cream)",
    consumedAt: "Yesterday, 9:00 PM",
    reaction: "Abdominal Bloating & Mild Cramping",
    severity: "Moderate",
    recurrenceCount: 4,
    notes: "Drank 300ml whole cow milk with turmeric. Bloating started after 45 mins.",
    patternDetected: true,
    aiObservation: "You have repeatedly logged bloating after consuming liquid dairy across 4 entries over the past 3 weeks. Consider testing lactose-free alternatives or digestive enzymes.",
    disclaimer: "This is an automated pattern observation and does not constitute a clinical lactose-intolerance diagnosis."
  },
  {
    id: "fr_02",
    food: "Whey Protein Isolate",
    consumedAt: "3 days ago, 6:00 PM",
    reaction: "None (Digested Smoothly)",
    severity: "None",
    recurrenceCount: 12,
    notes: "Post-workout shake mixed with water. Zero gastric distress.",
    patternDetected: false
  }
];

export const INITIAL_TRAINER_INTERVENTIONS: TrainerIntervention[] = [
  {
    id: "int_01",
    memberName: "Rahul Verma",
    memberAge: 27,
    memberAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    status: "High Attention",
    statusColor: "red",
    issue: "Missed 3 workouts in the last 10 days",
    aiRecommendation: "Send motivational nudge & offer adjusted 3-day full-body split",
    lastWorkout: "8 days ago (Legs)",
    currentWeight: "84.2 kg (Goal: Weight Loss -8kg)",
    attendanceTrend: "Declined 40% vs last month"
  },
  {
    id: "int_02",
    memberName: "Aarav Shah",
    memberAge: 23,
    memberAvatar: "/assets/aarav.jpg",
    status: "On Track (Minor Progression Check)",
    statusColor: "yellow",
    issue: "Workout volume surged +14% this week; bench press readiness peak",
    aiRecommendation: "Approve 82.5 kg bench press overload and review right shoulder comfort",
    lastWorkout: "Yesterday (Back & Biceps)",
    currentWeight: "72.4 kg (Goal: Muscle Gain +3kg)",
    attendanceTrend: "Optimal (5-day streak)"
  },
  {
    id: "int_03",
    memberName: "Priya Nair",
    memberAge: 29,
    memberAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    status: "Needs Attention",
    statusColor: "yellow",
    issue: "Has not logged nutrition for 6 consecutive days",
    aiRecommendation: "Automated macro reminder ping sent; trainer check-in suggested",
    lastWorkout: "2 days ago (HIIT Cardio)",
    currentWeight: "58.1 kg (Goal: Maintenance)",
    attendanceTrend: "Stable"
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_01",
    title: "Telehealth Appointment in 35 mins",
    desc: "Dr. Ramesh Sharma is ready for your shoulder assessment at 5:30 PM.",
    time: "10 mins ago",
    type: "health",
    actionText: "Join Room"
  },
  {
    id: "notif_02",
    title: "Hydration Milestone Reached 💧",
    desc: "You've logged 2,400ml today! Just 1,100ml remaining to hit your target.",
    time: "3 hours ago",
    type: "nutrition",
    actionText: "Log +250ml"
  },
  {
    id: "notif_03",
    title: "5-Day Gym Attendance Streak 🔥",
    desc: "You have visited FitZone Vadodara 5 consecutive days this week!",
    time: "Yesterday",
    type: "gym",
    actionText: "View Badge"
  }
];
