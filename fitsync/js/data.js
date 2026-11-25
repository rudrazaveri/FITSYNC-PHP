/**
 * FitSync — Master Data Store & LocalStorage Persistence
 * Manages state across all 16 platform modules
 */

const DEFAULT_FITSYNC_DATA = {
  isLoggedIn: false,
  registeredUsers: [],
  user: null,
  stats: {
    weight: {
      current: null,
      unit: "kg",
      changeText: "No measurement yet",
      isPositive: true
    },
    bmi: {
      value: "--",
      status: "No data yet"
    },
    calories: {
      current: 0,
      target: 2000,
      unit: "kcal"
    },
    water: {
      current: 0.0,
      target: 3.0,
      unit: "L"
    }
  },
  goal: {
    title: "General Fitness",
    targetWeight: "--",
    targetDate: "--",
    progressPercent: 0,
    startingWeight: "--"
  },
  membership: {
    gymName: "No Gym Selected",
    location: "--",
    plan: "Free Athlete Tier",
    validTill: "--",
    status: "Inactive",
    startDate: "--",
    turnstileCode: "--"
  },
  gyms: [],
  trainers: [],
  todayWorkout: {
    title: "No Workout Scheduled",
    duration: "0 min",
    exercisesCount: 0,
    difficulty: "Beginner",
    exercises: []
  },
  workoutPlans: {
    mon: {
      dayKey: "mon",
      dayName: "Monday",
      badge: "MONDAY'S ROUTINE",
      subBadge: "Past Session Completed",
      title: "Chest & Triceps Hypertrophy",
      tagline: "Horizontal Push Pattern • Upper Pec Density & Lockout Power • Intermediate",
      duration: "45 mins",
      exercises: [
        {
          id: "ex_bench",
          name: "Barbell Incline Bench Press",
          muscle: "Chest (Upper Pectoralis), Front Delts",
          equipment: "Incline Bench, Olympic Barbell",
          image: "assets/images/ex_incline_bench.jpg",
          target: "Target: 4 sets x 8–10 reps @ 65.0 kg",
          sets: [
            { set: 1, reps: 10, weight: 60.0, done: true },
            { set: 2, reps: 10, weight: 65.0, done: true },
            { set: 3, reps: 8, weight: 65.0, done: true },
            { set: 4, reps: 8, weight: 70.0, done: true }
          ]
        },
        {
          id: "ex_dips",
          name: "Parallel Bar Dips",
          muscle: "Lower Pectoralis, Anterior Delts, Triceps",
          equipment: "Dip Station",
          image: "assets/images/ex_parallel_dips.jpg",
          target: "Target: 3 sets x 12 reps @ Bodyweight",
          sets: [
            { set: 1, reps: 12, weight: "Bodyweight", done: true },
            { set: 2, reps: 12, weight: "Bodyweight", done: true },
            { set: 3, reps: 10, weight: "Bodyweight", done: true }
          ]
        },
        {
          id: "ex_tricep",
          name: "Tricep Rope Pushdown",
          muscle: "Triceps Lateral & Medial Heads",
          equipment: "Cable Tower",
          image: "assets/images/ex_tricep_pushdown.jpg",
          target: "Target: 3 sets x 15 reps @ 25.0 kg",
          sets: [
            { set: 1, reps: 15, weight: 20.0, done: true },
            { set: 2, reps: 12, weight: 25.0, done: true },
            { set: 3, reps: 12, weight: 25.0, done: true }
          ]
        }
      ]
    },
    tue: {
      dayKey: "tue",
      dayName: "Tuesday",
      badge: "TUESDAY'S ROUTINE",
      subBadge: "Daily Routine Preview",
      title: "Back & Biceps Power",
      tagline: "Pull Movement Pattern • V-Taper & Arm Thickness • Intermediate",
      duration: "50 mins",
      exercises: [
        {
          id: "ex_lat",
          name: "Wide-Grip Lat Pulldown",
          muscle: "Latissimus Dorsi, Teres Major, Biceps • Cable Pulldown Machine",
          equipment: "Cable Machine",
          image: "assets/images/ex_lat_pulldown.jpg",
          target: "Target: 4 sets x 10–12 reps @ 60.0 kg",
          sets: [
            { set: 1, reps: 12, weight: 55.0, done: false },
            { set: 2, reps: 10, weight: 60.0, done: false },
            { set: 3, reps: 10, weight: 60.0, done: false },
            { set: 4, reps: 8, weight: 65.0, done: false }
          ]
        },
        {
          id: "ex_deadlift",
          name: "Conventional Deadlift",
          muscle: "Hamstrings, Glutes, Erector Spinae • Olympic Barbell",
          equipment: "Olympic Barbell",
          image: "assets/images/ex_deadlift.jpg",
          target: "Target: 4 sets x 6–8 reps @ 85.0 kg",
          sets: [
            { set: 1, reps: 8, weight: 70.0, done: false },
            { set: 2, reps: 8, weight: 80.0, done: false },
            { set: 3, reps: 6, weight: 85.0, done: false },
            { set: 4, reps: 6, weight: 90.0, done: false }
          ]
        },
        {
          id: "ex_curl",
          name: "Incline Dumbbell Bicep Curl",
          muscle: "Biceps Brachii (Long Head) • Dumbbells",
          equipment: "Dumbbells & 45° Bench",
          image: "assets/images/ex_incline_curl.jpg",
          target: "Target: 3 sets x 12 reps @ 14.0 kg",
          sets: [
            { set: 1, reps: 12, weight: 12.0, done: false },
            { set: 2, reps: 12, weight: 14.0, done: false },
            { set: 3, reps: 10, weight: 14.0, done: false }
          ]
        },
        {
          id: "ex_row",
          name: "Seated Cable Row",
          muscle: "Rhomboids, Latissimus Dorsi, Mid Trapezius",
          equipment: "Low Pulley Cable",
          image: "assets/images/ex_seated_row.jpg",
          target: "Target: 3 sets x 12 reps @ 50.0 kg",
          sets: [
            { set: 1, reps: 12, weight: 45.0, done: false },
            { set: 2, reps: 12, weight: 50.0, done: false },
            { set: 3, reps: 10, weight: 55.0, done: false }
          ]
        },
        {
          id: "ex_hammer",
          name: "Dumbbell Hammer Curls",
          muscle: "Brachialis & Brachioradialis • Free Weights",
          equipment: "Dumbbells",
          image: "assets/images/ex_hammer_curl.jpg",
          target: "Target: 3 sets x 12 reps @ 16.0 kg",
          sets: [
            { set: 1, reps: 12, weight: 14.0, done: false },
            { set: 2, reps: 12, weight: 16.0, done: false },
            { set: 3, reps: 10, weight: 16.0, done: false }
          ]
        }
      ]
    },
    wed: {
      dayKey: "wed",
      dayName: "Wednesday",
      badge: "WEDNESDAY'S ROUTINE",
      subBadge: "Past Session Completed",
      title: "Lower Body & Core Dominance",
      tagline: "Knee-Dominant & Hinge Patterns • Quad Tear-Drop & Glute Activation",
      duration: "55 mins",
      exercises: [
        {
          id: "ex_squat",
          name: "Barbell Back Squat",
          muscle: "Quadriceps, Gluteus Maximus, Hamstrings",
          equipment: "Squat Rack, Olympic Barbell",
          image: "assets/images/ex_back_squat.jpg",
          target: "Target: 4 sets x 8 reps @ 80.0 kg",
          sets: [
            { set: 1, reps: 8, weight: 70.0, done: true },
            { set: 2, reps: 8, weight: 75.0, done: true },
            { set: 3, reps: 8, weight: 80.0, done: true },
            { set: 4, reps: 6, weight: 85.0, done: true }
          ]
        },
        {
          id: "ex_rdl",
          name: "Romanian Deadlift (RDL)",
          muscle: "Hamstrings, Glutes, Lower Back",
          equipment: "Olympic Barbell",
          image: "assets/images/ex_romanian_deadlift.jpg",
          target: "Target: 4 sets x 10 reps @ 65.0 kg",
          sets: [
            { set: 1, reps: 10, weight: 55.0, done: true },
            { set: 2, reps: 10, weight: 60.0, done: true },
            { set: 3, reps: 10, weight: 65.0, done: true },
            { set: 4, reps: 8, weight: 70.0, done: true }
          ]
        },
        {
          id: "ex_calves",
          name: "Standing Calf Raises",
          muscle: "Gastrocnemius, Soleus",
          equipment: "Calf Raise Machine",
          image: "assets/images/ex_standing_calf_raise.jpg",
          target: "Target: 4 sets x 15 reps @ 50.0 kg",
          sets: [
            { set: 1, reps: 15, weight: 45.0, done: true },
            { set: 2, reps: 15, weight: 50.0, done: true },
            { set: 3, reps: 15, weight: 50.0, done: true },
            { set: 4, reps: 12, weight: 55.0, done: true }
          ]
        }
      ]
    },
    thu: {
      dayKey: "thu",
      dayName: "Thursday",
      badge: "THURSDAY'S ROUTINE",
      subBadge: "Active Mobility & Recovery",
      title: "Active Mobility & Core Conditioning",
      tagline: "Scapular Mechanics • Pelvic Stability & Thoracic Opener",
      duration: "35 mins",
      exercises: [
        {
          id: "ex_greatest_stretch",
          name: "World's Greatest Stretch & Thoracic Opener",
          muscle: "Hip Flexors, Hamstrings, Thoracic Spine, Groin • Yoga Mat",
          equipment: "Yoga Mat / Bodyweight",
          image: "assets/images/ex_greatest_stretch.jpg",
          target: "Target: 3 sets x 6 / side reps @ Bodyweight",
          sets: [
            { set: 1, reps: 6, weight: "Bodyweight", done: false },
            { set: 2, reps: 6, weight: "Bodyweight", done: false },
            { set: 3, reps: 6, weight: "Bodyweight", done: false }
          ]
        },
        {
          id: "ex_plank",
          name: "Weighted Core Plank",
          muscle: "Transverse Abdominis, Rectus Abdominis",
          equipment: "Weight Plate & Floor Mat",
          image: "assets/images/ex_forearm_plank.jpg",
          target: "Target: 4 sets x 60s Hold @ 10.0 kg",
          sets: [
            { set: 1, reps: 60, weight: "Bodyweight", done: false },
            { set: 2, reps: 60, weight: 10.0, done: false },
            { set: 3, reps: 60, weight: 10.0, done: false },
            { set: 4, reps: 45, weight: 10.0, done: false }
          ]
        },
        {
          id: "ex_kettlebell",
          name: "Kettlebell Russian Swings",
          muscle: "Posterior Chain, Glutes & Hip Explosiveness",
          equipment: "Kettlebell",
          image: "assets/images/ex_russian_twist.jpg",
          target: "Target: 4 sets x 15 reps @ 20.0 kg",
          sets: [
            { set: 1, reps: 15, weight: 16.0, done: false },
            { set: 2, reps: 15, weight: 20.0, done: false },
            { set: 3, reps: 15, weight: 20.0, done: false },
            { set: 4, reps: 15, weight: 24.0, done: false }
          ]
        }
      ]
    },
    fri: {
      dayKey: "fri",
      dayName: "Friday",
      badge: "FRIDAY'S ROUTINE",
      subBadge: "Yesterday's Session",
      title: "Shoulders & Upper Body Push",
      tagline: "Vertical Push • 3D Deltoid Roundness & Scapular Elevation",
      duration: "45 mins",
      exercises: [
        {
          id: "ex_ohp",
          name: "Dumbbell Overhead Shoulder Press",
          muscle: "Anterior Deltoids, Lateral Delts, Triceps",
          equipment: "Dumbbells & 75° Incline Bench",
          image: "assets/images/ex_dumbbell_press.jpg",
          target: "Target: 4 sets x 10 reps @ 20.0 kg",
          sets: [
            { set: 1, reps: 12, weight: 16.0, done: true },
            { set: 2, reps: 10, weight: 18.0, done: true },
            { set: 3, reps: 10, weight: 20.0, done: true },
            { set: 4, reps: 8, weight: 22.0, done: true }
          ]
        },
        {
          id: "ex_lat_raise",
          name: "Dumbbell Lateral Deltoid Raise",
          muscle: "Lateral Deltoid Head (Side Delts)",
          equipment: "Dumbbells",
          image: "assets/images/ex_lateral_raise.jpg",
          target: "Target: 4 sets x 15 reps @ 9.0 kg",
          sets: [
            { set: 1, reps: 15, weight: 8.0, done: true },
            { set: 2, reps: 15, weight: 9.0, done: true },
            { set: 3, reps: 15, weight: 9.0, done: true },
            { set: 4, reps: 12, weight: 10.0, done: true }
          ]
        },
        {
          id: "ex_face_pull",
          name: "Cable Face Pull with External Rotation",
          muscle: "Rear Deltoids, Rotator Cuff, Infraspinatus",
          equipment: "Cable Tower with Rope",
          image: "assets/images/ex_face_pull.jpg",
          target: "Target: 3 sets x 15 reps @ 20.0 kg",
          sets: [
            { set: 1, reps: 15, weight: 15.0, done: true },
            { set: 2, reps: 15, weight: 20.0, done: true },
            { set: 3, reps: 15, weight: 20.0, done: true }
          ]
        }
      ]
    },
    sat: {
      dayKey: "sat",
      dayName: "Saturday",
      badge: "SATURDAY'S ROUTINE",
      subBadge: "Today's Active Session",
      title: "Upper Body Strength & Hypertrophy",
      tagline: "Compound Chest & Back Overload • Peak Performance Session",
      duration: "45 mins",
      exercises: [
        {
          id: "ex_incline",
          name: "Incline Barbell Bench Press",
          muscle: "Upper Pectoralis, Anterior Deltoids, Triceps",
          equipment: "Incline Bench, Olympic Barbell",
          image: "assets/images/ex_incline_bench.jpg",
          target: "Target: 4 sets x 8–10 reps @ 65.0 kg",
          sets: [
            { set: 1, reps: 10, weight: 60.0, done: false },
            { set: 2, reps: 8, weight: 65.0, done: false },
            { set: 3, reps: 8, weight: 65.0, done: false },
            { set: 4, reps: 6, weight: 70.0, done: false }
          ]
        },
        {
          id: "ex_pulldown_sat",
          name: "Neutral-Grip Lat Pulldown",
          muscle: "Latissimus Dorsi, Teres Major, Biceps",
          equipment: "Cable Pulldown Machine",
          image: "assets/images/ex_lat_pulldown.jpg",
          target: "Target: 4 sets x 10–12 reps @ 60.0 kg",
          sets: [
            { set: 1, reps: 12, weight: 55.0, done: false },
            { set: 2, reps: 10, weight: 60.0, done: false },
            { set: 3, reps: 10, weight: 60.0, done: false },
            { set: 4, reps: 8, weight: 65.0, done: false }
          ]
        },
        {
          id: "ex_lateral_sat",
          name: "Dumbbell Lateral Deltoid Raise",
          muscle: "Lateral Deltoid Head (Side Delts)",
          equipment: "Dumbbells",
          image: "assets/images/ex_lateral_raise.jpg",
          target: "Target: 4 sets x 15 reps @ 9.0 kg",
          sets: [
            { set: 1, reps: 15, weight: 8.0, done: false },
            { set: 2, reps: 15, weight: 9.0, done: false },
            { set: 3, reps: 15, weight: 9.0, done: false },
            { set: 4, reps: 12, weight: 10.0, done: false }
          ]
        },
        {
          id: "ex_curls_sat",
          name: "Standing Dumbbell Bicep Curl",
          muscle: "Biceps Brachii, Brachialis",
          equipment: "Dumbbells",
          image: "assets/images/ex_barbell_curl.jpg",
          target: "Target: 3 sets x 12 reps @ 14.0 kg",
          sets: [
            { set: 1, reps: 12, weight: 12.0, done: false },
            { set: 2, reps: 12, weight: 14.0, done: false },
            { set: 3, reps: 10, weight: 14.0, done: false }
          ]
        }
      ]
    },
    sun: {
      dayKey: "sun",
      dayName: "Sunday",
      badge: "SUNDAY'S ROUTINE",
      subBadge: "Rest & Cellular Recovery",
      title: "Full Rest & Recovery Protocol",
      tagline: "Active Recovery • Light 5,000 Step Walk • Foam Rolling & Hydration",
      duration: "30 mins",
      exercises: [
        {
          id: "ex_foam",
          name: "Full Body Foam Rolling & Myofascial Release",
          muscle: "IT Band, Quads, Thoracic Spine, Lats",
          equipment: "High-Density Foam Roller",
          image: "assets/images/ex_foam_rolling.jpg",
          target: "Target: 3 sets x 3 mins Deep Rolling",
          sets: [
            { set: 1, reps: 3, weight: "Bodyweight", done: false },
            { set: 2, reps: 3, weight: "Bodyweight", done: false },
            { set: 3, reps: 3, weight: "Bodyweight", done: false }
          ]
        },
        {
          id: "ex_walk",
          name: "Zone 1 Outdoor Recovery Walk",
          muscle: "Cardiovascular Flushing & Lymphatic Drainage",
          equipment: "Outdoor Trail / Treadmill",
          image: "assets/images/ex_recovery_walk.jpg",
          target: "Target: 45 min Low-Intensity Aerobic Walk",
          sets: [
            { set: 1, reps: 45, weight: "Bodyweight", done: false }
          ]
        }
      ]
    }
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
    // 1. CHEST (Pectoralis Major & Minor)
    {
      id: "ex-chest-incline-bb",
      name: "Barbell Incline Bench Press",
      muscleGroup: "chest",
      muscle: "Upper Pectoralis Major (Clavicular Head), Anterior Deltoid",
      equipment: "Incline Bench, Olympic Barbell",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Set bench at 30°. Retract scapulae, lower bar under control to upper clavicle, press upward through mid-chest without flaring elbows.",
      image: "assets/images/ex_incline_bench.jpg"
    },
    {
      id: "ex-chest-flat-bb",
      name: "Flat Barbell Bench Press",
      muscleGroup: "chest",
      muscle: "Pectoralis Major (Sternal Head), Anterior Deltoid, Triceps",
      equipment: "Flat Bench, Olympic Barbell",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Maintain 5-point contact, arch lower back naturally, drive heels into floor. Touch mid-sternum with elbows tucked at 45°.",
      image: "assets/images/ex_flat_bench.jpg"
    },
    {
      id: "ex-chest-db-fly",
      name: "Incline Dumbbell Chest Flyes",
      muscleGroup: "chest",
      muscle: "Upper & Middle Pectoralis Major (Hypertrophy Stretch)",
      equipment: "Incline Bench, Dumbbells",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Slight bend in elbows. Open arms in wide arc until deep pec stretch is felt, squeeze chest at top without clanking dumbbells.",
      image: "assets/images/ex_incline_fly.jpg"
    },
    {
      id: "ex-chest-dips",
      name: "Parallel Bar Chest Dips",
      muscleGroup: "chest",
      muscle: "Lower Pectoralis Major (Costal Head), Triceps",
      equipment: "Dip Station",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Lean forward 30° to target pecs. Lower until upper arms are parallel to floor, push through palms to lockout.",
      image: "assets/images/ex_parallel_dips.jpg"
    },
    {
      id: "ex-chest-cable-cross",
      name: "Cable Low-to-High Flye Crossover",
      muscleGroup: "chest",
      muscle: "Upper Pectoralis (Clavicular Head & Sternal Tie-In)",
      equipment: "Dual Cable Tower",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Set pulleys to lowest notch. Drive hands upward and inward in an upward scooping motion, squeeze upper chest for 1 second.",
      image: "assets/images/ex_cable_crossover.jpg"
    },
    {
      id: "ex-chest-pushups",
      name: "Standard Push-Ups (Deficit / Floor)",
      muscleGroup: "chest",
      muscle: "Pectoralis Major, Serratus Anterior, Core",
      equipment: "Bodyweight",
      difficulty: "Beginner",
      type: "Compound",
      cues: "Full plank alignment with glutes engaged. Lower chest to 1 inch off floor, push actively away while spreading shoulder blades at top.",
      image: "assets/images/ex_pushups.jpg"
    },

    // 2. BACK (Latissimus Dorsi, Rhomboids, Mid/Upper Back)
    {
      id: "ex-back-lat-pulldown",
      name: "Wide-Grip Lat Pulldown",
      muscleGroup: "back",
      muscle: "Latissimus Dorsi (Outer Width), Teres Major, Biceps",
      equipment: "Cable Pulldown Machine",
      difficulty: "Beginner",
      type: "Compound",
      cues: "Grip slightly wider than shoulders. Depress scapulae first, drive elbows downward toward hips, bring bar to upper chest.",
      image: "assets/images/ex_lat_pulldown.jpg"
    },
    {
      id: "ex-back-pullups",
      name: "Bodyweight Neutral-Grip Pull-Ups",
      muscleGroup: "back",
      muscle: "Latissimus Dorsi, Brachialis, Lower Trapezius",
      equipment: "Pull-Up Bar",
      difficulty: "Advanced",
      type: "Compound",
      cues: "Hang with dead-hang extension. Initiate with back muscles, drive elbows down to ribs until chin clears the bar cleanly.",
      image: "assets/images/ex_pullups.jpg"
    },
    {
      id: "ex-back-bb-row",
      name: "Barbell Bent-Over Row",
      muscleGroup: "back",
      muscle: "Rhomboids, Latissimus Dorsi, Mid-Trapezius, Posterior Delts",
      equipment: "Olympic Barbell",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Hinge at 45° with rigid flat back. Pull bar toward belly button, squeeze shoulder blades together at apex.",
      image: "assets/images/ex_barbell_row.jpg"
    },
    {
      id: "ex-back-seated-row",
      name: "Seated Cable Row (Close-Grip)",
      muscleGroup: "back",
      muscle: "Rhomboids, Mid Trapezius, Latissimus Dorsi Thickness",
      equipment: "Low Cable Machine, V-Bar",
      difficulty: "Beginner",
      type: "Compound",
      cues: "Sit tall with chest upright. Pull handle to lower abdomen, keep elbows tucked close to torso, control the stretch on release.",
      image: "assets/images/ex_seated_row.jpg"
    },
    {
      id: "ex-back-db-row",
      name: "Single-Arm Dumbbell Row",
      muscleGroup: "back",
      muscle: "Latissimus Dorsi (Unilateral Thickness), Teres Major",
      equipment: "Flat Bench, Dumbbell",
      difficulty: "Beginner",
      type: "Compound",
      cues: "Support one knee on bench. Row dumbbell back towards hip pocket in a J-curve arc, preventing torso rotation.",
      image: "assets/images/ex_dumbbell_row.jpg"
    },

    // 3. TRAPEZIUS & UPPER BACK (Traps)
    {
      id: "ex-traps-bb-shrug",
      name: "Barbell Power Shrugs",
      muscleGroup: "traps",
      muscle: "Upper Trapezius, Levator Scapulae",
      equipment: "Barbell / Smith Machine",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Hold bar at hip level. Elevate shoulders straight up towards ears without rolling shoulders, hold peak contraction for 1 full second.",
      image: "assets/images/ex_shrugs.jpg"
    },
    {
      id: "ex-traps-face-pull",
      name: "Cable Face Pulls with External Rotation",
      muscleGroup: "traps",
      muscle: "Rear Deltoids, Rhomboids, Middle & Lower Trapezius",
      equipment: "Cable Tower, Rope Attachment",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Set pulley at eye height. Pull rope towards bridge of nose while externally rotating wrists so thumbs point backward.",
      image: "assets/images/ex_face_pull.jpg"
    },
    {
      id: "ex-traps-prone-y-raise",
      name: "Prone Incline Y-Raise",
      muscleGroup: "traps",
      muscle: "Lower Trapezius, Scapular Stabilizers",
      equipment: "Incline Bench, Light Dumbbells",
      difficulty: "Intermediate",
      type: "Isolation",
      cues: "Lie face down on 30° incline. Raise arms in a 45° 'Y' position thumbs upward, squeezing lower shoulder blades down and back.",
      image: "assets/images/ex_prone_y_raise.jpg"
    },

    // 4. LOWER BACK (Erector Spinae)
    {
      id: "ex-lowerback-deadlift",
      name: "Barbell Conventional Deadlift",
      muscleGroup: "lowerback",
      muscle: "Erector Spinae, Gluteus Maximus, Hamstrings, Traps",
      equipment: "Olympic Barbell & Bumper Plates",
      difficulty: "Advanced",
      type: "Compound",
      cues: "Bar over midfoot. Wedge hips down, pull slack out of bar, drive floor away with legs while keeping spine neutral throughout.",
      image: "assets/images/ex_deadlift.jpg"
    },
    {
      id: "ex-lowerback-hyper",
      name: "Hyperextensions (Back Extensions)",
      muscleGroup: "lowerback",
      muscle: "Erector Spinae (Lumbar Spine), Gluteal Muscles",
      equipment: "45-Degree Hyperextension Bench",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Hips against pad edge. Lower torso smoothly, extend back until body forms straight diagonal line without hyperextending lumbar spine.",
      image: "assets/images/ex_hyperextensions.jpg"
    },
    {
      id: "ex-lowerback-goodmorning",
      name: "Barbell Good Mornings",
      muscleGroup: "lowerback",
      muscle: "Erector Spinae, Hamstrings, Gluteus Maximus",
      equipment: "Barbell, Squat Rack",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Bar rested on upper traps. Soft knee bend, hinge hips backward until torso is nearly parallel with floor, drive hips forward.",
      image: "assets/images/ex_good_mornings.jpg"
    },

    // 5. SHOULDERS (Deltoids - Anterior, Lateral, Posterior)
    {
      id: "ex-shoulders-ohp",
      name: "Standing Barbell Overhead Press (OHP)",
      muscleGroup: "shoulders",
      muscle: "Anterior Deltoids, Lateral Deltoids, Triceps, Core",
      equipment: "Olympic Barbell, Squat Rack",
      difficulty: "Advanced",
      type: "Compound",
      cues: "Tight glutes and braced core. Press bar in vertical path, tuck head through window at top for full overhead lockout.",
      image: "assets/images/ex_overhead_press.jpg"
    },
    {
      id: "ex-shoulders-db-press",
      name: "Seated Dumbbell Shoulder Press",
      muscleGroup: "shoulders",
      muscle: "Anterior & Lateral Deltoids, Triceps Brachii",
      equipment: "Adjustable Bench, Dumbbells",
      difficulty: "Beginner",
      type: "Compound",
      cues: "Set bench at 75-80°. Press dumbbells upward along natural arc, stopping just short of locking out elbows.",
      image: "assets/images/ex_dumbbell_press.jpg"
    },
    {
      id: "ex-shoulders-lat-raise",
      name: "Dumbbell Lateral Deltoid Raise",
      muscleGroup: "shoulders",
      muscle: "Lateral Deltoids (Side Delts / V-Taper Width)",
      equipment: "Dumbbells",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Slight 10° forward lean. Raise elbows in scapular plane to parallel with floor, lead with elbows, pause 0.5s at peak.",
      image: "assets/images/ex_lateral_raise.jpg"
    },
    {
      id: "ex-shoulders-cable-y",
      name: "Cable Lateral Y-Raise",
      muscleGroup: "shoulders",
      muscle: "Lateral Deltoids (Constant Cable Tension)",
      equipment: "Dual Low Cable Pulley",
      difficulty: "Intermediate",
      type: "Isolation",
      cues: "Cross cables behind back. Pull upwards and outwards to 45° angle, keeping constant tension through full range of motion.",
      image: "assets/images/ex_cable_lateral.jpg"
    },
    {
      id: "ex-shoulders-rear-pecdeck",
      name: "Reverse Pec Deck (Rear Delt Fly)",
      muscleGroup: "shoulders",
      muscle: "Posterior Deltoids (Rear Delts), Infraspinatus",
      equipment: "Pec Deck Machine",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Chest flat against pad. Keep slight elbow bend, drive arms back horizontally using rear shoulders rather than mid-back.",
      image: "assets/images/ex_rear_pecdeck.jpg"
    },

    // 6. BICEPS (Biceps Brachii - Long & Short Heads, Brachialis)
    {
      id: "ex-biceps-bb-curl",
      name: "Standing Barbell Bicep Curl",
      muscleGroup: "biceps",
      muscle: "Biceps Brachii (Short & Long Heads), Brachialis",
      equipment: "EZ Bar / Straight Barbell",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Elbows pinned to sides of ribcage. Curl weight upward through full supination, control 3-second eccentric lowering phase.",
      image: "assets/images/ex_barbell_curl.jpg"
    },
    {
      id: "ex-biceps-incline-curl",
      name: "Incline Dumbbell Bicep Curl",
      muscleGroup: "biceps",
      muscle: "Biceps Brachii Long Head (Bicep Peak Stretch)",
      equipment: "45-Degree Incline Bench, Dumbbells",
      difficulty: "Intermediate",
      type: "Isolation",
      cues: "Arms hanging straight down behind torso. Curl dumbbells while maintaining shoulder extension to maximize long head stretch.",
      image: "assets/images/ex_incline_curl.jpg"
    },
    {
      id: "ex-biceps-hammer",
      name: "Dumbbell Hammer Curls",
      muscleGroup: "biceps",
      muscle: "Brachialis & Brachioradialis (Arm Thickness)",
      equipment: "Dumbbells",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Neutral thumbs-up grip. Curl dumbbells alternately or together toward front shoulders without swinging torso.",
      image: "assets/images/ex_hammer_curl.jpg"
    },
    {
      id: "ex-biceps-preacher",
      name: "Preacher Curl (Scott Bench)",
      muscleGroup: "biceps",
      muscle: "Biceps Brachii Short Head (Inner Peak Isolation)",
      equipment: "Preacher Bench, EZ Bar",
      difficulty: "Intermediate",
      type: "Isolation",
      cues: "Armpits snug over pad. Isolate biceps completely by eliminating momentum, curl upward to full flexion without lifting elbows.",
      image: "assets/images/ex_preacher_curl.jpg"
    },

    // 7. TRICEPS (Triceps Brachii - Lateral, Long, Medial Heads)
    {
      id: "ex-triceps-rope-pushdown",
      name: "Tricep Rope Cable Pushdown",
      muscleGroup: "triceps",
      muscle: "Triceps Brachii (Lateral & Medial Heads)",
      equipment: "High Cable Pulley, Rope Attachment",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Upper arms stationary by flanks. Push rope down, flaring rope ends outward at bottom for maximum tricep contraction.",
      image: "assets/images/ex_tricep_pushdown.jpg"
    },
    {
      id: "ex-triceps-skullcrusher",
      name: "Lying Barbell Skull Crushers",
      muscleGroup: "triceps",
      muscle: "Triceps Brachii (Long Head & Medial Head)",
      equipment: "Flat Bench, EZ Barbell",
      difficulty: "Intermediate",
      type: "Isolation",
      cues: "Arms angled 10° backward from vertical. Hinge at elbows, lower bar to hairline, extend triceps back to start position.",
      image: "assets/images/ex_skullcrushers.jpg"
    },
    {
      id: "ex-triceps-overhead-ext",
      name: "Overhead Dumbbell Tricep Extension",
      muscleGroup: "triceps",
      muscle: "Triceps Brachii Long Head (Full Stretch Overhead)",
      equipment: "Dumbbell / Cable",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Hold dumbbell with diamond cup grip overhead. Lower dumbbell deep behind head, flare elbows slightly, press straight up.",
      image: "assets/images/ex_overhead_tricep.jpg"
    },
    {
      id: "ex-triceps-cg-bench",
      name: "Close-Grip Barbell Bench Press",
      muscleGroup: "triceps",
      muscle: "Triceps Brachii, Anterior Deltoids, Inner Pecs",
      equipment: "Flat Olympic Bench",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Shoulder-width grip. Keep elbows tucked tightly against ribs, lower to lower sternum, press explosively through triceps.",
      image: "assets/images/ex_close_grip_bench.jpg"
    },

    // 8. FOREARMS & GRIP (Brachioradialis, Wrist Flexors & Extensors)
    {
      id: "ex-forearms-reverse-curl",
      name: "Reverse-Grip Barbell Wrist Curl",
      muscleGroup: "forearms",
      muscle: "Brachioradialis, Forearm Extensors",
      equipment: "Barbell / EZ Bar",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Pronated overhand grip. Rest forearms across thighs, curl wrists upward toward ceiling, hold for 1 second.",
      image: "assets/images/ex_reverse_curl.jpg"
    },
    {
      id: "ex-forearms-farmers-walk",
      name: "Heavy Dumbbell Farmer's Carry",
      muscleGroup: "forearms",
      muscle: "Grip Flexors, Brachioradialis, Trapezius, Core",
      equipment: "Heavy Dumbbells or Kettlebells",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Stand tall with ribs down and shoulders packed. Walk 40 meters with measured heel-to-toe steps without swaying sideways.",
      image: "assets/images/ex_farmers_walk.jpg"
    },

    // 9. QUADRICEPS (Rectus Femoris, Vastus Lateralis, Vastus Medialis)
    {
      id: "ex-quads-back-squat",
      name: "Barbell Back Squat (High Bar)",
      muscleGroup: "quads",
      muscle: "Quadriceps Femoris (Rectus Femoris, Vastus Medialis), Glutes",
      equipment: "Olympic Squat Rack & Barbell",
      difficulty: "Advanced",
      type: "Compound",
      cues: "Bar on upper traps. Deep diaphragmatic brace, break at hips and knees simultaneously, descend below parallel, drive up through midfoot.",
      image: "assets/images/ex_back_squat.jpg"
    },
    {
      id: "ex-quads-leg-ext",
      name: "Leg Extension Machine",
      muscleGroup: "quads",
      muscle: "Quadriceps (Vastus Medialis 'Teardrop' Isolation)",
      equipment: "Leg Extension Machine",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Back against pad, knee joint aligned with machine pivot. Extend legs to full lockout, pause for 1 second, resist negative descent.",
      image: "assets/images/ex_leg_extension.jpg"
    },
    {
      id: "ex-quads-split-squat",
      name: "Bulgarian Split Squat",
      muscleGroup: "quads",
      muscle: "Quadriceps, Gluteus Medius, Adductors",
      equipment: "Flat Bench, Pair of Dumbbells",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Rear foot elevated on bench. Keep front knee tracking over second toe, sink straight down until back knee hovers above floor.",
      image: "assets/images/ex_bulgarian_split.jpg"
    },
    {
      id: "ex-quads-hack-squat",
      name: "Machine Hack Squat / Leg Press",
      muscleGroup: "quads",
      muscle: "Quadriceps Femoris Mass & Vastus Lateralis Sweep",
      equipment: "Hack Squat Sled",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Feet shoulder-width on platform. Lower sled under strict 3-second control to 90° knee angle, drive through heels without knee hyperextension.",
      image: "assets/images/ex_hack_squat.jpg"
    },

    // 10. HAMSTRINGS (Biceps Femoris, Semitendinosus, Semimembranosus)
    {
      id: "ex-hamstrings-rdl",
      name: "Barbell Romanian Deadlift (RDL)",
      muscleGroup: "hamstrings",
      muscle: "Hamstrings (Biceps Femoris), Gluteus Maximus",
      equipment: "Olympic Barbell & Plates",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Soft knee bend throughout. Push hips straight back towards rear wall, slide bar down shins until deep hamstring stretch, drive hips through.",
      image: "assets/images/ex_romanian_deadlift.jpg"
    },
    {
      id: "ex-hamstrings-lying-curl",
      name: "Lying Leg Curl Machine",
      muscleGroup: "hamstrings",
      muscle: "Hamstrings (Knee Flexion Hypertrophy)",
      equipment: "Lying Leg Curl Machine",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Hips pressed firmly into bench. Curl pad toward glutes, dorsiflex toes slightly, control the lowering tempo to prevent hip lift.",
      image: "assets/images/ex_lying_leg_curl.jpg"
    },
    {
      id: "ex-hamstrings-seated-curl",
      name: "Seated Leg Curl Machine",
      muscleGroup: "hamstrings",
      muscle: "Hamstrings (Peak Lengthened Position)",
      equipment: "Seated Leg Curl Machine",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Adjust lap pad snugly. Curl heels down and back under seat, pause at peak flexion, emphasize 3-second controlled return.",
      image: "assets/images/ex_seated_leg_curl.jpg"
    },

    // 11. GLUTES (Gluteus Maximus, Medius & Minimus)
    {
      id: "ex-glutes-hip-thrust",
      name: "Barbell Hip Thrust",
      muscleGroup: "glutes",
      muscle: "Gluteus Maximus (Peak Contraction), Hamstrings",
      equipment: "Hip Thrust Bench & Barbell Pad",
      difficulty: "Intermediate",
      type: "Compound",
      cues: "Upper back hinged across bench, bar over hips. Drive through heels to full hip extension, tuck chin, squeeze glutes hard for 1 second at top.",
      image: "assets/images/ex_hip_thrust.jpg"
    },
    {
      id: "ex-glutes-kickback",
      name: "Cable Standing Glute Kickback",
      muscleGroup: "glutes",
      muscle: "Gluteus Maximus & Gluteus Medius",
      equipment: "Low Cable Tower, Ankle Strap",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Hinge torso slightly forward. Kick leg straight backward squeezing glute at top, avoid overarching lower spine.",
      image: "assets/images/ex_glute_kickback.jpg"
    },
    {
      id: "ex-glutes-abduction",
      name: "Seated Hip Abduction Machine",
      muscleGroup: "glutes",
      muscle: "Gluteus Medius & Minimus (Hip Stability & Shelf)",
      equipment: "Hip Abduction Machine",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Sit slightly forward off backrest. Push knees wide against resistance pads, hold peak contraction, return slowly.",
      image: "assets/images/ex_hip_abduction.jpg"
    },

    // 12. CALVES (Gastrocnemius & Soleus)
    {
      id: "ex-calves-standing-raise",
      name: "Standing Barbell Calf Raise",
      muscleGroup: "calves",
      muscle: "Gastrocnemius (Medial & Lateral Heads / Straight Knee)",
      equipment: "Calf Block, Smith Machine or Barbell",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Balls of feet on edge of block. Drop heels for full calf stretch, drive onto big toes for peak contraction, pause at apex.",
      image: "assets/images/ex_standing_calf_raise.jpg"
    },
    {
      id: "ex-calves-seated-raise",
      name: "Seated Calf Raise Machine",
      muscleGroup: "calves",
      muscle: "Soleus Muscle (Deep Postural Calf Muscle)",
      equipment: "Seated Calf Raise Machine",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Knees bent at 90° isolates soleus. Lower heels into deep stretch, drive up onto toes with a 2-second hold at peak.",
      image: "assets/images/ex_seated_calf_raise.jpg"
    },

    // 13. ABS & CORE (Rectus Abdominis, Obliques, Deep Transverse)
    {
      id: "ex-abs-hanging-raise",
      name: "Hanging Leg / Knee Raises",
      muscleGroup: "abs",
      muscle: "Lower Rectus Abdominis, Hip Flexors, Deep Core",
      equipment: "Pull-Up Bar / Captain's Chair",
      difficulty: "Intermediate",
      type: "Isolation",
      cues: "Hang with engaged shoulders. Curl pelvis upward while lifting legs or knees to chest, avoid using body momentum.",
      image: "assets/images/ex_hanging_leg_raise.jpg"
    },
    {
      id: "ex-abs-cable-crunch",
      name: "Kneeling Cable Rope Crunch",
      muscleGroup: "abs",
      muscle: "Upper Rectus Abdominis (Six-Pack Flexion)",
      equipment: "High Cable Pulley, Rope Attachment",
      difficulty: "Intermediate",
      type: "Isolation",
      cues: "Kneel facing cable. Hold rope by ears, curl spine downward bringing elbows towards thighs, squeeze abs without sitting back on heels.",
      image: "assets/images/ex_cable_crunch.jpg"
    },
    {
      id: "ex-abs-russian-twist",
      name: "Weighted Russian Twists",
      muscleGroup: "abs",
      muscle: "External & Internal Obliques, Transverse Abdominis",
      equipment: "Medicine Ball or Dumbbell, Exercise Mat",
      difficulty: "Beginner",
      type: "Isolation",
      cues: "Sit with knees bent, torso reclined at 45°. Rotate torso side to side touching weight to floor with controlled cadence.",
      image: "assets/images/ex_russian_twist.jpg"
    },
    {
      id: "ex-abs-ab-wheel",
      name: "Ab Wheel Rollout",
      muscleGroup: "abs",
      muscle: "Total Core Anti-Extension, Rectus Abdominis, Lats",
      equipment: "Ab Roller Wheel, Knee Mat",
      difficulty: "Advanced",
      type: "Compound",
      cues: "Start on knees with posterior pelvic tilt. Roll wheel forward while bracing core like a rock, pull back using abs without arching lower back.",
      image: "assets/images/ex_ab_wheel.jpg"
    },
    {
      id: "ex-abs-plank",
      name: "Weighted Forearm Plank",
      muscleGroup: "abs",
      muscle: "Transverse Abdominis, Deep Stabilizers, Glutes",
      equipment: "Weight Plate / Bodyweight",
      difficulty: "Intermediate",
      type: "Isometric",
      cues: "Elbows under shoulders, pull elbows toward toes isometrically while squeezing glutes and quads. Keep hips level.",
      image: "assets/images/ex_forearm_plank.jpg"
    }
  ],
  assessment: {
    age: null,
    gender: null,
    height: null,
    weight: null,
    waist: null,
    neck: null,
    hip: null,
    activity: 1.2,
    goal: "general_fitness",
    bmi: null,
    bmiCategory: "No assessment yet",
    bmr: null,
    tdee: null,
    targetCalories: 2000,
    targetProtein: 0,
    targetCarbs: 0,
    targetFat: 0,
    bodyFatPct: null,
    lastCalculated: "No assessment recorded"
  },
  measurementsHistory: [],
  nutrition: {
    calories: 0,
    targetCalories: 2000,
    macros: {
      protein: { current: 0, target: 120, unit: "g" },
      carbs: { current: 0, target: 200, unit: "g" },
      fat: { current: 0, target: 60, unit: "g" },
      fiber: { current: 0, target: 30, unit: "g" }
    },
    meals: [],
    allergies: [],
    reactionNotes: "No adverse nutritional reactions logged."
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
      image: "assets/images/recipe_oats.jpg",
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
      image: "assets/images/recipe_paneer.jpg",
      ingredients: ["150g Low-Fat Paneer", "80g Cooked Quinoa", "Cucumber, Bell Peppers", "1 tbsp Olive Oil Lemon Dressing"],
      instructions: "Pan-sear paneer cubes with mild spices. Arrange over a bed of warm quinoa, diced bell peppers, and dress with olive oil and lemon."
    },
    {
      id: "rec-3",
      title: "Post-Workout Berry Blast Recovery Shake",
      category: "Post-Workout",
      prepTime: "5 mins",
      calories: 290,
      protein: 30,
      carbs: 35,
      fat: 3,
      image: "assets/images/recipe_shake.jpg",
      ingredients: ["1 Scoop Whey Isolate", "100g Frozen Blueberries", "200ml Almond Milk", "1 tsp Raw Honey"],
      instructions: "Blend all ingredients at high speed until smooth and frothy. Serve immediately post-training."
    },
    {
      id: "rec-4",
      title: "Yellow Moong Dal & Spinach Protein Medley",
      category: "Dinner",
      prepTime: "25 mins",
      calories: 420,
      protein: 26,
      carbs: 64,
      fat: 7,
      image: "assets/images/recipe_dal.jpg",
      ingredients: ["100g Yellow Moong Dal", "Spinach, Tomatoes, Carrots", "Cumin, Turmeric, Ginger", "1 tsp Desi Ghee"],
      instructions: "Pressure cook moong dal with turmeric and ginger. Temper with cumin in ghee and stir in tender spinach leaves."
    },
    {
      id: "rec-5",
      title: "Herb-Grilled Chicken Breast & Brown Rice",
      category: "Lunch",
      prepTime: "25 mins",
      calories: 520,
      protein: 48,
      carbs: 52,
      fat: 8,
      image: "assets/images/recipe_chicken_rice.jpg",
      ingredients: ["180g Lean Chicken Breast", "1 Cup Steamed Brown Rice", "Steamed Broccoli & Carrots", "Rosemary & Garlic Marinade"],
      instructions: "Grill chicken breast for 6 mins per side. Serve over steamed brown rice and crisp garlic-seasoned broccoli."
    },
    {
      id: "rec-6",
      title: "Pan-Seared Salmon Fillet with Asparagus",
      category: "Dinner",
      prepTime: "20 mins",
      calories: 560,
      protein: 42,
      carbs: 24,
      fat: 22,
      image: "assets/images/recipe_salmon.jpg",
      ingredients: ["160g Atlantic Salmon Fillet", "Bundle of Fresh Asparagus", "1 Baked Sweet Potato", "Lemon Herb Butter"],
      instructions: "Sear salmon skin-side down until crispy. Roast asparagus with olive oil and serve with baked sweet potato."
    },
    {
      id: "rec-7",
      title: "Greek Yogurt Parfait with Walnuts & Honey",
      category: "Breakfast",
      prepTime: "5 mins",
      calories: 320,
      protein: 24,
      carbs: 38,
      fat: 8,
      image: "assets/images/recipe_yogurt_parfait.jpg",
      ingredients: ["200g Greek Yogurt", "Handful of Blueberries & Strawberries", "15g Crushed Walnuts", "1 tbsp Raw Honey"],
      instructions: "Layer Greek yogurt with fresh berries and walnuts. Drizzle pure honey on top for immediate antioxidant fuel."
    },
    {
      id: "rec-8",
      title: "Poached Eggs & Smashed Avocado Toast",
      category: "Breakfast",
      prepTime: "12 mins",
      calories: 410,
      protein: 22,
      carbs: 32,
      fat: 18,
      image: "assets/images/recipe_egg_avocado.jpg",
      ingredients: ["2 Large Free-Range Eggs", "Half Ripe Hass Avocado", "1 Slice Artisan Sourdough", "Chili Flakes & Sea Salt"],
      instructions: "Toast sourdough. Mash avocado with lemon juice. Poach eggs for 3 mins and place on avocado toast with chili flakes."
    },
    {
      id: "rec-9",
      title: "Crispy Tofu & Edamame Asian Power Bowl",
      category: "Lunch",
      prepTime: "22 mins",
      calories: 460,
      protein: 32,
      carbs: 50,
      fat: 14,
      image: "assets/images/recipe_tofu_bowl.jpg",
      ingredients: ["150g Extra-Firm Tofu", "60g Shelled Edamame", "Shredded Cabbage, Carrots", "Sesame Ginger Tamari Dressing"],
      instructions: "Air-fry tofu cubes until golden and crunchy. Toss with steamed edamame, shredded slaw, and ginger dressing."
    },
    {
      id: "rec-10",
      title: "Golden Banana Protein Oat Pancakes",
      category: "Breakfast",
      prepTime: "15 mins",
      calories: 440,
      protein: 34,
      carbs: 58,
      fat: 6,
      image: "assets/images/recipe_protein_pancakes.jpg",
      ingredients: ["1 Ripe Banana", "1 Scoop Vanilla Whey", "50g Oat Flour", "2 Egg Whites", "Pure Maple Drizzle"],
      instructions: "Blend all ingredients into a smooth batter. Cook on non-stick skillet for 2 mins per side until golden brown."
    }
  ],
  waterStation: {
    current: 0.0,
    target: 3.0,
    logs: [],
    weeklyHistory: [0, 0, 0, 0, 0, 0, 0]
  },
  appointments: [],
  reports: [],
  attendance: {
    monthlyVisits: 0,
    targetVisits: 20,
    consistencyPct: 0,
    currentStreak: 0,
    records: []
  },
  weeklyActivity: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    workouts: [0, 0, 0, 0, 0, 0, 0],
    activityScore: [0, 0, 0, 0, 0, 0, 0]
  },
  progressData: {
    labels: [],
    weights: []
  }
};

