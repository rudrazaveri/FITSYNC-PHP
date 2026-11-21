# FitSync — PHP Edition Setup Guide

## 1. Overview
This project has been ported to the exact required **Minor Project** technology stack:
* **Backend & Server Logic**: **PHP 7.4 / 8.x**
* **Frontend Markup & Styling**: **HTML5 + CSS3 (Electric Blue Theme)**
* **Interactivity & Audio Telemetry**: **Vanilla JavaScript (Timers, Dynamic Calculators, Chart.js, Lucide Icons)**
* **Storage**: **LocalStorage & Session Persistence**

---

## 2. Project Directory Structure

```text
FIT-SYNC AI php/
├── config/
│   ├── config.php          # Base constants, environment variable loader (.env.local), URL helpers
│   └── session.php         # User sessions, authentication helpers, flash alerts
├── includes/
│   ├── header.php          # HTML5 <head>, Google Fonts, Bootstrap 5 CDN, CSS, Flash alerts
│   ├── navbar.php          # Sticky responsive navigation with role badges & dropdowns
│   └── footer.php          # Footer branding, Bootstrap JS bundle, main.js bundle
├── css/
│   ├── style.css           # Master Electric Blue design system
│   └── responsive.css      # Responsive layout adjustments
├── js/
│   ├── app.js              # Application router, modal controller, rest timer
│   ├── charts.js           # Chart.js visualization engine
│   └── data.js             # FitSyncStore state & LocalStorage
├── assets/
│   └── images/             # 26 high-resolution themed photos
├── api/
│   ├── assessment.php      # Mifflin-St Jeor BMR, TDEE, and Macro target calculator API
│   ├── workouts.php        # Workout set logger API
│   └── meals.php           # Nutrition and food intake logger API
├── index.html              # Complete SPA Dashboard (16 modules)
├── index.php               # Landing Page with hero section, feature pillars, stack badges
├── login.php               # Sign-in page with fast demo logins
├── register.php            # New member registration page
├── logout.php              # Session destroyer and redirect
├── dashboard.php           # Server-rendered PHP member dashboard
├── workouts.php            # Active workout logger with rest timer widget
├── nutrition.php           # Daily diet protocol, macro breakdown, and meal logging
├── assessment.php          # Senses Biometric Assessment Form with live calculations
└── attendance.php          # Multi-gym QR turnstile attendance pass & check-in log
```

---

## 3. How to Run the Website

### Option A: Using Python Simple Server (Quickest for Frontend SPA)
```powershell
python -m http.server 8085
```
Open your browser at: [http://127.0.0.1:8085/index.html](http://127.0.0.1:8085/index.html)

---

### Option B: Using PHP Built-In Server
If PHP is installed on your computer:
1. Open PowerShell or Terminal in this folder (`c:\FIT-SYNC AI php`).
2. Run:
   ```powershell
   php -S 127.0.0.1:8000
   ```
3. Open your browser and navigate to:
   [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

### Option C: Using XAMPP (Standard College Setup)
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
   - Real-time client calculation in `js/app.js` and server-side validation in `api/assessment.php`.

2. **Web Audio & Interval Rest Timer**:
   - Zero external audio files required. Synthesizes countdown intervals for gym rest management.

3. **Pure Standards-Compliant Architecture**:
   - Fully accessible offline without any external cloud service or third-party database dependencies.
