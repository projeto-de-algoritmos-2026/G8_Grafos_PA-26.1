#include <stdio.h>
#include <stdlib.h>
#include <string.h> // NOVO: Permite comparar textos
#include "heap.h" 

#define INF 999
#define V 13 

typedef struct {
    char *nome;
    int x;
    int y;
} Local;

Local locais[V] = {
    {"canada", 520, 420}, {"estados_unidos", 470, 660}, {"mexico", 500, 835},
    {"brasil", 740, 1185}, {"argentina", 780, 1475}, {"inglaterra", 1215, 640},
    {"espanha", 1175, 790}, {"nigeria", 1300, 1035}, {"africa_do_sul", 1440, 1490},
    {"india", 1685, 985}, {"china", 1980, 850}, {"japao", 2215, 860},
    {"australia", 2095, 1455}
};

// NOVO: Função para descobrir o número (ID) de um país pelo nome
int obter_id_por_nome(char *nome) {
    for (int i = 0; i < V; i++) {
        if (strcmp(locais[i].nome, nome) == 0) return i;
    }
    return -1;
}

void calcular_dijkstra(int grafo[V][V], int origem, int dist[], int pai[]) {
    for (int i = 0; i < V; i++) {
        dist[i] = INF;
        pai[i] = -1;
    }
    PQinit(V); 
    dist[origem] = 0;
    PQinsert((no){origem, dist[origem]});

    while (!PQempty()) {
        no u = PQdelMin();
        for (int v = 0; v < V; v++) {
            int peso = grafo[u.id][v];
            if (peso != INF && peso > 0) { 
                if (dist[u.id] + peso < dist[v]) {
                    int antiga_dist = dist[v];
                    dist[v] = dist[u.id] + peso;
                    pai[v] = u.id;
                    if (antiga_dist == INF) PQinsert((no){v, dist[v]});
                    else PQdecreaseKey(v, dist[v]);
                }
            }
        }
    }
    PQfree();
}

void gerar_json(int grafo[V][V], int dist[], int pai[]) {
    FILE *f = fopen("state.json", "w"); 
    fprintf(f, "{\n  \"routers\": [\n");
    for (int i = 0; i < V; i++) {
        fprintf(f, "    {\"id\": \"%s\", \"label\": \"%s\", \"active\": %s, \"x\": %d, \"y\": %d}%s\n", 
                locais[i].nome, locais[i].nome, (dist[i] < INF ? "true" : "false"), 
                locais[i].x, locais[i].y, (i == V - 1) ? "" : ",");
    }
    fprintf(f, "  ],\n  \"links\": [\n");
    int first = 1;
    for (int i = 0; i < V; i++) {
        for (int j = i + 1; j < V; j++) {
            if (grafo[i][j] != INF) {
                if (!first) fprintf(f, ",\n");
                fprintf(f, "    {\"from\": \"%s\", \"to\": \"%s\", \"cost\": %d, \"available\": true}", 
                        locais[i].nome, locais[j].nome, grafo[i][j]);
                first = 0;
            }
        }
    }
    fprintf(f, "\n  ]\n}");
    fclose(f);
}

// NOVA FUNÇÃO: Gera a rota calculada para o JavaScript desenhar a linha verde
void gerar_rota_json(int origem, int destino, int dist[], int pai[]) {
    FILE *f = fopen("route.json", "w");
    if (dist[destino] == INF) {
        // Se não tiver caminho (ex: cabo quebrado)
        fprintf(f, "{\n  \"reachable\": false,\n  \"cost\": 0,\n  \"message\": \"Destino inatingivel!\",\n  \"path\": [],\n  \"distances\": []\n}");
    } else {
        // Reconstrói o caminho voltando pelos pais
        int caminho[V];
        int count = 0;
        int atual = destino;
        while (atual != -1) {
            caminho[count++] = atual;
            atual = pai[atual];
        }

        fprintf(f, "{\n  \"reachable\": true,\n  \"cost\": %d,\n  \"message\": \"Rota calculada com sucesso via OSPF!\",\n  \"path\": [\n", dist[destino]);
        
        // Imprime os nomes de trás pra frente (origem -> destino)
        for (int i = count - 1; i >= 0; i--) {
            fprintf(f, "    \"%s\"%s\n", locais[caminho[i]].nome, (i == 0) ? "" : ",");
        }

        // Envia as distâncias para aparecerem nas plaquinhas dos nós
        fprintf(f, "  ],\n  \"distances\": [\n");
        for (int i = 0; i < V; i++) {
            fprintf(f, "    {\"id\": \"%s\", \"cost\": %d, \"reachable\": %s}%s\n",
                    locais[i].nome, dist[i], (dist[i] < INF ? "true" : "false"), (i == V - 1) ? "" : ",");
        }
        fprintf(f, "  ]\n}");
    }
    fclose(f);
}

int main(int argc, char *argv[]) {
    int distancias[V], pais[V];
    int rede[V][V];

    for(int i=0; i<V; i++) for(int j=0; j<V; j++) rede[i][j] = (i==j) ? 0 : INF;

    // Conexões da sua topologia...
    rede[0][1] = 2; rede[1][0] = 2;   
    rede[1][2] = 3; rede[2][1] = 3;   
    rede[2][3] = 8; rede[3][2] = 8;   
    rede[3][4] = 4; rede[4][3] = 4;   
    rede[1][5] = 15; rede[5][1] = 15; 
    rede[3][6] = 14; rede[6][3] = 14; 
    rede[3][7] = 12; rede[7][3] = 12; 
    rede[5][6] = 3; rede[6][5] = 3;   
    rede[6][7] = 7; rede[7][6] = 7;   
    rede[7][8] = 10; rede[8][7] = 10; 
    rede[5][9] = 20; rede[9][5] = 20;  
    rede[8][9] = 18; rede[9][8] = 18;  
    rede[9][10] = 6; rede[10][9] = 6;  
    rede[10][11] = 4; rede[11][10] = 4; 
    rede[10][12] = 12; rede[12][10] = 12; 
    rede[1][11] = 18; rede[11][1] = 18; 

    
    if (argc == 3) {
        int origem = obter_id_por_nome(argv[1]);
        int destino = obter_id_por_nome(argv[2]);

        if (origem != -1 && destino != -1) {
            calcular_dijkstra(rede, origem, distancias, pais);
            gerar_rota_json(origem, destino, distancias, pais);
        }
        return 0; 
    }

    // Se ligou agora (sem argumentos), mostra o estado inicial
    calcular_dijkstra(rede, 3, distancias, pais);
    gerar_json(rede, distancias, pais);

    return 0;
}