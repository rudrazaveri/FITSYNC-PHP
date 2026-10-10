// FitSync AI — Seed Database & Ecosystem State

export const FITSYNC_DATA = {
  currentUser: {
    id: "mem_aarav_01",
    name: "Aarav Shah",
    age: 23,
    gender: "Male",
    heightCm: 175,
    weightKg: 72.4,
    startingWeightKg: 74.5,
    targetWeightKg: 75.0,
    goal: "Muscle Gain",
    secondaryGoals: ["Increase Strength", "Improve Flexibility"],
    activityLevel: "Moderately Active",
    exerciseFrequency: "4–5 days/week",
    dietaryPreference: "Non-Vegetarian",
    allergies: ["Peanuts"],
    dietaryRestrictions: ["Low Sodium"],
    gymId: "gym_fitzone_vadodara",
    trainerId: "tr_raj_patel",
    avatar: "assets/aarav.jpg",
    membership: "FitZone Platinum Elite",
    memberSince: "Jan 2026",
    streakDays: 5,
    waterLoggedMl: 2400,
    waterTargetMl: 3500,
    caloriesLogged: 1840,
    calorieTarget: 2650,
    proteinLogged: 112,
    proteinTarget: 150,
    carbsLogged: 215,
    carbsTarget: 300,
    fatLogged: 58,
    fatTarget: 75,
    fitnessScore: 82,
    scores: {
      activity: 85,
      strength: 80,
      consistency: 88,
      nutrition: 78,
      progress: 84
    },
    metrics: {
      bmi: 23.6,
      bmiCategory: "Healthy / Optimal",
      bmr: 1720,
      tdee: 2450,
      bodyFatEst: "14.2%",
      waistCm: 81,
      neckCm: 38,
      hipCm: 96
    }
  },

  gyms: [
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
      equipmentHighlights: "Hammer Strength, Eleiko Racks, LifeFitness Cardio, Sauna",
      membershipTiers: [
        { name: "Silver Basic", price: "₹2,499/mo", access: "Gym floor only" },
        { name: "Gold All-Access", price: "₹3,999/mo", access: "Gym + Group Classes + Locker" },
        { name: "Platinum Elite", price: "₹5,499/mo", access: "Full Access + 2 Trainer Sessions/mo + Recovery Zone" }
      ],
      features: ["24/7 Access", "Olympic Lifting Platforms", "Physio Clinic On-Premise", "Juice & Nutrition Bar"]
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
      membershipTiers: [
        { name: "Standard", price: "₹2,999/mo" },
        { name: "Pro Athlete", price: "₹5,999/mo" }
      ],
      features: ["Indoor Turf Track", "Cryotherapy Chamber", "Swimming Pool"]
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
      membershipTiers: [
        { name: "Studio Pass", price: "₹3,499/mo" }
      ],
      features: ["Biomechanics Lab", "Pilates Reformers", "Cafe"]
    }
  ],

  trainers: [
    {
      id: "tr_raj_patel",
      name: "Raj Patel",
      gymId: "gym_fitzone_vadodara",
      gymName: "FitZone Vadodara",
      role: "Senior Strength & Hypertrophy Coach",
      avatar: "assets/trainer_raj.jpg",
      experience: "7+ Years",
      rating: 4.9,
      reviewsCount: 142,
      specializations: ["Hypertrophy & Muscle Gain", "Powerlifting Form", "Injury Prevention"],
      certifications: ["CSCS (NSCA)", "ACE Certified Personal Trainer", "Precision Nutrition L1"],
      bio: "Dedicated to biomechanically sound lifting and data-driven strength progression. Former state powerlifter.",
      assignedMembersCount: 24,
      availabilityStatus: "Available Today • 4 Slots",
      weeklySchedule: "Mon - Sat: 6:00 AM – 1:00 PM, 5:00 PM – 9:00 PM"
    },
    {
      id: "tr_priya_sharma",
      name: "Priya Sharma",
      gymId: "gym_fitzone_vadodara",
      gymName: "FitZone Vadodara",
      role: "Functional Fitness & Conditioning Coach",
      avatar: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=500&auto=format&fit=crop&q=80",
      experience: "5 Years",
      rating: 4.8,
      reviewsCount: 98,
      specializations: ["Metabolic Conditioning", "Core Stability", "Female Athletic Development"],
      certifications: ["CrossFit L2", "NASM-CPT"],
      bio: "Passionate about building functional mobility and high work capacity for everyday athletic humans.",
      assignedMembersCount: 18,
      availabilityStatus: "Available Tomorrow",
      weeklySchedule: "Tue - Sun: 7:00 AM – 2:00 PM"
    },
    {
      id: "tr_vikram_mehta",
      name: "Vikram Mehta",
      gymId: "gym_fitzone_vadodara",
      gymName: "FitZone Vadodara",
      role: "Mobility & Athletic Rehabilitation Coach",
      avatar: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=500&auto=format&fit=crop&q=80",
      experience: "8 Years",
      rating: 4.9,
      reviewsCount: 165,
      specializations: ["Mobility Restructuring", "Kinetics", "Post-Rehab Bridging"],
      certifications: ["FRCms Mobility Specialist", "EXOS Performance Specialist"],
      bio: "Bridging the gap between clinical physical therapy and heavy compound weight training.",
      assignedMembersCount: 15,
      availabilityStatus: "Available Today",
      weeklySchedule: "Mon - Fri: 8:00 AM – 4:00 PM"
    }
  ],

  doctors: [
    {
      id: "doc_ananya_iyer",
      name: "Dr. Ananya Iyer",
      specialty: "Sports Medicine Physician",
      qualifications: "MBBS, MD (Sports Medicine)",
      clinic: "OrthoSports Performance Medical Center",
      location: "Vadodara / Telehealth Online",
      experience: "9 Years",
      rating: 4.95,
      reviewsCount: 210,
      avatar: "assets/doctor_iyer.jpg",
      consultationFee: "₹1,200",
      bio: "Specializes in joint bio-mechanics, exercise physiology, hormonal optimization, and rapid sports injury recuperation.",
      availableDays: ["Monday", "Wednesday", "Thursday", "Saturday"],
      weeklyTimeSlots: {
        "Monday": ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"],
        "Wednesday": ["04:00 PM", "05:00 PM", "06:00 PM", "06:30 PM"],
        "Thursday": ["10:00 AM", "11:00 AM", "12:30 PM", "01:30 PM"],
        "Saturday": ["09:00 AM", "10:30 AM", "01:00 PM"]
      },
      consultationTypes: ["Online Video Consultation", "In-Person Clinical Visit"]
    },
    {
      id: "doc_sameer_joshi",
      name: "Dr. Sameer Joshi",
      specialty: "Orthopedic & Joint Consultant",
      qualifications: "MS (Ortho), DNB (Sports Trauma)",
      clinic: "Apex Orthopedic & Spine Hospital",
      location: "Ahmedabad / Telehealth Online",
      experience: "14 Years",
      rating: 4.88,
      reviewsCount: 340,
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&auto=format&fit=crop&q=80",
      consultationFee: "₹1,500",
      bio: "Focused on tendonitis, spinal alignment, ACL/meniscus conservative rehabilitation, and heavy lifter ergonomics.",
      availableDays: ["Tuesday", "Friday"],
      weeklyTimeSlots: {
        "Tuesday": ["02:00 PM", "03:30 PM", "05:00 PM"],
        "Friday": ["10:00 AM", "11:30 AM", "04:00 PM"]
      },
      consultationTypes: ["Online Video Consultation", "In-Person Clinical Visit"]
    }
  ],

  physiotherapists: [
    {
      id: "pt_ramesh_sharma",
      name: "Dr. Ramesh Sharma",
      specialty: "Consultant Physiotherapist & Sports Rehab",
      qualifications: "BPT, MPT (Sports Biomechanics)",
      clinic: "Renew Physio & Sports Recovery Center",
      location: "Vadodara / Telehealth Online",
      experience: "8 Years",
      rating: 4.92,
      reviewsCount: 185,
      avatar: "assets/physio_sharma.jpg",
      consultationFee: "₹900",
      bio: "Expert in dry needling, kinematic gait analysis, rotator cuff rehabilitation, and gym-specific movement retraining.",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      weeklyTimeSlots: {
        "Monday": ["10:00 AM", "01:00 PM", "05:30 PM"],
        "Wednesday": ["04:00 PM", "05:30 PM", "06:30 PM"],
        "Thursday": ["10:00 AM", "11:30 AM", "02:00 PM"]
      },
      consultationTypes: ["Online Movement Assessment", "In-Person Hands-On Session"]
    },
    {
      id: "pt_neha_kapoor",
      name: "Dr. Neha Kapoor",
      specialty: "Spine, Posture & Kinetic Specialist",
      qualifications: "MPT (Musculoskeletal), CMP (Mulligan Concept)",
      clinic: "KineticWell Posture Clinic",
      location: "Vadodara / Online",
      experience: "6 Years",
      rating: 4.85,
      reviewsCount: 112,
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=80",
      consultationFee: "₹850",
      bio: "Specializes in desk-worker postural correction, pelvic tilt rebalancing, and cervical spine mobility.",
      availableDays: ["Tuesday", "Thursday", "Saturday"],
      weeklyTimeSlots: {
        "Tuesday": ["11:00 AM", "03:00 PM", "05:00 PM"],
        "Thursday": ["09:30 AM", "01:00 PM", "04:00 PM"]
      },
      consultationTypes: ["Online Video Consultation", "In-Person Studio Visit"]
    }
  ],

  todayWorkout: {
    title: "Chest & Triceps Hypertrophy",
    focus: "Push Movement Pattern • Upper Body Mass",
    duration: "45 mins",
    totalExercises: 5,
    difficulty: "Intermediate / Advanced",
    aiRecommendation: {
      exercise: "Barbell Bench Press",
      previousLog: "4 sets × 8 reps @ 80.0 kg (RPE 7.5, clean lockout)",
      insight: "You completed your previous bench press sets comfortably with high bar velocity. AI recommends increasing load to 82.5 kg for your top sets today.",
      suggestedWeightKg: 82.5,
      suggestedReps: "8 reps",
      status: "AI Recommended",
      trainerNote: "Coach Raj approved this progression. Maintain arch & pin scapula back."
    },
    exercises: [
      {
        id: "ex_bench_press",
        name: "Barbell Bench Press",
        muscle: "Chest (Mid/Lower Pectorals), Front Deltoid, Triceps",
        equipment: "Barbell & Flat Bench",
        thumbnail: "assets/bench_press.jpg",
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
          "Lie flat on the bench with your eyes aligned directly under the barbell.",
          "Grip the bar slightly wider than shoulder-width with wrists straight.",
          "Unrack, pull shoulder blades down and back, planting feet flat into the floor.",
          "Lower bar under control to mid-sternum, tucking elbows at 45 degrees.",
          "Drive upward through heels and chest to full extension without lifting glutes."
        ],
        commonMistakes: "Bouncing barbell off ribs, flaring elbows out to 90 degrees, lifting hips off bench.",
        trainerTip: "Keep tight leg drive engaged throughout each rep to stabilize your thoracic spine."
      },
      {
        id: "ex_incline_db_press",
        name: "Incline Dumbbell Press",
        muscle: "Upper Chest (Clavicular Head), Anterior Delts",
        equipment: "Dumbbells & 30° Incline Bench",
        thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
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
          "Kick dumbbells up to shoulder level with knees as you recline.",
          "Press upward while converging weights smoothly without clacking.",
          "Lower with a full deep stretch in upper pec fibers."
        ],
        commonMistakes: "Setting bench angle too steep (>45° shifts load to shoulders), partial range of motion.",
        trainerTip: "Pause for a split-second at the deepest stretch to recruit high-threshold motor units."
      },
      {
        id: "ex_cable_fly",
        name: "Standing Cable Pec Fly",
        muscle: "Sternal Chest, Peak Contraction",
        equipment: "Dual Adjustable Pulley Cable Machine",
        thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
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
          "Set cable pulleys at chest height, step one foot forward for balance.",
          "Maintain a slight soft bend in elbows like hugging a wide oak barrel.",
          "Bring hands together in front of sternum, squeezing chest hard for 1 second."
        ],
        commonMistakes: "Turning the movement into a pressing motion, bending elbows excessively.",
        trainerTip: "Think of bringing your inner biceps together rather than just your hands."
      },
      {
        id: "ex_tricep_pushdown",
        name: "Rope Cable Tricep Pushdown",
        muscle: "Triceps (Lateral & Medial Heads)",
        equipment: "High Cable & Tricep Rope",
        thumbnail: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=80",
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
          "Keep elbows pinned firmly against your ribcage.",
          "Push down until arms lock out, flaring rope ends outward at the bottom."
        ],
        commonMistakes: "Letting elbows drift forward, swinging torso to build momentum.",
        trainerTip: "Isolate the hinge strictly at the elbow joint for maximum triceps activation."
      },
      {
        id: "ex_overhead_extension",
        name: "Overhead Dumbbell Extension",
        muscle: "Triceps Long Head",
        equipment: "Single Heavy Dumbbell",
        thumbnail: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=500&auto=format&fit=crop&q=80",
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
          "Hold dumbbell vertically behind head with both hands cupping the upper plate.",
          "Lower dumbbell down past neck until full stretch is felt in long tricep head.",
          "Extend arms vertically overhead without flaring elbows outwards."
        ],
        commonMistakes: "Arching lower back severely, letting elbows splay wide.",
        trainerTip: "Keep abdominal wall braced to protect lumbar spine throughout overhead extension."
      }
    ]
  },

  exerciseLibrary: [
    { id: "lib_bench", name: "Barbell Bench Press", muscle: "Chest", equipment: "Barbell", difficulty: "Intermediate", type: "Compound Strength" },
    { id: "lib_squat", name: "Barbell Back Squat", muscle: "Legs", equipment: "Barbell", difficulty: "Advanced", type: "Compound Strength" },
    { id: "lib_deadlift", name: "Conventional Deadlift", muscle: "Back", equipment: "Barbell", difficulty: "Advanced", type: "Compound Strength" },
    { id: "lib_incline_db", name: "Incline Dumbbell Press", muscle: "Chest", equipment: "Dumbbell", difficulty: "Intermediate", type: "Hypertrophy" },
    { id: "lib_pullup", name: "Weighted Pull-Ups", muscle: "Back", equipment: "Bodyweight", difficulty: "Intermediate", type: "Compound Strength" },
    { id: "lib_cable_row", name: "Seated Cable Row", muscle: "Back", equipment: "Cable", difficulty: "Beginner", type: "Hypertrophy" },
    { id: "lib_lateral_raise", name: "Dumbbell Lateral Raise", muscle: "Arms", equipment: "Dumbbell", difficulty: "Beginner", type: "Isolation" },
    { id: "lib_bicep_curl", name: "Incline Dumbbell Bicep Curl", muscle: "Arms", equipment: "Dumbbell", difficulty: "Beginner", type: "Isolation" },
    { id: "lib_leg_press", name: "45° Leg Press", muscle: "Legs", equipment: "Machine", difficulty: "Beginner", type: "Hypertrophy" },
    { id: "lib_romanian_dl", name: "Romanian Deadlift (RDL)", muscle: "Legs", equipment: "Barbell", difficulty: "Intermediate", type: "Posterior Chain" },
    { id: "lib_plank", name: "Weighted Plank", muscle: "Core", equipment: "Bodyweight", difficulty: "Beginner", type: "Core Stability" },
    { id: "lib_hanging_leg_raise", name: "Hanging Leg Raise", muscle: "Core", equipment: "Pull-Up Bar", difficulty: "Intermediate", type: "Core Flexion" }
  ],

  meals: [
    {
      id: "meal_01",
      type: "Breakfast",
      title: "Oatmeal with Whey & Berries",
      time: "08:15 AM",
      calories: 540,
      protein: 42,
      carbs: 68,
      fat: 12,
      ingredients: "Rolled oats, 1 scoop whey isolate, almond milk, blueberries, chia seeds"
    },
    {
      id: "meal_02",
      type: "Lunch",
      title: "Gourmet High-Protein Fitness Bowl",
      time: "01:30 PM",
      calories: 680,
      protein: 48,
      carbs: 64,
      fat: 22,
      image: "assets/healthy_meal.jpg",
      ingredients: "Herb grilled chicken & spiced paneer, tri-color quinoa, sliced avocado, roasted sweet potato, baby spinach, cherry tomatoes"
    },
    {
      id: "meal_03",
      type: "Pre-Workout Snack",
      title: "Greek Yogurt & Banana Crunch",
      time: "04:45 PM",
      calories: 320,
      protein: 22,
      carbs: 48,
      fat: 4,
      ingredients: "Low-fat Greek yogurt, 1 sliced banana, 1 tsp raw honey"
    },
    {
      id: "meal_04",
      type: "Dinner (Planned)",
      title: "Tandoori Fish Skewers with Brown Rice",
      time: "08:30 PM",
      calories: 610,
      protein: 45,
      carbs: 65,
      fat: 16,
      ingredients: "Marinated bhetki fish, brown basmati rice, steamed broccoli & bell peppers"
    }
  ],

  foodReactionLogs: [
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
  ],

  appointments: [
    {
      id: "apt_01",
      providerId: "pt_ramesh_sharma",
      providerName: "Dr. Ramesh Sharma",
      providerRole: "Consultant Physiotherapist",
      providerAvatar: "assets/physio_sharma.jpg",
      clinic: "Renew Physio & Sports Recovery Center",
      date: "Today, Oct 7",
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
      providerAvatar: "assets/doctor_iyer.jpg",
      clinic: "OrthoSports Performance Medical Center",
      date: "Oct 12, 2026",
      time: "10:30 AM",
      type: "In-Person Clinical Visit",
      status: "Confirmed",
      meetingLink: null,
      agenda: "Routine quarterly athletic bloodwork & micronutrient review"
    },
    {
      id: "apt_03",
      providerId: "tr_raj_patel",
      providerName: "Coach Raj Patel",
      providerRole: "Senior Strength Trainer",
      providerAvatar: "assets/trainer_raj.jpg",
      clinic: "FitZone Fitness Vadodara",
      date: "Sep 28, 2026",
      time: "06:00 PM",
      type: "1-on-1 Lifting Form Check",
      status: "Completed",
      meetingLink: null,
      agenda: "Squat depth & hip drive kinematic tuneup"
    }
  ],

  healthReports: [
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
      highlights: "Hemoglobin 15.2 g/dL (Optimal), Serum Ferritin 124 ng/mL, Total Testosterone 710 ng/dL, Fasting Glucose 88 mg/dL",
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
    },
    {
      id: "rep_03",
      title: "Resting Metabolic Rate (Indirect Calorimetry)",
      type: "Metabolic Testing",
      uploadDate: "Jul 10, 2026",
      fileType: "PDF",
      fileSize: "1.1 MB",
      lab: "FitSync Sports Science Lab",
      sharedWithDoctor: true,
      sharedWithPhysio: false,
      sharedWithTrainer: true,
      highlights: "Measured BMR: 1,718 kcal/day. RQ 0.81 indicating efficient mixed-substrate oxidation.",
      notes: "Shared with Coach Raj Patel to formulate surplus calorie target."
    }
  ],

  trainerInterventions: [
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
      memberAvatar: "assets/aarav.jpg",
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
  ],

  notifications: [
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
      title: "AI Progression Ready 🧠",
      desc: "Coach Raj & FitSync AI updated your bench press load to 82.5 kg.",
      time: "2 hours ago",
      type: "workout",
      actionText: "View Sets"
    },
    {
      id: "notif_03",
      title: "Hydration Milestone Reached 💧",
      desc: "You've logged 2,400ml today! Just 1,100ml remaining to hit your target.",
      time: "3 hours ago",
      type: "nutrition",
      actionText: "Log +250ml"
    },
    {
      id: "notif_04",
      title: "5-Day Gym Attendance Streak 🔥",
      desc: "You have visited FitZone Vadodara 5 consecutive days this week!",
      time: "Yesterday",
      type: "gym",
      actionText: "View Badge"
    }
  ],

  aiSuggestedPrompts: [
    "What should I eat for dinner?",
    "How can I increase my protein?",
    "Give me a vegetarian high-protein breakfast",
    "I have 600 calories left today. What can I eat?"
  ]
};
