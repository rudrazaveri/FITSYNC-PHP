import re

with open('user/portal_template.php', 'r', encoding='utf-8') as f:
    tpl = f.read()

view_ids = re.findall(r'id=["\']view-([^"\']+)["\']', tpl)
print("View IDs found in user/portal_template.php:", view_ids)
print("Total SVGs in user/portal_template.php:", len(re.findall(r'<svg', tpl)))

# Check rest timer
timer_matches = re.findall(r'restTimer|rest-timer|timer', tpl, re.I)
print("Timer matches count:", len(timer_matches))

# Check charts
canvas_matches = re.findall(r'<canvas[^>]+>', tpl, re.I)
print("Canvas charts found:", canvas_matches)

# Check workout builder
wb_matches = re.findall(r'workout-builder|workout-form|log-workout|actionLogWorkout', tpl, re.I)
print("Workout builder matches:", set(wb_matches))

# Check exercise list/library
ex_matches = re.findall(r'exercise-card|exercise-list|exercise-grid|view-exercises', tpl, re.I)
print("Exercise matches:", set(ex_matches))
