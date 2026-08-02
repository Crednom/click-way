// Camadas de z-index centralizadas.
//
// Bug corrigido na revisão da Fase 4: o modal usava z-index: 100, mas os
// controles do Leaflet (zoom +/-) usam z-index até 800 por padrão — por isso
// o mapa aparecia por cima do modal. Qualquer modal/overlay novo deve usar
// Z_INDEX.modal (bem acima do que o Leaflet usa) em vez de um número solto.

export const Z_INDEX = {
  /** Maior z-index usado internamente pelos controles do Leaflet (~800). Informativo. */
  mapControls: 800,
  /** Painéis flutuantes sobre o mapa (ex: busca do passageiro) — acima do Leaflet, abaixo de modais. */
  overlay: 1000,
  modal: 2000,
  /** Reservado para a Fase 11 (react-toastify) — deve ficar acima de modais. */
  toast: 3000,
} as const;
