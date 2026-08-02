// Resolve a pendência registrada no PROGRESS.md desde a Fase 4: todo POI
// precisa acabar vinculado ao nó do grafo mais próximo (`Poi.nearestNodeId`),
// mas o grafo não existe ainda quando os POIs são criados. Solução escolhida
// nesta fase: vínculo automático, recalculado sempre que o grafo muda (nó
// criado/removido) — não uma ação manual do admin. Mantém `nearestNodeId`
// sempre correto sem exigir nenhum passo extra.

import { getPois, getGraphNodes, savePoi } from './storage';
import { percentDistance } from './coordinates';
import type { GraphNode, Point } from '../types';

/** Encontra o nó do grafo mais próximo de um ponto (percentual) qualquer. */
export function findNearestNode(point: Point, nodes: GraphNode[]): GraphNode | undefined {
  let nearest: GraphNode | undefined;
  let nearestDistance = Infinity;
  for (const node of nodes) {
    const distance = percentDistance(point, node.position);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = node;
    }
  }
  return nearest;
}

/**
 * Recalcula `nearestNodeId` de todos os POIs a partir dos nós do grafo
 * atuais. Se não houver nenhum nó, todo POI fica com `nearestNodeId`
 * undefined (estado esperado antes da Fase 5 ter algum nó criado).
 */
export function relinkAllPois(): void {
  const nodes = getGraphNodes();
  const pois = getPois();

  for (const poi of pois) {
    const nearest = nodes.length > 0 ? findNearestNode(poi.position, nodes) : undefined;
    const nearestNodeId = nearest?.id;
    if (poi.nearestNodeId !== nearestNodeId) {
      savePoi({ ...poi, nearestNodeId });
    }
  }
}
