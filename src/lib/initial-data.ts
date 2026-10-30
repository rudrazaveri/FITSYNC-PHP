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
  Exercise,
  WeekDay,
  Trainer,
  TrainerMessage,
  TrainerBooking
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
  day: "Monday",
  exercises: INITIAL_EXERCISES
};

export const TUESDAY_EXERCISES: Exercise[] = [
  {
    id: "ex_lat_pulldown",
    name: "Wide-Grip Lat Pulldown",
    muscle: "Latissimus Dorsi, Teres Major, Biceps",
    equipment: "Cable Pulldown Machine",
    thumbnail: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner / Intermediate",
    type: "Compound Pull",
    targetSets: 4,
    targetReps: "10–12",
    targetWeight: "60.0 kg",
    restSeconds: 90,
    completedSets: [
      { set: 1, reps: 12, weight: "55.0 kg", status: "pending" },
      { set: 2, reps: 10, weight: "60.0 kg", status: "pending" },
      { set: 3, reps: 10, weight: "60.0 kg", status: "pending" },
      { set: 4, reps: 8, weight: "65.0 kg", status: "pending" }
    ],
    instructions: [
      "Grip the bar slightly outside shoulder width with palms facing away.",
      "Engage your lats, pull shoulder blades down and back, and lean back slightly (10-15°).",
      "Pull smoothly toward upper chest, driving elbows down into your sides.",
      "Control the eccentric return until lats are fully stretched overhead."
    ],
    commonMistakes: "Swinging torso violently backward, pulling bar behind neck.",
    trainerTip: "Think about driving your elbows into your back pockets."
  },
  {
    id: "ex_barbell_row",
    name: "Bent-Over Barbell Row",
    muscle: "Rhomboids, Latissimus Dorsi, Posterior Deltoid, Spinal Erectors",
    equipment: "Olympic Barbell & Plates",
    thumbnail: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Compound Strength",
    targetSets: 4,
    targetReps: "8–10",
    targetWeight: "65.0 kg",
    restSeconds: 90,
    completedSets: [
      { set: 1, reps: 10, weight: "60.0 kg", status: "pending" },
      { set: 2, reps: 8, weight: "65.0 kg", status: "pending" },
      { set: 3, reps: 8, weight: "65.0 kg", status: "pending" },
      { set: 4, reps: 8, weight: "65.0 kg", status: "pending" }
    ],
    instructions: [
      "Hinge forward at the hips with a flat back at a 45-degree angle.",
      "Hold the bar with an overhand grip slightly wider than shoulder width.",
      "Row the barbell upward to touch your upper abdomen / sternum.",
      "Squeeze shoulder blades firmly together for a 1-second pause, then lower under control."
    ],
    commonMistakes: "Rounding lumbar spine, using momentum to heave the bar.",
    trainerTip: "Keep your chest puffed and gaze fixed 2-3 feet ahead on the floor."
  },
  {
    id: "ex_seated_cable_row",
    name: "Seated Cable Row (Close-Grip)",
    muscle: "Mid-Back, Trapezius, Biceps",
    equipment: "Low Cable Row Station & V-Handle",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Hypertrophy",
    targetSets: 3,
    targetReps: "10–12",
    targetWeight: "55.0 kg",
    restSeconds: 75,
    completedSets: [
      { set: 1, reps: 12, weight: "50.0 kg", status: "pending" },
      { set: 2, reps: 10, weight: "55.0 kg", status: "pending" },
      { set: 3, reps: 10, weight: "55.0 kg", status: "pending" }
    ],
    instructions: [
      "Sit upright with knees slightly bent and feet secured against footrests.",
      "Pull handle into lower abdomen while keeping shoulders down away from ears.",
      "Pause for 1 second at full retraction and stretch forward without rounding spine."
    ],
    commonMistakes: "Hyperextending lower back at the finish, rocking forward and back.",
    trainerTip: "Hold the peak contraction to build thick upper back density."
  },
  {
    id: "ex_db_bicep_curl",
    name: "Standing Dumbbell Bicep Curl",
    muscle: "Biceps Brachii, Brachialis",
    equipment: "Dumbbells",
    thumbnail: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Isolation",
    targetSets: 3,
    targetReps: "10–12",
    targetWeight: "14.0 kg",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 12, weight: "12.0 kg", status: "pending" },
      { set: 2, reps: 10, weight: "14.0 kg", status: "pending" },
      { set: 3, reps: 10, weight: "14.0 kg", status: "pending" }
    ],
    instructions: [
      "Stand tall with dumbbells at your sides, palms facing inward.",
      "As you curl upward, supinate wrists so palms face your shoulders at peak.",
      "Squeeze biceps hard for 1 second, then lower slowly for 2-3 seconds."
    ],
    commonMistakes: "Swinging elbows forward, leaning torso back to cheat weight up.",
    trainerTip: "Pin your elbows to your sides to keep tension exclusively on the biceps."
  },
  {
    id: "ex_hammer_curl",
    name: "Incline Dumbbell Hammer Curl",
    muscle: "Brachialis, Brachioradialis (Forearms)",
    equipment: "Dumbbells & Incline Bench",
    thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Isolation",
    targetSets: 3,
    targetReps: "12–15",
    targetWeight: "12.0 kg",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 14, weight: "10.0 kg", status: "pending" },
      { set: 2, reps: 12, weight: "12.0 kg", status: "pending" },
      { set: 3, reps: 12, weight: "12.0 kg", status: "pending" }
    ],
    instructions: [
      "Recline on a 60-degree incline bench with arms hanging naturally.",
      "Keep palms facing each other (neutral grip) throughout the movement.",
      "Curl weights upward without swinging, feeling deep tension along outer arm."
    ],
    commonMistakes: "Twisting wrists, lifting shoulders off bench.",
    trainerTip: "This builds arm thickness and forearm grip strength simultaneously."
  }
];

