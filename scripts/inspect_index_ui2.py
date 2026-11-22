import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Navigation links in sidebar
nav_match = re.search(r'(<ul[^>]*class="[^"]*sidebar-nav[^"]*"[^>]*>.*?</ul>)', html, re.DOTALL)
if not nav_match:
    nav_match = re.search(r'(<nav[^>]*class="[^"]*sidebar-nav[^"]*"[^>]*>.*?</nav>)', html, re.DOTALL)
if not nav_match:
    nav_match = re.search(r'(<div[^>]*class="[^"]*sidebar-nav[^"]*"[^>]*>.*?</div>)', html, re.DOTALL)
if not nav_match:
    # search for nav-item
    nav_match = re.search(r'(<nav.*?</aside>)', html, re.DOTALL)

print("--- SIDEBAR NAV LINKS ---")
if nav_match:
    print(nav_match.group(0)[:2000])

# Top search / actions header inside main
main_match = re.search(r'(<main[^>]*>.*?</header>)', html, re.DOTALL)
print("\n--- MAIN TOP BAR / HEADER ---")
if main_match:
    print(main_match.group(0)[:1500])
else:
    # find header or search bar in main
    sb_search = re.search(r'(<div[^>]*class="[^"]*(?:topbar|main-header|header-search|search-bar)[^"]*"[^>]*>.*?</div>)', html, re.DOTALL)
    if sb_search:
        print(sb_search.group(0)[:1000])

# Card structures in dashboard
card_matches = re.findall(r'(<div[^>]*class="[^"]*(?:card|stat-card|metric-card)[^"]*"[^>]*>.*?</div>)', html, re.DOTALL)
print(f"\n--- CARDS FOUND ({len(card_matches)}) ---")
for c in card_matches[:3]:
    print(c[:400] + "...\n")
