import os
import glob

trainer_files = glob.glob('trainer/*.php') + glob.glob('trainer/includes/*.php')
print(f"Trainer files count: {len(trainer_files)}")
for tf in sorted(trainer_files):
    print(f" - {tf} ({os.path.getsize(tf):,} bytes)")
