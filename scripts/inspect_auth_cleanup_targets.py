with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Let's inspect the tabs in auth-card
start_tabs = c.find('<div class="auth-tabs">')
end_tabs = c.find('</div>', start_tabs + 20)
print("=== auth-tabs ===")
print(c[start_tabs:end_tabs+6])

# Inspect cleanDbBanner and auth-card-footer
start_footer = c.find('<!-- Shared Clean Database Mode Active Banner -->')
if start_footer == -1:
    start_footer = c.find('id="cleanDbBanner"')
end_footer = c.find('</div>\n    </div>\n  </div>\n\n  <div class="app-layout">')
print("\n=== footer & banner ===")
print(c[start_footer:end_footer+25])
