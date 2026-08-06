// Modelo de dados do Click Way — espelha a seção 5 do click-way-spec.md.
// Qualquer alteração aqui deve ser refletida no documento (ver seção 0.3 do spec).

export type UserRole = 'admin' | 'passenger';

export interface Floor {
  id: string;
  name: string; // ex: "Térreo" — preparado para o futuro, MVP usa só 1 registro
}

export interface MapImage {
  id: string;
  floorId: string; // MVP terá sempre 1 floor fixo (ver Floor acima)
  imageDataUrl: string; // salvo no IndexedDB
  width: number;
  height: number;
  scale?: MapScale;
}

// Escala: referência definida pelo admin (linha desenhada sobre o mapa)
export interface MapScale {
  pointA: Point;
  pointB: Point;
  realDistanceMeters: number;
  // fator derivado, calculado uma vez e cacheado:
  metersPerPercentUnit: number;
}

// Coordenadas sempre em PERCENTUAL (0-100) relativo à imagem, nunca pixel absoluto.
export interface Point {
  xPct: number;
  yPct: number;
}

// Categoria de local. Era uma union fechada de 13 valores fixos; virou um id
// de string livre porque tanto as 13 categorias "de fábrica" quanto as
// personalizadas (criadas pelo admin — ver `Category` abaixo, adicionado na
// revisão da Fase 4) circulam pelos mesmos campos (`Poi.category`,
// `PoiFormModal`, `PoiCategoryIcon` etc.). A lista dos 13 nomes de fábrica
// continua existindo, só que agora só internamente em poiCategories.ts (usada
// pra dar segurança de tipo ao escrever o seed inicial, sem vazar a union
// fechada pro resto do app).
export type PoiCategory = string;

// Categoria de local. As 13 "de fábrica" (PoiCategory acima) vêm prontas; o
// admin também pode criar categorias personalizadas (nome + cor), guardadas
// com `isCustom: true`. Adicionado a pedido do usuário durante a revisão da
// Fase 4 — não existia no spec original. Ver PROGRESS.md.
export interface Category {
  id: string;
  label: string;
  color: string;
  isCustom: boolean;
}

export interface Poi {
  id: string;
  floorId: string;
  name: string;
  // DESVIO da seção 5 original do spec (era `category: PoiCategory`, union
  // fechada): virou `string` para aceitar tanto as 13 categorias de fábrica
  // quanto categorias personalizadas criadas pelo admin (`Category.id`).
  // Ver PROGRESS.md.
  category: string;
  position: Point;
  iconUrl?: string;
  description?: string;
  // DESVIO da seção 5 original do spec (era `nearestNodeId: string`, obrigatório):
  // tornou-se opcional porque a Fase 4 (criação de POIs) roda antes da Fase 5
  // (criação do grafo) no roadmap — não existe nó nenhum ainda quando o
  // primeiro POI é criado. Fica undefined até a Fase 5 vincular. Decisão e
  // justificativa completa registradas no PROGRESS.md.
  nearestNodeId?: string;
}

export interface GraphNode {
  id: string;
  floorId: string;
  position: Point;
}

export interface GraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  weight: number; // custo usado pelo Dijkstra (baseado na distância real, via escala)
  type?: 'corredor' | 'escada' | 'escada_rolante' | 'elevador';
}

// DESVIO (Fase 10): `Sector` e `Platform` existiam como entidades separadas
// no modelo original, mas essa divisão nunca virou uma fase própria no
// roadmap (seção 11) — e desde a Fase 4 já existe a categoria de POI
// 'plataforma', totalmente funcional (nome, posição no mapa, QR Code). Ter
// "Platform" como uma segunda entidade representando a mesma coisa (um POI
// categoria plataforma, só que com um "label" separado do "nome") seria
// duplicar o mesmo conceito em dois lugares sem necessidade. Removidas —
// `Trip.platformId` abaixo agora referencia diretamente o id de um Poi
// (filtrado por `category === 'plataforma'` na tela de admin).

export interface Trip {
  id: string;
  company: string;
  destination: string;
  time: string;
  status:
    | 'no_horario'
    | 'atrasado'
    | 'cancelado'
    | 'embarque_iniciado'
    | 'embarque_encerrado';
  /** Id de um Poi com category === 'plataforma' (ver DESVIO acima). */
  platformId: string;
}

export type QrTargetType = 'poi' | 'node';

export interface QrCodeLink {
  id: string;
  code: string; // valor codificado no QR
  targetType: QrTargetType;
  targetId: string; // poiId ou nodeId, conforme targetType
}

export type NotificationType =
  | 'atraso'
  | 'cancelamento'
  | 'embarque_iniciado'
  | 'embarque_encerrado'
  | 'troca_plataforma';

export type NotificationSeverity = 'informacao' | 'atencao' | 'urgente';

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  message: string;
  tripId?: string;
  createdAt: number;
  read: boolean;
}