export const WEDNESDAY_EXERCISES: Exercise[] = [
  {
    id: "ex_barbell_squat",
    name: "Barbell Back Squat",
    muscle: "Quadriceps, Glutes, Hamstrings, Core",
    equipment: "Squat Rack & Olympic Barbell",
    thumbnail: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&auto=format&fit=crop&q=80",
    difficulty: "Advanced",
    type: "Compound Strength",
    targetSets: 4,
    targetReps: "8–10",
    targetWeight: "90.0 kg",
    restSeconds: 120,
    completedSets: [
      { set: 1, reps: 10, weight: "80.0 kg", status: "pending" },
      { set: 2, reps: 8, weight: "90.0 kg", status: "pending" },
      { set: 3, reps: 8, weight: "90.0 kg", status: "pending" },
      { set: 4, reps: 8, weight: "90.0 kg", status: "pending" }
    ],
    instructions: [
      "Place barbell comfortably across upper trapezius with hands gripping firmly.",
      "Set feet slightly wider than shoulder width with toes angled slightly outward.",
      "Inhale, brace intra-abdominal wall, and sit hips down and back to parallel.",
      "Drive aggressively through mid-foot and heels to stand back up."
    ],
    commonMistakes: "Knees caving inward, rising onto toes, rounding lower back.",
    trainerTip: "Screw your feet into the floor to maintain strong hip torque."
  },
  {
    id: "ex_rdl",
    name: "Romanian Deadlift (RDL)",
    muscle: "Hamstrings, Gluteus Maximus, Lower Back",
    equipment: "Barbell or Heavy Dumbbells",
    thumbnail: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Posterior Chain",
    targetSets: 4,
    targetReps: "10–12",
    targetWeight: "70.0 kg",
    restSeconds: 90,
    completedSets: [
      { set: 1, reps: 12, weight: "60.0 kg", status: "pending" },
      { set: 2, reps: 10, weight: "70.0 kg", status: "pending" },
      { set: 3, reps: 10, weight: "70.0 kg", status: "pending" },
      { set: 4, reps: 10, weight: "70.0 kg", status: "pending" }
    ],
    instructions: [
      "Stand with feet hip-width apart, holding barbell against upper thighs.",
      "Unlock knees slightly, then push hips backward as far as possible.",
      "Lower bar down shins until maximum hamstring stretch is achieved.",
      "Drive hips forward to return to standing, squeezing glutes at the top."
    ],
    commonMistakes: "Squatting instead of hinging, letting bar drift away from shins.",
    trainerTip: "Keep barbell in close contact with your legs throughout the descent."
  },
  {
    id: "ex_leg_press",
    name: "45-Degree Leg Press",
    muscle: "Quadriceps, Glutes, Adductors",
    equipment: "45° Incline Leg Press Machine",
    thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Hypertrophy",
    targetSets: 3,
    targetReps: "12–15",
    targetWeight: "160.0 kg",
    restSeconds: 90,
    completedSets: [
      { set: 1, reps: 15, weight: "140.0 kg", status: "pending" },
      { set: 2, reps: 12, weight: "160.0 kg", status: "pending" },
      { set: 3, reps: 12, weight: "160.0 kg", status: "pending" }
    ],
    instructions: [
      "Place feet shoulder-width apart in middle of sled plate.",
      "Release safety bars and lower sled until knees reach 90 degrees.",
      "Press through heels without locking knees forcefully at top."
    ],
    commonMistakes: "Allowing pelvis to lift off the padded seat, locking out knees.",
    trainerTip: "Keep lower back flat against back pad to prevent spinal shear."
  },
  {
    id: "ex_standing_calf_raise",
    name: "Standing Machine Calf Raise",
    muscle: "Gastrocnemius, Soleus",
    equipment: "Standing Calf Machine",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Isolation",
    targetSets: 4,
    targetReps: "15–20",
    targetWeight: "50.0 kg",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 20, weight: "45.0 kg", status: "pending" },
      { set: 2, reps: 18, weight: "50.0 kg", status: "pending" },
      { set: 3, reps: 16, weight: "50.0 kg", status: "pending" },
      { set: 4, reps: 15, weight: "50.0 kg", status: "pending" }
    ],
    instructions: [
      "Place balls of feet on block with heels extending off edge.",
      "Lower heels below block level for full 2-second calf stretch.",
      "Drive onto big toes and hold peak contraction at top for 1 full second."
    ],
    commonMistakes: "Bouncing quickly without pause, bending knees.",
    trainerTip: "Calves respond best to slow eccentric stretch and full contraction."
  },
  {
    id: "ex_hanging_knee_raise",
    name: "Hanging Captain's Knee Raise",
    muscle: "Rectus Abdominis, Hip Flexors, Obliques",
    equipment: "Pull-up Bar or Captain's Chair",
    thumbnail: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner / Intermediate",
    type: "Core Strength",
    targetSets: 3,
    targetReps: "15–18",
    targetWeight: "Bodyweight",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 18, weight: "Bodyweight", status: "pending" },
      { set: 2, reps: 15, weight: "Bodyweight", status: "pending" },
      { set: 3, reps: 15, weight: "Bodyweight", status: "pending" }
    ],
    instructions: [
      "Hang from pull-up bar or support yourself on forearm pads.",
      "Roll pelvis upward as you bring knees toward chest.",
      "Lower legs slowly without swinging."
    ],
    commonMistakes: "Swinging body for momentum, failing to posteriorly tilt pelvis.",
    trainerTip: "Curl your hips upward at top to isolate lower abdominals."
  }
];

