// Tela de admin "Mapa e escala" (seção 2.1 do spec). Orquestra:
// - upload/troca da planta (via shared/lib/image.ts + storage.saveMap)
// - exibição da planta (features/map/MapView.tsx)
// - configuração de escala (features/map/MapScaleTool.tsx), controlando aqui
//   a máquina de estados de "escolher ponto A → ponto B → digitar distância",
//   porque é a página quem recebe os cliques do MapView.

import { useEffect, useState } from 'react';
import AppHeader from '../../shared/components/AppHeader';
import MapView, { type MapViewMarker } from '../map/MapView';
import MapScaleTool, { type ScalePickingState } from '../map/MapScaleTool';
import { getMap, saveMap } from '../../shared/lib/storage';
import { loadAndCompressImage } from '../../shared/lib/image';
import { computeScale } from '../../shared/lib/coordinates';
import type { MapImage, Point } from '../../shared/types';

function MapUpload() {
  const [map, setMap] = useState<MapImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pickingState, setPickingState] = useState<ScalePickingState>('idle');
  const [pointA, setPointA] = useState<Point | null>(null);
  const [pointB, setPointB] = useState<Point | null>(null);

  useEffect(() => {
    getMap()
      .then(setMap)
      .catch(() => setError('Não foi possível carregar o mapa salvo.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite re-selecionar o mesmo arquivo depois
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const { dataUrl, width, height } = await loadAndCompressImage(file);
      // Trocar a planta invalida a escala anterior (a geometria mudou).
      const newMap: MapImage = {
        id: 'map-default',
        floorId: 'floor-default',
        imageDataUrl: dataUrl,
        width,
        height,
        scale: undefined,
      };
      await saveMap(newMap);
      setMap(newMap);
      resetScalePicking();
    } catch {
      setError('Não foi possível carregar essa imagem. Tente outro arquivo.');
    } finally {
      setUploading(false);
    }
  }

  function resetScalePicking() {
    setPickingState('idle');
    setPointA(null);
    setPointB(null);
  }

  function handleMapClick(point: Point) {
    if (pickingState === 'picking-a') {
      setPointA(point);
      setPickingState('picking-b');
    } else if (pickingState === 'picking-b') {
      setPointB(point);
      setPickingState('awaiting-distance');
    }
  }

  async function handleConfirmDistance(meters: number) {
    if (!map || !pointA || !pointB) return;
    const scale = computeScale(pointA, pointB, meters);
    const updatedMap: MapImage = { ...map, scale };
    await saveMap(updatedMap);
    setMap(updatedMap);
    resetScalePicking();
  }

  const scaleMarkers: MapViewMarker[] = [];
  if (pointA) scaleMarkers.push({ id: 'scale-point-a', position: pointA, color: '#a8380d', label: 'Ponto A' });
  if (pointB) scaleMarkers.push({ id: 'scale-point-b', position: pointB, color: '#a8380d', label: 'Ponto B' });

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader title="Mapa e escala" accentColor="var(--color-admin)" />
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
              border: '2px dashed var(--color-border)',
              borderRadius: '12px',
              padding: '32px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <p style={{ margin: 0, color: 'var(--color-muted)' }}>
              Nenhuma planta cadastrada ainda. Envie uma imagem da rodoviária.
            </p>
            <label
              style={{
                background: 'var(--color-admin)',
                color: '#fff',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              {uploading ? 'Enviando...' : 'Selecionar imagem'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}

        {map && (
          <>
            <MapView
              imageDataUrl={map.imageDataUrl}
              width={map.width}
              height={map.height}
              markers={scaleMarkers}
              onMapClick={handleMapClick}
            />

            <MapScaleTool
              scale={map.scale}
              pickingState={pickingState}
              onStartPicking={() => setPickingState('picking-a')}
              onCancel={resetScalePicking}
              onConfirmDistance={handleConfirmDistance}
            />

            <label
              style={{
                alignSelf: 'flex-start',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.85rem',
              }}
            >
              {uploading ? 'Enviando...' : 'Alterar planta'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </>
        )}

        {error && <p style={{ color: 'var(--color-severity-urgente)' }}>{error}</p>}
      </main>
    </div>
  );
}

export default MapUpload;
