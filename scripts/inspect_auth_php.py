with open('login.php', 'r', encoding='utf-8') as f:
    print("=== login.php ===")
    print(f.read()[:1500])

with open('register.php', 'r', encoding='utf-8') as f:
    print("\n=== register.php ===")
    print(f.read()[:1500])
