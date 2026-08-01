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
}

interface MapViewProps {
  imageDataUrl: string;
  width: number;
  height: number;
  markers?: MapViewMarker[];
  onMapClick?: (point: Point) => void;
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

function MapView({
  imageDataUrl,
  width,
  height,
  markers = [],
  onMapClick,
  heightPx = 420,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Ref para o callback: evita recriar o mapa inteiro só porque o pai passou
  // uma nova função de clique entre renders.
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

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
      const circle = L.circleMarker(latLng, {
        radius: 9,
        color: marker.color ?? '#0b5fa5',
        weight: 2,
        fillColor: marker.color ?? '#0b5fa5',
        fillOpacity: 0.9,
      });
      if (marker.label) {
        circle.bindTooltip(marker.label, { direction: 'top', offset: [0, -8] });
      }
      circle.addTo(layer);
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
