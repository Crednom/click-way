// Tela inicial do módulo Passageiro (seção 2.2 do spec: busca, categorias,
// traçado de rota no mapa).
//
// DECISÃO desta fase: calcular uma rota exige um ponto de partida, mas a
// leitura de QR Code (que dá a localização automaticamente) só é implementada
// na Fase 9. Até lá, o passageiro indica "onde está" tocando no mapa — um
// mecanismo manual temporário. Quando a Fase 9 chegar, o plano é que o QR
// Code preencha esse mesmo `originPoint` automaticamente, mantendo a opção de
// toque manual como alternativa (ex: se o passageiro não tiver como escanear).
//
// DECISÃO (simplificação): o documento original descrevia uma taxonomia fixa
// de categorias de busca (Serviços: Banheiros, Alimentação, Compras,
// Embarque, Atendimento, Emergência), separada das 13 categorias de POI do
// admin. Usei as categorias reais dos POIs (`getCategories()`, fábrica +
// personalizadas) como filtro de busca em vez de criar uma segunda taxonomia
// paralela — evita um filtro que não bate com o que o admin realmente
// cadastrou, e como categorias agora são livres (Fase 4, revisão), o admin já
// pode criar algo como "Emergência" se quiser.

import { useEffect, useMemo, useState } from 'react';
import AppHeader from '../../shared/components/AppHeader';
import MapView, { type MapViewLine, type MapViewMarker } from '../map/MapView';
import SearchBar from './SearchBar';
import SearchResultsList from './SearchResultsList';
import { getMap, getPois, getCategories, getGraphNodes } from '../../shared/lib/storage';
import { findNearestNode } from '../../shared/lib/poiNodeLinking';
import { calculateRoute, type RouteResult } from '../routing/calculateRoute';
import { renderPoiIconHtml } from '../../shared/lib/poiIconHtml';
import type { Category, GraphNode, MapImage, Point, Poi } from '../../shared/types';

function HomeScreen() {
  const [map, setMap] = useState<MapImage | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [destination, setDestination] = useState<Poi | null>(null);
  const [originPoint, setOriginPoint] = useState<Point | null>(null);

  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    getMap()
      .then(setMap)
      .finally(() => setLoading(false));
    setPois(getPois());
    setCategories(getCategories());
    setNodes(getGraphNodes());
  }, []);

  // Recalcula a rota sempre que destino, localização atual ou o grafo mudam.
  useEffect(() => {
    if (!destination || !originPoint) {
      setRouteResult(null);
      setRouteError(null);
      return;
    }
    const originNode = findNearestNode(originPoint, nodes);
    if (!originNode) {
      setRouteResult(null);
      setRouteError('Ainda não há caminhos configurados neste mapa.');
      return;
    }
    if (!destination.nearestNodeId) {
      setRouteResult(null);
      setRouteError('Este local ainda não está conectado ao mapa de navegação.');
      return;
    }
    const result = calculateRoute(originNode.id, destination.nearestNodeId);
    if (!result) {
      setRouteResult(null);
      setRouteError('Não foi possível calcular uma rota até este local.');
      return;
    }
    setRouteError(null);
    setRouteResult(result);
  }, [destination, originPoint, nodes]);

  function getCategoryMeta(categoryId: string): Category {
    return (
      categories.find((cat) => cat.id === categoryId) ?? {
        id: categoryId,
        label: categoryId,
        color: 'var(--color-muted)',
        isCustom: true,
      }
    );
  }

  const usedCategories = useMemo(() => {
    const usedIds = new Set(pois.map((poi) => poi.category));
    return categories.filter((cat) => usedIds.has(cat.id));
  }, [pois, categories]);

  const filteredPois = useMemo(() => {
    return pois.filter((poi) => {
      if (selectedCategoryId && poi.category !== selectedCategoryId) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      const categoryLabel = (categories.find((cat) => cat.id === poi.category)?.label ?? poi.category).toLowerCase();
      return poi.name.toLowerCase().includes(q) || categoryLabel.includes(q);
    });
  }, [pois, query, selectedCategoryId, categories]);

  const isSearching = query.trim() !== '' || selectedCategoryId !== null;

  function handleSelectDestination(poi: Poi) {
    setDestination(poi);
    setQuery('');
    setSelectedCategoryId(null);
  }

  function handleBackToSearch() {
    setDestination(null);
    setRouteResult(null);
    setRouteError(null);
  }

  function handleMapClick(point: Point) {
    if (!destination) return;
    setOriginPoint(point);
  }

  const routeMarkers: MapViewMarker[] = [];
  if (originPoint) {
    routeMarkers.push({
      id: 'origin',
      position: originPoint,
      color: 'var(--color-passenger)',
      label: 'Você está aqui',
    });
  }
  if (destination) {
    routeMarkers.push({
      id: destination.id,
      position: destination.position,
      color: getCategoryMeta(destination.category).color,
      label: destination.name,
      iconHtml: renderPoiIconHtml(destination),
    });
  }

  const routeLines: MapViewLine[] = [];
  if (routeResult) {
    for (let i = 0; i < routeResult.nodeIds.length - 1; i += 1) {
      const fromNode = nodes.find((node) => node.id === routeResult.nodeIds[i]);
      const toNode = nodes.find((node) => node.id === routeResult.nodeIds[i + 1]);
      if (fromNode && toNode) {
        routeLines.push({
          id: `route-${i}`,
          from: fromNode.position,
          to: toNode.position,
          color: 'var(--color-passenger)',
        });
      }
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader title="Passageiro" accentColor="var(--color-passenger)" />
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
          <p style={{ color: 'var(--color-muted)', textAlign: 'center' }}>
            O mapa da rodoviária ainda não foi configurado.
          </p>
        )}

        {!loading && map && !destination && (
          <>
            <SearchBar value={query} onChange={setQuery} />

            {usedCategories.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {usedCategories.map((cat) => {
                  const selected = cat.id === selectedCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(selected ? null : cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '999px',
                        border: selected ? `2px solid ${cat.color}` : '1px solid var(--color-border)',
                        background: selected ? `${cat.color}1a` : 'var(--color-surface)',
                        color: selected ? cat.color : 'var(--color-text)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }}
                      />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            )}

            {isSearching ? (
              <SearchResultsList pois={filteredPois} categories={categories} onSelect={handleSelectDestination} />
            ) : (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
                Busque um local ou toque numa categoria acima.
              </p>
            )}
          </>
        )}

        {!loading && map && destination && (
          <>
            <button
              type="button"
              onClick={handleBackToSearch}
              style={{
                alignSelf: 'flex-start',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-passenger)',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '4px 0',
              }}
            >
              ← Nova busca
            </button>

            {!originPoint && (
              <div
                style={{
                  border: '1px solid var(--color-passenger)',
                  background: 'var(--color-passenger-bg)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                }}
              >
                Toque no mapa para indicar onde você está agora.
              </div>
            )}

            <MapView
              imageDataUrl={map.imageDataUrl}
              width={map.width}
              height={map.height}
              markers={routeMarkers}
              lines={routeLines}
              onMapClick={handleMapClick}
            />

            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <strong style={{ fontSize: '0.95rem' }}>{destination.name}</strong>

              {routeError && (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-severity-urgente)' }}>{routeError}</span>
              )}
              {routeResult && (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                  Distância aproximada: {Math.round(routeResult.totalWeight)} m
                </span>
              )}

              {originPoint && (
                <button
                  type="button"
                  onClick={() => setOriginPoint(null)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    color: 'var(--color-muted)',
                  }}
                >
                  Trocar localização
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default HomeScreen;
