// Camada única de acesso a dados locais (seção 4 do click-way-spec.md).
//
// Regra do spec: NENHUM componente deve chamar localStorage/indexedDB diretamente.
// Todo acesso a dados passa por aqui.
//
// - IndexedDB (via `idb`): dados grandes — a imagem do mapa (base64/blob).
// - localStorage: dados estruturados menores (POIs, nós, arestas, QR codes,
//   plataformas, viagens, notificações, escala), serializados em JSON.
//
// FASE 1: apenas a infraestrutura genérica de leitura/escrita foi implementada.
// FASE 3: mapa/escala e o Floor fixo foram implementados (ver seção abaixo).
// As demais funções de domínio (getPois, getGraphNodes...) continuam como
// stubs — cada uma será preenchida na fase do roadmap (seção 11) responsável
// por aquela funcionalidade. Isso evita implementar regras de negócio antes da
// tela que as usa existir.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  AppNotification,
  Category,
  Floor,
  GraphEdge,
  GraphNode,
  MapImage,
  Poi,
  QrCodeLink,
  Trip,
} from '../types';
import { BUILTIN_CATEGORIES } from './poiCategories';

// ---------------------------------------------------------------------------
// IndexedDB — usado apenas para a imagem do mapa (pode passar de 5-10MB em base64,
// o que estoura o limite prático do localStorage).
// ---------------------------------------------------------------------------

const DB_NAME = 'click-way-db';
const DB_VERSION = 1;
const MAP_IMAGES_STORE = 'mapImages';

interface ClickWayDB extends DBSchema {
  [MAP_IMAGES_STORE]: {
    key: string;
    value: MapImage;
  };
}

let dbPromise: Promise<IDBPDatabase<ClickWayDB>> | null = null;

