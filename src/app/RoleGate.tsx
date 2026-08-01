// RoleGate — tela de entrada do app. Substitui o placeholder da Fase 1.
// Escolhe o papel ativo (admin/passageiro) no store e navega para o módulo
// correspondente (rotas definidas em app/routes.tsx).

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBus, FaUserGear } from 'react-icons/fa6';
import { useAppStore } from '../store/useAppStore';
import type { UserRole } from '../shared/types';

interface RoleCardProps {
  icon: ReactNode;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  onSelect: () => void;
}

function RoleCard({ icon, label, description, color, bgColor, onSelect }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        textAlign: 'left',
        padding: '20px',
        borderRadius: '16px',
        border: `1px solid ${color}`,
        background: bgColor,
        color: 'var(--color-text)',
        transition: 'transform 120ms ease',
      }}
      onPointerDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: color,
          color: '#fff',
          fontSize: '1.4rem',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{label}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
          {description}
        </span>
      </span>
    </button>
  );
}

function RoleGate() {
  const navigate = useNavigate();
  const setRole = useAppStore((state) => state.setRole);

  function handleSelect(role: UserRole) {
    setRole(role);
    navigate(role === 'admin' ? '/admin' : '/passageiro');
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '32px',
        padding: '24px',
        maxWidth: '420px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', margin: '0 0 4px', fontWeight: 800 }}>
          Click Way
        </h1>
        <p style={{ color: 'var(--color-muted)', margin: 0, fontSize: '0.95rem' }}>
          Navegação interna da rodoviária
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <RoleCard
          icon={<FaBus />}
          label="Sou passageiro"
          description="Buscar destino e traçar rota até a plataforma"
          color="var(--color-passenger)"
          bgColor="var(--color-passenger-bg)"
          onSelect={() => handleSelect('passenger')}
        />
        <RoleCard
          icon={<FaUserGear />}
          label="Sou administrador"
          description="Configurar mapa, locais, grafo e notificações"
          color="var(--color-admin)"
          bgColor="var(--color-admin-bg)"
          onSelect={() => handleSelect('admin')}
        />
      </div>

      <p
        style={{
          textAlign: 'center',
          color: 'var(--color-muted)',
          fontSize: '0.75rem',
          margin: 0,
        }}
      >
        Projeto acadêmico — os dois perfis funcionam neste mesmo dispositivo.
      </p>
    </main>
  );
}

export default RoleGate;