export const THURSDAY_EXERCISES: Exercise[] = [
  {
    id: "ex_db_shoulder_press",
    name: "Seated Dumbbell Shoulder Press",
    muscle: "Anterior Deltoid, Lateral Deltoid, Triceps",
    equipment: "Dumbbells & 85° Bench",
    thumbnail: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Compound Overhead",
    targetSets: 4,
    targetReps: "8–10",
    targetWeight: "22.0 kg",
    restSeconds: 90,
    completedSets: [
      { set: 1, reps: 10, weight: "20.0 kg", status: "pending" },
      { set: 2, reps: 8, weight: "22.0 kg", status: "pending" },
      { set: 3, reps: 8, weight: "22.0 kg", status: "pending" },
      { set: 4, reps: 8, weight: "22.0 kg", status: "pending" }
    ],
    instructions: [
      "Kick dumbbells to shoulder height, palms forward, elbows slightly tucked (60°).",
      "Press weights vertically overhead in a smooth arc until arms are extended.",
      "Lower under control to ear height feeling deep stretch in deltoids."
    ],
    commonMistakes: "Excessive arching of lower back, clacking dumbbells together overhead.",
    trainerTip: "Keep core tightly braced and heels planted firmly into the floor."
  },
  {
    id: "ex_lateral_raise",
    name: "Dumbbell Lateral Raise",
    muscle: "Lateral Deltoid (Side Shoulder Width)",
    equipment: "Dumbbells",
    thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Isolation",
    targetSets: 4,
    targetReps: "12–15",
    targetWeight: "10.0 kg",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 15, weight: "8.0 kg", status: "pending" },
      { set: 2, reps: 14, weight: "10.0 kg", status: "pending" },
      { set: 3, reps: 12, weight: "10.0 kg", status: "pending" },
      { set: 4, reps: 12, weight: "10.0 kg", status: "pending" }
    ],
    instructions: [
      "Stand with soft knees and lean forward roughly 10 degrees.",
      "Raise dumbbells out to sides leading with elbows until parallel to floor.",
      "Pause for half a second at shoulder height, then lower with control."
    ],
    commonMistakes: "Using body swing, raising hands higher than elbows, shrugging traps.",
    trainerTip: "Pour water from a pitcher motion at top to maximize side deltoid activation."
  },
  {
    id: "ex_cable_face_pull",
    name: "Rope Cable Face Pull",
    muscle: "Posterior Deltoids, Rhomboids, Rotator Cuff",
    equipment: "High Cable & Rope",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Postural & Rear Delt",
    targetSets: 3,
    targetReps: "15–18",
    targetWeight: "20.0 kg",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 18, weight: "17.5 kg", status: "pending" },
      { set: 2, reps: 15, weight: "20.0 kg", status: "pending" },
      { set: 3, reps: 15, weight: "20.0 kg", status: "pending" }
    ],
    instructions: [
      "Attach rope to high cable at eye level, step back into solid stance.",
      "Pull rope towards nose while rotating wrists so thumbs point backward.",
      "Squeeze rear deltoids and external rotators forcefully."
    ],
    commonMistakes: "Leaning back to pull weight, dropping elbows low.",
    trainerTip: "Crucial exercise for shoulder health and counteracting rounded postures."
  },
  {
    id: "ex_db_shrug",
    name: "Dumbbell Shrug",
    muscle: "Upper Trapezius",
    equipment: "Heavy Dumbbells",
    thumbnail: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Trap Isolation",
    targetSets: 3,
    targetReps: "12–15",
    targetWeight: "28.0 kg",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 15, weight: "24.0 kg", status: "pending" },
      { set: 2, reps: 14, weight: "28.0 kg", status: "pending" },
      { set: 3, reps: 12, weight: "28.0 kg", status: "pending" }
    ],
    instructions: [
      "Hold heavy dumbbells at your sides with neutral grip.",
      "Elevate shoulders straight up towards your ears in vertical motion.",
      "Hold top squeeze for 2 seconds before lowering slowly."
    ],
    commonMistakes: "Rolling shoulders in circles (injures rotator cuffs).",
    trainerTip: "Pure vertical elevation only. Never roll shoulders backward."
  },
  {
    id: "ex_cable_crunch",
    name: "Kneeling Cable Abdominal Crunch",
    muscle: "Rectus Abdominis",
    equipment: "High Cable & Rope",
    thumbnail: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Core Hypertrophy",
    targetSets: 3,
    targetReps: "15–20",
    targetWeight: "35.0 kg",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 20, weight: "30.0 kg", status: "pending" },
      { set: 2, reps: 18, weight: "35.0 kg", status: "pending" },
      { set: 3, reps: 15, weight: "35.0 kg", status: "pending" }
    ],
    instructions: [
      "Kneel in front of cable stack, hold rope handles next to temples.",
      "Curl torso downward, bringing elbows toward mid-thighs by flexing abs.",
      "Exhale completely and squeeze abs hard, then return under tension."
    ],
    commonMistakes: "Bending at the hips instead of flexing the spine.",
    trainerTip: "Keep hips locked in position. All movement comes from contracting the abdominal wall."
  }
];

