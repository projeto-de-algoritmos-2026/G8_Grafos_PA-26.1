import http.server
import subprocess
import urllib.parse

class OSPFHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)

        # 1. Carregamento inicial do mapa
        if parsed_path.path == '/state':
            subprocess.run(["./roteador_ospf"])
            self.path = '/state.json'

        # 2. Roda quando clicar em "Calcular"
        elif parsed_path.path == '/route':
            query = urllib.parse.parse_qs(parsed_path.query)
            source = query.get('source', [''])[0]
            target = query.get('target', [''])[0]

            # Executa o C "injetando" os países escolhidos
            subprocess.run(["roteador_ospf.exe", source, target])
            self.path = '/route.json'

        return super().do_GET()

server_address = ('127.0.0.1', 8080)
httpd = http.server.HTTPServer(server_address, OSPFHandler)
print("Servidor OSPF operando na porta 8080")
httpd.serve_forever()