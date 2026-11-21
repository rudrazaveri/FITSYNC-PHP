# FitSync — Multi-Gym Fitness & Healthcare Management Platform

> **"Your Fitness. Your Health. Your Intelligence."**  
> *A unified ecosystem for multi-gym management, personalized fitness tracking, biometric assessments, nutrition, and healthcare connectivity.*

---

## 🌟 Executive Overview

**FitSync** is a full-featured fitness and healthcare web platform designed for members, certified gym trainers, gym branch owners, and medical consultants. Built using a lightweight, standards-compliant stack (**HTML5, CSS3, Vanilla JavaScript, PHP, and Supabase / PostgreSQL**), it delivers a native-feeling single-page application (SPA) experience without bulky frontend frameworks.

---

## 🛠️ Technology Stack (Minor Project Specification)

| Layer | Technologies | Role & Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | **HTML5 & CSS3** | Semantic layout and Electric Blue design system with custom CSS variables, responsive grid/flexbox, and modal dialogs. |
| **Interactions** | **Vanilla JavaScript (ES6+)** | Zero-reload client-side routing (`switchView`), Mifflin-St Jeor formula engine, rest interval timer, and LocalStorage caching. |
| **Visualizations** | **Chart.js & Lucide Icons** | Activity bar charts, weight progression line charts, hydration tracking, and 72 interface icons with SVG fallbacks. |
| **Backend API** | **PHP 8.x** | Modular REST endpoints (`api/workouts.php`, `api/meals.php`, `api/assessment.php`), session authentication, and database connectivity. |
| **Database** | **Supabase (PostgreSQL)** | Cloud-hosted relational database storing user profiles, gym branches, workouts, nutrition, attendance logs, and progress metrics. |

---

## 🎨 Design System: Electric Blue Theme

Designed according to high-contrast modern dashboard standards:

- **Primary Blue:** `#155DFC`
- **Secondary Blue:** `#3B82F6`
- **Light Blue Accent:** `#DBEAFE`
- **Background:** `#F5F7FF`
- **Card Background:** `#FFFFFF` (14–16px border-radius, subtle 1px border)
- **Main Text:** `#0F172A`
- **Muted Text:** `#64748B`
- **Success / Green:** `#16A34A`
- **Accent Orange:** `#F97316`
- **Typography:** `Inter` (Google Fonts)

---

## 📱 Platform Modules (16 Integrated Views)

1. **Dashboard (`#view-dashboard`):** 3-column layout featuring welcome banner, 4 live telemetry stat cards (Weight, BMI, Calories, Water), Fitness Goal circular ring, Weekly Activity bar chart, 6 quick actions, Gym & Membership overview, Recent Progress trend line, Today's Workout widget, Nutrition summary, and upcoming medical/physio consultations.
2. **Gyms & Membership (`#view-gyms`):** Multi-gym branch directory (FitZone Pune, PowerHouse Mumbai, CrossFit Arena, Elite Fitness) with amenity badges, trainer counts, and active tier validation.
3. **Trainers (`#view-trainers`):** Certified coach directory with specialty filters, experience badges, and direct session booking.
4. **Workouts (`#view-workouts`):** Structured training splits, exercise checklists, and live workout session launcher.
5. **Exercise Library (`#view-exercises`):** Searchable exercise encyclopedia with form cues, targeted muscle groups, and equipment tags.
6. **Fitness Assessment (`#view-assessment`):** Live Mifflin-St Jeor biometric calculator computing BMR, TDEE, goal-adjusted calorie intake, macronutrient splits, and U.S. Navy body fat estimates.
7. **Progress Tracking (`#view-progress`):** Historical body weight logging with dedicated high-resolution Chart.js line graph and milestone targets.
8. **Nutrition & Diet (`#view-nutrition`):** Macronutrient balance tracker (Protein, Carbs, Fats), caloric budget progress, and meal logging.
9. **Recipes (`#view-recipes`):** High-protein recipes with prep times, calorie counts, and macro breakdowns.
10. **Water Intake Station (`#view-water`):** Interactive hydration tracker with preset quick-adds (+150ml, +250ml, +500ml), weekly consumption chart, and daily target bottle visualization.
11. **Appointments (`#view-appointments`):** Telehealth consultation scheduler for sports medicine physicians and physiotherapists.
12. **Health Reports Vault (`#view-reports`):** Encrypted medical and laboratory report repository.
13. **Attendance & Turnstile (`#view-attendance`):** Multi-gym turnstile check-in simulator, monthly visit streaks, and QR code pass.
14. **Reports & Analytics (`#view-analytics`):** Monthly attendance, workout volume, and calorie adherence trends.
15. **Settings (`#view-settings`):** Member profile management, emergency contact details, and preference configurations.
16. **Help & Support (`#view-help`):** FAQ accordion, contact support channels, and platform user guides.

