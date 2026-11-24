import urllib.request
import re

urls = [
    'http://localhost:8085/',
    'http://localhost:8085/trainer/',
    'http://localhost:8085/gym_owner/'
]

print("=== 1. HTTP Endpoint Check ===")
for u in urls:
    try:
        res = urllib.request.urlopen(u)
        print(f"{u} => Status {res.status}")
    except Exception as e:
        print(f"FAILED {u}: {e}")

print("\n=== 2. Trainer Portal Verification ===")
with open('trainer/index.html', 'r', encoding='utf-8') as f:
    t_html = f.read()

t_checks = [
    'js/data.js',
    'activeCoachSwitcher',
    'memberCardsGrid',
    'dossierModal',
    'trainerStatAthletes',
    'portal-nav-bar',
    'btnFilterMyAthletes',
    'btnFilterAllAthletes',
    'trainerChatChannelList'
]
for chk in t_checks:
    print(f"Trainer has '{chk}': {chk in t_html}")

print("\n=== 3. Gym Owner Portal Verification ===")
with open('gym_owner/index.html', 'r', encoding='utf-8') as f:
    g_html = f.read()

g_checks = [
    'js/data.js',
    'ownerCoachesGrid',
    'ownerMembersTableBody',
    'modalAddCoach',
    'modalAddMember',
    'portal-nav-bar',
    'statTotalCoaches',
    'statTotalMembers',
    'statRevenue'
]
for chk in g_checks:
    print(f"Gym Owner has '{chk}': {chk in g_html}")

print("\n=== 4. Member Portal Verification ===")
with open('index.html', 'r', encoding='utf-8') as f:
    m_html = f.read()

m_checks = [
    'js/data.js',
    'portal-nav-bar',
    'assignedCoachSpotlightContainer',
    'availableTrainersGrid'
]
for chk in m_checks:
    print(f"Member portal has '{chk}': {chk in m_html}")
