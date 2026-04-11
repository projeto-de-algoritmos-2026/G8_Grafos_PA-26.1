#include <stdio.h>
#include <stdlib.h>

#define INF 999
#define V 4 // Roteadores A, B, C, D

void gerar_json(int dist[], int pai[]) {
    FILE *f = fopen("data.json", "w");
    if (f == NULL) return;

    fprintf(f, "{\n  \"nos\": [\n");
    for (int i = 0; i < V; i++) {
        fprintf(f, "    {\"id\": %d, \"dist\": %d, \"pai\": %d}%s\n", 
                i, dist[i], pai[i], (i == V-1) ? "" : ",");
    }
    fprintf(f, "  ]\n}");
    fclose(f);
    printf("Arquivo data.json gerado com sucesso!\n");
}

int main() {
    // Simulação rápida: Supondo que o Dijkstra rodou
    // Distâncias de A(0) para: A=0, B=10, C=2, D=5
    int distancias[] = {0, 10, 2, 100};
    // Pais (quem conectou quem): A=-1, B=A, C=A, D=C
    int pais[] = {-1, 0, 1, 2};

    gerar_json(distancias, pais);

    return 0;
}