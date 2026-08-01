// Ferramenta de configuração de escala (seção 2.1 do spec: "Configurar
// escala"). Componente controlado pela tela que o usa (admin/MapUpload.tsx),
// que é quem escuta os cliques no MapView e decide o que fazer com cada um —
// este componente só mostra o status atual e recebe a distância real digitada.

import { useState, type CSSProperties } from 'react';
import type { MapScale } from '../../shared/types';

export type ScalePickingState = 'idle' | 'picking-a' | 'picking-b' | 'awaiting-distance';

interface MapScaleToolProps {
  scale?: MapScale;
  pickingState: ScalePickingState;
  onStartPicking: () => void;
  onCancel: () => void;
  onConfirmDistance: (meters: number) => void;
}

function MapScaleTool({
  scale,
  pickingState,
  onStartPicking,
  onCancel,
  onConfirmDistance,
}: MapScaleToolProps) {
  const [distanceInput, setDistanceInput] = useState('');

  function handleConfirm() {
    const meters = Number(distanceInput.replace(',', '.'));
    if (!Number.isFinite(meters) || meters <= 0) return;
    onConfirmDistance(meters);
    setDistanceInput('');
  }

  const boxStyle: CSSProperties = {
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  if (pickingState === 'idle') {
    return (
      <div style={boxStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem' }}>Escala</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              {scale
                ? `Referência: ${scale.realDistanceMeters} m entre os dois pontos marcados`
                : 'Ainda não configurada — as instruções de rota não terão distância real até isso ser feito.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onStartPicking}
            style={{
              background: 'var(--color-admin)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {scale ? 'Alterar escala' : 'Configurar escala'}
          </button>
        </div>
      </div>
    );
  }

  if (pickingState === 'picking-a' || pickingState === 'picking-b') {
    return (
      <div style={{ ...boxStyle, borderColor: 'var(--color-admin)', background: 'var(--color-admin-bg)' }}>
        <span style={{ fontSize: '0.9rem' }}>
          {pickingState === 'picking-a'
            ? 'Toque no mapa no primeiro ponto de referência.'
            : 'Agora toque no segundo ponto de referência.'}
        </span>
        <button
          type="button"
          onClick={onCancel}
          style={{
            alignSelf: 'flex-start',
            background: 'transparent',
            border: '1px solid var(--color-admin)',
            color: 'var(--color-admin)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.8rem',
          }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  // awaiting-distance
  return (
    <div style={{ ...boxStyle, borderColor: 'var(--color-admin)', background: 'var(--color-admin-bg)' }}>
      <label style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        Distância real entre os dois pontos (em metros)
        <input
          type="number"
          inputMode="decimal"
          min="0.1"
          step="0.1"
          value={distanceInput}
          onChange={(event) => setDistanceInput(event.target.value)}
          placeholder="ex: 12.5"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '1rem',
          }}
        />
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!distanceInput}
          style={{
            background: 'var(--color-admin)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '0.85rem',
            fontWeight: 600,
            opacity: distanceInput ? 1 : 0.5,
          }}
        >
          Confirmar
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-admin)',
            color: 'var(--color-admin)',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '0.85rem',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default MapScaleTool;
