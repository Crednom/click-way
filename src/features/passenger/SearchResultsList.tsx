// Lista de resultados de busca (seção 2.2/4 do documento original: digitar
// "Banheiro" mostra todos, digitar "Plataforma C8" mostra ela). Cada item é
// selecionável — tocar chama `onSelect`, que a HomeScreen usa pra definir o
// destino e calcular a rota.

import PoiCategoryIcon from '../../shared/components/PoiCategoryIcon';
import type { Category, Poi } from '../../shared/types';

interface SearchResultsListProps {
  pois: Poi[];
  categories: Category[];
  onSelect: (poi: Poi) => void;
}

function SearchResultsList({ pois, categories, onSelect }: SearchResultsListProps) {
  function getCategoryMeta(categoryId: string): Category {
    return (
      categories.find((cat) => cat.id === categoryId) ?? {
        id: categoryId,
        label: categoryId,
        color: 'var(--color-muted)',
        isCustom: true,
      }
    );
  }

  if (pois.length === 0) {
    return (
      <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '16px' }}>
        Nenhum local encontrado.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {pois.map((poi) => {
        const meta = getCategoryMeta(poi.category);
        return (
          <li key={poi.id}>
            <button
              type="button"
              onClick={() => onSelect(poi)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: meta.color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {poi.iconUrl ? (
                  <img src={poi.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <PoiCategoryIcon category={poi.category} />
                )}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{poi.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{meta.label}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default SearchResultsList;