class FitSyncStore {
  constructor() {
    this.storageKey = 'fitsync_master_platform_v4';
    this.purgeLegacyKeys();
    this.state = this.load();
  }

  purgeLegacyKeys() {
    try {
      localStorage.removeItem('fitsync_master_platform_v1');
      localStorage.removeItem('fitsync_master_platform_v2');
      localStorage.removeItem('fitsync_master_platform_v3');
      localStorage.removeItem('fitsync_authenticated_session');
    } catch(e) {}
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isLoggedIn === undefined) {
          parsed.isLoggedIn = false;
        }
        if (!parsed.registeredUsers) {
          parsed.registeredUsers = [];
        } else {
          // Filter out any legacy seed users
          parsed.registeredUsers = parsed.registeredUsers.filter(u => 
            !['ritika@fitsync.health', 'isha.kulkarni@fitsync.com', 'aarav@fitsync.health', 'coach@fitsync.health'].includes(u.email.toLowerCase())
          );
        }
        if (!parsed.trainers) {
          parsed.trainers = [];
        } else {
          // Filter out any legacy seed trainers
          parsed.trainers = parsed.trainers.filter(t => 
            !['coach@fitsync.health', 'simran@fitsync.health', 'vikram.shinde@fitsync.health'].includes((t.email || '').toLowerCase())
          );
        }
        if (!parsed.workoutPlans || !parsed.workoutPlans.thu || !parsed.workoutPlans.thu.exercises || parsed.workoutPlans.thu.exercises[0].id !== "ex_greatest_stretch" || !parsed.workoutPlans.mon.exercises[0].image.includes('ex_incline_bench')) {
          parsed.workoutPlans = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.workoutPlans));
        }
        if (!parsed.exerciseLibrary || parsed.exerciseLibrary.length < 30 || parsed.exerciseLibrary[0].image.includes('ex_bench.jpg')) {
          parsed.exerciseLibrary = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.exerciseLibrary));
        }
        if (!parsed.recipes || parsed.recipes.length < 8 || parsed.recipes[0].image.includes('healthy_meal.jpg')) {
          parsed.recipes = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.recipes));
        }
        if (!parsed.nutrition || !parsed.nutrition.meals || !parsed.nutrition.meals[0].image) {
          parsed.nutrition = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.nutrition));
        }
        return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage load error, using default state:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA));
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      try {
        window.dispatchEvent(new CustomEvent('fitsync_data_changed', { detail: this.state }));
      } catch (evErr) {}
    } catch (e) {
      console.warn('Could not save to LocalStorage:', e);
    }
  }

  getExerciseLibrary() {
    if (!this.state.exerciseLibrary || this.state.exerciseLibrary.length < 30) {
      this.state.exerciseLibrary = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.exerciseLibrary));
    }
    return this.state.exerciseLibrary;
  }

  getWorkoutPlan(dayKey) {
    if (!this.state.workoutPlans) {
      this.state.workoutPlans = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.workoutPlans));
    }
    if (!this.state.workoutPlans[dayKey]) {
      this.state.workoutPlans[dayKey] = DEFAULT_FITSYNC_DATA.workoutPlans[dayKey] || DEFAULT_FITSYNC_DATA.workoutPlans['tue'];
    }
    return this.state.workoutPlans[dayKey];
  }

  saveWorkoutPlan(dayKey, plan) {
    if (!this.state.workoutPlans) {
      this.state.workoutPlans = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.workoutPlans));
    }
    this.state.workoutPlans[dayKey] = plan;
    this.save();
    return plan;
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

  resetWater() {
    this.state.stats.water.current = 0.0;
    this.state.waterStation.current = 0.0;
    this.state.waterStation.logs = [];
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

  login(email, password, remember = true) {
    if (!this.state.registeredUsers || this.state.registeredUsers.length === 0) {
      this.state.registeredUsers = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.registeredUsers));
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    const existing = this.state.registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      this.state.user = {
        ...this.state.user,
        name: existing.name,
        email: existing.email,
        phone: existing.phone || this.state.user.phone,
        role: existing.role === 'Gym Trainer' ? 'Trainer · Certified' : 'Member · Premium',
        avatar: existing.avatar || 'assets/images/isha_avatar.jpg',
        gender: existing.gender || 'Female',
        age: existing.age || 24,
        height: `${existing.height || 170} cm`,
        weight: `${existing.weight || 65} kg`,
        fitnessGoal: existing.goal || 'Build Muscle',
        gymBranch: existing.gym ? `${existing.gym}${existing.branchLocation ? ' - ' + existing.branchLocation : ''}` : this.state.user.gymBranch
      };
      if (existing.weight) {
        this.state.stats.weight.current = parseFloat(existing.weight);
      }
      if (existing.goal) {
        this.state.goal.title = existing.goal;
      }
    } else if (cleanEmail) {
      const namePart = cleanEmail.split('@')[0];
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const newGuest = {
        name: formattedName,
        email: cleanEmail,
        role: "Gym Member",
        tag: "Athlete",
        avatar: "assets/images/isha_avatar.jpg",
        phone: "+91 98765 43210",
        gym: "FitZone Fitness",
        branchLocation: "Alkapuri, Vadodara • 1.2 km",
        goal: "Build Muscle (Hypertrophy Surplus)",
        gender: "Other",
        age: 24,
        height: 172,
        weight: 68.0
      };
      this.state.registeredUsers.push(newGuest);
      this.state.user = {
        ...this.state.user,
        name: newGuest.name,
        email: newGuest.email,
        role: 'Member · Premium',
        gymBranch: `${newGuest.gym} - ${newGuest.branchLocation}`
      };
    }
    this.state.isLoggedIn = true;
    this.save();
    return true;
  }

  register(userData) {
    if (!this.state.registeredUsers) {
      this.state.registeredUsers = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.registeredUsers));
    }
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const existingIndex = this.state.registeredUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
    const newProfile = {
      name: userData.fullName || "FitSync Athlete",
      email: cleanEmail,
      role: userData.role === 'trainer' ? 'Gym Trainer' : 'Gym Member',
      tag: userData.role === 'trainer' ? 'Coach' : 'Athlete',
      avatar: userData.avatarUrl || (userData.gender === 'Female' ? 'assets/images/isha_avatar.jpg' : 'assets/images/aarav.jpg'),
      phone: userData.phone || '+91 98765 43210',
      gym: userData.gymBranch || 'FitZone Fitness',
      branchLocation: userData.gymLocation || 'Alkapuri, Vadodara • 1.2 km',
      goal: userData.goal || 'Build Muscle (Hypertrophy Surplus)',
      activityLevel: userData.activityLevel || 'Moderately Active (1.55x BMR)',
      gender: userData.gender || 'Male',
      age: parseInt(userData.age, 10) || 24,
      height: parseInt(userData.height, 10) || 175,
      weight: parseFloat(userData.weight) || 70.0
    };

    if (existingIndex >= 0) {
      this.state.registeredUsers[existingIndex] = newProfile;
    } else {
      this.state.registeredUsers.push(newProfile);
    }

    this.state.user = {
      ...this.state.user,
      name: newProfile.name,
      email: newProfile.email,
      phone: newProfile.phone,
      role: newProfile.role === 'Gym Trainer' ? 'Trainer · Certified' : 'Member · Premium',
      avatar: newProfile.avatar,
      gender: newProfile.gender,
      age: newProfile.age,
      height: `${newProfile.height} cm`,
      weight: `${newProfile.weight} kg`,
      fitnessGoal: newProfile.goal,
      gymBranch: `${newProfile.gym} - ${newProfile.branchLocation}`
    };

    if (newProfile.weight) {
      this.state.stats.weight.current = newProfile.weight;
    }
    if (newProfile.goal) {
      this.state.goal.title = newProfile.goal;
    }
    if (this.state.membership) {
      this.state.membership.gymName = newProfile.gym;
    }

    this.state.isLoggedIn = true;
    this.save();
    return true;
  }

  logout() {
    this.state.isLoggedIn = false;
    this.save();
  }

  // --- Dynamic Gym Owner & Roster Management Methods ---
  getTrainers() {
    return this.state.trainers || [];
  }

  getTrainerById(id) {
    if (!id) return null;
    return (this.getTrainers() || []).find(t => t.id === id) || null;
  }

  getMemberByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return (this.getMembers() || []).find(m => m.email.toLowerCase() === cleanEmail) || null;
  }

  addTrainer(coachData) {
    if (!this.state.trainers) this.state.trainers = [];

    const coachId = coachData.id || ('tr-' + (this.state.trainers.length + 1) + '-' + Math.floor(100 + Math.random() * 900));
    const cleanEmail = (coachData.email || '').trim().toLowerCase();

    const newCoach = {
      id: coachId,
      user_id: coachData.user_id || parseInt(coachId.replace('tr-', '')) || null,
      name: coachData.name || 'New Coach',
      email: cleanEmail,
      phone: coachData.phone || '+91 98000 00000',
      title: coachData.title || 'Certified Strength Coach',
      rating: parseFloat(coachData.rating) || 5.0,
      experience: coachData.experience || '3+ Years',
      hourlyRate: coachData.hourlyRate || '₹1,500 / hr',
      specialties: Array.isArray(coachData.specialties) ? coachData.specialties : (coachData.specialties ? coachData.specialties.split(',').map(s => s.trim()) : ['Hypertrophy', 'Strength']),
      avatar: coachData.avatar || 'assets/images/trainer_raj.jpg',
      gym: coachData.gym || 'FitZone Fitness',
      isAssigned: false
    };

    // Update if already exists, else push
    const existingIndex = this.state.trainers.findIndex(t => t.id === coachId || t.email.toLowerCase() === cleanEmail);
    if (existingIndex >= 0) {
      this.state.trainers[existingIndex] = newCoach;
    } else {
      this.state.trainers.push(newCoach);
    }

    this.save();
    return newCoach;
  }

  deleteTrainer(coachId) {
    if (!this.state.trainers) return false;
    this.state.trainers = this.state.trainers.filter(t => t.id !== coachId && ('tr-' + t.user_id) !== coachId);

    // Unassign this coach from any assigned members
    if (this.state.registeredUsers) {
      this.state.registeredUsers.forEach(u => {
        if (u.assignedCoachId === coachId) {
          u.assignedCoachId = null;
          u.assignedCoachName = null;
        }
      });
    }

    this.save();
    return true;
  }

  getMembers() {
    return (this.state.registeredUsers || []).filter(u => u.role !== 'Gym Trainer');
  }

  addMember(memberData) {
    if (!this.state.registeredUsers) this.state.registeredUsers = [];

    const cleanEmail = (memberData.email || '').trim().toLowerCase();
    const existingIndex = this.state.registeredUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);

    let assignedCoachName = memberData.assignedCoachName || null;
    if (memberData.assignedCoachId && !assignedCoachName) {
      const c = (this.state.trainers || []).find(t => t.id === memberData.assignedCoachId);
      if (c) assignedCoachName = c.name;
    }

    const newMember = {
      name: memberData.name || 'New Athlete',
      email: cleanEmail,
      role: 'Gym Member',
      tag: 'Athlete',
      avatar: memberData.avatar || (memberData.gender === 'Female' ? 'assets/images/isha_avatar.jpg' : 'assets/images/aarav.jpg'),
      phone: memberData.phone || '+91 98765 00000',
      gym: memberData.gym || 'FitZone Fitness',
      branchLocation: memberData.branchLocation || 'FitZone Kothrud',
      goal: memberData.goal || 'Build Muscle (Hypertrophy Surplus)',
      membershipTier: memberData.membershipTier || 'Gold',
      assignedCoachId: memberData.assignedCoachId || null,
      assignedCoachName: assignedCoachName || 'Unassigned',
      activityLevel: memberData.activityLevel || 'Moderately Active (1.55x BMR)',
      gender: memberData.gender || 'Female',
      age: parseInt(memberData.age, 10) || 24,
      height: parseInt(memberData.height, 10) || 168,
      weight: parseFloat(memberData.weight) || 60.0,
      registeredAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    if (existingIndex >= 0) {
      this.state.registeredUsers[existingIndex] = newMember;
    } else {
      this.state.registeredUsers.push(newMember);
    }

    this.save();
    return newMember;
  }

  deleteMember(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    this.state.registeredUsers = (this.state.registeredUsers || []).filter(u => u.email.toLowerCase() !== cleanEmail);
    this.save();
    return true;
  }

  assignCoach(memberEmail, coachId) {
    const cleanEmail = (memberEmail || '').trim().toLowerCase();
    const member = (this.state.registeredUsers || []).find(u => u.email.toLowerCase() === cleanEmail);
    const coach = (this.state.trainers || []).find(t => t.id === coachId);
    if (member && coach) {
      member.assignedCoachId = coach.id;
      member.assignedCoachName = coach.name;
      this.save();
      return true;
    }
    return false;
  }

  getGymStats() {
    const coaches = this.getTrainers();
    const members = this.getMembers();
    return {
      totalCoaches: coaches.length,
      totalMembers: members.length,
      capacityPct: Math.min(95, Math.max(30, Math.round((members.length / 50) * 100))),
      activeSubscriptions: members.length
    };
  }

  resetDatabase() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch(e) {}
    this.state = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA));
    this.state.isLoggedIn = false;
    this.save();
  }
}

