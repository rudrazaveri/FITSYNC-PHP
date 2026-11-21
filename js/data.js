/**
 * FitSync — Master Data Store & LocalStorage Persistence
 * Manages state for Isha Kulkarni (Member · Premium) across all 16 platform modules
 */

const DEFAULT_FITSYNC_DATA = {
  user: {
    name: "Isha Kulkarni",
    initials: "IK",
    role: "Member · Premium",
    avatar: "assets/images/aarav.jpg",
    email: "isha.kulkarni@fitsync.com",
    phone: "+91 98765 43210",
    dob: "2002-04-15",
    gender: "Female",
    age: 24,
    height: "168 cm",
    weight: "62.5 kg",
    emergencyContact: "Anand Kulkarni (+91 98220 12345)",
    fitnessGoal: "Build Muscle",
    experienceLevel: "Intermediate (2+ years)",
    gymBranch: "FitZone Gym, Kothrud, Pune",
    notifications: {
      workoutReminders: true,
      waterReminders: true,
      attendanceAlerts: true,
      coachFeedback: true
    }
  },
  stats: {
    weight: {
      current: 62.5,
      unit: "kg",
      changeText: "↓ 1.5 kg vs last month",
      isPositive: true
    },
    bmi: {
      value: 21.6,
      status: "Healthy range"
    },
    calories: {
      current: 1820,
      target: 2200,
      unit: "kcal"
    },
    water: {
      current: 2.1,
      target: 3.0,
      unit: "L"
    }
  },
  goal: {
    title: "Build Muscle",
    targetWeight: "68 kg",
    targetDate: "28 Feb 2027",
    progressPercent: 75,
    startingWeight: "65.0 kg"
  },
  membership: {
    gymName: "FitZone Gym",
    location: "Kothrud, Pune",
    plan: "Premium All-Access Plan",
    validTill: "15 Mar 2027",
    status: "Active",
    startDate: "16 Mar 2026",
    turnstileCode: "FS-PUN-9821"
  },
  gyms: [
    {
      id: "gym-1",
      name: "FitZone Gym",
      location: "Kothrud, Pune",
      rating: 4.9,
      reviews: 320,
      status: "Active Membership",
      amenities: ["Olympic Platforms", "Steam & Sauna", "Crossfit Turf", "Biometric Turnstile"],
      image: "assets/images/bench_press.jpg",
      hours: "5:30 AM – 10:30 PM",
      phone: "+91 20 2544 1122"
    },
    {
      id: "gym-2",
      name: "PowerHouse Arena",
      location: "Baner, Pune",
      rating: 4.8,
      reviews: 245,
      status: "All-Access Included",
      amenities: ["Hammer Strength Iso-Lateral", "Recovery Lounge", "Boxing Ring"],
      image: "assets/images/bench_press.jpg",
      hours: "6:00 AM – 11:00 PM",
      phone: "+91 20 2729 3344"
    },
    {
      id: "gym-3",
      name: "Metro Crossfit Studio",
      location: "Viman Nagar, Pune",
      rating: 4.8,
      reviews: 180,
      status: "All-Access Included",
      amenities: ["Rogue Rig", "Kettlebells", "Rowing Ergometers"],
      image: "assets/images/bench_press.jpg",
      hours: "6:00 AM – 10:00 PM",
      phone: "+91 20 2663 8899"
    },
    {
      id: "gym-4",
      name: "Elite Iron Republic",
      location: "Kalyani Nagar, Pune",
      rating: 4.9,
      reviews: 410,
      status: "All-Access Included",
      amenities: ["Eleiko Calibrated Plates", "Ice Baths", "Physio Clinic"],
      image: "assets/images/bench_press.jpg",
      hours: "24 Hours Open",
      phone: "+91 20 4122 7700"
    }
  ],
  trainers: [
    {
      id: "tr-1",
      name: "Coach Raj Malhotra",
      isAssigned: true,
      title: "Head Strength & Conditioning Coach",
      rating: 4.9,
      experience: "8+ Years",
      specialties: ["Hypertrophy", "Powerlifting", "Biomechanical Alignment"],
      avatar: "assets/images/trainer_raj.jpg",
      gym: "FitZone Gym, Kothrud"
    },
    {
      id: "tr-2",
      name: "Simran Kaur",
      isAssigned: false,
      title: "Senior Functional Fitness Coach",
      rating: 4.9,
      experience: "6 Years",
      specialties: ["Mobility & Kinematics", "Fat Loss", "Athletic Conditioning"],
      avatar: "assets/images/trainer_raj.jpg",
      gym: "PowerHouse Arena, Baner"
    },
    {
      id: "tr-3",
      name: "Vikram Shinde",
      isAssigned: false,
      title: "Olympic Weightlifting Specialist",
      rating: 4.8,
      experience: "7 Years",
      specialties: ["Clean & Jerk", "Snatch Technique", "Explosive Power"],
      avatar: "assets/images/trainer_raj.jpg",
      gym: "Metro Crossfit Studio"
    }
  ],
  todayWorkout: {
    title: "Upper Body Strength",
    duration: "45 min",
    exercisesCount: 6,
    difficulty: "Intermediate",
    exercises: [
      { id: "e1", name: "Incline Barbell Bench Press", sets: "4 Sets", reps: "8-10 Reps", weight: "65 kg", completed: true },
      { id: "e2", name: "Dumbbell Overhead Shoulder Press", sets: "3 Sets", reps: "10-12 Reps", weight: "18 kg", completed: true },
      { id: "e3", name: "Cable Chest Flyes", sets: "3 Sets", reps: "12-15 Reps", weight: "15 kg", completed: false },
      { id: "e4", name: "Dumbbell Lateral Deltoid Raises", sets: "4 Sets", reps: "15 Reps", weight: "8 kg", completed: false },
      { id: "e5", name: "Triceps Rope Pushdowns", sets: "3 Sets", reps: "12 Reps", weight: "25 kg", completed: false },
      { id: "e6", name: "Parallel Bar Bodyweight Dips", sets: "3 Sets", reps: "To failure", weight: "Bodyweight", completed: false }
    ]
  },
  workoutSchedule: [
    { day: "Monday", focus: "Upper Body Push & Delts", exercises: 6, duration: "50 min", status: "Completed" },
    { day: "Tuesday", focus: "Lower Body Quad & Calves", exercises: 5, duration: "55 min", status: "Completed" },
    { day: "Wednesday", focus: "Upper Body Pull & Lats", exercises: 6, duration: "50 min", status: "Completed" },
    { day: "Thursday", focus: "Active Recovery & Mobility", exercises: 4, duration: "30 min", status: "Completed" },
    { day: "Friday", focus: "Chest & Triceps Hypertrophy", exercises: 6, duration: "45 min", status: "Today" },
    { day: "Saturday", focus: "Hamstrings, Glutes & Core", exercises: 5, duration: "50 min", status: "Upcoming" },
    { day: "Sunday", focus: "Full Rest Day", exercises: 0, duration: "—", status: "Rest" }
  ],
  exerciseLibrary: [
    {
      id: "ex-1",
      name: "Barbell Incline Bench Press",
      muscle: "Chest (Upper Pectoralis)",
      equipment: "Incline Bench, Barbell",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Set bench at 30 degrees. Retract scapulae, lower bar to clavicle level, drive upward without flaring elbows.",
      image: "assets/images/bench_press.jpg"
    },
    {
      id: "ex-2",
      name: "Barbell Romanian Deadlift (RDL)",
      muscle: "Hamstrings & Glutes",
      equipment: "Barbell, Plates",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Hinge at hips, keep bar in contact with thighs, slight knee flexion, drive hips forward to lockout.",
      image: "assets/images/bench_press.jpg"
    },
    {
      id: "ex-3",
      name: "Dumbbell Lateral Raise",
      muscle: "Shoulders (Lateral Deltoid)",
      equipment: "Dumbbells",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Slight forward torso lean. Raise elbows in scapular plane to parallel. Pause for 0.5s at peak.",
      image: "assets/images/bench_press.jpg"
    },
    {
      id: "ex-4",
      name: "Lat Pulldown (Neutral Grip)",
      muscle: "Back (Latissimus Dorsi)",
      equipment: "Cable Machine, Attachment",
      difficulty: "Beginner",
      type: "Compound",
      cues: "Depress shoulder blades before pulling. Drive elbows down towards hips, keep chest proud.",
      image: "assets/images/bench_press.jpg"
    },
    {
      id: "ex-5",
      name: "Barbell Back Squat",
      muscle: "Quadriceps & Core",
      equipment: "Squat Rack, Barbell",
      difficulty: "Advanced",
      type: "Compound",
      cues: "Brace core tightly. Break at hips and knees simultaneously, descend below parallel, drive through midfoot.",
      image: "assets/images/bench_press.jpg"
    },
    {
      id: "ex-6",
      name: "Standing Cable Bicep Curl",
      muscle: "Arms (Biceps Brachii)",
      equipment: "Cable Pulley, Straight Bar",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Pin elbows to ribs. Squeeze biceps hard at the top, control 3-second negative descent.",
      image: "assets/images/bench_press.jpg"
    }
  ],
  assessment: {
    age: 24,
    gender: "female",
    height: 168,
    weight: 62.5,
    waist: 74,
    neck: 32,
    hip: 94,
    activity: 1.55,
    goal: "muscle_gain",
    bmi: 22.1,
    bmiCategory: "Normal Weight",
    bmr: 1410,
    tdee: 2185,
    targetCalories: 2350,
    targetProtein: 125,
    targetCarbs: 275,
    targetFat: 65,
    bodyFatPct: 22.4,
    lastCalculated: "20 Nov 2026"
  },
  measurementsHistory: [
    { date: "20 Nov 2026", weight: 62.5, waist: 74.0, chest: 92.0, bicep: 29.5, thigh: 54.0 },
    { date: "20 Oct 2026", weight: 63.0, waist: 74.5, chest: 91.5, bicep: 29.0, thigh: 54.5 },
    { date: "20 Sep 2026", weight: 63.8, waist: 75.0, chest: 91.0, bicep: 28.5, thigh: 55.0 },
    { date: "20 Aug 2026", weight: 64.2, waist: 76.0, chest: 91.0, bicep: 28.0, thigh: 55.5 },
    { date: "20 Jul 2026", weight: 65.0, waist: 77.0, chest: 90.5, bicep: 28.0, thigh: 56.0 }
  ],
  nutrition: {
    calories: 1820,
    targetCalories: 2200,
    macros: {
      protein: { current: 96, target: 110, unit: "g" },
      carbs: { current: 212, target: 260, unit: "g" },
      fat: { current: 58, target: 70, unit: "g" },
      fiber: { current: 28, target: 35, unit: "g" }
    },
    meals: [
      { time: "08:15 AM", category: "Breakfast", name: "Rolled Oats & Whey Bowl with Chia Seeds", calories: 480, protein: 36, carbs: 62, fat: 9 },
      { time: "01:20 PM", category: "Lunch", name: "Grilled Paneer & Quinoa Power Bowl", calories: 640, protein: 38, carbs: 75, fat: 21 },
      { time: "05:00 PM", category: "Post-Workout Snack", name: "Greek Yogurt with Banana & Honey", calories: 310, protein: 22, carbs: 48, fat: 4 },
      { time: "08:30 PM", category: "Dinner", name: "Moong Dal Khichdi & Steamed Veggies", calories: 390, protein: 18, carbs: 64, fat: 6 }
    ],
    allergies: ["Peanuts (Strict Allergen Conflict)", "Soy (Mild Intolerance)"],
    reactionNotes: "Mild bloating noted after consuming high-sodium meal on 12 Nov. Recovered with hydration."
  },
  recipes: [
    {
      id: "rec-1",
      title: "High-Protein Rolled Oats & Whey Bowl",
      category: "Breakfast",
      prepTime: "10 mins",
      calories: 480,
      protein: 36,
      carbs: 62,
      fat: 9,
      image: "assets/images/healthy_meal.jpg",
      ingredients: ["60g Rolled Oats", "1 Scoop Whey Isolate", "150ml Skim Milk", "10g Chia Seeds", "Half sliced Banana"],
      instructions: "Simmer oats in milk for 5 mins. Remove from heat, stir in whey protein and chia seeds. Top with banana slices."
    },
    {
      id: "rec-2",
      title: "Grilled Paneer & Quinoa Power Bowl",
      category: "Lunch",
      prepTime: "20 mins",
      calories: 640,
      protein: 38,
      carbs: 75,
      fat: 21,
      image: "assets/images/healthy_meal.jpg",
      ingredients: ["150g Low-Fat Paneer", "80g Cooked Quinoa", "Cucumber, Bell Peppers", "1 tbsp Olive Oil Lemon Dressing"],
      instructions: "Pan-sear paneer cubes with mild spices. Arrange over a bed of warm quinoa, diced bell peppers, and dress with olive oil and lemon."
    },
    {
      id: "rec-3",
      title: "Post-Workout Berry Blast Shake",
      category: "Snack",
      prepTime: "5 mins",
      calories: 290,
      protein: 30,
      carbs: 35,
      fat: 3,
      image: "assets/images/healthy_meal.jpg",
      ingredients: ["1 Scoop Whey Isolate", "100g Frozen Blueberries", "200ml Almond Milk", "1 tsp Honey"],
      instructions: "Blend all ingredients at high speed until smooth and frothy. Serve immediately post-training."
    },
    {
      id: "rec-4",
      title: "Moong Dal & Vegetable Protein Medley",
      category: "Dinner",
      prepTime: "25 mins",
      calories: 420,
      protein: 26,
      carbs: 64,
      fat: 7,
      image: "assets/images/healthy_meal.jpg",
      ingredients: ["100g Yellow Moong Dal", "Spinach, Tomatoes, Carrots", "Cumin, Turmeric, Ginger", "1 tsp Ghee"],
      instructions: "Pressure cook moong dal with turmeric and ginger. Temper with cumin in ghee and stir in tender spinach leaves."
    }
  ],
  waterStation: {
    current: 2.1,
    target: 3.0,
    logs: [
      { time: "07:30 AM", amount: "500 ml", note: "Morning hydration" },
      { time: "10:15 AM", amount: "350 ml", note: "Desk hydration" },
      { time: "01:00 PM", amount: "500 ml", note: "Pre-lunch water" },
      { time: "04:30 PM", amount: "400 ml", note: "Pre-workout hydration" },
      { time: "06:45 PM", amount: "350 ml", note: "Post-workout hydration" }
    ],
    weeklyHistory: [2.8, 3.1, 2.9, 3.2, 2.7, 3.0, 2.1]
  },
  appointments: [
    {
      id: "apt-1",
      dayName: "Wed",
      dayNum: "20",
      time: "11:30 AM",
      professional: "Dr. Meera Nair",
      specialty: "General Physician",
      type: "Online",
      typeColor: "success",
      topic: "Cardiovascular Telemetry & Blood Panel Review"
    },
    {
      id: "apt-2",
      dayName: "Sat",
      dayNum: "23",
      time: "02:00 PM",
      professional: "Mr. Arjun Desai",
      specialty: "Sports Physiotherapist",
      type: "In-person",
      typeColor: "blue",
      topic: "Scapular Kinematics & Shoulder Mobility Screen"
    }
  ],
  reports: [
    {
      id: "rep-1",
      name: "Comprehensive Blood Biomarker Panel",
      category: "Pathology Diagnostic",
      date: "14 Nov 2026",
      size: "2.4 MB",
      status: "Verified",
      doctor: "Dr. Meera Nair"
    },
    {
      id: "rep-2",
      name: "Dual-Energy X-Ray (DEXA) Body Scan",
      category: "Body Composition",
      date: "28 Oct 2026",
      size: "1.8 MB",
      status: "Verified",
      doctor: "FitSync Biometrics Lab"
    },
    {
      id: "rep-3",
      name: "ECG & Resting Cardiovascular Rhythm",
      category: "Cardiac Diagnostic",
      date: "10 Oct 2026",
      size: "1.1 MB",
      status: "Normal",
      doctor: "Dr. K. Iyer"
    }
  ],
  attendance: {
    monthlyVisits: 18,
    targetVisits: 22,
    consistencyPct: 91,
    currentStreak: 5,
    records: [
      { date: "20 Nov 2026", time: "06:45 AM", gym: "FitZone Gym, Kothrud", method: "Turnstile QR", status: "Verified" },
      { date: "19 Nov 2026", time: "07:10 AM", gym: "FitZone Gym, Kothrud", method: "Turnstile QR", status: "Verified" },
      { date: "18 Nov 2026", time: "06:30 AM", gym: "FitZone Gym, Kothrud", method: "Turnstile QR", status: "Verified" },
      { date: "17 Nov 2026", time: "07:00 AM", gym: "PowerHouse Arena, Baner", method: "Turnstile QR", status: "Verified" },
      { date: "16 Nov 2026", time: "06:50 AM", gym: "FitZone Gym, Kothrud", method: "Turnstile QR", status: "Verified" },
      { date: "14 Nov 2026", time: "06:40 AM", gym: "FitZone Gym, Kothrud", method: "Turnstile QR", status: "Verified" },
      { date: "13 Nov 2026", time: "07:15 AM", gym: "Metro Crossfit Studio", method: "Turnstile QR", status: "Verified" }
    ]
  },
  weeklyActivity: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    workouts: [45, 60, 50, 0, 55, 65, 40],
    activityScore: [70, 88, 78, 35, 82, 94, 68]
  },
  progressData: {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    weights: [65.0, 64.2, 63.8, 63.0, 62.5]
  }
};

