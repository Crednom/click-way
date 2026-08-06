// Metadados de status de viagem (seção 2.1/2.2 do spec). Centralizado aqui
// pelo mesmo motivo de poiCategories.ts — admin (TripManager) e passageiro
// (TripInfoSheet) usam os mesmos rótulos/cores.

import type { Trip } from '../types';

export interface TripStatusMeta {
  label: string;
  color: string;
}

export const TRIP_STATUS_META: Record<Trip['status'], TripStatusMeta> = {
  no_horario: { label: 'No horário', color: '#146356' },
  atrasado: { label: 'Atrasado', color: '#b5790b' },
  cancelado: { label: 'Cancelado', color: '#b3261e' },
  embarque_iniciado: { label: 'Embarque iniciado', color: '#0b5fa5' },
  embarque_encerrado: { label: 'Embarque encerrado', color: '#5c6b84' },
};

export const TRIP_STATUSES: Trip['status'][] = Object.keys(TRIP_STATUS_META) as Trip['status'][];
