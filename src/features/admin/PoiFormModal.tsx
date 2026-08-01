// Modal de criar/editar local (seção 2.1 do spec). Bottom sheet, não modal
// centralizado, conforme a diretriz mobile-first da seção 8.
//
// Revisão da Fase 4 (feedback do usuário após testar): agora suporta criar
// categorias personalizadas (nome + cor) além das 13 de fábrica, e permite
// enviar um ícone/foto customizado para o local (sobrepõe o ícone padrão da
// categoria). Ver PROGRESS.md.

import { useEffect, useState } from 'react';
import PoiCategoryIcon from '../../shared/components/PoiCategoryIcon';
import { getCategories, saveCustomCategory } from '../../shared/lib/storage';
import { generateId } from '../../shared/lib/id';
import { loadAndCompressImage } from '../../shared/lib/image';
import { Z_INDEX } from '../../shared/lib/zIndex';
import type { Category, PoiCategory } from '../../shared/types';

const ICON_MAX_DIMENSION = 128;

export interface PoiFormValues {
  name: string;
  category: PoiCategory;
  description: string;
  iconUrl?: string;
}

interface PoiFormModalProps {
  initial?: PoiFormValues;
  isEditing: boolean;
  onSave: (values: PoiFormValues) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function PoiFormModal({ initial, isEditing, onSave, onDelete, onClose }: PoiFormModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<PoiCategory | ''>(initial?.category ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [iconUrl, setIconUrl] = useState(initial?.iconUrl);
  const [iconError, setIconError] = useState<string | null>(null);

  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#0b5fa5');

  useEffect(() => {
    const all = getCategories();
    setCategories(all);
    if (!category && all.length > 0) setCategory(all[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !category) return;
    onSave({ name: name.trim(), category, description: description.trim(), iconUrl });
  }

  function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    const newCategory: Category = {
      id: generateId(),
      label: newCategoryName.trim(),
      color: newCategoryColor,
      isCustom: true,
    };
    saveCustomCategory(newCategory);
    setCategories((current) => [...current, newCategory]);
    setCategory(newCategory.id);
    setNewCategoryName('');
    setCreatingCategory(false);
  }

  async function handleIconChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIconError(null);
    try {
      const { dataUrl } = await loadAndCompressImage(file, {
        maxDimension: ICON_MAX_DIMENSION,
        outputFormat: 'image/png',
      });
      setIconUrl(dataUrl);
    } catch {
      setIconError('Não foi possível carregar essa imagem.');
    }
  }

  const selectedMeta = categories.find((cat) => cat.id === category);

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
      <form
        onSubmit={handleSubmit}
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
          maxHeight: '85dvh',
          overflowY: 'auto',
        }}
      >
        <div
          aria-hidden="true"
          style={{ width: '40px', height: '4px', background: 'var(--color-border)', borderRadius: '999px', margin: '0 auto' }}
        />

        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
          {isEditing ? 'Editar local' : 'Novo local'}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            aria-hidden="true"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: selectedMeta?.color ?? 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.2rem',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {iconUrl ? (
              <img src={iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              category && <PoiCategoryIcon category={category} />
            )}
          </span>
          <label
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-admin)',
              border: '1px solid var(--color-admin)',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          >
            {iconUrl ? 'Trocar ícone' : 'Enviar ícone personalizado'}
            <input type="file" accept="image/*" onChange={handleIconChange} style={{ display: 'none' }} />
          </label>
          {iconUrl && (
            <button
              type="button"
              onClick={() => setIconUrl(undefined)}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', fontSize: '0.8rem' }}
            >
              Remover
            </button>
          )}
        </div>
        {iconError && <span style={{ fontSize: '0.8rem', color: 'var(--color-severity-urgente)' }}>{iconError}</span>}

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
          Nome
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="ex: Banheiro Setor A"
            autoFocus
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '1rem',
            }}
          />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.9rem' }}>Categoria</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
              gap: '8px',
            }}
          >
            {categories.map((cat) => {
              const selected = cat.id === category;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 6px',
                    borderRadius: '10px',
                    border: selected ? `2px solid ${cat.color}` : '1px solid var(--color-border)',
                    background: selected ? `${cat.color}1a` : 'var(--color-surface)',
                    color: selected ? cat.color : 'var(--color-text)',
                    fontSize: '0.7rem',
                    textAlign: 'center',
                  }}
                >
                  <PoiCategoryIcon category={cat.id} />
                  {cat.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCreatingCategory(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 6px',
                borderRadius: '10px',
                border: '1px dashed var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-muted)',
                fontSize: '0.7rem',
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
              Nova categoria
            </button>
          </div>

          {creatingCategory && (
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Nome da categoria"
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9rem',
                  }}
                />
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(event) => setNewCategoryColor(event.target.value)}
                  aria-label="Cor da categoria"
                  style={{ width: '40px', height: '38px', border: 'none', borderRadius: '8px', padding: 0 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                  style={{
                    flex: 1,
                    background: 'var(--color-admin)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    opacity: newCategoryName.trim() ? 1 : 0.5,
                  }}
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setCreatingCategory(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '0.85rem',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
          Descrição (opcional)
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            placeholder="Informações adicionais sobre o local"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '0.95rem',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="submit"
            disabled={!name.trim() || !category}
            style={{
              flex: 1,
              background: 'var(--color-admin)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 600,
              opacity: name.trim() && category ? 1 : 0.5,
            }}
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>
        </div>

        {isEditing && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-severity-urgente)',
              fontSize: '0.85rem',
              padding: '4px',
            }}
          >
            Excluir local
          </button>
        )}
      </form>
    </div>
  );
}

export default PoiFormModal;
