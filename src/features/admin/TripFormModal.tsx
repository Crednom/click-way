// Formulário de criar/editar viagem (seção 2.1 do spec: "podemos configurar
// plataforma; notificações de atraso, cancelamento, embarque iniciado,
// embarque encerrado, troca de plataforma"). Bottom sheet, mesmo padrão do
// PoiFormModal.tsx.

import { useState } from 'react';
import { TRIP_STATUS_META, TRIP_STATUSES } from '../../shared/lib/tripStatus';
import { Z_INDEX } from '../../shared/lib/zIndex';
import type { Poi, Trip } from '../../shared/types';

export interface TripFormValues {
  company: string;
  destination: string;
  time: string;
  platformId: string;
  status: Trip['status'];
}

interface TripFormModalProps {
  initial?: TripFormValues;
  platformOptions: Poi[];
  isEditing: boolean;
  onSave: (values: TripFormValues) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function TripFormModal({ initial, platformOptions, isEditing, onSave, onDelete, onClose }: TripFormModalProps) {
  const [company, setCompany] = useState(initial?.company ?? '');
  const [destination, setDestination] = useState(initial?.destination ?? '');
  const [time, setTime] = useState(initial?.time ?? '');
  const [platformId, setPlatformId] = useState(initial?.platformId ?? platformOptions[0]?.id ?? '');
  const [status, setStatus] = useState<Trip['status']>(initial?.status ?? 'no_horario');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!company.trim() || !destination.trim() || !time || !platformId) return;
    onSave({ company: company.trim(), destination: destination.trim(), time, platformId, status });
  }

  const canSubmit = company.trim() && destination.trim() && time && platformId;

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
      <form
        onSubmit={handleSubmit}
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
          maxHeight: '85dvh',
          overflowY: 'auto',
        }}
      >
        <div
          aria-hidden="true"
          style={{ width: '40px', height: '4px', background: 'var(--color-border)', borderRadius: '999px', margin: '0 auto' }}
        />

        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{isEditing ? 'Editar viagem' : 'Nova viagem'}</h2>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
          Empresa
          <input
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="ex: Gontijo"
            autoFocus
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
          Destino
          <input
            type="text"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="ex: São Paulo"
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
          Horário
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
          Plataforma
          <select
            value={platformId}
            onChange={(event) => setPlatformId(event.target.value)}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: 'var(--color-surface)' }}
          >
            {platformOptions.map((poi) => (
              <option key={poi.id} value={poi.id}>
                {poi.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Trip['status'])}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: 'var(--color-surface)' }}
          >
            {TRIP_STATUSES.map((value) => (
              <option key={value} value={value}>
                {TRIP_STATUS_META[value].label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              flex: 1,
              background: 'var(--color-admin)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 600,
              opacity: canSubmit ? 1 : 0.5,
            }}
          >
            Salvar
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
            Cancelar
          </button>
        </div>

        {isEditing && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-severity-urgente)', fontSize: '0.85rem', padding: '4px' }}
          >
            Excluir viagem
          </button>
        )}
      </form>
    </div>
  );
}

export default TripFormModal;