export const FRIDAY_EXERCISES: Exercise[] = [
  {
    id: "ex_close_grip_bench",
    name: "Close-Grip Barbell Bench Press",
    muscle: "Triceps Brachii, Inner Chest, Front Delts",
    equipment: "Barbell & Flat Bench",
    thumbnail: "/assets/bench_press.jpg",
    difficulty: "Intermediate",
    type: "Compound Arm Strength",
    targetSets: 4,
    targetReps: "8–10",
    targetWeight: "70.0 kg",
    restSeconds: 90,
    completedSets: [
      { set: 1, reps: 10, weight: "60.0 kg", status: "pending" },
      { set: 2, reps: 8, weight: "70.0 kg", status: "pending" },
      { set: 3, reps: 8, weight: "70.0 kg", status: "pending" },
      { set: 4, reps: 8, weight: "70.0 kg", status: "pending" }
    ],
    instructions: [
      "Lie on flat bench and grip bar shoulder-width apart.",
      "Tuck elbows tight against your ribs as you lower the bar to lower chest.",
      "Press up explosively through triceps to full extension."
    ],
    commonMistakes: "Gripping too narrow (less than 8 inches strains wrists).",
    trainerTip: "Shoulder-width grip protects wrists while maximizing triceps recruitment."
  },
  {
    id: "ex_preacher_curl",
    name: "Preacher EZ-Bar Bicep Curl",
    muscle: "Biceps Short Head (Bicep Peak)",
    equipment: "EZ-Curl Bar & Preacher Bench",
    thumbnail: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Isolation",
    targetSets: 3,
    targetReps: "10–12",
    targetWeight: "25.0 kg",
    restSeconds: 75,
    completedSets: [
      { set: 1, reps: 12, weight: "20.0 kg", status: "pending" },
      { set: 2, reps: 10, weight: "25.0 kg", status: "pending" },
      { set: 3, reps: 10, weight: "25.0 kg", status: "pending" }
    ],
    instructions: [
      "Sit at preacher bench with armpits snug against top pad.",
      "Grip inner curved handles of EZ bar with underhand grip.",
      "Curl bar upward to chin height, squeezing biceps at top peak."
    ],
    commonMistakes: "Lifting elbows off pad, bouncing bar at bottom.",
    trainerTip: "Eliminates all momentum, isolating the bicep completely."
  },
  {
    id: "ex_skull_crushers",
    name: "Lying EZ-Bar Skull Crushers",
    muscle: "Triceps Long Head & Medial Head",
    equipment: "EZ Bar & Flat Bench",
    thumbnail: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Isolation",
    targetSets: 3,
    targetReps: "10–12",
    targetWeight: "22.5 kg",
    restSeconds: 75,
    completedSets: [
      { set: 1, reps: 12, weight: "20.0 kg", status: "pending" },
      { set: 2, reps: 10, weight: "22.5 kg", status: "pending" },
      { set: 3, reps: 10, weight: "22.5 kg", status: "pending" }
    ],
    instructions: [
      "Lie back holding EZ-bar with straight arms above chest.",
      "Hinge strictly at elbows to lower bar toward forehead or slightly behind head.",
      "Extend arms back to starting position without flaring elbows out."
    ],
    commonMistakes: "Letting elbows drift or flare wide outward.",
    trainerTip: "Lowering slightly behind crown of head increases long head stretch."
  },
  {
    id: "ex_cable_rope_hammer",
    name: "Cable Rope Hammer Curls",
    muscle: "Brachialis, Brachioradialis",
    equipment: "Low Cable & Rope Attachment",
    thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Isolation",
    targetSets: 3,
    targetReps: "12–15",
    targetWeight: "22.5 kg",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 15, weight: "20.0 kg", status: "pending" },
      { set: 2, reps: 14, weight: "22.5 kg", status: "pending" },
      { set: 3, reps: 12, weight: "22.5 kg", status: "pending" }
    ],
    instructions: [
      "Hold rope ends with thumbs up (neutral grip).",
      "Curl upward keeping elbows pinned, spreading rope ends slightly at top."
    ],
    commonMistakes: "Using back swing to pull weight.",
    trainerTip: "Constant tension provided by cable enhances forearm vascularity."
  },
  {
    id: "ex_parallel_dips",
    name: "Parallel Bar Triceps Dips",
    muscle: "Triceps, Lower Chest, Front Deltoid",
    equipment: "Dip Station",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Bodyweight Compound",
    targetSets: 3,
    targetReps: "10–12",
    targetWeight: "Bodyweight",
    restSeconds: 75,
    completedSets: [
      { set: 1, reps: 12, weight: "Bodyweight", status: "pending" },
      { set: 2, reps: 10, weight: "Bodyweight", status: "pending" },
      { set: 3, reps: 10, weight: "Bodyweight", status: "pending" }
    ],
    instructions: [
      "Suspend body between parallel bars with arms locked out.",
      "Stay upright to focus on triceps, lower until elbows form 90 degrees.",
      "Push forcefully back up to lockout."
    ],
    commonMistakes: "Dropping too deep straining anterior shoulder capsules.",
    trainerTip: "Keep torso vertical to target triceps instead of chest."
  }
];

