// Tela de admin "Grafo" (seção 2.1 do spec: criar nós, criar conexões,
// alterar peso das conexões, remover conexões). Tela própria, separada de
// Locais — são interações visuais diferentes (seção 2.1: "Isso merece uma
// tela própria").
//
// Resolve também a pendência da Fase 4: sempre que um nó é criado ou
// removido, `relinkAllPois()` recalcula o `nearestNodeId` de todos os POIs
// (ver shared/lib/poiNodeLinking.ts).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../../shared/components/AppHeader';
import MapView, { type MapViewLine, type MapViewMarker } from '../map/MapView';
import EdgeWeightForm from './EdgeWeightForm';
import {
  getMap,
  getGraphNodes,
  saveGraphNode,
  deleteGraphNode,
  getGraphEdges,
  saveGraphEdge,
  deleteGraphEdge,
  getDefaultFloor,
} from '../../shared/lib/storage';
import { relinkAllPois } from '../../shared/lib/poiNodeLinking';
import { generateId } from '../../shared/lib/id';
import { percentDistance, percentDistanceToMeters } from '../../shared/lib/coordinates';
import type { GraphEdge, GraphNode, MapImage, Point } from '../../shared/types';

type Mode = 'idle' | 'adding-node' | 'connecting';

interface EdgeFormState {
  fromNodeId: string;
  toNodeId: string;
  edge?: GraphEdge;
}

