// Cálculo de rota (seção 5 do documento original: "Grafo → Dijkstra → Linha
// no mapa → Instruções"). Monta um grafo `graphology` a partir dos nós e
// arestas salvos pelo admin (Fase 5) e usa `graphology-shortest-path`
// (Dijkstra) para achar o menor caminho.
//
// REVISÃO (feedback do usuário, ainda dentro do espírito da Fase 7): a
// primeira versão desta fase calculava a rota entre o NÓ mais próximo da
// origem e o NÓ mais próximo do destino — o que deixava um "buraco" visível
// entre o ponto real (onde o passageiro tocou, ou a posição exata do POI) e
// o início da linha da rota. A correção, que é a abordagem padrão usada por
// apps de navegação de verdade (Google Maps, Waze, OSRM...), é encaixar o
// ponto na ARESTA mais próxima (projeção perpendicular sobre o segmento),
// não no nó mais próximo. Isso dá um encaixe exato, sem exigir que o admin
// crie manualmente uma porção de nós extras ao longo dos corredores.
//
// Não depende de nenhuma tela — puro cálculo, consumido pela Fase 7 (busca
// do passageiro) e pela Fase 8 (instruções passo a passo).

import Graph from 'graphology';
import { dijkstra } from 'graphology-shortest-path';
import { getGraphEdges, getGraphNodes, getMap } from '../../shared/lib/storage';
import { percentDistance, percentDistanceToMeters } from '../../shared/lib/coordinates';
import type { GraphEdge, GraphNode, MapScale, Point } from '../../shared/types';

export interface RouteResult {
  /** Caminho completo, já em pontos (percentual) prontos para desenhar — inclui o ponto real de origem e destino nas pontas. */
  points: Point[];
  /**
   * Distância total. Em metros se o mapa tiver escala configurada (Fase 3);
   * caso contrário, na mesma unidade "crua" usada pelos pesos das arestas
   * (ver ressalva em `EdgeWeightForm.tsx`, Fase 5).
   */
  totalDistance: number;
  /** Ids dos nós reais do grafo atravessados (sem os pontos virtuais de origem/destino) — útil pra Fase 8 relacionar trechos com o tipo de aresta (corredor/escada/etc). */
  nodeIds: string[];
}

const ORIGIN_VIRTUAL_ID = '__origin__';
const DESTINATION_VIRTUAL_ID = '__destination__';

function projectPointOnSegment(point: Point, a: Point, b: Point): { point: Point; t: number } {
  const abx = b.xPct - a.xPct;
  const aby = b.yPct - a.yPct;
  const lengthSq = abx * abx + aby * aby;

  if (lengthSq === 0) {
    // Aresta degenerada (os dois nós no mesmo ponto) — não deveria acontecer
    // na prática, mas não queremos dividir por zero se acontecer.
    return { point: a, t: 0 };
  }

  const apx = point.xPct - a.xPct;
  const apy = point.yPct - a.yPct;
  let t = (apx * abx + apy * aby) / lengthSq;
  t = Math.max(0, Math.min(1, t)); // limita ao segmento (não deixa "projetar" além das pontas)

  return { point: { xPct: a.xPct + t * abx, yPct: a.yPct + t * aby }, t };
}

interface EdgeProjection {
  edge: GraphEdge;
  nodeA: GraphNode;
  nodeB: GraphNode;
  point: Point;
  t: number;
  distancePct: number;
}

