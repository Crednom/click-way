// Ficha de informações da viagem (seção 2.2 do spec: "Ao tocar na
// plataforma: Empresa, Destino, Horário, Status"). Bottom sheet com um botão
// pra ainda assim traçar rota até aquela plataforma, se o passageiro quiser.
//
// Adicionado depois da Fase 10: botão "Selecionar como minha viagem" — como
// não há fluxo de compra de passagem no MVP, esta é uma das duas formas de
// definir a viagem ativa do passageiro (a outra é o TripSelectorModal, uma
// lista com todas as viagens).

import { TRIP_STATUS_META } from '../../shared/lib/tripStatus';
import { Z_INDEX } from '../../shared/lib/zIndex';
import type { Poi, Trip } from '../../shared/types';

interface TripInfoSheetProps {
  platform: Poi;
  trip: Trip;
  isActive: boolean;
  onTraceRoute: () => void;
  onSetActive: () => void;
  onClose: () => void;
}

function TripInfoSheet({ platform, trip, isActive, onTraceRoute, onSetActive, onClose }: TripInfoSheetProps) {
  const statusMeta = TRIP_STATUS_META[trip.status];

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
        }}
      >
        <div
          aria-hidden="true"
          style={{ width: '40px', height: '4px', background: 'var(--color-border)', borderRadius: '999px', margin: '0 auto' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{platform.name}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{trip.company}</span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: statusMeta.color,
              background: `${statusMeta.color}1a`,
              padding: '4px 12px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}
          >
            {statusMeta.label}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.9rem' }}>
            <strong>Destino:</strong> {trip.destination}
          </span>
          <span style={{ fontSize: '0.9rem' }}>
            <strong>Horário:</strong> {trip.time}
          </span>
        </div>

        {isActive ? (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: '#b58600',
              fontWeight: 600,
            }}
          >
            ★ Esta é a sua viagem ativa
          </span>
        ) : (
          <button
            type="button"
            onClick={onSetActive}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              color: 'var(--color-text)',
              fontWeight: 600,
            }}
          >
            ★ Selecionar como minha viagem
          </button>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onTraceRoute}
            style={{
              flex: 1,
              background: 'var(--color-passenger)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 600,
            }}
          >
            Traçar rota até aqui
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
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
    </div>
  );
}

export default TripInfoSheet;
