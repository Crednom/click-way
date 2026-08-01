// Cabeçalho reutilizado pelos módulos Admin e Passageiro (seção 8: layout
// mobile-first básico da Fase 2). O botão "Trocar perfil" limpa o papel no
// store e volta para o RoleGate — é o que permite a simulação Admin →
// Passageiro no mesmo dispositivo (seção 4 do spec).

import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

interface AppHeaderProps {
  title: string;
  accentColor: string;
}

function AppHeader({ title, accentColor }: AppHeaderProps) {
  const navigate = useNavigate();
  const setRole = useAppStore((state) => state.setRole);

  function handleSwitchRole() {
    setRole(null);
    navigate('/');
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          aria-hidden="true"
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: accentColor,
            flexShrink: 0,
          }}
        />
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>{title}</h1>
      </div>
      <button
        type="button"
        onClick={handleSwitchRole}
        style={{
          background: 'transparent',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '0.8rem',
          color: 'var(--color-muted)',
        }}
      >
        Trocar perfil
      </button>
    </header>
  );
}

export default AppHeader;
