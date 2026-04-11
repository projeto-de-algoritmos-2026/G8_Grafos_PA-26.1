#include <stdio.h>
#include <stdlib.h>

#define maior(A, B) (A.dist > B.dist)
typedef struct Item{
    int id;
    int dist;
}Item;

static int N;
static int *pos; //hash do heap
static Item *pq; // heap

void PQinit(int maxN){
  pq = malloc(sizeof(Item)*(maxN +1));
  pos = malloc(sizeof(int) *(maxN));
  for (int i = 0; i < maxN; i++) pos[i] = -1; // deixar a hash vazia.
  N = 0;
}

void exch(int i, int j) {
    Item t = pq[i]; 
    pq[i] = pq[j]; 
    pq[j] = t;

    pos[pq[i].id] = i;
    pos[pq[j].id] = j;
}

void fixUp(int k){
  while(k>1 && maior(pq[k/2],pq[k])){ //verifica se o pai é menor que o filho;
      exch(k,k/2); // troca o elemento filho de lugar com o pai se ele for maior
      k = k/2; //atualiza o indice do k para o indice se tornar o elemento pai
    }   
    //complexidade é log2k+1;
}
void PQinsert(Item v){
  pq[++N] = v;
  pos[v.id] = N;
  fixUp(N);
}

void fixDown(int k,int N){
    while(2*k <= N){
        int j = 2*k; //filho da esquerda , da direita seria 2*k+1
        if(j<N && maior(pq[j],pq[j+1])) j++; 
        //troca o pai e o filho de lugar já que o filho é maior
        if (!maior(pq[k], pq[j])) break;
        exch(k,j);
        //atualiza o indice do pai para o do filhos
        //já que eles trocaram de lugar;
        k = j;
      }
}

Item PQdelMin(){
    Item min = pq[1]; 
    exch(1,N);
    
    //comparação do "novo" primeiro com os filhos
    fixDown(1,N-1);

    //retornar o item removido;
    pos[min.id] = -1;
    return pq[N--] //retorna o ultimo e depois decrementa o tamanho do vetor
}

void PQdecreaseKey(int id, int nova_dist) {
    int i = pos[id]; // otimização aqui que a hash proporciona
    
    if (nova_dist < pq[i].dist) { // verifica se o caminho novo é melhor que o que já tinha
        pq[i].dist = nova_dist;
        fixUp(i); // atualiza a heap com o caminho novo se ele for melhor.
    }
}