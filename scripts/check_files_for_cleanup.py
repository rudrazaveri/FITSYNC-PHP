import re

files = ['index.html', 'fitsync/index.html', 'user/portal_template.php']
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()
    print(f"=== {fpath} ===")
    print("Has authTabBtnDemo:", 'authTabBtnDemo' in c)
    print("Has authDemoPane:", 'authDemoPane' in c)
    print("Has btn-auth-reset-db:", 'btn-auth-reset-db' in c)
    print("Has dataStorageModal:", 'dataStorageModal' in c)
    print("Has btn-settings-reset:", 'btn-settings-reset' in c)
