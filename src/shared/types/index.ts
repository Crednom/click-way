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

export type PoiCategory =
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

export interface Poi {
  id: string;
  floorId: string;
  name: string;
  category: PoiCategory;
  position: Point;
  iconUrl?: string;
  description?: string;
  nearestNodeId: string; // vínculo obrigatório com um nó do grafo
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

export interface Sector {
  id: string;
  name: string; // ex: "Setor A"
  platformIds: string[];
}

export interface Platform {
  id: string;
  label: string; // ex: "A1"
  poiId: string;
}

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
