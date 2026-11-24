with open('gym_owner/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

body_start = c.find('<body')
print(c[body_start:body_start+800])
