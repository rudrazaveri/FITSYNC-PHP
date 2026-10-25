import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import os

os.makedirs('assets/diagrams', exist_ok=True)

# 1. SDLC Cycle Diagram
fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=False))
ax.set_xlim(-1.5, 1.5)
ax.set_ylim(-1.5, 1.5)
ax.axis('off')

stages = [
    "1. Requirement\nGathering",
    "2. Analysis &\nFeasibility",
    "3. System\nDesign",
    "4. Full-Stack\nCoding",
    "5. Quality &\nTesting",
    "6. Cloud\nDeployment",
    "7. Evolution &\nMaintenance"
]
colors = ['#1E3A8A', '#0284C7', '#0D9488', '#16A34A', '#EAB308', '#EA580C', '#DC2626']
n = len(stages)
angles = [i * (2 * np.pi / n) + np.pi/2 for i in range(n)]

for i, (stage, col) in enumerate(zip(stages, colors)):
    angle = angles[i]
    x = 1.05 * np.cos(angle)
    y = 1.05 * np.sin(angle)
    box = patches.FancyBboxPatch((x-0.32, y-0.18), 0.64, 0.36, boxstyle="round,pad=0.04,rounding_size=0.08",
                                 facecolor=col, edgecolor='none', alpha=0.95)
    ax.add_patch(box)
    ax.text(x, y, stage, ha='center', va='center', color='white', weight='bold', fontsize=9.5)
    
    # Arrow to next stage
    next_angle = angles[(i - 1) % n]
    x_next = 1.05 * np.cos(next_angle)
    y_next = 1.05 * np.sin(next_angle)

# Center badge
center_circle = patches.Circle((0, 0), 0.48, facecolor='#0F172A', edgecolor='#38BDF8', linewidth=3)
ax.add_patch(center_circle)
ax.text(0, 0.08, "SDLC", ha='center', va='center', color='#38BDF8', weight='bold', fontsize=18)
ax.text(0, -0.12, "Iterative Agile\nLifecycle", ha='center', va='center', color='white', weight='medium', fontsize=8.5)

plt.tight_layout()
plt.savefig('assets/diagrams/sdlc_cycle.png', dpi=200, bbox_inches='tight')
plt.close()

# 2. Use Case Diagram
fig, ax = plt.subplots(figsize=(10, 7.5))
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')

# System Boundary
sys_box = patches.FancyBboxPatch((2.6, 0.5), 4.8, 9.0, boxstyle="round,pad=0.02,rounding_size=0.1",
                                facecolor='#F8FAFC', edgecolor='#0284C7', linewidth=2)
ax.add_patch(sys_box)
ax.text(5.0, 9.15, "FitSync AI System Boundary", ha='center', va='center', color='#0369A1', weight='bold', fontsize=12)

# Use Cases (Ovals)
use_cases = [
    (5.0, 8.2, "UC1: Register & Secure JWT Login"),
    (5.0, 7.0, "UC2: Biometric & Metabolic Calculation\n(BMR, TDEE, Navy Body Fat)"),
    (5.0, 5.7, "UC3: Log Meals & Real-time Macro Scan"),
    (5.0, 4.4, "UC4: Allergen Conflict & Reaction Warning"),
    (5.0, 3.1, "UC5: Schedule Conflict-Free Telehealth"),
    (5.0, 1.8, "UC6: AI Interactive Health Assistant"),
    (5.0, 0.9, "UC7: Row Level Security Data Audit")
]

for x, y, label in use_cases:
    ellipse = patches.Ellipse((x, y), 3.8, 0.85, facecolor='#E0F2FE', edgecolor='#0284C7', linewidth=1.5)
    ax.add_patch(ellipse)
    ax.text(x, y, label, ha='center', va='center', color='#0F172A', fontsize=8.5, weight='bold')

# Actors Left (Patient / Client)
ax.scatter([1.3], [6.0], s=250, color='#0284C7')
ax.plot([1.3, 1.3], [5.2, 5.8], color='#0284C7', lw=3)
ax.plot([0.8, 1.8], [5.5, 5.5], color='#0284C7', lw=3)
ax.plot([1.3, 0.9], [5.2, 4.5], color='#0284C7', lw=3)
ax.plot([1.3, 1.7], [5.2, 4.5], color='#0284C7', lw=3)
ax.text(1.3, 4.0, "Patient / User\n(Client)", ha='center', va='center', weight='bold', fontsize=10, color='#0F172A')

