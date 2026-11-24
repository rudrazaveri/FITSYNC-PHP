with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

start = c.find('id="authDashboardModal"')
end = c.find('<!-- END AUTHENTICATION OVERLAY -->')
if end == -1:
    end = c.find('</section>', start + 5000)

print("Auth overlay length:", end - start)
print(c[start:start+3500])
