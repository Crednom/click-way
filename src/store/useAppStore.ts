// Store global (Zustand) — seção 3 do spec: "papel atual, rota ativa, notificações".
//
// FASE 1 (atual): apenas o estado de `role` está funcional, pois é o que a
// Fase 2 (RoleGate + rotas) vai consumir. `activeRoute` e `notifications` estão
// com o formato pensado, mas ainda não têm nenhuma tela que os alimente — serão
// expandidos nas Fases 6-8 (roteamento) e 11 (notificações).

import { create } from 'zustand';
import type { AppNotification, UserRole } from '../shared/types';

interface AppState {
  /** Papel ativo no dispositivo (admin ou passageiro). null = ainda não escolhido. */
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;

  /**
   * Caminho da rota calculada atualmente (lista de ids de nó do grafo, em ordem).
   * Preenchido pela Fase 6 (Roteamento). Fica vazio até lá.
   */
  activeRoutePath: string[];
  setActiveRoutePath: (path: string[]) => void;

  /**
   * Notificações carregadas na sessão atual do passageiro.
   * Preenchido pela Fase 11 (Notificações). Fica vazio até lá.
   */
  notifications: AppNotification[];
  setNotifications: (notifications: AppNotification[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: null,
  setRole: (role) => set({ role }),

  activeRoutePath: [],
  setActiveRoutePath: (activeRoutePath) => set({ activeRoutePath }),

  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
}));
