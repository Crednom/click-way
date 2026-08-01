// Mapa da rodoviária (seção 2.1/2.2 do spec: planta completa, zoom, arrastar).
//
// Usa Leaflet com `L.CRS.Simple`, tratando a planta como um plano cartesiano
// (não um mapa geográfico com tiles) — técnica padrão para plantas/imagens
// estáticas. Componente reutilizável: a Fase 4 (locais) e a Fase 5 (grafo) vão
// usar os mesmos `markers` e `onMapClick` para criar POIs e nós.

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

interface MapViewProps {
  imageDataUrl: string;
  width: number;
  height: number;
  markers?: MapViewMarker[];
  onMapClick?: (point: Point) => void;
  onMarkerClick?: (markerId: string) => void;
  heightPx?: number;
}

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

function buildMarkerIcon(marker: MapViewMarker): L.DivIcon {
  const color = marker.color ?? '#0b5fa5';
  const size = 28;
  return L.divIcon({
    className: '', // sem a classe padrão do Leaflet (que traz fundo/borda quadrada)
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);">${marker.iconHtml ?? ''}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapView({
  imageDataUrl,
  width,
  height,
  markers = [],
  onMapClick,
  onMarkerClick,
  heightPx = 420,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Refs para os callbacks: evita recriar o mapa/marcadores só porque o pai
  // passou uma nova função entre renders.
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

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
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [imageDataUrl, width, height]);

  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markers.forEach((marker) => {
      const latLng = percentToLatLng(marker.position, width, height);
      const markerLayer = L.marker(latLng, { icon: buildMarkerIcon(marker) });
      if (marker.label) {
        markerLayer.bindTooltip(marker.label, { direction: 'top', offset: [0, -16] });
      }
      markerLayer.on('click', (event: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(event);
        onMarkerClickRef.current?.(marker.id);
      });
      markerLayer.addTo(layer);
    });
  }, [markers, width, height]);

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
