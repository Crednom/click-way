// Categorias "de fábrica" (seção 2.1/2.2 do spec). Categorias personalizadas
// criadas pelo admin não ficam aqui — são persistidas via storage.ts
// (getCategories() já mescla as duas listas). Ver Category em shared/types.

import type { Category } from '../types';

// Union fechada só para dar segurança de tipo ao escrever o objeto abaixo
// (evita erro de digitação num id) — não é exportada, porque o resto do app
// trabalha com `PoiCategory` (string livre, ver shared/types/index.ts).
type BuiltinCategoryId =
  | 'banheiro'
  | 'alimentacao'
  | 'bilheteria'
  | 'loja'
  | 'caixa_eletronico'
  | 'sala_espera'
  | 'guarda_volumes'
  | 'achados_e_perdidos'
  | 'elevador'
  | 'escada'
  | 'escada_rolante'
  | 'saida'
  | 'plataforma';

interface BuiltinMeta {
  label: string;
  color: string;
}

const BUILTIN_META: Record<BuiltinCategoryId, BuiltinMeta> = {
  banheiro: { label: 'Banheiro', color: '#0b5fa5' },
  alimentacao: { label: 'Alimentação', color: '#b5790b' },
  bilheteria: { label: 'Bilheteria', color: '#146356' },
  loja: { label: 'Loja', color: '#7c3aed' },
  caixa_eletronico: { label: 'Caixa eletrônico', color: '#0f766e' },
  sala_espera: { label: 'Sala de espera', color: '#334155' },
  guarda_volumes: { label: 'Guarda-volumes', color: '#92400e' },
  achados_e_perdidos: { label: 'Achados e perdidos', color: '#9333ea' },
  elevador: { label: 'Elevador', color: '#475569' },
  escada: { label: 'Escada', color: '#475569' },
  escada_rolante: { label: 'Escada rolante', color: '#475569' },
  saida: { label: 'Saída', color: '#b3261e' },
  plataforma: { label: 'Plataforma', color: '#a8380d' },
};

export const BUILTIN_CATEGORIES: Category[] = (
  Object.keys(BUILTIN_META) as BuiltinCategoryId[]
).map((id) => ({
  id,
  label: BUILTIN_META[id].label,
  color: BUILTIN_META[id].color,
  isCustom: false,
}));
