# FitSync AI — Technology Stack & Architectural Specification

> **"Your Fitness. Your Health. Your Intelligence."**  
> A comprehensive overview of all languages, frameworks, libraries, database engines, mathematical models, and deployment infrastructure used to build the FitSync AI platform.

---

## 1. Executive Technology Summary

FitSync AI is built as a responsive, full-stack web application designed for high performance, zero-latency responsive interactions, patient privacy, and cross-platform accessibility.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FITSYNC AI CLIENT LAYER                         │
│   HTML5 • CSS3 • Bootstrap 5.3 • JavaScript                            │
│   Dark Glassmorphism UI System • Web Audio API Tactile Haptics         │
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
│                    SUPABASE BACKEND & DATABASE LAYER                   │
│   • PostgreSQL (Relational Normalized Schema with UUIDs & GiST)        │
│   • Row Level Security (RLS) Patient Consent Matrix                    │
│   • Supabase Auth (Role-Based JWT Authorization across Roles)          │
│   • PostgREST Direct API Engine (`config/supabase.php`)                │
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
  * PostgREST cURL client for Supabase (`config/supabase.php`).

### 2.2 Database & BaaS
* **Supabase (PostgreSQL 15)**
  * User profiles, biometrics, workout routines, nutrition logs, and gym attendance.
  * Relational constraints and schema migrations in `supabase/migrations/`.

### 2.3 Frontend & Interactivity
* **HTML5 & CSS3**
  * Mobile-responsive semantic markup.
  * Custom dark fitness theme (`assets/css/style.css`).
* **Bootstrap 5.3**
  * Grid system, utility classes, modals, and responsive components.
* **JavaScript (Vanilla JS & Web Audio API)**
  * Real-time workout interval rest timer with start, pause, reset, and presets.
  * Web Audio API synthesized audio beeps without external MP3 assets.
  * Real-time biometric calculator for Mifflin-St Jeor BMR & TDEE.