function GraphEditorView() {
  const [map, setMap] = useState<MapImage | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<Mode>('idle');
  const [connectingFirstNodeId, setConnectingFirstNodeId] = useState<string | null>(null);
  const [edgeFormState, setEdgeFormState] = useState<EdgeFormState | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<GraphNode | null>(null);

  useEffect(() => {
    getMap()
      .then(setMap)
      .finally(() => setLoading(false));
    refresh();
  }, []);

  function refresh() {
    setNodes(getGraphNodes());
    setEdges(getGraphEdges());
  }

  function handleMapClick(point: Point) {
    if (mode !== 'adding-node') return;
    const node: GraphNode = {
      id: generateId(),
      floorId: getDefaultFloor().id,
      position: point,
    };
    saveGraphNode(node);
    relinkAllPois();
    refresh();
  }

  function handleNodeMarkerClick(nodeId: string) {
    if (mode === 'adding-node') return;

    if (mode === 'connecting') {
      if (!connectingFirstNodeId) {
        setConnectingFirstNodeId(nodeId);
        return;
      }
      if (connectingFirstNodeId === nodeId) {
        setConnectingFirstNodeId(null);
        return;
      }
      const existing = edges.find(
        (edge) =>
          (edge.fromNodeId === connectingFirstNodeId && edge.toNodeId === nodeId) ||
          (edge.fromNodeId === nodeId && edge.toNodeId === connectingFirstNodeId),
      );
      setEdgeFormState({ fromNodeId: connectingFirstNodeId, toNodeId: nodeId, edge: existing });
      setConnectingFirstNodeId(null);
      return;
    }

    // modo idle: tocar num nó abre a confirmação de exclusão
    const node = nodes.find((item) => item.id === nodeId);
    if (node) setNodeToDelete(node);
  }

  function handleLineClick(edgeId: string) {
    const edge = edges.find((item) => item.id === edgeId);
    if (!edge) return;
    setEdgeFormState({ fromNodeId: edge.fromNodeId, toNodeId: edge.toNodeId, edge });
  }

  function handleConfirmEdge(weight: number, type: GraphEdge['type']) {
    if (!edgeFormState) return;
    const edge: GraphEdge = {
      id: edgeFormState.edge?.id ?? generateId(),
      fromNodeId: edgeFormState.fromNodeId,
      toNodeId: edgeFormState.toNodeId,
      weight,
      type,
    };
    saveGraphEdge(edge);
    refresh();
    setEdgeFormState(null);
  }

  function handleDeleteEdge() {
    if (!edgeFormState?.edge) return;
    deleteGraphEdge(edgeFormState.edge.id);
    refresh();
    setEdgeFormState(null);
  }

  function handleConfirmDeleteNode() {
    if (!nodeToDelete) return;
    deleteGraphNode(nodeToDelete.id);
    relinkAllPois();
    refresh();
    setNodeToDelete(null);
  }

  function toggleMode(next: Mode) {
    setConnectingFirstNodeId(null);
    setMode((current) => (current === next ? 'idle' : next));
  }

  const nodeMarkers: MapViewMarker[] = nodes.map((node, index) => ({
    id: node.id,
    position: node.position,
    color: node.id === connectingFirstNodeId ? 'var(--color-admin)' : '#475569',
    label: String(index + 1),
  }));

  const edgeLines: MapViewLine[] = edges
    .map((edge): MapViewLine | null => {
      const fromNode = nodes.find((node) => node.id === edge.fromNodeId);
      const toNode = nodes.find((node) => node.id === edge.toNodeId);
      if (!fromNode || !toNode) return null;
      return { id: edge.id, from: fromNode.position, to: toNode.position, color: '#475569' };
    })
    .filter((line): line is MapViewLine => Boolean(line));

  // Sugestão de peso para o formulário de aresta: distância real (via escala,
  // se configurada) entre os dois nós selecionados.
  let suggestedWeight = 1;
  let suggestionNote: string | undefined;
  if (edgeFormState) {
    const fromNode = nodes.find((node) => node.id === edgeFormState.fromNodeId);
    const toNode = nodes.find((node) => node.id === edgeFormState.toNodeId);
    if (fromNode && toNode) {
      const distancePct = percentDistance(fromNode.position, toNode.position);
      if (map?.scale) {
        suggestedWeight = percentDistanceToMeters(distancePct, map.scale);
        suggestionNote = 'Sugestão calculada pela escala configurada — ajuste se o caminho real não for reto.';
      } else {
        suggestedWeight = distancePct;
        suggestionNote = 'Escala não configurada (tela "Mapa e escala") — este valor não é em metros reais.';
      }
    }
  }

  let statusText = `${nodes.length} nó(s), ${edges.length} conexão(ões). Toque num nó para excluí-lo.`;
  if (mode === 'adding-node') statusText = 'Toque no mapa para adicionar nós.';
  else if (mode === 'connecting' && !connectingFirstNodeId) statusText = 'Toque no primeiro nó para conectar.';
  else if (mode === 'connecting' && connectingFirstNodeId) statusText = 'Agora toque no segundo nó.';

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader title="Grafo" accentColor="var(--color-admin)" />
      <main
        style={{
          flex: 1,
          padding: '16px',
          maxWidth: '640px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {loading && <p style={{ color: 'var(--color-muted)' }}>Carregando...</p>}

        {!loading && !map && (
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              color: 'var(--color-muted)',
            }}
          >
            <p style={{ marginTop: 0 }}>Cadastre o mapa da rodoviária antes de criar o grafo.</p>
            <Link
              to="/admin/mapa"
              style={{
                display: 'inline-block',
                background: 'var(--color-admin)',
                color: '#fff',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Ir para Mapa e escala
            </Link>
          </div>
        )}

        {map && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{statusText}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => toggleMode('adding-node')}
                  style={{
                    background: mode === 'adding-node' ? 'var(--color-admin)' : 'transparent',
                    color: mode === 'adding-node' ? '#fff' : 'var(--color-admin)',
                    border: '1px solid var(--color-admin)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mode === 'adding-node' ? 'Concluir' : 'Adicionar nó'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleMode('connecting')}
                  style={{
                    background: mode === 'connecting' ? 'var(--color-admin)' : 'transparent',
                    color: mode === 'connecting' ? '#fff' : 'var(--color-admin)',
                    border: '1px solid var(--color-admin)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mode === 'connecting' ? 'Concluir' : 'Conectar nós'}
                </button>
              </div>
            </div>

            <MapView
              imageDataUrl={map.imageDataUrl}
              width={map.width}
              height={map.height}
              markers={nodeMarkers}
              lines={edgeLines}
              onMapClick={handleMapClick}
              onMarkerClick={handleNodeMarkerClick}
              onLineClick={handleLineClick}
            />

            {nodeToDelete && (
              <div
                style={{
                  border: '1px solid var(--color-severity-urgente)',
                  background: '#fbe9e7',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>
                  Excluir este nó? As conexões que usam ele também serão removidas, e os
                  locais vinculados a ele serão religados ao nó mais próximo automaticamente.
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteNode}
                    style={{
                      background: 'var(--color-severity-urgente)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setNodeToDelete(null)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {edgeFormState && (
        <EdgeWeightForm
          isEditing={Boolean(edgeFormState.edge)}
          suggestedWeight={suggestedWeight}
          suggestionNote={suggestionNote}
          initialWeight={edgeFormState.edge?.weight}
          initialType={edgeFormState.edge?.type}
          onConfirm={handleConfirmEdge}
          onDelete={edgeFormState.edge ? handleDeleteEdge : undefined}
          onCancel={() => setEdgeFormState(null)}
        />
      )}
    </div>
  );
}

export default GraphEditorView;
