with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add authSignInAlert
old_signin = '<div id="authSignInPane">\n          <form id="authSignInForm"'
new_signin = '''<div id="authSignInPane">
          <div id="authSignInAlert" style="display: none; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 0.85rem;"></div>
          <form id="authSignInForm"'''

if old_signin in html:
    html = html.replace(old_signin, new_signin)
    print("Added authSignInAlert to index.html")
else:
    print("old_signin pattern not found, trying normalized")

# Add authRegisterAlert
old_reg = '<div id="authRegisterPane" style="display: none;">\n          <form id="authRegisterForm"'
new_reg = '''<div id="authRegisterPane" style="display: none;">
          <div id="authRegisterAlert" style="display: none; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 0.85rem;"></div>
          <form id="authRegisterForm"'''

if old_reg in html:
    html = html.replace(old_reg, new_reg)
    print("Added authRegisterAlert to index.html")
else:
    print("old_reg pattern not found, trying normalized")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated index.html successfully!")