---

## 🪟 Interactive Modals (8 Total)

- **`workoutModal`**: Exercise set tracker with live ticking rest countdown timer (60s / 90s).
- **`addWaterModal`**: Instant hydration logging with one-tap presets and custom millilitre input.
- **`addMealModal`**: Meal category selector and nutrition logging form.
- **`updateProgressModal`**: Body weight logger updating charts and localStorage in real time.
- **`bookAppointmentModal`**: Doctor / Physiotherapist consultation booking.
- **`uploadReportModal`**: Encrypted medical file upload simulation.
- **`gymDetailsModal`**: Detailed view of gym branch amenities, hours, and location.
- **`goalDetailsModal`**: Breakdown of primary fitness goal milestones.

---

## 🚀 Running the Project Locally

### 1. Frontend Quick Preview (Zero Setup)
You can preview the platform immediately using any local web server or by opening `index.html` in your browser:
```bash
# Using Python
python -m http.server 8085

# Open in your browser:
# http://127.0.0.1:8085/
# or http://127.0.0.1:8085/fitsync/
```

### 2. Full PHP + Supabase Backend
To run with PHP and Supabase backend features:
1. Ensure **PHP 8.0+** is installed (or use **XAMPP / WAMP / Laragon**).
2. Configure your Supabase credentials in `config/supabase.php` or `.env.local`:
   ```php
   define('SUPABASE_URL', 'https://your-project.supabase.co');
   define('SUPABASE_ANON_KEY', 'your-anon-key');
   ```
3. Run the migrations in `supabase/migrations/` inside your Supabase SQL Editor.
4. Start the PHP server:
   ```bash
   php -S 127.0.0.1:8000
   ```
5. Open `http://127.0.0.1:8000` to access the full application.

For detailed backend setup instructions, consult [PHP_SETUP_GUIDE.md](file:///c:/FIT-SYNC%20AI%20php/PHP_SETUP_GUIDE.md).

---

## 📁 Repository Structure

```text
FIT-SYNC AI php/
├── index.html            # Main User Dashboard SPA (all 16 modules)
├── index.php             # PHP entrypoint with session router
├── dashboard.php         # Server-rendered PHP dashboard
├── login.php             # Authentication login page
├── register.php          # Member registration page
├── workouts.php          # PHP workouts module
├── nutrition.php         # PHP nutrition module
├── assessment.php        # PHP assessment module
├── attendance.php        # PHP attendance module
├── api/                  # PHP REST API endpoints
│   ├── assessment.php
│   ├── meals.php
│   └── workouts.php
├── config/               # PHP config and Supabase client
│   ├── config.php
│   ├── session.php
│   └── supabase.php
├── css/                  # Styling & themes
│   ├── style.css         # Master Electric Blue design system
│   └── responsive.css    # Responsive mobile & tablet layouts
├── js/                   # Vanilla JavaScript controllers
│   ├── app.js            # Router, modal controller, rest timer
│   ├── charts.js         # Chart.js visualization engine
│   └── data.js           # FitSyncStore state & localStorage
├── assets/               # Media & visual assets
│   ├── images/           # 26 high-resolution themed photos
│   └── css/
├── fitsync/              # Standalone frontend bundle
├── supabase/             # Database migrations & seed data
│   ├── migrations/
│   └── seed.sql
├── documents/            # Feature specs & project documentation
├── PHP_SETUP_GUIDE.md    # PHP & database setup instructions
└── TECHNOLOGY_STACK.md   # Architectural & stack breakdown
```

---

## 📄 License & Academic Attribution
Developed for Minor Project requirements — FitSync Multi-Gym Fitness & Healthcare Management Platform.
