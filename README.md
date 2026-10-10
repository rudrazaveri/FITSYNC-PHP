# FitSync AI — Intelligent Multi-Gym Fitness, Health & Personalized Coaching Platform

> **"Your Fitness. Your Health. Your Intelligence."**  
> *One unified ecosystem for personalized fitness, predictive nutrition, clinical healthcare connectivity, and multi-gym management.*

---

## 🌟 Executive Overview & Product Architecture

**FitSync AI** is a commercial-grade, unified health-tech and fitness-tech mobile platform that connects:
1. **Gym Members** — Athletes and fitness enthusiasts tracking workouts, nutrition, biometrics, and recovery.
2. **Gym Trainers** — Certified strength and conditioning coaches monitoring assigned members, approving progression, and acting on automated intervention intelligence.
3. **Gym Owners & Administrators** — Gym branch operators managing turnstile attendance, equipment, trainers, and membership packages.
4. **Sports Medicine Doctors** — Medical physicians reviewing blood biomarker panels, cardiac diagnostics, and conducting online telehealth consultations.
5. **Physiotherapists** — Rehabilitation specialists diagnosing joint mechanics, posture kinematics, and mobility recovery.
6. **Platform Administrators** — Multi-gym network directors managing cross-city tenant isolation (Vadodara, Ahmedabad, Surat).

---

## 🎨 Design System & Visual Specification ("BioDigital Kinetic")

FitSync AI implements the **BioDigital Kinetic** design system, fusing **Dark Space Glassmorphism** with high-contrast biological neon accents:

| Token Category | Hex Value / Gradient | Role & Usage |
| :--- | :--- | :--- |
| **Canvas Base** | `#0B0F17` / `#070A10` | Non-reflective pitch charcoal foundation. Eliminates eye strain and optimizes OLED power efficiency. |
| **Fitness Primary** | `#10B981` (Neon Emerald) | Kinetic energy, streak milestones, target calories, active PR progression, optimal recovery. |
| **Healthcare Primary**| `#06B6D4` / `#38BDF8` (Cyan) | Clinical teleconsultations, doctor badges, bloodwork diagnostics, hydration metrics, patient consent. |
| **AI Nebula** | `linear-gradient(135deg, #8B5CF6, #3B82F6, #06B6D4)` | Predictive nutrition coach, adaptive progression recommendations, automated safety checks. |
| **Warning Status** | `#F59E0B` (Amber) | Recurring dietary patterns, sub-optimal training volume, trainer intervention flags. |
| **Danger / Allergen** | `#EF4444` (Crimson) | Dietary safety allergen conflicts (Peanuts), missed workout thresholds, clinical alerts. |

### Typography Scale
- **Display Hero:** `Space Grotesk` (34px, 800 weight, -0.03em tracking) for primary telemetry readouts (18,400 kg, 2,650 kcal).
- **Headlines:** `Space Grotesk` (18px - 22px, 700 weight) for workout titles, module headers, and provider profiles.
- **Body & Labels:** `Plus Jakarta Sans` (12px - 14px, 400 - 600 weight) for instructions, nutrition breakdowns, and chat dialogue.
- **Biometric Annotations:** `JetBrains Mono` (10px - 12px, tabular numerals) for BMR, TDEE, rest timers, and lab values.

---

## 📱 Prototype Pages & Feature Map (All 8 Roles & Modules)

### Page 1: 🎨 Design System
- Live color swatches with functional token definitions.
- Typography scale showcase.
- Reusable component sandbox: Kinetic CTA buttons, AI predictive buttons, healthcare cards, status badges, and inputs.
- AI visual language (✨ AI Insight, 🧠 FitSync Recommendation).
- Healthcare visual language (🔒 Patient Privacy Lock, clinical consent badges).

### Page 2: 📱 Member App (Aarav Shah, 23 • Muscle Gain • FitZone Vadodara)
1. **Welcome & Onboarding:**
   - Brand logo, hero tagline, and entry CTA ("Get Started").
2. **Member Registration:**
   - Name, email, phone, DOB, gender, and encrypted credential setup.