export const SATURDAY_EXERCISES: Exercise[] = [
  {
    id: "ex_kettlebell_swing",
    name: "Russian Kettlebell Swings",
    muscle: "Glutes, Hamstrings, Core, Cardiovascular",
    equipment: "Cast Iron Kettlebell (16–24 kg)",
    thumbnail: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Functional Power",
    targetSets: 4,
    targetReps: "20",
    targetWeight: "20.0 kg",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 20, weight: "16.0 kg", status: "pending" },
      { set: 2, reps: 20, weight: "20.0 kg", status: "pending" },
      { set: 3, reps: 20, weight: "20.0 kg", status: "pending" },
      { set: 4, reps: 20, weight: "20.0 kg", status: "pending" }
    ],
    instructions: [
      "Hinge at hips with knees soft, grip kettlebell with both hands.",
      "Snap hips forward explosively to drive kettlebell to chest height.",
      "Let kettlebell swing back between legs under control."
    ],
    commonMistakes: "Squatting the weight up, using arms to lift bell.",
    trainerTip: "All driving force comes from powerful hip snap, not the arms."
  },
  {
    id: "ex_db_thruster",
    name: "Dumbbell Thrusters",
    muscle: "Full Body (Quads, Shoulders, Core)",
    equipment: "Pair of Dumbbells",
    thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
    difficulty: "Advanced",
    type: "Metabolic Conditioning",
    targetSets: 3,
    targetReps: "12",
    targetWeight: "14.0 kg",
    restSeconds: 75,
    completedSets: [
      { set: 1, reps: 12, weight: "12.0 kg", status: "pending" },
      { set: 2, reps: 12, weight: "14.0 kg", status: "pending" },
      { set: 3, reps: 12, weight: "14.0 kg", status: "pending" }
    ],
    instructions: [
      "Hold dumbbells at shoulders in front-rack position.",
      "Perform a full squat to parallel.",
      "Explode upward, transferring momentum into an overhead press in one fluid movement."
    ],
    commonMistakes: "Pausing between squat and press, knees collapsing.",
    trainerTip: "Use leg drive to propel the dumbbells smoothly overhead."
  },
  {
    id: "ex_battle_ropes",
    name: "Battle Ropes Alternating Slam",
    muscle: "Shoulders, Lats, Core, Anaerobic Capacity",
    equipment: "Heavy Battle Ropes",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner / Intermediate",
    type: "HIIT Conditioning",
    targetSets: 4,
    targetReps: "30 Secs",
    targetWeight: "Standard Rope",
    restSeconds: 45,
    completedSets: [
      { set: 1, reps: 30, weight: "Timed", status: "pending" },
      { set: 2, reps: 30, weight: "Timed", status: "pending" },
      { set: 3, reps: 30, weight: "Timed", status: "pending" },
      { set: 4, reps: 30, weight: "Timed", status: "pending" }
    ],
    instructions: [
      "Take athletic quarter-squat stance holding rope ends.",
      "Alternate whipping arms vigorously up and down creating steady waves to the anchor point.",
      "Breathe rhythmically and brace your core."
    ],
    commonMistakes: "Standing upright with stiff legs.",
    trainerTip: "Keep a soft athletic bend in your knees and maintain high frequency."
  },
  {
    id: "ex_box_jumps",
    name: "Plyometric Box Jumps",
    muscle: "Fast-Twitch Leg Fibers, Calves, Glutes",
    equipment: "24-Inch Plyo Box",
    thumbnail: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Plyometrics",
    targetSets: 3,
    targetReps: "10",
    targetWeight: "Bodyweight",
    restSeconds: 60,
    completedSets: [
      { set: 1, reps: 10, weight: "Bodyweight", status: "pending" },
      { set: 2, reps: 10, weight: "Bodyweight", status: "pending" },
      { set: 3, reps: 10, weight: "Bodyweight", status: "pending" }
    ],
    instructions: [
      "Stand 1 foot in front of box in athletic stance.",
      "Swing arms back, hinge, and explode upward landing softly on box in quarter-squat.",
      "Stand up fully, then step down carefully one leg at a time."
    ],
    commonMistakes: "Jumping down backwards (high Achilles rupture risk).",
    trainerTip: "Always step down gently to preserve knee and Achilles tendon integrity."
  },
  {
    id: "ex_rowing_machine",
    name: "Concept 2 Row (500m Intervals)",
    muscle: "Legs, Back, Cardiovascular Engine",
    equipment: "Indoor Rowing Machine",
    thumbnail: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
    difficulty: "Intermediate",
    type: "Cardiovascular Stamina",
    targetSets: 3,
    targetReps: "500m Sprint",
    targetWeight: "Damper 6",
    restSeconds: 90,
    completedSets: [
      { set: 1, reps: 500, weight: "1:48 split", status: "pending" },
      { set: 2, reps: 500, weight: "1:50 split", status: "pending" },
      { set: 3, reps: 500, weight: "1:52 split", status: "pending" }
    ],
    instructions: [
      "Drive back with legs first, swing hips slightly open, then pull handle to sternum.",
      "Return arms first, hinge hips, then bend knees into the catch."
    ],
    commonMistakes: "Bending knees before arms have cleared thighs.",
    trainerTip: "Stroke cadence: Legs - Body - Arms on the drive; Arms - Body - Legs on the recovery."
  }
];

