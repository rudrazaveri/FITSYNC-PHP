# FitSync — MySQL Database Documentation & Migration Guide

## 1. Overview
This directory contains the authoritative, production-ready **MySQL 8.0 / MariaDB 10.4+** schema and verified seed data for the **FitSync Multi-Gym Fitness Management Platform**.

* **Authoritative Schema File:** `database/fitsync_mysql_schema.sql` (and mirrored at `/fitsync_mysql_schema.sql`)
* **Default Database Name:** `fitsync_db`
* **Character Set & Collation:** `utf8mb4` / `utf8mb4_unicode_ci`
* **Storage Engine:** `InnoDB` (ACID compliant with explicit foreign keys and cascade actions)

---

## 2. Structural Changes from Old PostgreSQL Schema

| Aspect | Old PostgreSQL Schema (`fitsync_schema.sql`) | Updated MySQL Schema (`database/fitsync_mysql_schema.sql`) |
| :--- | :--- | :--- |
| **Total Tables** | 88 tables | **81 tables** |
| **Primary Keys** | `BIGINT GENERATED ALWAYS AS IDENTITY` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY` |
| **Timestamps** | `TIMESTAMPTZ` with `now()` | `DATETIME` with `CURRENT_TIMESTAMP` |
| **Booleans** | `BOOLEAN` | `TINYINT(1)` (aliased to `BOOLEAN` in MySQL) |
| **Network IPs** | `INET` | `VARCHAR(45)` (IPv4 / IPv6 compatible) |
| **JSON Fields** | `JSONB` | `JSON` |
| **Unique Keys** | `TEXT UNIQUE` (Fails in MySQL) | `VARCHAR(191)` / `VARCHAR(255) UNIQUE` |
| **Doctor/Physio Modules** | 10 tables + 'doctor'/'physio' roles | **100% Removed** (Strict adherence to Section 9 of Master Spec) |

### Removed Medical & Consultation Tables:
1. `availability_rules`
2. `availability_blocks`
3. `appointments`
4. `reschedule_requests`
5. `consultation_notes`
6. `physio_sessions`
7. `physio_exercise_assignments`
8. `physio_exercise_logs`
9. `report_shares`
10. `assessment_shares`

---

## 3. How to Import the Schema into XAMPP / MySQL

### Option A: Using phpMyAdmin (Visual Interface)
1. Open the **XAMPP Control Panel** and ensure **MySQL** and **Apache** are started.
2. In your browser, navigate to: `http://localhost/phpmyadmin/`.
3. Click the **Import** tab on the top menu.
4. Click **Choose File** and select `c:\FIT-SYNC AI php\database\fitsync_mysql_schema.sql`.
5. Click **Go** at the bottom.
6. The database `fitsync_db` and all 81 tables with initial seed data will be created automatically.

### Option B: Using MySQL Command Line
Run the following in PowerShell / Command Prompt:
```powershell
# Default XAMPP setup (root user, no password)
mysql -u root -p < "c:\FIT-SYNC AI php\database\fitsync_mysql_schema.sql"
```

---

## 4. Pre-Seeded Accounts for Testing (All Passwords: `password123`)

| Role | Name | Email | Password | Assigned Context |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Admin** | System Administrator | `admin@fitsync.com` | `password123` | Full platform oversight & verification |
| **Gym Owner** | Priya Sharma | `owner@fitzone.com` | `password123` | Owner of FitZone Fitness (Pune & Vadodara) |
| **Trainer (Coach)** | Coach Raj Malhotra | `coach@fitsync.health` | `password123` | Head CSCS Coach; assigned to Isha, Ritika & Aarav |
| **Trainer (Coach)** | Vikram Singh | `vikram@fitsync.health` | `password123` | Functional movement & calisthenics coach |
| **Trainer (Coach)** | Simran Kaur | `simran@fitsync.health` | `password123` | Female hypertrophy & nutrition specialist |
| **Gym Member** | Isha Kulkarni | `isha.kulkarni@fitsync.com` | `password123` | FitZone Gold Member; PPL routine active |
| **Gym Member** | Ritika Sharma | `ritika@fitsync.health` | `password123` | FitZone Member; active chat with Coach Raj |
| **Gym Member** | Aarav Patel | `aarav.patel@fitsync.ai` | `password123` | PowerHouse Gym Member |

*Note: All passwords are pre-hashed using PHP's native `PASSWORD_BCRYPT` algorithm (`$2y$10$...`) for instant secure login.*

---

## 5. Core Table Relationships (78 Tables)

```
Users (users)
  ├── User Profiles (user_profiles)
  ├── Trainer Profiles (trainer_profiles)
  │     ├── Credentials (trainer_credentials)
  │     └── Specializations (trainer_specializations)
  ├── Gym Ownership (gyms.owner_user_id)
  │     ├── Photos, Hours, Facilities, Equipment
  │     ├── Staffing Roster (gym_trainers)
  │     └── Membership Plans (membership_plans)
  ├── Member Memberships (memberships)
  │     └── Turnstile Attendance (attendance)
  ├── Trainer Assignments (trainer_assignments)
  │     ├── Permissions (trainer_data_permissions)
  │     ├── Direct Notes (trainer_notes)
  │     └── Two-Way Chat (conversations -> messages)
  ├── Workout Engine
  │     ├── Master Library (exercises -> muscle_groups, equipment)
  │     ├── Plans & Days (workout_plans -> plan_days -> plan_day_exercises)
  │     ├── Assignments (plan_assignments)
  │     └── Session Logs (workout_sessions -> session_exercises -> exercise_set_logs)
  └── Nutrition & Hydration
        ├── Foods & Categories (foods -> food_categories, food_servings)
        ├── Allergies & Restrictions (user_allergies, user_dietary_restrictions)
        ├── Recipes & Ingredients (recipes -> recipe_ingredients)
        ├── Daily Meals (meals -> meal_items)
        └── Hydration Logs (water_logs)
```
