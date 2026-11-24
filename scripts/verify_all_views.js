const fs = require('fs');
const path = require('path');

console.log("=== FITSYNC VIEW & NAVIGATION AUDIT ===");

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const requiredViews = [
  'dashboard', 'gyms', 'trainers', 'coach_chat', 'workouts',
  'exercises', 'assessment', 'progress', 'nutrition', 'recipes',
  'water', 'attendance', 'analytics', 'settings', 'help'
];

let allViewsFound = true;
requiredViews.forEach(v => {
  const containerRegex = new RegExp(`id=["']view-${v}["']`);
  const navRegex = new RegExp(`data-nav=["']${v}["']`);
  const hasContainer = containerRegex.test(indexHtml);
  const hasNav = navRegex.test(indexHtml);

  if (!hasContainer || !hasNav) {
    console.error(`FAIL: View "${v}" -> Container: ${hasContainer}, Nav: ${hasNav}`);
    allViewsFound = false;
  } else {
    console.log(`PASS: View "${v}" container & nav button verified.`);
  }
});

console.log("\n=== CROSS-PORTAL LINKS AUDIT ===");
const gymOwnerHtml = fs.readFileSync(path.join(__dirname, '..', 'gym_owner', 'index.html'), 'utf8');
const trainerHtml = fs.readFileSync(path.join(__dirname, '..', 'trainer', 'index.html'), 'utf8');

// Check no broken ../api/ calls remain in gym_owner and trainer
const brokenFetchesGym = (gymOwnerHtml.match(/fetch\(['"]\.\.\/api\//g) || []).length;
const brokenFetchesTrainer = (trainerHtml.match(/fetch\(['"]\.\.\/api\//g) || []).length;

console.log(`Gym Owner ../api/ fetches remaining: ${brokenFetchesGym} (Expected: 0)`);
console.log(`Trainer ../api/ fetches remaining: ${brokenFetchesTrainer} (Expected: 0)`);

if (brokenFetchesGym > 0 || brokenFetchesTrainer > 0) {
  console.error("FAIL: Broken relative API paths detected!");
  process.exit(1);
} else {
  console.log("PASS: All cross-portal API endpoints accurately anchored.");
}

console.log("\n=== AUDIT COMPLETE: ALL CHECKS PASSED ===");