3. **Gym Discovery & Selection:**
   - Searchable branch selector with FitZone Vadodara (4.9★, 1.2km, 8 trainers), PowerHouse Ahmedabad, and Elite Fitness Surat.
4. **Senses-Style Health & Fitness Assessment (4 Steps):**
   - **Step 1:** Age (23), Height (175 cm), Weight (72.4 kg), optional tape metrics (Waist 81cm, Neck 38cm, Hip 96cm).
   - **Step 2:** Activity Index (Moderately Active, 4–5 days/week).
   - **Step 3:** Primary Fitness Goal (Build Muscle) & Secondary Goals (Strength, Flexibility).
   - **Step 4:** Dietary Preferences & Allergies (Non-Vegetarian, **Peanuts Allergen** flagged).
5. **Assessment Results Engine:**
   - **Real Formula Computation:**
     - **BMI:** 23.6 (*Healthy / Optimal*)
     - **BMR (Mifflin-St Jeor):** 1,720 kcal/day (*Calories at complete rest*)
     - **TDEE:** 2,450 kcal/day (*Energy expenditure with activity*)
     - **Daily Target:** 2,650 kcal (*+200 kcal surplus for muscle gain*)
     - **Daily Macros:** Protein 150g (2.1g/kg), Carbs 300g, Healthy Fats 75g (25% ratio)
     - **Fitness Score:** 82 / 100 with sub-scores (Activity 85, Strength 80, Consistency 88, Nutrition 78).
     - Non-diagnostic transparency disclaimer banner.
6. **Member Home Dashboard:**
   - Good Morning, Aarav Shah header with FitZone badge and notification bell.
   - Quick Today's Summary (Calories, Protein, Workout, 5-Day Streak 🔥).
   - One-tap interactive hydration logger (`+250ml`).
   - Hero Workout Card (Chest & Triceps, 6 Exercises, 45 min).
   - AI Coach Card ("Ask FitSync AI").
   - Upcoming telehealth appointment preview (Dr. Ramesh Sharma at 05:30 PM with 1-tap room entry).
7. **Workout Module & Adaptive Progression:**
   - Chest & Triceps routine: Barbell Bench Press, Incline DB Press, Cable Fly, Tricep Pushdown, Overhead DB Extension.
   - Set-by-set logging with interactive status toggles ("✓ Completed").
   - Live rest countdown timer with audio feedback.
   - **FitSync Adaptive AI Recommendation:** Detects easy bench sets and suggests increasing load to 82.5 kg, backed by Coach Raj's approval.
   - Exercise library with search, muscle group filters, and full guide modal.
8. **Nutrition Module & Safety Engine:**
   - Caloric budget progress bar and macro breakdown.
   - Interactive meal logging with instant macro computation.
   - **Dietary Safety Check:** Real-time conflict scanner (entering "Peanut Butter" triggers `🔴 Potential Allergen Conflict Detected: Peanuts`).
   - Recommended Gourmet Fitness Bowl with high-protein photography.
   - **Food Reaction Tracker:** Recurring pattern observer (Milk → Bloating flagged with pattern insight and non-diagnostic note).
9. **Health Hub & Clinical Connectivity:**
   - Sports medicine physicians (Dr. Ananya Iyer, MBBS MD) and physiotherapists (Dr. Ramesh Sharma, MPT).
   - Provider availability schedule grid (Monday 10am-1pm, Wednesday 4pm-7pm, Thursday 10am-2pm).
   - Interactive 5-step appointment booking modal with instant confirmation.
   - Health Reports Vault: Blood panels, MRI scans, and metabolic testing with explicit patient consent sharing controls.
10. **Telehealth Video Consultation UI:**
    - Fullscreen consultation room with Dr. Ramesh Sharma.
    - Live ticking session timer, microphone toggle, camera toggle, speaker toggle, in-call notes, and end call button.
11. **Progress, Photos, Goals & Attendance:**
    - SVG weight trend chart (-2.1 kg this month).
    - Monthly attendance heatmap (18 visits, 88% attendance, 5-day streak).
    - Goal progress bars (Bench 82.5/90 kg, Protein 112/150g, Attendance 5/4 days).
