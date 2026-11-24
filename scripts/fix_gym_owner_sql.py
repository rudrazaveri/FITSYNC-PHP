with open('includes/gym_owner_data.php', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('g.address,', 'g.address_line1 AS address,')
c = c.replace('g.max_capacity, g.monthly_fee', '150 AS max_capacity, 3500.00 AS monthly_fee')
c = c.replace('up.current_weight_kg AS weight, up.fitness_goal AS goal,', 'up.weight_kg AS weight, up.fitness_experience AS goal,')

with open('includes/gym_owner_data.php', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated includes/gym_owner_data.php")

with open('api/gym_owner/add_member.php', 'r', encoding='utf-8') as f:
    m = f.read()

m = m.replace('INSERT INTO user_profiles (user_id, gender, current_weight_kg, fitness_goal, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
              'INSERT INTO user_profiles (user_id, gender, weight_kg, fitness_experience, updated_at) VALUES (?, ?, ?, \'intermediate\', NOW())')

with open('api/gym_owner/add_member.php', 'w', encoding='utf-8') as f:
    f.write(m)

print("Updated api/gym_owner/add_member.php")
