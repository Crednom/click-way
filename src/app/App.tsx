// Placeholder da Fase 1: só confirma que o setup (Vite + React + TS + estrutura
// de pastas + Zustand) está funcionando. A tela real de entrada (RoleGate, com a
// escolha entre Administrador e Passageiro) é implementada na Fase 2.

import { useAppStore } from '../store/useAppStore';

function App() {
  const role = useAppStore((state) => state.role);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px',
        gap: '8px',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Click Way</h1>
      <p style={{ color: 'var(--color-muted)', margin: 0 }}>
        Fase 1 concluída — setup do projeto.
      </p>
      <p style={{ color: 'var(--color-muted)', margin: 0, fontSize: '0.875rem' }}>
        Papel atual no store: {role ?? '(nenhum selecionado ainda)'}
      </p>
    </main>
  );
}

export default App;
