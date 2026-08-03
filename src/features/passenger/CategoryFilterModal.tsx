// Modal "Ver todas as categorias" (pedido do usuário: a fileira de chips de
// categoria não deve ficar poluída/cortada quando há muitas categorias —
// mostra só algumas inline, e esta grade responsiva mostra todas). Mesmo
// padrão visual (bottom sheet) do PoiFormModal.tsx, e reusa PoiCategoryIcon
// pra manter o mesmo ícone que aparece nos POIs.

import PoiCategoryIcon from '../../shared/components/PoiCategoryIcon';
import { Z_INDEX } from '../../shared/lib/zIndex';
import type { Category } from '../../shared/types';

interface CategoryFilterModalProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  onClose: () => void;
}

function CategoryFilterModal({ categories, selectedCategoryId, onSelect, onClose }: CategoryFilterModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 33, 61, 0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: Z_INDEX.modal,
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          borderRadius: '20px 20px 0 0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxHeight: '80dvh',
          overflowY: 'auto',
        }}
      >
        <div
          aria-hidden="true"
          style={{ width: '40px', height: '4px', background: 'var(--color-border)', borderRadius: '999px', margin: '0 auto' }}
        />

        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Categorias</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '14px 6px',
              borderRadius: '12px',
              border: selectedCategoryId === null ? '2px solid var(--color-passenger)' : '1px solid var(--color-border)',
              background: selectedCategoryId === null ? 'var(--color-passenger-bg)' : 'var(--color-surface)',
              color: selectedCategoryId === null ? 'var(--color-passenger)' : 'var(--color-text)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: selectedCategoryId === null ? 'var(--color-passenger)' : 'var(--color-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.7rem',
              }}
            >
              Tudo
            </span>
            Todos os locais
          </button>

          {categories.map((cat) => {
            const selected = cat.id === selectedCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelect(selected ? null : cat.id);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '14px 6px',
                  borderRadius: '12px',
                  border: selected ? `2px solid ${cat.color}` : '1px solid var(--color-border)',
                  background: selected ? `${cat.color}1a` : 'var(--color-surface)',
                  color: selected ? cat.color : 'var(--color-text)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                >
                  <PoiCategoryIcon category={cat.id} />
                </span>
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '12px',
            fontWeight: 600,
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

export default CategoryFilterModal;
