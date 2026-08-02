// Formulário de criar/editar aresta (seção 2.1 do spec: "criar conexões,
// alterar peso das conexões"). Painel inline, mesmo padrão visual do
// MapScaleTool.tsx — não é um bottom sheet cheio, é um cartão pequeno que
// aparece logo abaixo do mapa quando dois nós são selecionados.

import { useState } from 'react';
import { Z_INDEX } from '../../shared/lib/zIndex';
import type { GraphEdge } from '../../shared/types';

const EDGE_TYPES: { value: NonNullable<GraphEdge['type']>; label: string }[] = [
  { value: 'corredor', label: 'Corredor' },
  { value: 'escada', label: 'Escada' },
  { value: 'escada_rolante', label: 'Escada rolante' },
  { value: 'elevador', label: 'Elevador' },
];

interface EdgeWeightFormProps {
  /** Peso sugerido (calculado pela distância real entre os nós, se a escala estiver configurada). */
  suggestedWeight: number;
  suggestionNote?: string;
  isEditing: boolean;
  initialWeight?: number;
  initialType?: GraphEdge['type'];
  onConfirm: (weight: number, type: GraphEdge['type']) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

function EdgeWeightForm({
  suggestedWeight,
  suggestionNote,
  isEditing,
  initialWeight,
  initialType,
  onConfirm,
  onDelete,
  onCancel,
}: EdgeWeightFormProps) {
  const [weightInput, setWeightInput] = useState(
    String(initialWeight ?? Math.round(suggestedWeight * 10) / 10),
  );
  const [type, setType] = useState<GraphEdge['type']>(initialType ?? 'corredor');

  function handleConfirm() {
    const weight = Number(weightInput.replace(',', '.'));
    if (!Number.isFinite(weight) || weight <= 0) return;
    onConfirm(weight, type);
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: Z_INDEX.modal,
        display: 'flex',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <strong style={{ fontSize: '0.95rem' }}>
          {isEditing ? 'Editar conexão' : 'Nova conexão'}
        </strong>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
          Peso (distância, em metros)
          <input
            type="number"
            inputMode="decimal"
            min="0.1"
            step="0.1"
            value={weightInput}
            onChange={(event) => setWeightInput(event.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '1rem',
            }}
          />
          {suggestionNote && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{suggestionNote}</span>
          )}
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
          Tipo
          <select
            value={type}
            onChange={(event) => setType(event.target.value as GraphEdge['type'])}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '0.95rem',
              background: 'var(--color-surface)',
            }}
          >
            {EDGE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!weightInput}
            style={{
              flex: 1,
              background: 'var(--color-admin)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 600,
              opacity: weightInput ? 1 : 0.5,
            }}
          >
            {isEditing ? 'Salvar' : 'Conectar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>
        </div>

        {isEditing && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-severity-urgente)',
              fontSize: '0.85rem',
              padding: '4px',
            }}
          >
            Remover conexão
          </button>
        )}
      </div>
    </div>
  );
}

export default EdgeWeightForm;
