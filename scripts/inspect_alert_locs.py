with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'<div id="authSignInPane">.*?<form id="authSignInForm"', text, re.DOTALL)
if m:
    print("Match around authSignInPane:")
    print(m.group(0))

m2 = re.search(r'<div id="authRegisterPane"[^>]*>.*?<form id="authRegisterForm"', text, re.DOTALL)
if m2:
    print("\nMatch around authRegisterPane:")
    print(m2.group(0))
