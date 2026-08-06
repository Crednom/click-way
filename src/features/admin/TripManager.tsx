// Tela de admin "Viagens" (seção 2.1 do spec). Plataforma aqui é um Poi com
// category === 'plataforma' (ver DESVIO em shared/types/index.ts — Sector/
// Platform como entidades separadas foram removidas).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../../shared/components/AppHeader';
import TripFormModal, { type TripFormValues } from './TripFormModal';
import { getPois, getTrips, saveTrip, deleteTrip } from '../../shared/lib/storage';
import { generateId } from '../../shared/lib/id';
import { TRIP_STATUS_META } from '../../shared/lib/tripStatus';
import type { Poi, Trip } from '../../shared/types';

function TripManager() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [platformPois, setPlatformPois] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  useEffect(() => {
    setTrips(getTrips());
    setPlatformPois(getPois().filter((poi) => poi.category === 'plataforma'));
    setLoading(false);
  }, []);

  function refresh() {
    setTrips(getTrips());
  }

  function getPlatformName(platformId: string): string {
    return platformPois.find((poi) => poi.id === platformId)?.name ?? 'Plataforma removida';
  }

  function handleCreate(values: TripFormValues) {
    saveTrip({ id: generateId(), ...values });
    refresh();
    setCreating(false);
  }

  function handleUpdate(values: TripFormValues) {
    if (!editingTrip) return;
    saveTrip({ ...editingTrip, ...values });
    refresh();
    setEditingTrip(null);
  }

  function handleDelete() {
    if (!editingTrip) return;
    deleteTrip(editingTrip.id);
    refresh();
    setEditingTrip(null);
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader title="Viagens" accentColor="var(--color-admin)" />
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

        {!loading && platformPois.length === 0 && (
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              color: 'var(--color-muted)',
            }}
          >
            <p style={{ marginTop: 0 }}>
              Cadastre pelo menos uma plataforma (categoria "Plataforma") em Locais antes de criar viagens.
            </p>
            <Link
              to="/admin/locais"
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
              Ir para Locais
            </Link>
          </div>
        )}

        {!loading && platformPois.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                {trips.length} viagem(ns) cadastrada(s)
              </span>
              <button
                type="button"
                onClick={() => setCreating(true)}
                style={{
                  background: 'var(--color-admin)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Nova viagem
              </button>
            </div>

            {trips.length === 0 && (
              <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '24px 0' }}>
                Nenhuma viagem cadastrada ainda.
              </p>
            )}

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trips.map((trip) => {
                const statusMeta = TRIP_STATUS_META[trip.status];
                return (
                  <li key={trip.id}>
                    <button
                      type="button"
                      onClick={() => setEditingTrip(trip)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{trip.company}</strong>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: statusMeta.color,
                            background: `${statusMeta.color}1a`,
                            padding: '2px 10px',
                            borderRadius: '999px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
                        {trip.destination} — {trip.time}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        {getPlatformName(trip.platformId)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>

      {creating && (
        <TripFormModal
          isEditing={false}
          platformOptions={platformPois}
          onSave={handleCreate}
          onClose={() => setCreating(false)}
        />
      )}

      {editingTrip && (
        <TripFormModal
          isEditing
          platformOptions={platformPois}
          initial={{
            company: editingTrip.company,
            destination: editingTrip.destination,
            time: editingTrip.time,
            platformId: editingTrip.platformId,
            status: editingTrip.status,
          }}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setEditingTrip(null)}
        />
      )}
    </div>
  );
}

export default TripManager;