class FitSyncStore {
  constructor() {
    this.storageKey = 'fitsync_master_platform_v2';
    this.state = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('LocalStorage load error, using default state:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA));
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save to LocalStorage:', e);
    }
  }

  addWater(amountInLiters) {
    this.state.stats.water.current = parseFloat((this.state.stats.water.current + amountInLiters).toFixed(2));
    this.state.waterStation.current = this.state.stats.water.current;
    this.state.waterStation.logs.unshift({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: `${Math.round(amountInLiters * 1000)} ml`,
      note: "Quick logged hydration"
    });
    this.save();
    return this.state.stats.water;
  }

  addMeal(name, category, calories, protein, carbs, fat) {
    this.state.stats.calories.current += calories;
    this.state.nutrition.calories += calories;
    this.state.nutrition.macros.protein.current += protein;
    this.state.nutrition.macros.carbs.current += carbs;
    this.state.nutrition.macros.fat.current += fat;
    this.state.nutrition.meals.unshift({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: category,
      name: name,
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat
    });
    this.save();
    return this.state.nutrition;
  }

  updateWeight(newWeight) {
    const val = parseFloat(newWeight);
    this.state.stats.weight.current = val;
    this.state.assessment.weight = val;
    this.state.progressData.weights[this.state.progressData.weights.length - 1] = val;
    this.state.measurementsHistory.unshift({
      date: "Today",
      weight: val,
      waist: 74.0,
      chest: 92.0,
      bicep: 29.5,
      thigh: 54.0
    });
    this.save();
    return this.state.stats.weight;
  }

  saveAssessment(data) {
    this.state.assessment = { ...this.state.assessment, ...data, lastCalculated: "Just now" };
    this.state.stats.bmi.value = data.bmi;
    this.state.stats.calories.target = data.targetCalories;
    this.state.nutrition.targetCalories = data.targetCalories;
    this.state.nutrition.macros.protein.target = data.targetProtein;
    this.state.nutrition.macros.carbs.target = data.targetCarbs;
    this.state.nutrition.macros.fat.target = data.targetFat;
    this.save();
  }

  recordAttendance() {
    this.state.attendance.monthlyVisits += 1;
    this.state.attendance.currentStreak += 1;
    this.state.attendance.records.unshift({
      date: "Today",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      gym: this.state.membership.gymName + ", Kothrud",
      method: "Turnstile QR",
      status: "Verified"
    });
    this.save();
  }

  updateUserProfile(profile) {
    this.state.user = { ...this.state.user, ...profile };
    this.save();
  }
}

window.fitSyncStore = new FitSyncStore();
