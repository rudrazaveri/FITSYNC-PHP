with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re

m_sign = re.search(r'<div id=["\']authSignInPane["\'].*?(?=<div id=["\']authRegisterPane["\'])', html, re.DOTALL)
if m_sign:
    print("=== authSignInPane ===")
    print(m_sign.group(0)[:800])

m_reg = re.search(r'<div id=["\']authRegisterPane["\'].*?(?=<div id=["\']authDemoPane["\'])', html, re.DOTALL)
if m_reg:
    print("\n=== authRegisterPane ===")
    print(m_reg.group(0)[:800])