12. **Floating AI Assistant & Global Search:**
    - Persistent ✨ `Ask FitSync AI` drawer with pre-loaded prompts and instant context-aware replies.
    - Medical safety triage disclaimer for acute pain symptoms.

### Page 3: 🏋️ Trainer App (Coach Raj Patel UI)
- Active member queue: 24 assigned members, 14 active today, 4 sessions.
- **AI Trainer Intervention Intelligence:**
  - `🔴 Rahul Verma:` Missed 3 workouts in last 10 days (AI suggests 3-day split nudge).
  - `🟡 Aarav Shah:` High bar velocity on bench press; approved 82.5 kg progression.
  - `🟡 Priya Nair:` Has not logged nutrition for 6 consecutive days.

### Page 4: 🩺 Doctor App (Dr. Ananya Iyer UI)
- Clinical queue: Patient consultations, video room access, and scheduling.
- Sovereign Medical Vault: View authorized patient blood panels with explicit consent badges.
- Weekly availability configuration grid.

### Page 5: 🏃 Physiotherapist App (Dr. Ramesh Sharma UI)
- Physical therapy sessions and kinematic tracking.
- Rotator cuff mobility metrics (85° external rotation) and thoracic spine recovery tracking.
- Direct entry into the live video consultation room.

### Page 6: 🏢 Gym Admin / Owner App (FitZone Vadodara)
- 482 total members, 8 certified trainers, 86.4% monthly attendance rate.
- Trainer roster performance monitor.
- Membership packages configuration (Silver Basic, Gold All-Access, Platinum VIP).

### Page 7: 🌐 Platform Admin App (Multi-Gym Network Architecture)
- Enterprise multi-tenant overview: FitZone Vadodara, PowerHouse Ahmedabad, Elite Fitness Surat.
- Total network stats: 1,492 members, 26 trainers, 342 monthly clinical consults.
- Isolated database partition architecture and cross-network health provider registry.

### Page 8: 🗺️ Prototype Flow (Interactive Node Diagram)
- Interactive visual graph connecting all 6 major user journeys.
- One-click jump buttons that transport you directly into any screen state in the prototype.

---

## 🛠️ How to Run & Explore Locally

The prototype runs as a zero-dependency modern web application.

### Quick Start
```bash
# In the project directory (c:\figma)
python -m http.server 3000
```
Open **[http://localhost:3000](http://localhost:3000)** in any modern browser (Chrome, Edge, Safari, Firefox).

### Key Interactive Features to Try:
1. **Switch Viewports:** Click `📱 390×844` in the top right to view in the iPhone 15 Pro hardware frame, or `🖥️ Fluid` to expand to a responsive layout.
2. **Audio Haptics:** Click buttons with sound turned on to experience synthesized native-feeling clicks, completion chimes, and AI pulses.
3. **Take the Assessment:** Click `⚡ Quick Jump Flow...` → `4. Senses Health Assessment` to experience the 4-step biometric onboarding with live Mifflin-St Jeor formula calculations!
4. **Log Sets & Rest Timer:** Go to `Workout`, tap a set to toggle completion, and start the interactive rest timer.
5. **Test Allergen Safety:** Go to `Nutrition` → `🛡️ Safety Check` and type "Peanut Butter" to witness the live allergy conflict warning.
6. **Join a Video Call:** Click `📹 Join Video Room` on the Home or Health tab to enter the simulated telehealth consultation with Dr. Sharma!
7. **Ask FitSync AI:** Click the floating `✨ Ask FitSync AI` button and tap any prompt chip for immediate intelligent answers.

---

## ☁️ Google Stitch Design Cloud Project

This prototype is also registered in Stitch:
- **Project ID:** `2416637838043309167`
- **Screen ID:** `f8f6a2a4398644fe8f817bc1d38d7e65`
- **Design System Asset:** `assets/46baee7b8f684790b145f3ae27eeb3bf` (*BioDigital Kinetic*)
