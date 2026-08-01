// Gera o HTML (string) do conteúdo interno do marcador no mapa: a imagem
// customizada (`iconUrl`), se houver, ou o ícone da categoria. Usado pelo
// MapView, que precisa de uma string HTML para o `L.divIcon` do Leaflet — não
// dá pra passar uma árvore React viva ali.
//
// Separado de shared/components/PoiCategoryIcon.tsx porque esse arquivo só
// pode exportar o componente (regra de fast refresh do Vite/oxlint).

import { renderToStaticMarkup } from 'react-dom/server';
import PoiCategoryIcon from '../components/PoiCategoryIcon';
import type { PoiCategory } from '../types';

export function renderPoiIconHtml(poi: { category: PoiCategory; iconUrl?: string }): string {
  if (poi.iconUrl) {
    return `<img src="${poi.iconUrl}" alt="" style="width:20px;height:20px;object-fit:cover;border-radius:50%;" />`;
  }
  return renderToStaticMarkup(<PoiCategoryIcon category={poi.category} />);
}