export const SUNDAY_EXERCISES: Exercise[] = [
  {
    id: "ex_greatest_stretch",
    name: "World's Greatest Stretch & Thoracic Opener",
    muscle: "Hip Flexors, Hamstrings, Thoracic Spine, Groin",
    equipment: "Yoga Mat",
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Dynamic Mobility",
    targetSets: 3,
    targetReps: "6 / side",
    targetWeight: "Bodyweight",
    restSeconds: 45,
    completedSets: [
      { set: 1, reps: 6, weight: "Bodyweight", status: "pending" },
      { set: 2, reps: 6, weight: "Bodyweight", status: "pending" },
      { set: 3, reps: 6, weight: "Bodyweight", status: "pending" }
    ],
    instructions: [
      "Step into deep lunge with hands planted on inside of front foot.",
      "Drop inside elbow toward ankle for 2 seconds.",
      "Rotate torso upward, extending arm to ceiling and looking towards hand."
    ],
    commonMistakes: "Rushing through the movement without breathing deeply.",
    trainerTip: "Opens up stiff hips and tight thoracic spine from a week of heavy lifting."
  },
  {
    id: "ex_foam_rolling",
    name: "Full-Body Foam Rolling & Spinal Extension",
    muscle: "Upper Back, Glutes, IT Bands, Quads",
    equipment: "High-Density Foam Roller",
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Myofascial Release",
    targetSets: 1,
    targetReps: "10 Mins",
    targetWeight: "Self-Myofascial",
    restSeconds: 0,
    completedSets: [
      { set: 1, reps: 10, weight: "Guided", status: "pending" }
    ],
    instructions: [
      "Roll slowly over tender muscle tissues for 30-45 seconds per zone.",
      "Extend thoracic spine backward over roller with hands cradling head."
    ],
    commonMistakes: "Rolling directly over lumbar spine or joint bones.",
    trainerTip: "Breathe through trigger points to encourage deep muscular relaxation."
  },
  {
    id: "ex_band_dislocates",
    name: "Resistance Band Shoulder Dislocates",
    muscle: "Shoulder Rotator Cuff, Pectoral Stretch",
    equipment: "Light Resistance Band",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Joint Health",
    targetSets: 3,
    targetReps: "12",
    targetWeight: "Light Band",
    restSeconds: 30,
    completedSets: [
      { set: 1, reps: 12, weight: "Light", status: "pending" },
      { set: 2, reps: 12, weight: "Light", status: "pending" },
      { set: 3, reps: 12, weight: "Light", status: "pending" }
    ],
    instructions: [
      "Hold band with wide grip in front of hips.",
      "Keeping arms straight, bring band overhead and behind back smoothly.",
      "Return forward with control without bending elbows."
    ],
    commonMistakes: "Gripping too narrow causing elbows to bend or shoulders to hitch.",
    trainerTip: "Widen grip until movement feels completely smooth with zero pinching."
  },
  {
    id: "ex_bird_dog_deadbug",
    name: "Bird Dog & Deadbug Core Stabilizer",
    muscle: "Transverse Abdominis, Multifidus, Spinal Stabilizers",
    equipment: "Yoga Mat",
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Core Stability",
    targetSets: 3,
    targetReps: "10 / side",
    targetWeight: "Bodyweight",
    restSeconds: 45,
    completedSets: [
      { set: 1, reps: 10, weight: "Bodyweight", status: "pending" },
      { set: 2, reps: 10, weight: "Bodyweight", status: "pending" },
      { set: 3, reps: 10, weight: "Bodyweight", status: "pending" }
    ],
    instructions: [
      "In quadruped position, extend opposite arm and leg horizontally.",
      "Hold for 2 seconds without rotating hips or arching lower back.",
      "Switch sides smoothly maintaining neutral spine."
    ],
    commonMistakes: "Kicking leg too high arching lower back.",
    trainerTip: "Imagine a glass of water resting on your lower back that cannot spill."
  },
  {
    id: "ex_incline_walk",
    name: "Low-Intensity Incline Treadmill Walk",
    muscle: "Cardiovascular, Calves, Aerobic Base",
    equipment: "Treadmill (8-10% Incline @ 4.5 km/h)",
    thumbnail: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&auto=format&fit=crop&q=80",
    difficulty: "Beginner",
    type: "Zone 2 Active Recovery",
    targetSets: 1,
    targetReps: "20 Mins",
    targetWeight: "Zone 2",
    restSeconds: 0,
    completedSets: [
      { set: 1, reps: 20, weight: "Incline 8%", status: "pending" }
    ],
    instructions: [
      "Walk tall on incline without holding side rails.",
      "Maintain conversational heart rate (115-130 bpm) for active flush."
    ],
    commonMistakes: "Holding handrails and leaning back (eliminates incline benefit).",
    trainerTip: "Promotes lymphatic circulation and speeds recovery without systemic fatigue."
  }
];

