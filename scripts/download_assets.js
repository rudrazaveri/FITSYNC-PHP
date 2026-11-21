const fs = require('fs');
const path = require('path');
const https = require('https');

const ASSETS_DIR = path.resolve(__dirname, '..', 'assets', 'images');
const FITSYNC_ASSETS_DIR = path.resolve(__dirname, '..', 'fitsync', 'assets', 'images');

if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(FITSYNC_ASSETS_DIR)) fs.mkdirSync(FITSYNC_ASSETS_DIR, { recursive: true });

const imageManifest = [
  // --- CHEST EXERCISES ---
  { filename: 'ex_flat_bench.jpg', unsplashId: 'photo-1517838277536-f5f99be501cd' },
  { filename: 'ex_incline_bench.jpg', unsplashId: 'photo-1581009146145-b5ef050c2e1e' },
  { filename: 'ex_incline_fly.jpg', unsplashId: 'photo-1534438327276-14e5300c3a48' },
  { filename: 'ex_parallel_dips.jpg', unsplashId: 'photo-1598971639058-fab3c3109a00' },
  { filename: 'ex_cable_crossover.jpg', unsplashId: 'photo-1541534741688-6078c6bfb5c5' },
  { filename: 'ex_pushups.jpg', unsplashId: 'photo-1571019614242-c5c5dee9f50b' },
  { filename: 'ex_close_grip_bench.jpg', unsplashId: 'photo-1517838277536-f5f99be501cd' },

  // --- BACK EXERCISES ---
  { filename: 'ex_lat_pulldown.jpg', unsplashId: 'photo-1584863265045-f9d10ca7fa61' },
  { filename: 'ex_pullups.jpg', unsplashId: 'photo-1526506118085-60ce8714f8c5' },
  { filename: 'ex_barbell_row.jpg', unsplashId: 'photo-1605296867304-46d5465a13f1' },
  { filename: 'ex_seated_row.jpg', unsplashId: 'photo-1534367507873-d2d7e24c797f' },
  { filename: 'ex_dumbbell_row.jpg', unsplashId: 'photo-1583454110551-21f2fa2afe61' },

  // --- TRAPEZIUS & UPPER BACK ---
  { filename: 'ex_shrugs.jpg', unsplashId: 'photo-1532029837206-abbe2b7620e3' },
  { filename: 'ex_face_pull.jpg', unsplashId: 'photo-1574680096145-d05b474e2155' },
  { filename: 'ex_prone_y_raise.jpg', unsplashId: 'photo-1517963879433-6ad2b056d712' },

  // --- LOWER BACK ---
  { filename: 'ex_deadlift.jpg', unsplashId: 'photo-1517838277536-f5f99be501cd' },
  { filename: 'ex_hyperextensions.jpg', unsplashId: 'photo-1599058917212-d750089bc07e' },
  { filename: 'ex_good_mornings.jpg', unsplashId: 'photo-1517838277536-f5f99be501cd' },

  // --- SHOULDERS ---
  { filename: 'ex_overhead_press.jpg', unsplashId: 'photo-1541534741688-6078c6bfb5c5' },
  { filename: 'ex_dumbbell_press.jpg', unsplashId: 'photo-1581009146145-b5ef050c2e1e' },
  { filename: 'ex_lateral_raise.jpg', unsplashId: 'photo-1581009146145-b5ef050c2e1e' },
  { filename: 'ex_cable_lateral.jpg', unsplashId: 'photo-1534438327276-14e5300c3a48' },
  { filename: 'ex_rear_pecdeck.jpg', unsplashId: 'photo-1574680096145-d05b474e2155' },

  // --- BICEPS ---
  { filename: 'ex_barbell_curl.jpg', unsplashId: 'photo-1583454110551-21f2fa2afe61' },
  { filename: 'ex_incline_curl.jpg', unsplashId: 'photo-1534438327276-14e5300c3a48' },
  { filename: 'ex_hammer_curl.jpg', unsplashId: 'photo-1581009146145-b5ef050c2e1e' },
  { filename: 'ex_preacher_curl.jpg', unsplashId: 'photo-1583454110551-21f2fa2afe61' },
  { filename: 'ex_bicep.jpg', unsplashId: 'photo-1583454110551-21f2fa2afe61' },

  // --- TRICEPS ---
  { filename: 'ex_tricep_pushdown.jpg', unsplashId: 'photo-1541534741688-6078c6bfb5c5' },
  { filename: 'ex_skullcrushers.jpg', unsplashId: 'photo-1517838277536-f5f99be501cd' },
  { filename: 'ex_overhead_tricep.jpg', unsplashId: 'photo-1581009146145-b5ef050c2e1e' },

  // --- FOREARMS & GRIP ---
  { filename: 'ex_reverse_curl.jpg', unsplashId: 'photo-1583454110551-21f2fa2afe61' },
  { filename: 'ex_farmers_walk.jpg', unsplashId: 'photo-1532029837206-abbe2b7620e3' },

  // --- QUADRICEPS ---
  { filename: 'ex_back_squat.jpg', unsplashId: 'photo-1574680096145-d05b474e2155' },
  { filename: 'ex_leg_extension.jpg', unsplashId: 'photo-1534438327276-14e5300c3a48' },
  { filename: 'ex_bulgarian_split.jpg', unsplashId: 'photo-1571019613454-1cb2f99b2d8b' },
  { filename: 'ex_hack_squat.jpg', unsplashId: 'photo-1534438327276-14e5300c3a48' },

  // --- HAMSTRINGS ---
  { filename: 'ex_romanian_deadlift.jpg', unsplashId: 'photo-1517838277536-f5f99be501cd' },
  { filename: 'ex_lying_leg_curl.jpg', unsplashId: 'photo-1584863265045-f9d10ca7fa61' },
  { filename: 'ex_seated_leg_curl.jpg', unsplashId: 'photo-1534438327276-14e5300c3a48' },

  // --- GLUTES ---
  { filename: 'ex_hip_thrust.jpg', unsplashId: 'photo-1574680096145-d05b474e2155' },
  { filename: 'ex_glute_kickback.jpg', unsplashId: 'photo-1518611012118-696072aa579a' },
  { filename: 'ex_hip_abduction.jpg', unsplashId: 'photo-1534438327276-14e5300c3a48' },

  // --- CALVES ---
  { filename: 'ex_standing_calf_raise.jpg', unsplashId: 'photo-1574680096145-d05b474e2155' },
  { filename: 'ex_seated_calf_raise.jpg', unsplashId: 'photo-1534438327276-14e5300c3a48' },

  // --- ABS & CORE ---
  { filename: 'ex_hanging_leg_raise.jpg', unsplashId: 'photo-1526506118085-60ce8714f8c5' },
  { filename: 'ex_cable_crunch.jpg', unsplashId: 'photo-1541534741688-6078c6bfb5c5' },
  { filename: 'ex_russian_twist.jpg', unsplashId: 'photo-1518611012118-696072aa579a' },
  { filename: 'ex_ab_wheel.jpg', unsplashId: 'photo-1571019614242-c5c5dee9f50b' },
  { filename: 'ex_forearm_plank.jpg', unsplashId: 'photo-1566241142559-40e1dab266c6' },

  // --- MOBILITY & RECOVERY ---
  { filename: 'ex_greatest_stretch.jpg', unsplashId: 'photo-1518611012118-696072aa579a' },
  { filename: 'ex_hip_mobility.jpg', unsplashId: 'photo-1506126613408-eca07ce68773' },
  { filename: 'ex_goblet_squat.jpg', unsplashId: 'photo-1574680096145-d05b474e2155' },
  { filename: 'ex_foam_rolling.jpg', unsplashId: 'photo-1544367567-0f2fcb009e0b' },
  { filename: 'ex_recovery_walk.jpg', unsplashId: 'photo-1476480862126-209bfaa8edc8' },

  // --- HEALTHY RECIPES & MEALS ---
  { filename: 'recipe_oats.jpg', unsplashId: 'photo-1517673132405-a56a62b18caf' },
  { filename: 'recipe_paneer.jpg', unsplashId: 'photo-1546069901-ba9599a7e63c' },
  { filename: 'recipe_shake.jpg', unsplashId: 'photo-1553530666-ba11a7da3888' },
  { filename: 'recipe_dal.jpg', unsplashId: 'photo-1546833999-b9f581a1996d' },
  { filename: 'recipe_chicken_rice.jpg', unsplashId: 'photo-1532550907401-a500c9a57435' },
  { filename: 'recipe_salmon.jpg', unsplashId: 'photo-1467003909585-2f8a72700288' },
  { filename: 'recipe_yogurt_parfait.jpg', unsplashId: 'photo-1488477181946-6428a0291777' },
  { filename: 'recipe_egg_avocado.jpg', unsplashId: 'photo-1525351484163-7529414344d8' },
  { filename: 'recipe_tofu_bowl.jpg', unsplashId: 'photo-1512621776951-a57141f2eefd' },
  { filename: 'recipe_protein_pancakes.jpg', unsplashId: 'photo-1528207776546-365bb710ee93' }
];

