// Camada única de acesso a dados locais (seção 4 do click-way-spec.md).
//
// Regra do spec: NENHUM componente deve chamar localStorage/indexedDB diretamente.
// Todo acesso a dados passa por aqui.
//
// - IndexedDB (via `idb`): dados grandes — a imagem do mapa (base64/blob).
// - localStorage: dados estruturados menores (POIs, nós, arestas, QR codes,
//   plataformas, viagens, notificações, escala), serializados em JSON.
//
// FASE 1 (atual): apenas a infraestrutura genérica de leitura/escrita está
// implementada. As funções de domínio (getPois, savePoi, getGraphNodes...) são
// stubs — cada uma será preenchida na fase do roadmap (seção 11) responsável por
// aquela funcionalidade. Isso evita implementar regras de negócio antes da tela
// que as usa existir.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  AppNotification,
  GraphEdge,
  GraphNode,
  MapImage,
  Platform,
  Poi,
  QrCodeLink,
  Sector,
  Trip,
} from '../types';

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
// Mapa (imagem + escala) — implementação chega na Fase 3 (Admin: mapa e escala).
// ---------------------------------------------------------------------------

export async function getMap(): Promise<MapImage | null> {
  throw new Error('storage.getMap: não implementado ainda (ver Fase 3 do roadmap)');
}

export async function saveMap(_map: MapImage): Promise<void> {
  throw new Error('storage.saveMap: não implementado ainda (ver Fase 3 do roadmap)');
}

// ---------------------------------------------------------------------------
// Locais (POIs) — implementação chega na Fase 4 (Admin: locais).
// ---------------------------------------------------------------------------

export function getPois(): Poi[] {
  throw new Error('storage.getPois: não implementado ainda (ver Fase 4 do roadmap)');
}

export function savePoi(_poi: Poi): void {
  throw new Error('storage.savePoi: não implementado ainda (ver Fase 4 do roadmap)');
}

export function deletePoi(_poiId: string): void {
  throw new Error('storage.deletePoi: não implementado ainda (ver Fase 4 do roadmap)');
}

// ---------------------------------------------------------------------------
// Grafo (nós e arestas) — implementação chega na Fase 5 (Admin: grafo).
// ---------------------------------------------------------------------------

export function getGraphNodes(): GraphNode[] {
  throw new Error(
    'storage.getGraphNodes: não implementado ainda (ver Fase 5 do roadmap)',
  );
}

export function saveGraphNode(_node: GraphNode): void {
  throw new Error(
    'storage.saveGraphNode: não implementado ainda (ver Fase 5 do roadmap)',
  );
}

export function getGraphEdges(): GraphEdge[] {
  throw new Error(
    'storage.getGraphEdges: não implementado ainda (ver Fase 5 do roadmap)',
  );
}

export function saveGraphEdge(_edge: GraphEdge): void {
  throw new Error(
    'storage.saveGraphEdge: não implementado ainda (ver Fase 5 do roadmap)',
  );
}

export function deleteGraphEdge(_edgeId: string): void {
  throw new Error(
    'storage.deleteGraphEdge: não implementado ainda (ver Fase 5 do roadmap)',
  );
}

// ---------------------------------------------------------------------------
// Setores e plataformas — implementação chega na Fase 10 (Viagens), junto do
// cadastro de viagens (ambos fazem parte da mesma tela de admin).
// ---------------------------------------------------------------------------

export function getSectors(): Sector[] {
  throw new Error(
    'storage.getSectors: não implementado ainda (ver Fase 10 do roadmap)',
  );
}

export function getPlatforms(): Platform[] {
  throw new Error(
    'storage.getPlatforms: não implementado ainda (ver Fase 10 do roadmap)',
  );
}

// ---------------------------------------------------------------------------
// Viagens — implementação chega na Fase 10 (Viagens).
// ---------------------------------------------------------------------------

export function getTrips(): Trip[] {
  throw new Error('storage.getTrips: não implementado ainda (ver Fase 10 do roadmap)');
}

export function saveTrip(_trip: Trip): void {
  throw new Error('storage.saveTrip: não implementado ainda (ver Fase 10 do roadmap)');
}

// ---------------------------------------------------------------------------
// QR Codes — implementação chega na Fase 9 (QR Code).
// ---------------------------------------------------------------------------

export function getQrCodeLinks(): QrCodeLink[] {
  throw new Error(
    'storage.getQrCodeLinks: não implementado ainda (ver Fase 9 do roadmap)',
  );
}

export function saveQrCodeLink(_link: QrCodeLink): void {
  throw new Error(
    'storage.saveQrCodeLink: não implementado ainda (ver Fase 9 do roadmap)',
  );
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
