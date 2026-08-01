// Ícone por categoria de POI. Separado de poiCategories.ts porque precisa de
// JSX (react-icons), enquanto o outro arquivo é só dados puros reutilizáveis
// fora de componentes React.
//
// Categorias personalizadas (criadas pelo admin, ver Fase 4 revisão) não têm
// ícone próprio — caem no ícone genérico `FaLocationDot`. Se o POI tiver um
// `iconUrl` customizado (foto/ícone enviado pelo admin), ele tem prioridade
// sobre qualquer ícone de categoria — ver `renderPoiIconHtml` em
// shared/lib/poiIconHtml.tsx (fica em outro arquivo para este componente só
// exportar o componente em si — fast refresh do Vite exige isso).

import type { ComponentType } from 'react';
import {
  FaRestroom,
  FaUtensils,
  FaTicket,
  FaStore,
  FaMoneyBillWave,
  FaChair,
  FaSuitcaseRolling,
  FaMagnifyingGlass,
  FaElevator,
  FaStairs,
  FaArrowsUpDown,
  FaDoorOpen,
  FaBus,
  FaLocationDot,
} from 'react-icons/fa6';
import type { PoiCategory } from '../types';

const ICON_BY_CATEGORY: Record<string, ComponentType> = {
  banheiro: FaRestroom,
  alimentacao: FaUtensils,
  bilheteria: FaTicket,
  loja: FaStore,
  caixa_eletronico: FaMoneyBillWave,
  sala_espera: FaChair,
  guarda_volumes: FaSuitcaseRolling,
  achados_e_perdidos: FaMagnifyingGlass,
  elevador: FaElevator,
  escada: FaStairs,
  escada_rolante: FaArrowsUpDown,
  saida: FaDoorOpen,
  plataforma: FaBus,
};

const DEFAULT_POI_ICON: ComponentType = FaLocationDot;

interface PoiCategoryIconProps {
  category: PoiCategory;
}

function PoiCategoryIcon({ category }: PoiCategoryIconProps) {
  const IconComponent = ICON_BY_CATEGORY[category] ?? DEFAULT_POI_ICON;
  return <IconComponent />;
}

export default PoiCategoryIcon;