function getDb(): Promise<IDBPDatabase<ClickWayDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ClickWayDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(MAP_IMAGES_STORE)) {
          db.createObjectStore(MAP_IMAGES_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// localStorage — helpers genéricos de leitura/escrita em JSON.
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'clickway:';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Dado corrompido ou inacessível: nunca deixar a UI quebrar por causa disso.
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

/**
 * Registra um listener para o evento nativo `storage`, disparado quando o
 * localStorage é alterado em OUTRA aba do mesmo navegador. Usado pela seção 4
 * do spec para simular o recebimento de notificações do admin no perfil do
 * passageiro, quando os dois estão em abas diferentes do mesmo dispositivo.
 * Retorna uma função de cleanup (para usar dentro de useEffect).
 */
export function onExternalStorageChange(callback: () => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key && event.key.startsWith(STORAGE_PREFIX)) {
      callback();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

// ---------------------------------------------------------------------------
// Floor — MVP usa sempre um único andar fixo (seção 9 do spec: o campo
// `floorId` existe no modelo para o futuro, mas não implementamos seletor de
// andares nesta entrega). Criado automaticamente na primeira leitura.
// ---------------------------------------------------------------------------

const DEFAULT_FLOOR_ID = 'floor-default';

export function getDefaultFloor(): Floor {
  const existing = readJson<Floor | null>('floor', null);
  if (existing) return existing;
  const floor: Floor = { id: DEFAULT_FLOOR_ID, name: 'Térreo' };
  writeJson('floor', floor);
  return floor;
}

// ---------------------------------------------------------------------------
// Mapa (imagem + escala) — implementado na Fase 3.
// MVP tem um único mapa (um único andar), então a imagem é sempre salva sob a
// mesma chave fixa no IndexedDB.
// ---------------------------------------------------------------------------

const MAP_IMAGE_ID = 'map-default';

export async function getMap(): Promise<MapImage | null> {
  const db = await getDb();
  const map = await db.get(MAP_IMAGES_STORE, MAP_IMAGE_ID);
  return map ?? null;
}

export async function saveMap(map: MapImage): Promise<void> {
  const db = await getDb();
  await db.put(MAP_IMAGES_STORE, { ...map, id: MAP_IMAGE_ID });
}

// ---------------------------------------------------------------------------
// Locais (POIs) — implementado na Fase 4.
// ---------------------------------------------------------------------------

const POIS_KEY = 'pois';

export function getPois(): Poi[] {
  return readJson<Poi[]>(POIS_KEY, []);
}

export function savePoi(poi: Poi): void {
  const pois = getPois();
  const index = pois.findIndex((existing) => existing.id === poi.id);
  if (index >= 0) {
    pois[index] = poi;
  } else {
    pois.push(poi);
  }
  writeJson(POIS_KEY, pois);
}

export function deletePoi(poiId: string): void {
  const pois = getPois().filter((poi) => poi.id !== poiId);
  writeJson(POIS_KEY, pois);
}

// ---------------------------------------------------------------------------
// Categorias — as 13 "de fábrica" (poiCategories.ts) + as personalizadas
// criadas pelo admin (nome + cor). Adicionado a pedido do usuário durante a
// revisão da Fase 4 (não existia no spec original) — ver PROGRESS.md.
// ---------------------------------------------------------------------------

const CUSTOM_CATEGORIES_KEY = 'categories:custom';

function getCustomCategories(): Category[] {
  return readJson<Category[]>(CUSTOM_CATEGORIES_KEY, []);
}

/** Categorias de fábrica + personalizadas, prontas para exibir num seletor. */
export function getCategories(): Category[] {
  return [...BUILTIN_CATEGORIES, ...getCustomCategories()];
}

export function saveCustomCategory(category: Category): void {
  const custom = getCustomCategories();
  const index = custom.findIndex((existing) => existing.id === category.id);
  if (index >= 0) {
    custom[index] = category;
  } else {
    custom.push(category);
  }
  writeJson(CUSTOM_CATEGORIES_KEY, custom);
}

// ---------------------------------------------------------------------------
// Grafo (nós e arestas) — implementado na Fase 5.
// ---------------------------------------------------------------------------

const GRAPH_NODES_KEY = 'graphNodes';
const GRAPH_EDGES_KEY = 'graphEdges';

export function getGraphNodes(): GraphNode[] {
  return readJson<GraphNode[]>(GRAPH_NODES_KEY, []);
}

export function saveGraphNode(node: GraphNode): void {
  const nodes = getGraphNodes();
  const index = nodes.findIndex((existing) => existing.id === node.id);
  if (index >= 0) {
    nodes[index] = node;
  } else {
    nodes.push(node);
  }
  writeJson(GRAPH_NODES_KEY, nodes);
}

/**
 * Remove um nó e faz a limpeza em cascata: apaga as arestas que o usavam e
 * desvincula (`nearestNodeId = undefined`) qualquer POI que apontava pra ele.
 * Não estava nos stubs originais da Fase 1 — adição da Fase 5, documentada no
 * PROGRESS.md.
 */
export function deleteGraphNode(nodeId: string): void {
  const nodes = getGraphNodes().filter((node) => node.id !== nodeId);
  writeJson(GRAPH_NODES_KEY, nodes);

  const edges = getGraphEdges().filter(
    (edge) => edge.fromNodeId !== nodeId && edge.toNodeId !== nodeId,
  );
  writeJson(GRAPH_EDGES_KEY, edges);

  const pois = getPois().map((poi) =>
    poi.nearestNodeId === nodeId ? { ...poi, nearestNodeId: undefined } : poi,
  );
  writeJson(POIS_KEY, pois);
}

export function getGraphEdges(): GraphEdge[] {
  return readJson<GraphEdge[]>(GRAPH_EDGES_KEY, []);
}

export function saveGraphEdge(edge: GraphEdge): void {
  const edges = getGraphEdges();
  const index = edges.findIndex((existing) => existing.id === edge.id);
  if (index >= 0) {
    edges[index] = edge;
  } else {
    edges.push(edge);
  }
  writeJson(GRAPH_EDGES_KEY, edges);
}

export function deleteGraphEdge(edgeId: string): void {
  const edges = getGraphEdges().filter((edge) => edge.id !== edgeId);
  writeJson(GRAPH_EDGES_KEY, edges);
}

// ---------------------------------------------------------------------------
// Viagens — implementado na Fase 10. `getSectors`/`getPlatforms` foram
// removidos daqui (não só deixados como stub) — ver DESVIO documentado em
// shared/types/index.ts: a divisão Sector/Platform nunca virou uma fase
// própria, e o POI categoria 'plataforma' (Fase 4) já cobre a mesma
// necessidade sem duplicar o conceito.
// ---------------------------------------------------------------------------

const TRIPS_KEY = 'trips';

export function getTrips(): Trip[] {
  return readJson<Trip[]>(TRIPS_KEY, []);
}

export function saveTrip(trip: Trip): void {
  const trips = getTrips();
  const index = trips.findIndex((existing) => existing.id === trip.id);
  if (index >= 0) {
    trips[index] = trip;
  } else {
    trips.push(trip);
  }
  writeJson(TRIPS_KEY, trips);
}

/** Não estava nos stubs originais — mesmo padrão de CRUD completo já usado nas demais entidades. */
export function deleteTrip(tripId: string): void {
  const trips = getTrips().filter((trip) => trip.id !== tripId);
  writeJson(TRIPS_KEY, trips);
}

// ---------------------------------------------------------------------------
// Viagem ativa do passageiro — adicionado depois da Fase 10, a pedido do
// usuário (não há fluxo de compra de passagem no MVP, então é preciso um
// jeito simples de "escolher" qual viagem é a sua). Guarda só o ID, nunca os
// dados da viagem em si — assim, se o admin editar a viagem (ex: trocar a
// plataforma), o passageiro sempre vê a versão mais recente na próxima
// leitura, sem precisar sincronizar nada manualmente.
// ---------------------------------------------------------------------------

const ACTIVE_TRIP_ID_KEY = 'activeTripId';

export function getActiveTripId(): string | null {
  return readJson<string | null>(ACTIVE_TRIP_ID_KEY, null);
}

export function setActiveTripId(tripId: string | null): void {
  writeJson(ACTIVE_TRIP_ID_KEY, tripId);
}

// ---------------------------------------------------------------------------
// QR Codes — implementado na Fase 9.
// ---------------------------------------------------------------------------

const QR_CODE_LINKS_KEY = 'qrCodeLinks';

export function getQrCodeLinks(): QrCodeLink[] {
  return readJson<QrCodeLink[]>(QR_CODE_LINKS_KEY, []);
}

export function saveQrCodeLink(link: QrCodeLink): void {
  const links = getQrCodeLinks();
  const index = links.findIndex((existing) => existing.id === link.id);
  if (index >= 0) {
    links[index] = link;
  } else {
    links.push(link);
  }
  writeJson(QR_CODE_LINKS_KEY, links);
}

/**
 * Não estava nos stubs originais da Fase 1 — adição da Fase 9, mesmo padrão
 * de CRUD completo já usado em POIs e no grafo (Fases 4/5).
 */
export function deleteQrCodeLink(linkId: string): void {
  const links = getQrCodeLinks().filter((link) => link.id !== linkId);
  writeJson(QR_CODE_LINKS_KEY, links);
}

// ---------------------------------------------------------------------------
// Notificações — implementação chega na Fase 11 (Notificações).
// ---------------------------------------------------------------------------

export function getNotifications(): AppNotification[] {
  throw new Error(
    'storage.getNotifications: não implementado ainda (ver Fase 11 do roadmap)',
  );
}

export function saveNotification(_notification: AppNotification): void {
  throw new Error(
    'storage.saveNotification: não implementado ainda (ver Fase 11 do roadmap)',
  );
}

export function markNotificationRead(_notificationId: string): void {
  throw new Error(
    'storage.markNotificationRead: não implementado ainda (ver Fase 11 do roadmap)',
  );
}

// As funções acima usam `getDb`, `readJson` e `writeJson` como infraestrutura de
// apoio quando forem implementadas — mantidas aqui já prontas para uso.
export const __internal = { getDb, readJson, writeJson };