export const WEEKLY_WORKOUT_ROUTINES: Record<WeekDay, WorkoutRoutine> = {
  Monday: {
    id: "wt_mon_chest_triceps",
    title: "Chest & Triceps Hypertrophy",
    focus: "Push Movement Pattern • Upper Body Mass",
    duration: "45 mins",
    totalExercises: 5,
    difficulty: "Intermediate / Advanced",
    day: "Monday",
    exercises: INITIAL_EXERCISES
  },
  Tuesday: {
    id: "wt_tue_back_biceps",
    title: "Back & Biceps Power",
    focus: "Pull Movement Pattern • V-Taper & Arm Thickness",
    duration: "50 mins",
    totalExercises: 5,
    difficulty: "Intermediate",
    day: "Tuesday",
    exercises: TUESDAY_EXERCISES
  },
  Wednesday: {
    id: "wt_wed_legs_core",
    title: "Legs & Lower Body Strength",
    focus: "Quad Drive & Posterior Chain Power",
    duration: "55 mins",
    totalExercises: 5,
    difficulty: "Advanced",
    day: "Wednesday",
    exercises: WEDNESDAY_EXERCISES
  },
  Thursday: {
    id: "wt_thu_shoulders_traps",
    title: "Shoulders, Traps & Core",
    focus: "Overhead Power • 3D Deltoids & Abdominal Wall",
    duration: "45 mins",
    totalExercises: 5,
    difficulty: "Intermediate",
    day: "Thursday",
    exercises: THURSDAY_EXERCISES
  },
  Friday: {
    id: "wt_fri_arms_upper",
    title: "Arms & Upper Body Sculpt",
    focus: "Biceps Peak • Triceps Horseshoe • Upper Pump",
    duration: "45 mins",
    totalExercises: 5,
    difficulty: "Intermediate",
    day: "Friday",
    exercises: FRIDAY_EXERCISES
  },
  Saturday: {
    id: "wt_sat_hiit_functional",
    title: "Functional Conditioning & HIIT",
    focus: "Metabolic Burn • Kettlebell & Full-Body Power",
    duration: "40 mins",
    totalExercises: 5,
    difficulty: "High Intensity",
    day: "Saturday",
    exercises: SATURDAY_EXERCISES
  },
  Sunday: {
    id: "wt_sun_recovery_mobility",
    title: "Active Recovery & Mobility Flow",
    focus: "Joint Decompression • Fascial Stretch • Zone 2",
    duration: "35 mins",
    totalExercises: 5,
    difficulty: "All Levels / Rest",
    day: "Sunday",
    exercises: SUNDAY_EXERCISES
  }
};

