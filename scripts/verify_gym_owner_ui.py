with open('gym_owner/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

ids = ['ownerCoachesGrid', 'ownerMembersTableBody', 'modalAddCoach', 'modalAddMember', 'memberCoachSelect', 'statTotalAthletes', 'statTotalCoaches', 'statCapacity', 'statMonthlyRevenue']
for el in ids:
    found = f'id="{el}"' in c or f"id='{el}'" in c
    print(f'Element #{el} present: {found}')
