
import sys
import os

blissdatafile = 'blissdata.js'
blisseditor = 'blisseditor.html'

HOST = 'localhost'
PORT = 8000

from BaseHTTPServer import HTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler

class StoreHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        length = self.headers['content-length']
        data = self.rfile.read(int(length))
        if self.path == '/' + blissdatafile:
            filepath = os.path.join(os.curdir, self.path[1:])
            print >>sys.stderr, "Writing %s chars to %s" % (length, filepath)
            with open(filepath, 'w') as fh:
                fh.write(data.decode())
            self.send_response(200)
        else:
            print >>sys.stderr, 'Path not allowed: %s' % (self.path,)
            self.send_response(403)

if __name__ == '__main__':
    print >>sys.stderr, "Open the following URL in Firefox:"
    print >>sys.stderr, "http://%s:%s/%s" % (HOST, PORT, blisseditor)
    if HOST == 'localhost': HOST = ''
    server = HTTPServer((HOST, PORT), StoreHandler)
    server.serve_forever()