export const WEEK_DAYS: WeekDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export function getTodayDayName(): WeekDay {
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday ...
  const mapping: WeekDay[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  return mapping[dayIndex];
}

export function getWorkoutForDay(dayName: WeekDay): WorkoutRoutine {
  return WEEKLY_WORKOUT_ROUTINES[dayName] || WEEKLY_WORKOUT_ROUTINES["Monday"];
}

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

export const INITIAL_TRAINERS: Trainer[] = [
  {
    id: "tr_raj_patel",
    name: "Coach Raj Patel",
    gymId: "gym_fitzone_vadodara",
    gymName: "FitZone Fitness Vadodara",
    role: "Senior Strength & Hypertrophy Coach",
    avatar: "/assets/trainer_raj.jpg",
    experience: "7+ Years",
    rating: 4.9,
    reviewsCount: 142,
    specializations: ["Hypertrophy & Muscle Gain", "Powerlifting Form", "Progressive Overload", "Injury Prevention"],
    certifications: ["CSCS (NSCA)", "ACE Certified Personal Trainer", "Precision Nutrition L1"],
    bio: "Dedicated to biomechanically sound lifting and real compound strength progression. Former state-level competitive powerlifter.",
    assignedMembersCount: 24,
    availabilityStatus: "On Gym Floor • Available for 1-on-1",
    weeklySchedule: "Mon - Sat: 6:00 AM – 1:00 PM, 5:00 PM – 9:00 PM",
    phone: "+91 98251 44321",
    email: "coach.raj@fitsync.health"
  },
  {
    id: "tr_priya_sharma",
    name: "Coach Priya Sharma",
    gymId: "gym_fitzone_vadodara",
    gymName: "FitZone Fitness Vadodara",
    role: "Functional Conditioning & Kinetic Coach",
    avatar: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=500&auto=format&fit=crop&q=80",
    experience: "5 Years",
    rating: 4.8,
    reviewsCount: 98,
    specializations: ["Metabolic Conditioning", "Core Stability", "Female Athletic Development", "Zone 2 Cardio"],
    certifications: ["CrossFit Level 2", "NASM-CPT", "Functional Range Conditioning"],
    bio: "Passionate about building functional mobility, posture resilience, and high work capacity for everyday athletic humans.",
    assignedMembersCount: 18,
    availabilityStatus: "Available Tomorrow Morning",
    weeklySchedule: "Tue - Sun: 7:00 AM – 2:00 PM",
    phone: "+91 98252 88412",
    email: "coach.priya@fitsync.health"
  },
  {
    id: "tr_vikram_mehta",
    name: "Coach Vikram Mehta",
    gymId: "gym_powerhouse_ahmedabad",
    gymName: "PowerHouse Gym Ahmedabad",
    role: "Mobility & Athletic Rehabilitation Coach",
    avatar: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=500&auto=format&fit=crop&q=80",
    experience: "8 Years",
    rating: 4.9,
    reviewsCount: 165,
    specializations: ["Mobility Restructuring", "Joint Kinematics", "Olympic Lifting Technique"],
    certifications: ["FRCms Mobility Specialist", "EXOS Performance Specialist"],
    bio: "Bridging the gap between athletic conditioning and heavy compound weight training with zero joint pain.",
    assignedMembersCount: 15,
    availabilityStatus: "Available Today • 3 Slots",
    weeklySchedule: "Mon - Fri: 8:00 AM – 4:00 PM",
    phone: "+91 98255 12093",
    email: "coach.vikram@fitsync.health"
  }
];

export const INITIAL_TRAINER_MESSAGES: TrainerMessage[] = [
  {
    id: "msg_01",
    sender: "trainer",
    senderName: "Coach Raj Patel",
    text: "Hey! Welcome to FitZone Vadodara. I'm assigned as your strength coach. How did your chest & triceps session feel today?",
    timestamp: "2026-10-30T09:15:00Z",
    time: "09:15 AM",
    category: "general"
  },
  {
    id: "msg_02",
    sender: "user",
    senderName: "You",
    text: "Hey Coach! The bench press felt solid, hit 82.5 kg on the top sets. Just felt a tiny pinch in my front deltoid on the last rep.",
    timestamp: "2026-10-30T09:20:00Z",
    time: "09:20 AM",
    category: "form_check"
  },
  {
    id: "msg_03",
    sender: "trainer",
    senderName: "Coach Raj Patel",
    text: "Great weight moved! For the pinch, make sure you tuck your elbows 45 degrees rather than flaring them 90 degrees. Also remember to engage leg drive before unracking. Catch me on the gym floor today at 5 PM if you want me to spot your form!",
    timestamp: "2026-10-30T09:25:00Z",
    time: "09:25 AM",
    category: "form_check"
  }
];

export const INITIAL_TRAINER_BOOKINGS: TrainerBooking[] = [
  {
    id: "tb_01",
    trainerId: "tr_raj_patel",
    trainerName: "Coach Raj Patel",
    date: "Tomorrow, Oct 31",
    timeSlot: "05:30 PM",
    focusArea: "Squat Depth & Thoracic Mobility Check",
    status: "Confirmed",
    notes: "Review bar path and warm-up hip opener drill on the platform."
  }
];