# Actors Right (Doctor & Coach)
ax.scatter([8.7], [6.5], s=250, color='#16A34A')
ax.plot([8.7, 8.7], [5.7, 6.3], color='#16A34A', lw=3)
ax.plot([8.2, 9.2], [6.0, 6.0], color='#16A34A', lw=3)
ax.plot([8.7, 8.3], [5.7, 5.0], color='#16A34A', lw=3)
ax.plot([8.7, 9.1], [5.7, 5.0], color='#16A34A', lw=3)
ax.text(8.7, 4.5, "Doctor / Clinician\n& Coach", ha='center', va='center', weight='bold', fontsize=10, color='#0F172A')

# Connection Lines
for y_t in [8.2, 7.0, 5.7, 4.4, 3.1, 1.8]:
    ax.plot([1.6, 3.1], [5.5, y_t], color='#64748B', linestyle='--', lw=1.2)

for y_t in [8.2, 5.7, 4.4, 3.1, 0.9]:
    ax.plot([8.4, 6.9], [6.0, y_t], color='#64748B', linestyle='--', lw=1.2)

plt.tight_layout()
plt.savefig('assets/diagrams/use_case_diagram.png', dpi=200, bbox_inches='tight')
plt.close()

# 3. ER Diagram
fig, ax = plt.subplots(figsize=(11, 7))
ax.set_xlim(0, 11)
ax.set_ylim(0, 7)
ax.axis('off')

def draw_entity(x, y, w, h, title, attrs, color='#0284C7'):
    box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.01,rounding_size=0.06",
                                 facecolor='#F8FAFC', edgecolor=color, linewidth=2)
    ax.add_patch(box)
    header = patches.Rectangle((x, y + h - 0.5), w, 0.5, facecolor=color)
    ax.add_patch(header)
    ax.text(x + w/2, y + h - 0.25, title, ha='center', va='center', color='white', weight='bold', fontsize=9.5)
    for idx, attr in enumerate(attrs):
        ax.text(x + 0.15, y + h - 0.8 - idx*0.28, attr, ha='left', va='center', color='#1E293B', fontsize=7.5)

draw_entity(0.5, 4.2, 2.6, 2.5, "USERS (Auth)", ["PK id (UUID)", "email (VARCHAR)", "role (ENUM)", "created_at (TIMESTAMP)", "last_sign_in"])
draw_entity(4.2, 4.2, 2.7, 2.5, "PROFILES", ["PK user_id (FK->Users)", "full_name (VARCHAR)", "gender (VARCHAR)", "date_of_birth (DATE)", "height_cm (DECIMAL)", "activity_level"])
draw_entity(7.9, 4.2, 2.6, 2.5, "BIOMETRICS", ["PK id (UUID)", "FK user_id", "weight_kg (DECIMAL)", "neck_cm (DECIMAL)", "waist_cm (DECIMAL)", "bmr, tdee, body_fat"])

draw_entity(0.5, 0.6, 2.6, 2.7, "MEAL_LOGS", ["PK id (UUID)", "FK user_id", "meal_name (TEXT)", "calories (INT)", "protein_g, carbs_g", "logged_at (TIMESTAMP)"])
draw_entity(4.2, 0.6, 2.7, 2.7, "ALLERGEN_WARNINGS", ["PK id (UUID)", "FK user_id", "FK meal_id", "detected_allergen (TEXT)", "severity (HIGH/MED)", "logged_at (TIMESTAMP)"])
draw_entity(7.9, 0.6, 2.7, 2.7, "APPOINTMENTS", ["PK id (UUID)", "FK patient_id", "FK doctor_id", "scheduled_time (TIMESTAMP)", "status (CONFIRMED)", "meeting_url (TEXT)"])

