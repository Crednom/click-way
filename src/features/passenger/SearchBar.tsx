// Barra de busca (seção 2.2 do spec: "Tela inicial: Pesquisa, Categorias,
// Botão QR Code"). O botão de QR Code já aparece aqui (fixo, acessível com o
// polegar, seção 8), mas ainda não faz nada — a leitura de QR é a Fase 9.
// Por enquanto ele só mostra que a função está a caminho (title="Em breve"),
// pra não fingir uma funcionalidade que não existe ainda.

import { FaMagnifyingGlass, FaQrcode } from 'react-icons/fa6';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '999px',
          padding: '10px 14px',
        }}
      >
        <FaMagnifyingGlass color="var(--color-muted)" />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar local, loja, plataforma..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '0.95rem',
            background: 'transparent',
          }}
        />
      </div>
      <button
        type="button"
        title="Em breve: identificar sua localização por QR Code"
        aria-label="Escanear QR Code"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'var(--color-passenger)',
          color: '#fff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          flexShrink: 0,
          opacity: 0.6,
        }}
      >
        <FaQrcode />
      </button>
    </div>
  );
}

export default SearchBar;