function downloadImage(item) {
  return new Promise((resolve) => {
    const destPath = path.join(ASSETS_DIR, item.filename);
    const fitsyncDestPath = path.join(FITSYNC_ASSETS_DIR, item.filename);

    const url = `https://images.unsplash.com/${item.unsplashId}?w=500&auto=format&fit=crop&q=80`;

    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          const fileStream = fs.createWriteStream(destPath);
          redirectRes.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            try {
              fs.copyFileSync(destPath, fitsyncDestPath);
            } catch (err) {}
            console.log(`[OK] ${item.filename} downloaded (${fs.statSync(destPath).size} bytes)`);
            resolve(true);
          });
        }).on('error', (err) => {
          console.error(`[ERR] ${item.filename}:`, err.message);
          resolve(false);
        });
      } else if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          try {
            fs.copyFileSync(destPath, fitsyncDestPath);
          } catch (err) {}
          console.log(`[OK] ${item.filename} downloaded (${fs.statSync(destPath).size} bytes)`);
          resolve(true);
        });
      } else {
        console.warn(`[WARN] ${item.filename} returned status ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error(`[ERR] ${item.filename}:`, err.message);
      resolve(false);
    });
  });
}

async function run() {
  console.log(`Starting download of ${imageManifest.length} distinct assets...`);
  for (let i = 0; i < imageManifest.length; i += 5) {
    const batch = imageManifest.slice(i, i + 5);
    await Promise.all(batch.map(downloadImage));
  }
  console.log('All downloads completed!');
}

run();
