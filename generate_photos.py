import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

os.makedirs('fitsync/assets/images', exist_ok=True)
os.makedirs('assets/images', exist_ok=True)

# Load base photos for compositing and styling
bench_img = Image.open('assets/bench_press.jpg').convert('RGB')
meal_img = Image.open('assets/healthy_meal.jpg').convert('RGB')
raj_img = Image.open('assets/trainer_raj.jpg').convert('RGB')
doc_img = Image.open('assets/doctor_iyer.jpg').convert('RGB')
physio_img = Image.open('assets/physio_sharma.jpg').convert('RGB')

def create_card_image(base, title, subtitle, color_tint, output_path, width=600, height=400):
    # Resize and crop to aspect ratio
    im = base.copy()
    im = im.resize((width, height), Image.Resampling.LANCZOS)
    
    # Apply tint
    overlay = Image.new('RGB', (width, height), color_tint)
    im = Image.blend(im, overlay, alpha=0.35)
    
    # Add dark gradient at bottom for text contrast
    draw = ImageDraw.Draw(im, 'RGBA')
    for y in range(height // 2, height):
        alpha = int(220 * ((y - height // 2) / (height // 2)))
        draw.line([(0, y), (width, y)], fill=(15, 23, 42, alpha))
        
    # Accent top border
    draw.rectangle([0, 0, width, 8], fill=(21, 93, 252, 255))
    
    # Try loading truetype font, fallback to default
    try:
        font_lg = ImageFont.truetype("arialbd.ttf", 26)
        font_sm = ImageFont.truetype("arial.ttf", 16)
        font_tag = ImageFont.truetype("arialbd.ttf", 13)
    except:
        font_lg = ImageFont.load_default()
        font_sm = ImageFont.load_default()
        font_tag = ImageFont.load_default()
        
    # Draw badges and text
    draw.rounded_rectangle([24, height - 90, 140, height - 66], radius=4, fill=(21, 93, 252, 220))
    draw.text((32, height - 86), "FITSYNC ELITE", font=font_tag, fill=(255, 255, 255, 255))
    
    draw.text((24, height - 60), title, font=font_lg, fill=(255, 255, 255, 255))
    draw.text((24, height - 30), subtitle, font=font_sm, fill=(203, 213, 225, 255))
    
    im.save(output_path, quality=92)
    print(f"Created: {output_path}")

# 1. Gyms
create_card_image(bench_img, "FitZone Gym — Kothrud", "Olympic Lifting Platforms & Biometric Turnstiles", (21, 93, 252), "fitsync/assets/images/gym_fitzone.jpg")
create_card_image(bench_img, "PowerHouse Arena — Baner", "Iso-Lateral Hammer Strength & Boxing Ring", (14, 165, 233), "fitsync/assets/images/gym_powerhouse.jpg")
create_card_image(bench_img, "Metro Crossfit Studio", "Competition Rig, Kettlebells & Ski-Ergs", (16, 185, 129), "fitsync/assets/images/gym_crossfit.jpg")
create_card_image(bench_img, "Elite Iron Republic", "Eleiko Calibrated Plates & Cold Plunge Baths", (139, 92, 246), "fitsync/assets/images/gym_elite.jpg")

# 2. Exercises
create_card_image(bench_img, "Incline Barbell Bench Press", "Upper Pectoralis Major • 30° Incline", (21, 93, 252), "fitsync/assets/images/ex_bench.jpg")
create_card_image(bench_img, "Romanian Deadlift (RDL)", "Hamstrings & Gluteal Biomechanics", (245, 158, 11), "fitsync/assets/images/ex_deadlift.jpg")
create_card_image(bench_img, "Dumbbell Lateral Raise", "Lateral Deltoid Scaption Plane", (236, 72, 153), "fitsync/assets/images/ex_lateral_raise.jpg")
create_card_image(bench_img, "Neutral-Grip Lat Pulldown", "Latissimus Dorsi & Scapular Depression", (16, 185, 129), "fitsync/assets/images/ex_lat_pulldown.jpg")
create_card_image(bench_img, "Barbell Back Squat", "Quadriceps & Core Posterior Drive", (59, 130, 246), "fitsync/assets/images/ex_squat.jpg")
create_card_image(bench_img, "Cable Bicep Curl", "Biceps Brachii 3-Second Eccentric", (217, 70, 239), "fitsync/assets/images/ex_bicep.jpg")

# 3. Recipes
create_card_image(meal_img, "High-Protein Oats & Whey Bowl", "36g Protein • Rolled Oats & Chia Seeds", (21, 93, 252), "fitsync/assets/images/recipe_oats.jpg")
create_card_image(meal_img, "Grilled Paneer & Quinoa Bowl", "38g Protein • Mediterranean Herb Dressing", (16, 185, 129), "fitsync/assets/images/recipe_paneer.jpg")
create_card_image(meal_img, "Berry Blast Recovery Shake", "30g Protein • Antioxidant Blueberries", (236, 72, 153), "fitsync/assets/images/recipe_shake.jpg")
create_card_image(meal_img, "Moong Dal & Vegetable Medley", "26g Protein • High Fiber Indian Superfood", (245, 158, 11), "fitsync/assets/images/recipe_dal.jpg")

# 4. Profile / Personnel Avatars
def create_avatar(base, name, role, color_ring, output_path, size=240):
    im = base.copy().resize((size, size), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(im)
    draw.ellipse([2, 2, size - 2, size - 2], outline=color_ring, width=6)
    im.save(output_path, quality=94)
    print(f"Created Avatar: {output_path}")

create_avatar(physio_img, "Simran Kaur", "Functional Coach", (236, 72, 153), "fitsync/assets/images/trainer_simran.jpg")
create_avatar(raj_img, "Vikram Shinde", "Olympic Coach", (16, 185, 129), "fitsync/assets/images/trainer_vikram.jpg")
create_avatar(doc_img, "Dr. Meera Nair", "General Physician", (21, 93, 252), "fitsync/assets/images/doctor_meera.jpg")
create_avatar(physio_img, "Mr. Arjun Desai", "Physiotherapist", (14, 165, 233), "fitsync/assets/images/physio_arjun.jpg")
create_avatar(physio_img, "Isha Kulkarni", "Premium Athlete", (21, 93, 252), "fitsync/assets/images/isha_avatar.jpg")

# Mirror to assets/images
import shutil
for f in os.listdir('fitsync/assets/images'):
    shutil.copy2(os.path.join('fitsync/assets/images', f), os.path.join('assets/images', f))

print("All photos and card imagery generated successfully!")
