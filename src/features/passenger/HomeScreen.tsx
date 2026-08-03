// Tela inicial do módulo Passageiro (seção 2.2 do spec: busca, categorias,
// traçado de rota no mapa).
//
// REVISÃO 1 (feedback do usuário): mapa sempre visível (painéis flutuantes
// por cima, estilo Google Maps) + rota calculada com encaixe na aresta mais
// próxima (não no nó). Ver features/routing/calculateRoute.ts.
//
// REVISÃO 2 (feedback do usuário): dois pedidos atendidos aqui.
// 1. Os locais (POIs) agora aparecem SEMPRE no mapa (antes só apareciam
//    depois de escolher um destino pela busca) — igual ao Google Maps
//    mostrando os pontos de interesse no mapa por padrão.
// 2. Tocar diretamente no ícone de um local no mapa já define ele como
//    destino e traça a rota — não precisa passar pela busca.
// Ao entrar em modo "rota" (destino escolhido), os outros POIs somem e só
// origem+destino ficam visíveis, pra não poluir a rota traçada (mesmo
// princípio de anti-poluição já aplicado nos mapas do admin).
//
// DECISÃO que continua valendo: localização do passageiro é manual (toque no
// mapa) até a Fase 9 implementar QR Code. Ver PROGRESS.md.
//
// DECISÃO que continua valendo: categorias de busca = categorias reais dos
// POIs (`getCategories()`), não a taxonomia fixa do documento original. Ver
// PROGRESS.md.

import { useEffect, useMemo, useState } from 'react';
import { FaEllipsis } from 'react-icons/fa6';
import AppHeader from '../../shared/components/AppHeader';
import MapView, { type MapViewLine, type MapViewMarker } from '../map/MapView';
import SearchBar from './SearchBar';
import SearchResultsList from './SearchResultsList';
import CategoryFilterModal from './CategoryFilterModal';
import { getMap, getPois, getCategories } from '../../shared/lib/storage';
import { calculateRoute, type RouteFailureReason, type RouteResult } from '../routing/calculateRoute';
import { renderPoiIconHtml } from '../../shared/lib/poiIconHtml';
import { Z_INDEX } from '../../shared/lib/zIndex';
import type { Category, MapImage, Point, Poi } from '../../shared/types';

/** Quantos chips de categoria mostrar direto na tela antes de precisar abrir "Ver todas" (pedido do usuário: não deixar a fileira poluída). */
const MAX_INLINE_CATEGORIES = 4;

const ROUTE_FAILURE_MESSAGES: Record<RouteFailureReason, string> = {
  'sem-caminhos': 'Ainda não há nenhum caminho configurado neste mapa.',
  'muito-longe': 'Este ponto está muito longe de qualquer caminho configurado no mapa.',
  'sem-rota': 'Não foi possível calcular uma rota até este local (o mapa pode ter um trecho desconectado).',
};

