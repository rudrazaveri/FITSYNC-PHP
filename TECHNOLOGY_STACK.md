# FitSync — Technology Stack & Architectural Specification

> **"Your Fitness. Your Health. Your Intelligence."**  
> A comprehensive overview of all languages, frameworks, libraries, database engines, mathematical models, and deployment infrastructure used to build the FitSync platform.

---

## 1. Executive Technology Summary

FitSync is built as a responsive, standards-compliant web application designed for high performance, zero-latency responsive interactions, and cross-platform accessibility.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          FITSYNC CLIENT LAYER                          │
│   HTML5 • CSS3 • Vanilla JavaScript (ES6+) • Chart.js • Lucide Icons   │
│   Electric Blue UI System • Single Page Application (16 Views)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                       APPLICATION & BACKEND LAYER                      │
│   • PHP 8.x Modular Architecture (Config, Sessions, Partials)          │
│   • REST API Endpoints (`api/assessment.php`, `api/workouts.php`)      │
│   • Mifflin-St Jeor Biometric Engine • Macro Target Generator          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                            DATA & STORAGE                              │
│   • Client-Side LocalStorage (`FitSyncStore`)                          │
│   • Session State Management & Offline-First Operation                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                      DEVOPS & DEPLOYMENT LAYER                         │
│   • Apache / XAMPP / PHP Built-in Web Server                           │
│   • GitHub Version Control Pipeline                                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack Breakdown

### 2.1 Backend & Server
* **PHP 7.4 / 8.x**
  * Modular layout structure (`includes/header.php`, `includes/navbar.php`, `includes/footer.php`).
  * Session-based state management (`config/session.php`).
  * REST API endpoints for meals, workouts, and biometrics.

### 2.2 Frontend & Interactivity
* **HTML5 & CSS3**
  * Mobile-responsive semantic markup.
  * Custom Electric Blue theme (`css/style.css` & `css/responsive.css`).
* **JavaScript (Vanilla JS)**
  * Single Page Application router (`switchView`) supporting all 16 modules.
  * Real-time workout interval rest timer with start, pause, reset, and presets.
  * Real-time biometric calculator for Mifflin-St Jeor BMR & TDEE.
  * Chart.js integration for weekly activity and progress trends.
  * Lucide Icons integration.

### 2.3 Data Persistence
* **LocalStorage (FitSyncStore)**
  * Stores user profile, hydration logs, meal entries, biometric assessments, and attendance records locally with zero cloud dependencies.
