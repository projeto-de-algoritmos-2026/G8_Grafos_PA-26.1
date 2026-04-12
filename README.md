# Algoritmo de Dijkstra no mapa global de roteadores

Numero da Lista: 8  
Conteudo da Disciplina: Grafos

## Alunos
| Matricula | Aluno |
| -- | -- |
| 221022490 | Caua Araujo dos Santos |
| 222014859 | Ian Costa Guimaraes |

## Sobre
Este projeto demonstra o algoritmo de Dijkstra com heap minima aplicado a uma rede global de roteadores.

O frontend roda no navegador sobre um mapa SVG do mundo. Cada roteador pode ser ligado ou desligado e o usuario escolhe um destino digitando o `id` do pais em minusculo, por exemplo `brasil`, `india` ou `inglaterra`.

O backend foi implementado em C e exposto como um servidor HTTP local. Ele mantem o estado dos roteadores, executa o Dijkstra com heap e devolve:

- estado atual dos roteadores e enlaces;
- tabela de custos a partir do roteador de origem;
- caminho minimo entre origem e destino.

## Estrutura principal
- `index.html`: interface principal para abrir com Live Server.
- `styles.css`: estilo da visualizacao do mapa, enlaces e painel lateral.
- `app.js`: integracao do navegador com o backend em C.
- `algoritmos/heap.c` e `algoritmos/heap.h`: implementacao da heap minima.
- `algoritmos/dijkstra.c` e `algoritmos/dijkstra.h`: topologia da rede e algoritmo de Dijkstra.
- `server/server.c`: servidor HTTP local consumido pelo frontend.
- `server/build_backend.ps1`: script de compilacao do backend.

## Instalacao
### Pre-requisitos
- Windows com `gcc` disponivel no terminal.
- Extensao Live Server no VS Code, ou outro servidor estatico equivalente.

### Compilar o backend
No PowerShell, dentro da pasta do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File .\server\build_backend.ps1
```

Isso gera o executavel em `build/router_server.exe`.

### Iniciar o backend
```powershell
.\build\router_server.exe
```

O servidor fica disponivel em `http://127.0.0.1:8080`.

### Abrir o frontend
Abra `index.html` com o Live Server. O frontend faz requisicoes para o backend em C na porta `8080`.

## Uso
1. Inicie o backend em C.
2. Abra `index.html` com o Live Server.
3. Clique em um roteador no mapa para defini-lo como origem.
4. Digite o `id` do destino no campo lateral e clique em `Calcular`.
5. Ligue ou desligue roteadores no mapa para forcar o recalculo do menor caminho.

### Exemplo
- Origem: `inglaterra`
- Destino: `brasil`

Com todos os roteadores ativos, a rota minima inicial passa por `nigeria`. Se `nigeria` for desligada, o sistema recalcula e pode escolher outro caminho, como via `estados_unidos`.

## Endpoints do backend
- `GET /state`: retorna roteadores e enlaces.
- `POST /router/power?id=<roteador>&active=0|1`: altera o estado de energia de um roteador.
- `GET /route?source=<origem>&target=<destino>`: retorna a menor rota e a tabela de custos.

## Observacoes
O projeto foi estruturado para funcionar bem no fluxo pedido: frontend com Live Server e algoritmo executando em C. Como o ambiente atual nao possui Emscripten, a comunicacao C -> HTML foi feita por HTTP local, que preserva o algoritmo em C e mantem a demonstracao interativa em tempo real.
