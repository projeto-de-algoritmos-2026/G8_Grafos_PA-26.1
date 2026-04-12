#include <stdio.h>
#include <stdlib.h>
#include "heap.h"

#define maior(A, B) (A.dist > B.dist)

static int N;
static int *pos; // Hash do heap
static no *pq; // Vetor do heap



void PQinit(int maxN) {
    pq = malloc(sizeof(no) * (maxN + 1));
    pos = malloc(sizeof(int) * maxN);
    for (int i = 0; i < maxN; i++) pos[i] = -1;
    N = 0;
}

static void exch(int i, int j) {
    no t = pq[i]; 
    pq[i] = pq[j]; 
    pq[j] = t;
    pos[pq[i].id] = i;
    pos[pq[j].id] = j;
}

static void fixUp(int k) {
    while (k > 1 && maior(pq[k/2], pq[k])) {
        exch(k, k/2);
        k = k/2;
    }   
}

static void fixDown(int k, int limite) {
    while (2 * k <= limite) {
        int j = 2 * k;
        if (j < limite && maior(pq[j], pq[j+1])) j++; 
        if (!maior(pq[k], pq[j])) break;
        exch(k, j);
        k = j;
    }
}

void PQinsert(no v) {
    pq[++N] = v;
    pos[v.id] = N;
    fixUp(N);
}

no PQdelMin() {
    no min = pq[1]; 
    exch(1, N);
    fixDown(1, N - 1);
    pos[min.id] = -1;
    N--;
    return min;
}

void PQdecreaseKey(int id, int nova_dist) {
    int i = pos[id];
    if (i != -1 && nova_dist < pq[i].dist) {
        pq[i].dist = nova_dist;
        fixUp(i);
    }
}

int PQempty() {
    return N == 0;
}

void PQfree() {
    free(pq);
    free(pos);
}