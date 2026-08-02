// Mapa da rodoviária (seção 2.1/2.2 do spec: planta completa, zoom, arrastar).
//
// Usa Leaflet com `L.CRS.Simple`, tratando a planta como um plano cartesiano
// (não um mapa geográfico com tiles) — técnica padrão para plantas/imagens
// estáticas. Componente reutilizável: usado pelas Fases 4 (locais) e 5 (grafo)
// para criar POIs e nós.
//
// Revisão pós-Fase 4 (feedback do usuário): o nome do marcador antes só
// aparecia num tooltip de hover (ruim em touch/mobile). Agora o nome fica
// sempre visível ao lado do ícone, como no Google Maps — e pra evitar
// poluição visual quando dois pontos estão perto um do outro, um nome só é
// mostrado se não colidir (em pixels de tela) com o nome de um marcador já
// desenhado. Recalculado a cada zoom/arraste, porque a distância em pixels
// entre dois pontos muda conforme o zoom.

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Point } from '../../shared/types';

export interface MapViewMarker {
  id: string;
  position: Point;
  color?: string;
  label?: string;
  /**
   * HTML (string) a ser desenhado dentro do círculo do marcador — ex: um
   * ícone SVG ou uma tag <img>. Quem monta esse HTML é quem chama o MapView
   * (ex: PoiEditor usa `renderPoiIconHtml`), pra manter este componente
   * genérico e sem depender de conceitos de POI/categoria.
   */
  iconHtml?: string;
}

export interface MapViewLine {
  id: string;
  from: Point;
  to: Point;
  color?: string;
}

interface MapViewProps {
  imageDataUrl: string;
  width: number;
  height: number;
  markers?: MapViewMarker[];
  lines?: MapViewLine[];
  onMapClick?: (point: Point) => void;
  onMarkerClick?: (markerId: string) => void;
  onLineClick?: (lineId: string) => void;
  heightPx?: number;
}

// Distância mínima (em pixels de tela) entre dois marcadores para que ambos
// mostrem o nome. Abaixo disso, o segundo marcador mostra só o ícone.
const MIN_LABEL_SPACING_PX = 68;
const BADGE_SIZE = 28;

function percentToLatLng(point: Point, width: number, height: number): L.LatLngTuple {
  // CRS.Simple trata +lat como "para cima". A imagem cresce em y para baixo,
  // então invertemos: yPct=0 (topo da imagem) vira lat=height (topo do mapa).
  const lat = height - (point.yPct / 100) * height;
  const lng = (point.xPct / 100) * width;
  return [lat, lng];
}

function latLngToPercent(lat: number, lng: number, width: number, height: number): Point {
  return {
    xPct: (lng / width) * 100,
    yPct: ((height - lat) / height) * 100,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMarkerIcon(marker: MapViewMarker, showLabel: boolean): L.DivIcon {
  const color = marker.color ?? '#0b5fa5';
  const badge = `<div style="width:${BADGE_SIZE}px;height:${BADGE_SIZE}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);">${marker.iconHtml ?? ''}</div>`;

  const label =
    showLabel && marker.label
      ? `<span style="position:absolute;left:${BADGE_SIZE + 6}px;top:50%;transform:translateY(-50%);background:#fff;color:#14213d;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.25);">${escapeHtml(marker.label)}</span>`
      : '';

  return L.divIcon({
    className: '', // sem a classe padrão do Leaflet (que traz fundo/borda quadrada)
    html: `<div style="position:relative;width:${BADGE_SIZE}px;height:${BADGE_SIZE}px;">${badge}${label}</div>`,
    iconSize: [BADGE_SIZE, BADGE_SIZE],
    iconAnchor: [BADGE_SIZE / 2, BADGE_SIZE / 2],
  });
}

function MapView({
  imageDataUrl,
  width,
  height,
  markers = [],
  lines = [],
  onMapClick,
  onMarkerClick,
  onLineClick,
  heightPx = 420,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);

  // Refs para os callbacks/dados "mais recentes": evita recriar o mapa ou
  // registrar handlers novos só porque o pai passou uma nova referência entre
  // renders (função inline, array novo de markers etc.).
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  const onLineClickRef = useRef(onLineClick);
  onLineClickRef.current = onLineClick;
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const redrawMarkersRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!containerRef.current) return;

    const bounds: L.LatLngBoundsExpression = [
      [0, 0],
      [height, width],
    ];

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 4,
      attributionControl: false,
      zoomControl: true,
    });

    L.imageOverlay(imageDataUrl, bounds).addTo(map);
    map.fitBounds(bounds);

    map.on('click', (event: L.LeafletMouseEvent) => {
      const point = latLngToPercent(event.latlng.lat, event.latlng.lng, width, height);
      onMapClickRef.current?.(point);
    });

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    const linesLayer = L.layerGroup().addTo(map);
    linesLayerRef.current = linesLayer;
    mapRef.current = map;

    // Redesenha todos os marcadores, decidindo (por proximidade em pixels de
    // tela) quais mostram o nome. Reexecutado a cada zoom/arraste, porque a
    // distância em pixels entre dois pontos do mapa muda com o zoom.
    function redrawMarkers() {
      const layer = markersLayerRef.current;
      if (!layer) return;
      layer.clearLayers();

      const placedLabelPoints: L.Point[] = [];

      markersRef.current.forEach((marker) => {
        const latLng = percentToLatLng(marker.position, width, height);
        const screenPoint = map.latLngToContainerPoint(latLng);

        let showLabel = Boolean(marker.label);
        if (showLabel) {
          const collides = placedLabelPoints.some(
            (placed) => placed.distanceTo(screenPoint) < MIN_LABEL_SPACING_PX,
          );
          if (collides) showLabel = false;
        }
        if (showLabel) placedLabelPoints.push(screenPoint);

        const markerLayer = L.marker(latLng, { icon: buildMarkerIcon(marker, showLabel) });
        markerLayer.on('click', (event: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(event);
          onMarkerClickRef.current?.(marker.id);
        });
        markerLayer.addTo(layer);
      });
    }

    redrawMarkersRef.current = redrawMarkers;
    redrawMarkers();
    map.on('zoomend moveend', redrawMarkers);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      linesLayerRef.current = null;
    };
  }, [imageDataUrl, width, height]);

  // Linhas (arestas do grafo, Fase 5) não precisam de lógica de zoom/colisão
  // como os marcadores — só redesenha quando a lista muda.
  useEffect(() => {
    const layer = linesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    lines.forEach((line) => {
      const fromLatLng = percentToLatLng(line.from, width, height);
      const toLatLng = percentToLatLng(line.to, width, height);
      const polyline = L.polyline([fromLatLng, toLatLng], {
        color: line.color ?? '#475569',
        weight: 4,
        opacity: 0.85,
      });
      polyline.on('click', (event: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(event);
        onLineClickRef.current?.(line.id);
      });
      polyline.addTo(layer);
    });
  }, [lines, width, height]);

  // Quando a lista de markers muda (POIs criados/editados/excluídos), o
  // conteúdo de markersRef já foi atualizado acima (fora do efeito) — só
  // falta pedir o redesenho.
  useEffect(() => {
    redrawMarkersRef.current();
  }, [markers]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Mapa da rodoviária"
      style={{
        width: '100%',
        height: heightPx,
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#e9ebef',
      }}
    />
  );
}

export default MapView;
