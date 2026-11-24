with open('js/data.js', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update load() in FitSyncStore
old_load_block = """        if (!parsed.registeredUsers || parsed.registeredUsers.length === 0) {
          parsed.registeredUsers = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.registeredUsers));
        }"""

new_load_block = """        if (!parsed.registeredUsers || parsed.registeredUsers.length === 0) {
          parsed.registeredUsers = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.registeredUsers));
        } else {
          parsed.registeredUsers.forEach(u => {
            if (u.role !== 'Gym Trainer') {
              if (!u.assignedCoachId) u.assignedCoachId = 'tr-1';
              if (!u.assignedCoachName) u.assignedCoachName = 'Coach Raj Malhotra';
              if (!u.membershipTier) u.membershipTier = 'Gold';
              if (!u.bodyFat) u.bodyFat = '20.5%';
              if (!u.adherence) u.adherence = '92%';
              if (!u.recentLifts) u.recentLifts = { bench: '65 kg', squat: '95 kg', deadlift: '120 kg' };
              if (!u.notes) u.notes = 'Consistent attendance and clean movement form.';
            }
          });
        }
        if (!parsed.trainers || parsed.trainers.length === 0) {
          parsed.trainers = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.trainers));
        }"""

if old_load_block in c:
    c = c.replace(old_load_block, new_load_block)
    print("Updated load() successfully")
else:
    print("WARNING: old_load_block not matched")

# 2. Update save() to dispatch event
old_save_block = """  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }"""

new_save_block = """  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      try {
        window.dispatchEvent(new CustomEvent('fitsync_data_changed', { detail: this.state }));
      } catch (evErr) {}
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }"""

if old_save_block in c:
    c = c.replace(old_save_block, new_save_block)
    print("Updated save() successfully")
else:
    print("WARNING: old_save_block not matched")

# 3. Add getTrainerById and getMemberByEmail
old_get_trainers = """  getTrainers() {
    if (!this.state.trainers || this.state.trainers.length === 0) {
      this.state.trainers = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.trainers));
    }
    return this.state.trainers;
  }"""

new_get_trainers = """  getTrainers() {
    if (!this.state.trainers || this.state.trainers.length === 0) {
      this.state.trainers = JSON.parse(JSON.stringify(DEFAULT_FITSYNC_DATA.trainers));
    }
    return this.state.trainers;
  }

  getTrainerById(id) {
    if (!id) return null;
    return (this.getTrainers() || []).find(t => t.id === id) || null;
  }

  getMemberByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return (this.getMembers() || []).find(m => m.email.toLowerCase() === cleanEmail) || null;
  }"""

if old_get_trainers in c:
    c = c.replace(old_get_trainers, new_get_trainers)
    print("Added getTrainerById and getMemberByEmail successfully")
else:
    print("WARNING: old_get_trainers not matched")

with open('js/data.js', 'w', encoding='utf-8') as f:
    f.write(c)
print("js/data.js write complete")