/** Acha, entre todas as arestas, o ponto mais próximo de `point` (projeção perpendicular sobre cada segmento). */
function findNearestEdgeProjection(
  point: Point,
  nodes: GraphNode[],
  edges: GraphEdge[],
): EdgeProjection | null {
  let best: EdgeProjection | null = null;

  for (const edge of edges) {
    const nodeA = nodes.find((node) => node.id === edge.fromNodeId);
    const nodeB = nodes.find((node) => node.id === edge.toNodeId);
    if (!nodeA || !nodeB) continue;

    const { point: projected, t } = projectPointOnSegment(point, nodeA.position, nodeB.position);
    const distancePct = percentDistance(point, projected);

    if (!best || distancePct < best.distancePct) {
      best = { edge, nodeA, nodeB, point: projected, t, distancePct };
    }
  }

  return best;
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

/**
 * Insere um nó virtual no ponto projetado sobre uma aresta, dividindo o peso
 * da aresta original proporcionalmente à posição do ponto nela (não remove a
 * aresta original — ela continua existindo como um atalho válido).
 */
function insertVirtualNode(graph: Graph, virtualId: string, projection: EdgeProjection): void {
  graph.addNode(virtualId);

  const distToA = percentDistance(projection.point, projection.nodeA.position);
  const distToB = percentDistance(projection.point, projection.nodeB.position);
  const totalDist = distToA + distToB || 1; // evita divisão por zero (aresta degenerada)

  graph.addEdge(virtualId, projection.nodeA.id, {
    weight: projection.edge.weight * (distToA / totalDist),
  });
  graph.addEdge(virtualId, projection.nodeB.id, {
    weight: projection.edge.weight * (distToB / totalDist),
  });
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

function toDistanceUnit(distancePct: number, scale: MapScale | undefined): number {
  return scale ? percentDistanceToMeters(distancePct, scale) : distancePct;
}

/**
 * Calcula a rota entre dois pontos GEOMÉTRICOS quaisquer (não nós do grafo) —
 * ex: onde o passageiro tocou o mapa, e a posição exata de um POI. Encaixa
 * cada ponto na aresta mais próxima (não no nó mais próximo) antes de rodar
 * o Dijkstra, pra não deixar buraco entre o ponto real e a rota desenhada.
 *
 * ATENÇÃO: o pacote `graphology-shortest-path` exporta um `bidirectional` na
 * raiz do módulo, mas esse é o algoritmo SEM peso (BFS). O que usamos aqui é
 * `dijkstra.bidirectional` (namespace `dijkstra`), que aceita o nome do
 * atributo de peso. Import errado = rota "com menos saltos" em vez de "mais
 * curta de verdade" — silenciosamente errado, sem erro de tipo ou runtime.
 */
export async function calculateRoute(fromPoint: Point, toPoint: Point): Promise<RouteResult | null> {
  const nodes = getGraphNodes();
  const edges = getGraphEdges();
  if (edges.length === 0) return null; // sem nenhuma aresta, não há como formar rota nenhuma

  const map = await getMap();
  const scale = map?.scale;

  const fromProjection = findNearestEdgeProjection(fromPoint, nodes, edges);
  const toProjection = findNearestEdgeProjection(toPoint, nodes, edges);
  if (!fromProjection || !toProjection) return null;

  // Caso especial: origem e destino caem na mesma aresta — linha reta direta
  // entre os dois pontos projetados, sem precisar do resto do grafo. Usa o
  // peso REAL da aresta (proporcional a t), não a distância geométrica —
  // consistente com como o restante da rota é calculado (o peso da aresta é
  // a fonte da verdade, não a régua sobre o mapa).
  if (fromProjection.edge.id === toProjection.edge.id) {
    const segmentWeight = fromProjection.edge.weight * Math.abs(fromProjection.t - toProjection.t);
    const totalDistance =
      toDistanceUnit(percentDistance(fromPoint, fromProjection.point), scale) +
      segmentWeight +
      toDistanceUnit(percentDistance(toProjection.point, toPoint), scale);

    return {
      points: [fromPoint, fromProjection.point, toProjection.point, toPoint],
      totalDistance,
      nodeIds: [],
    };
  }

  const graph = buildGraph(nodes, edges);
  insertVirtualNode(graph, ORIGIN_VIRTUAL_ID, fromProjection);
  insertVirtualNode(graph, DESTINATION_VIRTUAL_ID, toProjection);

  let path: string[] | null;
  try {
    path = dijkstra.bidirectional(graph, ORIGIN_VIRTUAL_ID, DESTINATION_VIRTUAL_ID, 'weight');
  } catch {
    return null;
  }
  if (!path) return null;

  const positionById = new Map<string, Point>(nodes.map((node) => [node.id, node.position]));
  positionById.set(ORIGIN_VIRTUAL_ID, fromProjection.point);
  positionById.set(DESTINATION_VIRTUAL_ID, toProjection.point);

  const graphPoints = path
    .map((id) => positionById.get(id))
    .filter((point): point is Point => Boolean(point));

  const lastMile =
    toDistanceUnit(percentDistance(fromPoint, fromProjection.point), scale) +
    toDistanceUnit(percentDistance(toProjection.point, toPoint), scale);

  const graphWeight = computePathWeight(graph, path);
  const realNodeIds = path.filter((id) => id !== ORIGIN_VIRTUAL_ID && id !== DESTINATION_VIRTUAL_ID);

  // `graphWeight` já está na mesma unidade dos pesos das arestas (metros, se
  // o admin seguiu a sugestão da Fase 5) — só `lastMile` precisa passar por
  // `toDistanceUnit`, porque nasce de uma distância percentual crua.
  return {
    points: [fromPoint, ...graphPoints, toPoint],
    totalDistance: graphWeight + lastMile,
    nodeIds: realNodeIds,
  };
}
