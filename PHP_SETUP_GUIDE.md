# FitSync AI — PHP Edition Setup Guide

## 1. Overview
This project has been ported to the exact required **Minor Project** technology stack:
* **Backend & Server Logic**: **PHP 7.4 / 8.x**
* **Database & Cloud Storage**: **Supabase (PostgreSQL)**
* **Frontend Markup & Styling**: **HTML5 + CSS3 + Bootstrap 5.3**
* **Interactivity & Audio Telemetry**: **JavaScript (Web Audio API, Timers, Dynamic Calculators)**

---

## 2. Project Directory Structure

```text
FIT-SYNC AI php/
├── config/
│   ├── config.php          # Base constants, environment variable loader (.env.local), URL helpers
│   ├── session.php         # User sessions, authentication helpers, flash alerts
│   └── supabase.php        # Supabase cURL client (PostgREST table queries & Auth API)
├── includes/
│   ├── header.php          # HTML5 <head>, Google Fonts, Bootstrap 5 CDN, CSS, Flash alerts
│   ├── navbar.php          # Sticky responsive navigation with role badges & dropdowns
│   └── footer.php          # Footer branding, Bootstrap JS bundle, main.js bundle
├── assets/
│   ├── css/
│   │   └── style.css       # Fitness dark glassmorphism theme with Bootstrap 5
│   ├── js/
│   │   └── main.js         # Rest Timer engine, Web Audio API tone generator, live BMR/TDEE math
│   └── *.jpg               # Image assets (avatars, workouts, logo)
├── api/
│   ├── assessment.php      # Mifflin-St Jeor BMR, TDEE, and Macro target calculator API
│   ├── workouts.php        # Workout set logger API
│   └── meals.php           # Nutrition and food intake logger API
├── index.php               # Landing Page with hero section, feature pillars, stack badges
├── login.php               # Sign-in page with 1-Click Fast Demo Logins (Member, Trainer, Admin)
├── register.php            # New member registration page
├── logout.php              # Session destroyer and redirect
├── dashboard.php           # Comprehensive Member Dashboard (Streak, calories, routine, biometrics)
├── workouts.php            # Active workout logger with the Tactical Rest Timer widget
├── nutrition.php           # Daily diet protocol, macro breakdown, and meal logging
├── assessment.php          # Senses Biometric Assessment Form with live calculations
└── attendance.php          # Multi-gym QR turnstile attendance pass & check-in log
```

---

## 3. How to Run the Website

### Option A: Using PHP Built-In Server (Quickest)
If PHP is installed on your computer:
1. Open PowerShell or Terminal in this folder (`c:\FIT-SYNC AI php`).
2. Run:
   ```powershell
   php -S localhost:8000
   ```
3. Open your browser and navigate to:
   [http://localhost:8000](http://localhost:8000)

---

### Option B: Using XAMPP (Standard College Setup)
1. Copy or move this folder into your XAMPP web root:
   ```text
   C:\xampp\htdocs\fitsync
   ```
2. Open the **XAMPP Control Panel** and click **Start** next to **Apache**.
3. Open your browser and visit:
   [http://localhost/fitsync/](http://localhost/fitsync/)

---

## 4. Key Highlights for Project Evaluation & Viva

1. **Mifflin-St Jeor Biometric Mathematical Formula**:
   - Men: $BMR = 10 \times \text{weight(kg)} + 6.25 \times \text{height(cm)} - 5 \times \text{age} + 5$
   - Women: $BMR = 10 \times \text{weight(kg)} + 6.25 \times \text{height(cm)} - 5 \times \text{age} - 161$
   - Real-time client calculation in `assets/js/main.js` and server-side validation in `api/assessment.php`.

2. **Web Audio API Rest Timer**:
   - Zero external audio files required. Uses native HTML5 Web Audio API oscillators to generate crisp interval pings at 3-second warnings and timer completion.

3. **Supabase PostgreSQL Connectivity**:
   - `config/supabase.php` provides fluent query capabilities (`Supabase::table('user_profiles')->select('*')->get()`) through Supabase's RESTful PostgREST engine.