# Relationship lines with cardinality
def draw_rel(x1, y1, x2, y2, label):
    ax.plot([x1, x2], [y1, y2], color='#0F172A', lw=1.5)
    mx, my = (x1 + x2)/2, (y1 + y2)/2
    ax.text(mx, my + 0.15, label, ha='center', va='bottom', fontsize=8, weight='bold', color='#0369A1',
            bbox=dict(boxstyle="round,pad=0.15", facecolor='#F0F9FF', edgecolor='#BAE6FD'))

draw_rel(3.1, 5.4, 4.2, 5.4, "1 : 1")
draw_rel(6.9, 5.4, 7.9, 5.4, "1 : N")
draw_rel(1.8, 4.2, 1.8, 3.3, "1 : N")
draw_rel(3.1, 1.9, 4.2, 1.9, "1 : N")
draw_rel(5.5, 4.2, 8.5, 3.3, "1 : N")

plt.tight_layout()
plt.savefig('assets/diagrams/er_diagram.png', dpi=200, bbox_inches='tight')
plt.close()

# 4. DFD Level 0 (Context Diagram)
fig, ax = plt.subplots(figsize=(10, 5))
ax.set_xlim(0, 10)
ax.set_ylim(0, 5)
ax.axis('off')

# Central Process
center_proc = patches.Circle((5.0, 2.5), 1.3, facecolor='#0284C7', edgecolor='#0369A1', lw=2)
ax.add_patch(center_proc)
ax.text(5.0, 2.7, "0.0\nFITSYNC AI", ha='center', va='center', color='white', weight='bold', fontsize=12)
ax.text(5.0, 2.05, "Health & Biometric\nIntelligence Engine", ha='center', va='center', color='#E0F2FE', fontsize=8)

# External Entities
# Left: User
box_u = patches.Rectangle((0.6, 1.8), 2.0, 1.4, facecolor='#F1F5F9', edgecolor='#334155', lw=2)
ax.add_patch(box_u)
ax.text(1.6, 2.5, "USER / PATIENT", ha='center', va='center', weight='bold', fontsize=9.5)

# Right: Doctor / Clinician
box_d = patches.Rectangle((7.4, 1.8), 2.0, 1.4, facecolor='#F1F5F9', edgecolor='#334155', lw=2)
ax.add_patch(box_d)
ax.text(8.4, 2.5, "CLINICIAN /\nCOACH", ha='center', va='center', weight='bold', fontsize=9.5)

# Arrows User -> System
ax.annotate('Biometrics, Meals, Vitals', xy=(3.7, 2.9), xytext=(2.6, 2.9),
            arrowprops=dict(arrowstyle="->", color='#0F172A', lw=1.5), fontsize=8, va='bottom')
ax.annotate('Analytics, Warnings, Macros', xy=(2.6, 2.1), xytext=(3.7, 2.1),
            arrowprops=dict(arrowstyle="->", color='#0F172A', lw=1.5), fontsize=8, va='top')

# Arrows Doctor -> System
ax.annotate('Consultations, Plans', xy=(6.3, 2.9), xytext=(7.4, 2.9),
            arrowprops=dict(arrowstyle="->", color='#0F172A', lw=1.5), fontsize=8, va='bottom')
ax.annotate('Patient Vitals, Audit Logs', xy=(7.4, 2.1), xytext=(6.3, 2.1),
            arrowprops=dict(arrowstyle="->", color='#0F172A', lw=1.5), fontsize=8, va='top')

plt.tight_layout()
plt.savefig('assets/diagrams/dfd_level_0.png', dpi=200, bbox_inches='tight')
plt.close()

# 5. DFD Level 1
fig, ax = plt.subplots(figsize=(11, 7.5))
ax.set_xlim(0, 11)
ax.set_ylim(0, 7.5)
ax.axis('off')

def draw_proc(x, y, num, name):
    c = patches.Circle((x, y), 0.85, facecolor='#0284C7', edgecolor='#0369A1', lw=2)
    ax.add_patch(c)
    ax.text(x, y + 0.22, num, ha='center', va='center', color='white', weight='bold', fontsize=10)
    ax.text(x, y - 0.22, name, ha='center', va='center', color='white', weight='medium', fontsize=7.5)

