// Lista de viagens disponíveis, pra escolher a viagem ativa do passageiro
// (adicionado depois da Fase 10 — como não há fluxo de compra de passagem
// no MVP, esta é a forma de simular "eu comprei esta passagem" durante
// demonstrações). Mesmo padrão visual (bottom sheet) dos outros modais.

import { TRIP_STATUS_META } from '../../shared/lib/tripStatus';
import { Z_INDEX } from '../../shared/lib/zIndex';
import type { Poi, Trip } from '../../shared/types';

interface TripSelectorModalProps {
  trips: Trip[];
  platformPois: Poi[];
  activeTripId: string | null;
  onSelect: (tripId: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function TripSelectorModal({ trips, platformPois, activeTripId, onSelect, onClear, onClose }: TripSelectorModalProps) {
  function platformName(platformId: string): string {
    return platformPois.find((poi) => poi.id === platformId)?.name ?? 'Plataforma removida';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 33, 61, 0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: Z_INDEX.modal,
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          borderRadius: '20px 20px 0 0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxHeight: '80dvh',
          overflowY: 'auto',
        }}
      >
        <div
          aria-hidden="true"
          style={{ width: '40px', height: '4px', background: 'var(--color-border)', borderRadius: '999px', margin: '0 auto' }}
        />

        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Selecionar minha viagem</h2>

        {trips.length === 0 && (
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
            Nenhuma viagem cadastrada pelo administrador ainda.
          </p>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trips.map((trip) => {
            const statusMeta = TRIP_STATUS_META[trip.status];
            const isActive = trip.id === activeTripId;
            return (
              <li key={trip.id}>
                <button
                  type="button"
                  onClick={() => onSelect(trip.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isActive ? '2px solid #ffb300' : '1px solid var(--color-border)',
                    background: isActive ? '#fff8e6' : 'var(--color-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>
                      {isActive && '★ '}
                      {trip.company}
                    </strong>
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{platformName(trip.platformId)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {activeTripId && (
          <button
            type="button"
            onClick={onClear}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-severity-urgente)', fontSize: '0.85rem', padding: '4px' }}
          >
            Remover viagem ativa
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '12px',
            fontWeight: 600,
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

export default TripSelectorModal;
