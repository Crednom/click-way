// Cálculo de rota (seção 5 do documento original: "Grafo → Dijkstra → Linha
// no mapa → Instruções"). Monta um grafo `graphology` a partir dos nós e
// arestas salvos pelo admin (Fase 5) e usa `graphology-shortest-path`
// (Dijkstra) para achar o menor caminho entre dois nós.
//
// Não depende de nenhuma tela — puro cálculo, consumido pela Fase 7 (busca do
// passageiro) e pela Fase 8 (instruções passo a passo).

// ATENÇÃO: o pacote `graphology-shortest-path` exporta um `bidirectional` na
// raiz do módulo, mas esse é o algoritmo SEM peso (BFS). O que precisamos
// aqui é `dijkstra.bidirectional` (namespace `dijkstra`), que aceita o nome
// do atributo de peso. Import errado = rota "mais curta em número de saltos"
// em vez de "mais curta em distância real" — silenciosamente errado, sem
// erro de tipo ou runtime. Não trocar por `import { bidirectional } from
// 'graphology-shortest-path'`.
import Graph from 'graphology';
import { dijkstra } from 'graphology-shortest-path';
import { getGraphEdges, getGraphNodes } from '../../shared/lib/storage';
import type { GraphEdge, GraphNode } from '../../shared/types';

export interface RouteResult {
  /** Sequência de ids de nó do grafo, do ponto de partida até o destino. */
  nodeIds: string[];
  /**
   * Soma dos pesos das arestas do caminho. Só é uma distância real em metros
   * se os pesos das arestas foram definidos com a escala configurada (Fase 3)
   * — ver a nota em `EdgeWeightForm.tsx` (Fase 5), que já avisa o admin disso
   * ao criar cada aresta.
   */
  totalWeight: number;
}

function buildGraph(nodes: GraphNode[], edges: GraphEdge[]): Graph {
  const graph = new Graph({ type: 'undirected', multi: false });

  nodes.forEach((node) => {
    if (!graph.hasNode(node.id)) graph.addNode(node.id);
  });

  edges.forEach((edge) => {
    if (
      graph.hasNode(edge.fromNodeId) &&
      graph.hasNode(edge.toNodeId) &&
      edge.fromNodeId !== edge.toNodeId &&
      !graph.hasEdge(edge.fromNodeId, edge.toNodeId)
    ) {
      graph.addEdge(edge.fromNodeId, edge.toNodeId, { weight: edge.weight });
    }
  });

  return graph;
}

function computePathWeight(graph: Graph, nodeIds: string[]): number {
  let total = 0;
  for (let i = 0; i < nodeIds.length - 1; i += 1) {
    const edgeKey = graph.edge(nodeIds[i], nodeIds[i + 1]);
    if (edgeKey === undefined) continue;
    total += graph.getEdgeAttribute(edgeKey, 'weight') as number;
  }
  return total;
}

/**
 * Calcula o menor caminho entre dois nós do grafo. Retorna `null` se algum
 * dos nós não existir ou se não houver caminho entre eles (grafo
 * desconectado nesse trecho — ver seção 9 do spec: "validar se o grafo é
 * conexo" é responsabilidade do admin ao montar o grafo, isto aqui só reporta
 * a falha sem derrubar a aplicação).
 */
export function calculateRoute(fromNodeId: string, toNodeId: string): RouteResult | null {
  const nodes = getGraphNodes();
  const edges = getGraphEdges();
  const graph = buildGraph(nodes, edges);

  if (!graph.hasNode(fromNodeId) || !graph.hasNode(toNodeId)) return null;

  let nodeIds: string[] | null;
  try {
    nodeIds = dijkstra.bidirectional(graph, fromNodeId, toNodeId, 'weight');
  } catch {
    // graphology lança erro em caso de peso negativo contraditório — não
    // deveria acontecer (pesos vêm sempre > 0 do formulário da Fase 5), mas
    // não queremos que isso derrube a navegação do passageiro.
    return null;
  }

  if (!nodeIds) return null;

  return { nodeIds, totalWeight: computePathWeight(graph, nodeIds) };
}
