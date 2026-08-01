// Tela de admin "Locais" (seção 2.1 do spec: adicionar clicando no mapa,
// editar, excluir, categoria, ícone — via categoria, ver poiCategories.ts —,
// nome, descrição).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../../shared/components/AppHeader';
import PoiCategoryIcon from '../../shared/components/PoiCategoryIcon';
import { renderPoiIconHtml } from '../../shared/lib/poiIconHtml';
import MapView, { type MapViewMarker } from '../map/MapView';
import PoiFormModal, { type PoiFormValues } from './PoiFormModal';
import { getMap, getPois, savePoi, deletePoi, getDefaultFloor, getCategories } from '../../shared/lib/storage';
import { generateId } from '../../shared/lib/id';
import type { Category, MapImage, Point, Poi } from '../../shared/types';

function PoiEditor() {
  const [map, setMap] = useState<MapImage | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [addingMode, setAddingMode] = useState(false);
  const [draftPosition, setDraftPosition] = useState<Point | null>(null);
  const [editingPoi, setEditingPoi] = useState<Poi | null>(null);

  useEffect(() => {
    getMap()
      .then(setMap)
      .finally(() => setLoading(false));
    setPois(getPois());
    setCategories(getCategories());
  }, []);

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

  function refreshPois() {
    setPois(getPois());
    setCategories(getCategories());
  }

  function handleMapClick(point: Point) {
    if (!addingMode) return;
    setDraftPosition(point);
  }

  function handleMarkerClick(markerId: string) {
    const poi = pois.find((item) => item.id === markerId);
    if (poi) setEditingPoi(poi);
  }

  function handleCreate(values: PoiFormValues) {
    if (!draftPosition) return;
    const poi: Poi = {
      id: generateId(),
      floorId: getDefaultFloor().id,
      position: draftPosition,
      ...values,
    };
    savePoi(poi);
    refreshPois();
    setDraftPosition(null);
    setAddingMode(false);
  }

  function handleUpdate(values: PoiFormValues) {
    if (!editingPoi) return;
    savePoi({ ...editingPoi, ...values });
    refreshPois();
    setEditingPoi(null);
  }

  function handleDelete() {
    if (!editingPoi) return;
    deletePoi(editingPoi.id);
    refreshPois();
    setEditingPoi(null);
  }

  const markers: MapViewMarker[] = pois.map((poi) => ({
    id: poi.id,
    position: poi.position,
    color: getCategoryMeta(poi.category).color,
    label: poi.name,
    iconHtml: renderPoiIconHtml(poi),
  }));

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader title="Locais" accentColor="var(--color-admin)" />
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
            <p style={{ marginTop: 0 }}>Cadastre o mapa da rodoviária antes de adicionar locais.</p>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                {addingMode ? 'Toque no mapa para posicionar o novo local.' : `${pois.length} local(is) cadastrado(s)`}
              </span>
              <button
                type="button"
                onClick={() => setAddingMode((current) => !current)}
                style={{
                  background: addingMode ? 'transparent' : 'var(--color-admin)',
                  color: addingMode ? 'var(--color-admin)' : '#fff',
                  border: addingMode ? '1px solid var(--color-admin)' : 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {addingMode ? 'Cancelar' : 'Adicionar local'}
              </button>
            </div>

            <MapView
              imageDataUrl={map.imageDataUrl}
              width={map.width}
              height={map.height}
              markers={markers}
              onMapClick={handleMapClick}
              onMarkerClick={handleMarkerClick}
            />

            {pois.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pois.map((poi) => {
                  const meta = getCategoryMeta(poi.category);
                  return (
                    <li key={poi.id}>
                      <button
                        type="button"
                        onClick={() => setEditingPoi(poi)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-surface)',
                          textAlign: 'left',
                        }}
                      >
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: meta.color,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          {poi.iconUrl ? (
                            <img src={poi.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <PoiCategoryIcon category={poi.category} />
                          )}
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{poi.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{meta.label}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>

      {draftPosition && (
        <PoiFormModal
          isEditing={false}
          onSave={handleCreate}
          onClose={() => setDraftPosition(null)}
        />
      )}

      {editingPoi && (
        <PoiFormModal
          isEditing
          initial={{
            name: editingPoi.name,
            category: editingPoi.category,
            description: editingPoi.description ?? '',
            iconUrl: editingPoi.iconUrl,
          }}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setEditingPoi(null)}
        />
      )}
    </div>
  );
}

export default PoiEditor;
