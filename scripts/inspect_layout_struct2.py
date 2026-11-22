with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx_auth_end = html.find('<!-- Main Application Wrapper')
if idx_auth_end == -1:
    idx_auth_end = html.find('sidebarNav')
print("--- MAIN APPLICATION WRAPPER AROUND SIDEBAR ---")
print(html[idx_auth_end-200:idx_auth_end+1800])
