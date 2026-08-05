// Cálculo de rota (seção 5 do documento original: "Grafo → Dijkstra → Linha
// no mapa → Instruções"). Monta um grafo `graphology` a partir dos nós e
// arestas salvos pelo admin (Fase 5) e usa `graphology-shortest-path`
// (Dijkstra) para achar o menor caminho.
//
// REVISÃO 1 (feedback do usuário): a primeira versão desta fase calculava a
// rota entre o NÓ mais próximo da origem e o NÓ mais próximo do destino — o
// que deixava um "buraco" visível entre o ponto real e o início da linha da
// rota. Corrigido encaixando cada ponto na ARESTA mais próxima (projeção
// perpendicular sobre o segmento), não no nó mais próximo — mesma técnica
// usada por apps de navegação reais ("snap to edge/road").
//
// REVISÃO 2 (feedback do usuário): o encaixe na aresta mais próxima não
// tinha limite de distância — se o ponto (origem ou destino) estivesse longe
// de qualquer aresta desenhada, o código encaixava na aresta mais próxima DE
// QUALQUER JEITO, e desenhava uma linha reta até lá, que podia cortar por
// cima de paredes/construções no mapa (porque não segue caminho nenhum,
// segue linha reta). Corrigido com `MAX_SNAP_DISTANCE_PCT`: se a aresta mais
// próxima estiver mais longe que isso, a rota é recusada (com um motivo
// específico) em vez de desenhar algo sem sentido. Isso também empurra o
// problema pro lugar certo: se isso acontecer, é o grafo do admin que está
// incompleto perto daquele ponto, não algo que o código deveria "inventar"
// uma solução geométrica pra disfarçar.
//
// Não depende de nenhuma tela — puro cálculo, consumido pela Fase 7 (busca
// do passageiro).
//
// NOTA: esta versão já teve um campo `segments` (trechos tipados por
// corredor/escada/etc), adicionado na Fase 8 para alimentar instruções de
// navegação passo a passo em texto. A funcionalidade de instruções foi
// removida a pedido do usuário (não agregava o suficiente pro escopo do MVP,
// já que o app não tem localização contínua — sem isso, texto passo a passo
// vira só uma descrição estática da rota, redundante com a linha já
// desenhada no mapa). `segments` foi removido de volta junto — não faz
// sentido manter um campo que não serve pra mais nada; se algum dia isso for
// reconsiderado, `RouteSegment` pode ser recriado do zero, olhando o
// histórico do PROGRESS.md (Fase 8).

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
  /** Ids dos nós reais do grafo atravessados (sem os pontos virtuais de origem/destino). */
  nodeIds: string[];
}

export type RouteFailureReason =
  | 'sem-caminhos' // grafo não tem nenhuma aresta ainda
  | 'muito-longe' // origem ou destino longe demais de qualquer aresta (ver MAX_SNAP_DISTANCE_PCT)
  | 'sem-rota'; // grafo desconectado nesse trecho, ou erro inesperado do Dijkstra

export type RouteCalculation =
  | { ok: true; result: RouteResult }
  | { ok: false; reason: RouteFailureReason };

/**
 * Distância máxima (em unidades percentuais do mapa, 0-100) que um ponto
 * pode estar da aresta mais próxima para ainda ser considerado "conectado"
 * a ela. Acima disso, a rota é recusada em vez de desenhar uma linha reta
 * sem sentido até uma aresta distante. Ajustável — 12 é um ponto de partida
 * razoável, mas depende de quão zoomada/proporcional é a planta enviada
 * pelo admin; se muitas rotas legítimas estiverem sendo recusadas, aumente
 * este valor (ou é sinal de que o grafo precisa de mais nós perto dali).
 */
export const MAX_SNAP_DISTANCE_PCT = 12;

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
 * o Dijkstra, pra não deixar buraco entre o ponto real e a rota desenhada —
 * mas recusa o encaixe se a aresta mais próxima estiver longe demais (ver
 * `MAX_SNAP_DISTANCE_PCT`), pra não desenhar uma linha reta sem sentido por
 * cima de paredes/construções que não têm caminho nenhum modelado ali.
 *
 * ATENÇÃO: o pacote `graphology-shortest-path` exporta um `bidirectional` na
 * raiz do módulo, mas esse é o algoritmo SEM peso (BFS). O que usamos aqui é
 * `dijkstra.bidirectional` (namespace `dijkstra`), que aceita o nome do
 * atributo de peso. Import errado = rota "com menos saltos" em vez de "mais
 * curta de verdade" — silenciosamente errado, sem erro de tipo ou runtime.
 */
export async function calculateRoute(fromPoint: Point, toPoint: Point): Promise<RouteCalculation> {
  const nodes = getGraphNodes();
  const edges = getGraphEdges();
  if (edges.length === 0) return { ok: false, reason: 'sem-caminhos' };

  const map = await getMap();
  const scale = map?.scale;

  const fromProjection = findNearestEdgeProjection(fromPoint, nodes, edges);
  const toProjection = findNearestEdgeProjection(toPoint, nodes, edges);
  if (!fromProjection || !toProjection) return { ok: false, reason: 'sem-caminhos' };

  if (fromProjection.distancePct > MAX_SNAP_DISTANCE_PCT || toProjection.distancePct > MAX_SNAP_DISTANCE_PCT) {
    return { ok: false, reason: 'muito-longe' };
  }

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
      ok: true,
      result: {
        points: [fromPoint, fromProjection.point, toProjection.point, toPoint],
        totalDistance,
        nodeIds: [],
      },
    };
  }

  const graph = buildGraph(nodes, edges);
  insertVirtualNode(graph, ORIGIN_VIRTUAL_ID, fromProjection);
  insertVirtualNode(graph, DESTINATION_VIRTUAL_ID, toProjection);

  let path: string[] | null;
  try {
    path = dijkstra.bidirectional(graph, ORIGIN_VIRTUAL_ID, DESTINATION_VIRTUAL_ID, 'weight');
  } catch {
    return { ok: false, reason: 'sem-rota' };
  }
  if (!path) return { ok: false, reason: 'sem-rota' };

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
    ok: true,
    result: {
      points: [fromPoint, ...graphPoints, toPoint],
      totalDistance: graphWeight + lastMile,
      nodeIds: realNodeIds,
    },
  };
}
