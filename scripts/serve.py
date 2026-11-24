import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class FitSyncHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable aggressive caching for dev
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def run(port=8085, host='127.0.0.1'):
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    server_address = (host, port)
    httpd = ThreadingHTTPServer(server_address, FitSyncHandler)
    print(f"FitSync Development Server running at http://{host}:{port}/")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8085
    run(port=port)