const MUSCLE_BIOMECHANICS = {
  all: {
    key: "all",
    name: "Full Musculoskeletal Anatomy",
    latin: "Systema Musculare Humanum",
    view: "both",
    category: "Full Kinetic Chain",
    function: "Complete multi-joint human movement patterns, total neuromuscular coordination, and systemic athletic strength across all kinetic planes.",
    synergists: "Anterior & Posterior Musculature",
    count: 38
  },
  chest: {
    key: "chest",
    name: "Pectoralis Major & Minor",
    latin: "Pectoralis major, Pectoralis minor",
    view: "anterior",
    category: "Anterior Torso",
    function: "Horizontal adduction, shoulder flexion, internal arm rotation, and anterior pushing mechanics.",
    synergists: "Anterior Deltoids, Triceps Brachii, Serratus Anterior"
  },
  back: {
    key: "back",
    name: "Latissimus Dorsi & Rhomboids",
    latin: "Latissimus dorsi, Rhomboideus major/minor",
    view: "posterior",
    category: "Posterior Torso",
    function: "Shoulder extension, adduction, scapular retraction, and horizontal/vertical pulling mechanics.",
    synergists: "Biceps Brachii, Posterior Deltoids, Teres Major, Trapezius"
  },
  shoulders: {
    key: "shoulders",
    name: "Deltoids (Anterior, Lateral, Posterior)",
    latin: "Musculus deltoideus",
    view: "both",
    category: "Shoulder Girdle",
    function: "Arm abduction in scapular plane (lateral), arm flexion (anterior), horizontal abduction & external rotation (posterior).",
    synergists: "Supraspinatus, Trapezius, Triceps Brachii, Clavicular Pecs"
  },
  traps: {
    key: "traps",
    name: "Trapezius (Upper, Middle, Lower)",
    latin: "Musculus trapezius",
    view: "posterior",
    category: "Upper Back & Cervical",
    function: "Scapular elevation, upward rotation, retraction, and depression; cervical spinal stabilization.",
    synergists: "Levator Scapulae, Rhomboids, Posterior Deltoids"
  },
  lowerback: {
    key: "lowerback",
    name: "Erector Spinae & Lumbar Stabilizers",
    latin: "Musculus erector spinae",
    view: "posterior",
    category: "Posterior Chain",
    function: "Spinal extension, lateral flexion, rotation, and dynamic anti-flexion spinal posture preservation.",
    synergists: "Gluteus Maximus, Hamstrings, Quadratus Lumborum, Multifidus"
  },
  biceps: {
    key: "biceps",
    name: "Biceps Brachii & Brachialis",
    latin: "Biceps brachii, Brachialis",
    view: "anterior",
    category: "Anterior Arm",
    function: "Forearm flexion at elbow joint, radioulnar supination, and secondary shoulder flexion assistance.",
    synergists: "Brachioradialis, Pronator Teres, Anterior Deltoids"
  },
  triceps: {
    key: "triceps",
    name: "Triceps Brachii (Long, Lateral, Medial)",
    latin: "Triceps brachii",
    view: "posterior",
    category: "Posterior Arm",
    function: "Elbow extension; long head assists in shoulder extension and shoulder joint stabilization.",
    synergists: "Anconeus, Pectoralis Major (sternal), Anterior Deltoid"
  },
  forearms: {
    key: "forearms",
    name: "Brachioradialis & Forearm Flexors/Extensors",
    latin: "Brachioradialis, Flexores carpi",
    view: "both",
    category: "Lower Arm & Grip",
    function: "Elbow flexion in neutral grip, wrist flexion/extension, radial/ulnar deviation, and crushing grip force.",
    synergists: "Extensor carpi, Flexor digitorum, Thenar musculature"
  },
  quads: {
    key: "quads",
    name: "Quadriceps Femoris",
    latin: "Rectus femoris, Vastus lateralis, Vastus medialis, Vastus intermedius",
    view: "anterior",
    category: "Anterior Thigh",
    function: "Knee extension and eccentric deceleration; rectus femoris assists with hip flexion.",
    synergists: "Gluteus Maximus, Adductor Magnus, Soleus"
  },
  hamstrings: {
    key: "hamstrings",
    name: "Hamstrings (Biceps Femoris & Semis)",
    latin: "Biceps femoris, Semitendinosus, Semimembranosus",
    view: "posterior",
    category: "Posterior Thigh",
    function: "Knee flexion, hip extension, tibial rotation, and eccentric deceleration in sprinting.",
    synergists: "Gluteus Maximus, Adductor Magnus, Gastrocnemius"
  },
  glutes: {
    key: "glutes",
    name: "Gluteus Maximus, Medius & Minimus",
    latin: "Gluteus maximus, Gluteus medius, Gluteus minimus",
    view: "posterior",
    category: "Pelvic Girdle",
    function: "Primary hip extension, hip abduction, external rotation, and pelvic stabilization.",
    synergists: "Hamstrings, Erector Spinae, Tensor Fasciae Latae"
  },
  calves: {
    key: "calves",
    name: "Gastrocnemius & Soleus",
    latin: "Gastrocnemius, Soleus, Tibialis anterior",
    view: "both",
    category: "Lower Leg",
    function: "Ankle plantarflexion, propulsive force generation, and knee flexion stabilization (gastrocnemius).",
    synergists: "Plantaris, Flexor hallucis longus, Tibialis posterior"
  },
  abs: {
    key: "abs",
    name: "Rectus Abdominis & Obliques",
    latin: "Rectus abdominis, Obliquus externus/internus",
    view: "anterior",
    category: "Anterior Core",
    function: "Trunk flexion, posterior pelvic tilt, spinal rotation, lateral flexion, and intra-abdominal pressure generation.",
    synergists: "Transverse Abdominis, Multifidus, Diaphragm, Pelvic Floor"
  }
};

if (typeof window !== 'undefined') {
  window.fitSyncStore = new FitSyncStore();
  window.DEFAULT_FITSYNC_DATA = DEFAULT_FITSYNC_DATA;
  window.MUSCLE_BIOMECHANICS = MUSCLE_BIOMECHANICS;
}
