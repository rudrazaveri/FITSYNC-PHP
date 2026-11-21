const fs = require('fs');
const path = require('path');

const dataFilePath = path.resolve(__dirname, '..', 'js', 'data.js');
const fitsyncDataFilePath = path.resolve(__dirname, '..', 'fitsync', 'js', 'data.js');

let dataContent = fs.readFileSync(dataFilePath, 'utf8');

// 1. Update WorkoutPlans images
const workoutPlanImageReplacements = [
  // Monday
  { pattern: /id:\s*"ex_bench",\s*name:\s*"Barbell Incline Bench Press",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_incline_bench.jpg"') },
  { pattern: /id:\s*"ex_dips",\s*name:\s*"Parallel Bar Dips",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_parallel_dips.jpg"') },
  { pattern: /id:\s*"ex_tricep",\s*name:\s*"Tricep Rope Pushdown",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_tricep_pushdown.jpg"') },

  // Tuesday
  { pattern: /id:\s*"ex_lat",\s*name:\s*"Wide-Grip Lat Pulldown",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_lat_pulldown.jpg"') },
  { pattern: /id:\s*"ex_deadlift",\s*name:\s*"Conventional Deadlift",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_deadlift.jpg"') },
  { pattern: /id:\s*"ex_curl",\s*name:\s*"Incline Dumbbell Bicep Curl",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_incline_curl.jpg"') },
  { pattern: /id:\s*"ex_row",\s*name:\s*"Seated Cable Row",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_seated_row.jpg"') },
  { pattern: /id:\s*"ex_hammer",\s*name:\s*"Dumbbell Hammer Curls",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_hammer_curl.jpg"') },

  // Wednesday
  { pattern: /id:\s*"ex_squat",\s*name:\s*"Barbell Back Squat",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_back_squat.jpg"') },
  { pattern: /id:\s*"ex_rdl",\s*name:\s*"Romanian Deadlift \(RDL\)",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_romanian_deadlift.jpg"') },
  { pattern: /id:\s*"ex_calves",\s*name:\s*"Standing Calf Raises",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_standing_calf_raise.jpg"') },

  // Thursday
  { pattern: /id:\s*"ex_greatest_stretch",\s*name:\s*"World's Greatest Stretch & Thoracic Opener",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_greatest_stretch.jpg"') },
  { pattern: /id:\s*"ex_plank",\s*name:\s*"Weighted Core Plank",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_forearm_plank.jpg"') },
  { pattern: /id:\s*"ex_kettlebell",\s*name:\s*"Kettlebell Russian Swings",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_russian_twist.jpg"') },

  // Friday
  { pattern: /id:\s*"ex_ohp",\s*name:\s*"Dumbbell Overhead Shoulder Press",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_dumbbell_press.jpg"') },
  { pattern: /id:\s*"ex_lat_raise",\s*name:\s*"Dumbbell Lateral Deltoid Raise",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_lateral_raise.jpg"') },
  { pattern: /id:\s*"ex_face_pull",\s*name:\s*"Cable Face Pull with External Rotation",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_face_pull.jpg"') },

  // Saturday
  { pattern: /id:\s*"ex_incline",\s*name:\s*"Incline Barbell Bench Press",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_incline_bench.jpg"') },
  { pattern: /id:\s*"ex_pulldown_sat",\s*name:\s*"Neutral-Grip Lat Pulldown",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_lat_pulldown.jpg"') },
  { pattern: /id:\s*"ex_lateral_sat",\s*name:\s*"Dumbbell Lateral Deltoid Raise",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_lateral_raise.jpg"') },
  { pattern: /id:\s*"ex_curls_sat",\s*name:\s*"Standing Dumbbell Bicep Curl",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_barbell_curl.jpg"') },

  // Sunday
  { pattern: /id:\s*"ex_foam",\s*name:\s*"Full Body Foam Rolling & Myofascial Release",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_foam_rolling.jpg"') },
  { pattern: /id:\s*"ex_walk",\s*name:\s*"Zone 1 Outdoor Recovery Walk",[^}]+?image:\s*"[^"]+"/s, replacement: (match) => match.replace(/image:\s*"[^"]+"/, 'image: "assets/images/ex_recovery_walk.jpg"') }
];

workoutPlanImageReplacements.forEach(({ pattern, replacement }) => {
  dataContent = dataContent.replace(pattern, replacement);
});

// 2. Update exerciseLibrary with exact distinct photos
const exerciseExactImages = {
  "ex-chest-incline-bb": "assets/images/ex_incline_bench.jpg",
  "ex-chest-flat-bb": "assets/images/ex_flat_bench.jpg",
  "ex-chest-db-fly": "assets/images/ex_incline_fly.jpg",
  "ex-chest-dips": "assets/images/ex_parallel_dips.jpg",
  "ex-chest-cable-cross": "assets/images/ex_cable_crossover.jpg",
  "ex-chest-pushups": "assets/images/ex_pushups.jpg",
  "ex-back-lat-pulldown": "assets/images/ex_lat_pulldown.jpg",
  "ex-back-pullups": "assets/images/ex_pullups.jpg",
  "ex-back-bb-row": "assets/images/ex_barbell_row.jpg",
  "ex-back-seated-row": "assets/images/ex_seated_row.jpg",
  "ex-back-db-row": "assets/images/ex_dumbbell_row.jpg",
  "ex-traps-bb-shrug": "assets/images/ex_shrugs.jpg",
  "ex-traps-face-pull": "assets/images/ex_face_pull.jpg",
  "ex-traps-prone-y-raise": "assets/images/ex_prone_y_raise.jpg",
  "ex-lowerback-deadlift": "assets/images/ex_deadlift.jpg",
  "ex-lowerback-hyper": "assets/images/ex_hyperextensions.jpg",
  "ex-lowerback-goodmorning": "assets/images/ex_good_mornings.jpg",
  "ex-shoulders-ohp": "assets/images/ex_overhead_press.jpg",
  "ex-shoulders-db-press": "assets/images/ex_dumbbell_press.jpg",
  "ex-shoulders-lat-raise": "assets/images/ex_lateral_raise.jpg",
  "ex-shoulders-cable-y": "assets/images/ex_cable_lateral.jpg",
  "ex-shoulders-rear-pecdeck": "assets/images/ex_rear_pecdeck.jpg",
  "ex-biceps-bb-curl": "assets/images/ex_barbell_curl.jpg",
  "ex-biceps-incline-curl": "assets/images/ex_incline_curl.jpg",
  "ex-biceps-hammer": "assets/images/ex_hammer_curl.jpg",
  "ex-biceps-preacher": "assets/images/ex_preacher_curl.jpg",
  "ex-triceps-rope-pushdown": "assets/images/ex_tricep_pushdown.jpg",
  "ex-triceps-skullcrusher": "assets/images/ex_skullcrushers.jpg",
  "ex-triceps-overhead-ext": "assets/images/ex_overhead_tricep.jpg",
  "ex-triceps-cg-bench": "assets/images/ex_close_grip_bench.jpg",
  "ex-forearms-reverse-curl": "assets/images/ex_reverse_curl.jpg",
  "ex-forearms-farmers-walk": "assets/images/ex_farmers_walk.jpg",
  "ex-quads-back-squat": "assets/images/ex_back_squat.jpg",
  "ex-quads-leg-ext": "assets/images/ex_leg_extension.jpg",
  "ex-quads-split-squat": "assets/images/ex_bulgarian_split.jpg",
  "ex-quads-hack-squat": "assets/images/ex_hack_squat.jpg",
  "ex-hamstrings-rdl": "assets/images/ex_romanian_deadlift.jpg",
  "ex-hamstrings-lying-curl": "assets/images/ex_lying_leg_curl.jpg",
  "ex-hamstrings-seated-curl": "assets/images/ex_seated_leg_curl.jpg",
  "ex-glutes-hip-thrust": "assets/images/ex_hip_thrust.jpg",
  "ex-glutes-kickback": "assets/images/ex_glute_kickback.jpg",
  "ex-glutes-abduction": "assets/images/ex_hip_abduction.jpg",
  "ex-calves-standing-raise": "assets/images/ex_standing_calf_raise.jpg",
  "ex-calves-seated-raise": "assets/images/ex_seated_calf_raise.jpg",
  "ex-abs-hanging-raise": "assets/images/ex_hanging_leg_raise.jpg",
  "ex-abs-cable-crunch": "assets/images/ex_cable_crunch.jpg",
  "ex-abs-russian-twist": "assets/images/ex_russian_twist.jpg",
  "ex-abs-ab-wheel": "assets/images/ex_ab_wheel.jpg",
  "ex-abs-plank": "assets/images/ex_forearm_plank.jpg"
};

for (const [exId, imgPath] of Object.entries(exerciseExactImages)) {
  const regex = new RegExp(`(id:\\s*"${exId}",[\\s\\S]+?image:\\s*)"[^"]+"`, 'm');
  dataContent = dataContent.replace(regex, `$1"${imgPath}"`);
}

// 3. Update Nutrition Meals with distinct images
const newMealsSection = `    meals: [
      { time: "08:15 AM", category: "Breakfast", name: "Rolled Oats & Whey Bowl with Chia Seeds", calories: 480, protein: 36, carbs: 62, fat: 9, image: "assets/images/recipe_oats.jpg" },
      { time: "01:20 PM", category: "Lunch", name: "Grilled Paneer & Quinoa Power Bowl", calories: 640, protein: 38, carbs: 75, fat: 21, image: "assets/images/recipe_paneer.jpg" },
      { time: "05:00 PM", category: "Post-Workout Snack", name: "Greek Yogurt with Banana & Honey", calories: 310, protein: 22, carbs: 48, fat: 4, image: "assets/images/recipe_yogurt_parfait.jpg" },
      { time: "08:30 PM", category: "Dinner", name: "Moong Dal Khichdi & Steamed Veggies", calories: 390, protein: 18, carbs: 64, fat: 6, image: "assets/images/recipe_dal.jpg" }
    ],`;

dataContent = dataContent.replace(/meals:\s*\[[\s\S]+?allergies:/, `${newMealsSection}\n    allergies:`);

// 4. Update Recipes with distinct photos and expanded culinary variety
const newRecipesSection = `  recipes: [
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
  ],`;

dataContent = dataContent.replace(/recipes:\s*\[[\s\S]+?waterStation:/, `${newRecipesSection}\n  waterStation:`);

// 5. Update LocalStorage migration in FitSyncStore.prototype.load
const storageCheck = `        if (!parsed.workoutPlans || !parsed.workoutPlans.thu || !parsed.workoutPlans.thu.exercises || parsed.workoutPlans.thu.exercises[0].id !== "ex_greatest_stretch" || !parsed.workoutPlans.mon.exercises[0].image.includes('ex_incline_bench')) {
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
        }`;

dataContent = dataContent.replace(/if \(!parsed\.workoutPlans \|\|[\s\S]+?return parsed;/, `${storageCheck}\n        return parsed;`);

fs.writeFileSync(dataFilePath, dataContent, 'utf8');
fs.writeFileSync(fitsyncDataFilePath, dataContent, 'utf8');
console.log('Successfully updated js/data.js and fitsync/js/data.js with distinct photos for all exercises, meals, and recipes!');
