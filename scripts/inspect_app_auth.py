with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re

# Find initAuthSystem block
m = re.search(r'function initAuthSystem\(.*?(?=\nfunction |\Z)', js, re.DOTALL)
if m:
    print("=== initAuthSystem ===")
    print(m.group(0)[:1500])

# Find handleRegisterSubmit block
m_reg = re.search(r'function handleRegisterSubmit\(.*?(?=\nfunction |\Z)', js, re.DOTALL)
if m_reg:
    print("\n=== handleRegisterSubmit ===")
    print(m_reg.group(0)[:1500])

# Find login / logout functions
m_log = re.search(r'function logoutUser\(.*?(?=\nfunction |\Z)', js, re.DOTALL)
if m_log:
    print("\n=== logoutUser ===")
    print(m_log.group(0))

# Find sign in submit handler
m_sign = re.search(r'authSignInForm.*?(?=\n\s*(?:function|\/\*|\/\/ ---))', js, re.DOTALL)
if m_sign:
    print("\n=== authSignInForm handler ===")
    print(m_sign.group(0)[:1000])