draw_proc(2.0, 6.0, "1.0", "Auth &\nConsent")
draw_proc(5.5, 6.0, "2.0", "Biometric\nEngine")
draw_proc(9.0, 6.0, "3.0", "Nutrition &\nAllergen Scan")
draw_proc(3.5, 2.2, "4.0", "Telehealth &\nBooking")
draw_proc(7.5, 2.2, "5.0", "AI Health\nAssistant")

# Data stores
def draw_store(x, y, w, h, name):
    ax.plot([x, x+w], [y, y], color='#0F172A', lw=1.8)
    ax.plot([x, x+w], [y-h, y-h], color='#0F172A', lw=1.8)
    ax.fill_between([x, x+w], [y, y], [y-h, y-h], color='#F8FAFC')
    ax.text(x + w/2, y - h/2, name, ha='center', va='center', fontsize=8.5, weight='bold')

draw_store(1.0, 4.3, 2.0, 0.6, "D1: Users Store")
draw_store(4.5, 4.3, 2.0, 0.6, "D2: Biometrics")
draw_store(8.0, 4.3, 2.0, 0.6, "D3: Meals & Allergens")

# Arrows between processes & stores
ax.annotate('', xy=(2.0, 4.3), xytext=(2.0, 5.15), arrowprops=dict(arrowstyle="->", color='#64748B', lw=1.5))
ax.annotate('', xy=(5.5, 4.3), xytext=(5.5, 5.15), arrowprops=dict(arrowstyle="->", color='#64748B', lw=1.5))
ax.annotate('', xy=(9.0, 4.3), xytext=(9.0, 5.15), arrowprops=dict(arrowstyle="->", color='#64748B', lw=1.5))
ax.annotate('', xy=(3.5, 3.05), xytext=(2.0, 3.7), arrowprops=dict(arrowstyle="->", color='#64748B', lw=1.5))
ax.annotate('', xy=(6.5, 2.2), xytext=(5.5, 3.7), arrowprops=dict(arrowstyle="->", color='#64748B', lw=1.5))

plt.tight_layout()
plt.savefig('assets/diagrams/dfd_level_1.png', dpi=200, bbox_inches='tight')
plt.close()

# 6. Gantt Chart (2 Semesters / 8 Months)
fig, ax = plt.subplots(figsize=(10, 5.5))
tasks = [
    "Requirements Gathering & Fact Finding",
    "Architecture & Database Schema Design",
    "Frontend UI/UX (Tailwind & Next.js)",
    "Backend & Supabase RLS Implementation",
    "Biometric & Allergen Engine Development",
    "Telehealth Video & Audio Integration",
    "System Integration & Unit/E2E Testing",
    "Documentation & University Final Viva"
]
starts = [0, 1, 2, 3, 4, 5, 6, 7]
durations = [1.5, 1.5, 2.5, 2.5, 2.0, 1.5, 1.5, 1.0]
colors = ['#1E3A8A', '#0284C7', '#0D9488', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#475569']

y_pos = np.arange(len(tasks))
for i in range(len(tasks)):
    ax.barh(y_pos[i], durations[i], left=starts[i], align='center', color=colors[i], height=0.55, edgecolor='black', alpha=0.9)

ax.set_yticks(y_pos)
ax.set_yticklabels(tasks, fontsize=9, weight='medium')
ax.invert_yaxis()
ax.set_xlabel('Project Timeline (Months across 2 Semesters: Jul 2026 – Apr 2027)', fontsize=10, weight='bold')
ax.set_xticks(range(0, 9))
ax.set_xticklabels(['Month 1\n(Jul)', 'Month 2\n(Aug)', 'Month 3\n(Sep)', 'Month 4\n(Oct)', 'Month 5\n(Nov)', 'Month 6\n(Dec)', 'Month 7\n(Jan)', 'Month 8\n(Feb)', 'Month 9\n(Mar/Apr)'], fontsize=8.5)
ax.grid(axis='x', linestyle='--', alpha=0.7)

plt.tight_layout()
plt.savefig('assets/diagrams/gantt_chart.png', dpi=200, bbox_inches='tight')
plt.close()

print('All 6 diagrams generated successfully!')
