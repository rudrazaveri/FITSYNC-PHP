import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

m_in = re.search(r'<form[^>]*id=["\']authSignInForm["\'][^>]*>.*?</form>', html, re.DOTALL)
if m_in:
    print("=== authSignInForm in index.html ===")
    print(m_in.group(0))

m_reg = re.search(r'<form[^>]*id=["\']authRegisterForm["\'][^>]*>.*?</form>', html, re.DOTALL)
if m_reg:
    print("\n=== authRegisterForm in index.html ===")
    print(m_reg.group(0)[:1500])
