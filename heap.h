#ifndef HEAP_H
#define HEAP_H

typedef struct {
    int id;
    int dist;
} no;

//funções que o dijkstra vai
void PQinit(int maxN);
void PQinsert(no v);
no PQdelMin();
void PQdecreaseKey(int id, int nova_dist);
int PQempty(); // Útil para o loop do Dijkstra
void PQfree();  // Para limpar a memória no final

#endif