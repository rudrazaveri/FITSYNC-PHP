with open('js/data.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = """  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save to LocalStorage:', e);
    }
  }"""

replacement = """  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      try {
        window.dispatchEvent(new CustomEvent('fitsync_data_changed', { detail: this.state }));
      } catch (evErr) {}
    } catch (e) {
      console.warn('Could not save to LocalStorage:', e);
    }
  }"""

if target in c:
    c = c.replace(target, replacement)
    with open('js/data.js', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated save() with fitsync_data_changed event!")
else:
    print("Target not found!")