function HomeScreen() {
  const [map, setMap] = useState<MapImage | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [destination, setDestination] = useState<Poi | null>(null);
  const [originPoint, setOriginPoint] = useState<Point | null>(null);

  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  useEffect(() => {
    getMap()
      .then(setMap)
      .finally(() => setLoading(false));
    setPois(getPois());
    setCategories(getCategories());
  }, []);

  // Recalcula a rota (assíncrono: calculateRoute lê a escala do mapa) sempre
  // que destino ou localização atual mudam.
  useEffect(() => {
    if (!destination || !originPoint) {
      setRouteResult(null);
      setRouteError(null);
      return;
    }

    let cancelled = false;
    setCalculatingRoute(true);

    calculateRoute(originPoint, destination.position)
      .then((outcome) => {
        if (cancelled) return;
        if (!outcome.ok) {
          setRouteResult(null);
          setRouteError(ROUTE_FAILURE_MESSAGES[outcome.reason]);
          return;
        }
        setRouteError(null);
        setRouteResult(outcome.result);
      })
      .finally(() => {
        if (!cancelled) setCalculatingRoute(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destination, originPoint]);

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

  // Fileira de chips limitada (pedido do usuário: não poluir a tela quando
  // há muitas categorias) — o resto fica atrás do botão "Ver todas". Se a
  // categoria ativa não estiver entre as primeiras, ela é trazida pra
  // fileira mesmo assim, pra sempre dar pra ver/desmarcar o filtro ativo sem
  // precisar abrir o modal de novo.
  const visibleCategories = useMemo(() => {
    const base = usedCategories.slice(0, MAX_INLINE_CATEGORIES);
    if (selectedCategoryId && !base.some((cat) => cat.id === selectedCategoryId)) {
      const selected = usedCategories.find((cat) => cat.id === selectedCategoryId);
      if (selected) return [selected, ...base.slice(0, MAX_INLINE_CATEGORIES - 1)];
    }
    return base;
  }, [usedCategories, selectedCategoryId]);

  const hasMoreCategories = usedCategories.length > MAX_INLINE_CATEGORIES;

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
    if (!destination) return; // só captura "estou aqui" quando já tem destino escolhido
    setOriginPoint(point);
  }

  // Tocar direto num ícone de local no mapa: se ainda não tem destino, esse
  // toque define o destino (igual ao Google Maps); se já tem destino em
  // rota, os outros locais nem aparecem (ver browseMarkers/routeMarkers
  // abaixo), então esse handler só é relevante no modo "busca".
  function handleMarkerClick(markerId: string) {
    if (destination) return;
    const poi = pois.find((item) => item.id === markerId);
    if (poi) handleSelectDestination(poi);
  }

  // Modo "busca" (sem destino ainda): mostra os POIs no mapa — filtrados pela
  // categoria selecionada, se houver (pedido do usuário: o filtro de
  // categoria deve afetar o mapa, não só a lista de resultados). Modo
  // "rota" (destino escolhido): só origem + destino, pra não poluir a rota
  // traçada com os outros pontos.
  const browseMarkers: MapViewMarker[] = useMemo(() => {
    const visiblePois = selectedCategoryId ? pois.filter((poi) => poi.category === selectedCategoryId) : pois;
    return visiblePois.map((poi) => ({
      id: poi.id,
      position: poi.position,
      color: getCategoryMeta(poi.category).color,
      label: poi.name,
      iconHtml: renderPoiIconHtml(poi),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pois, categories, selectedCategoryId]);

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

  const displayedMarkers = destination ? routeMarkers : browseMarkers;

  // `routeResult.points` é o caminho inteiro em sequência — vira uma linha
  // por par de pontos consecutivos (é assim que o MapView desenha).
  const routeLines: MapViewLine[] = [];
  if (routeResult) {
    for (let i = 0; i < routeResult.points.length - 1; i += 1) {
      routeLines.push({
        id: `route-${i}`,
        from: routeResult.points[i],
        to: routeResult.points[i + 1],
        color: 'var(--color-passenger)',
      });
    }
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader title="Passageiro" accentColor="var(--color-passenger)" />

      {loading && <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '24px' }}>Carregando...</p>}

      {!loading && !map && (
        <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '24px' }}>
          O mapa da rodoviária ainda não foi configurado.
        </p>
      )}

      {!loading && map && (
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <MapView
            imageDataUrl={map.imageDataUrl}
            width={map.width}
            height={map.height}
            markers={displayedMarkers}
            lines={routeLines}
            onMapClick={handleMapClick}
            onMarkerClick={handleMarkerClick}
            heightPx="100%"
          />

          {/* Painel de busca — flutua por cima do mapa, estilo Google Maps */}
          {!destination && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: Z_INDEX.overlay,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <SearchBar value={query} onChange={setQuery} />

              {usedCategories.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {visibleCategories.map((cat) => {
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
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
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

                  {hasMoreCategories && (
                    <button
                      type="button"
                      onClick={() => setCategoryModalOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '999px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }}
                    >
                      <FaEllipsis />
                      Ver todas
                    </button>
                  )}
                </div>
              )}

              {isSearching && (
                <div
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: '14px',
                    padding: '8px',
                    maxHeight: '50vh',
                    overflowY: 'auto',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  <SearchResultsList pois={filteredPois} categories={categories} onSelect={handleSelectDestination} />
                </div>
              )}
            </div>
          )}

          {/* Instrução de localização — flutua sobre o mapa quando falta indicar "estou aqui" */}
          {destination && !originPoint && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                right: '12px',
                zIndex: Z_INDEX.overlay,
                background: 'var(--color-passenger)',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '0.9rem',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}
            >
              Toque no mapa para indicar onde você está agora.
            </div>
          )}

          {/* Card de rota — flutua na base do mapa, estilo Google Maps */}
          {destination && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: Z_INDEX.overlay,
                padding: '12px',
              }}
            >
              <div
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{destination.name}</strong>
                  <button
                    type="button"
                    onClick={handleBackToSearch}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-passenger)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Nova busca
                  </button>
                </div>

                {calculatingRoute && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Calculando rota...</span>
                )}
                {routeError && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-severity-urgente)' }}>{routeError}</span>
                )}
                {routeResult && !calculatingRoute && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                    Distância aproximada: {Math.round(routeResult.totalDistance)} m
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
            </div>
          )}
        </div>
      )}

      {categoryModalOpen && (
        <CategoryFilterModal
          categories={usedCategories}
          selectedCategoryId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}
    </div>
  );
}

export default HomeScreen;
