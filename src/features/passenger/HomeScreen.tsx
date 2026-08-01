// Tela inicial do módulo Passageiro.
//
// FASE 2 (atual): confirma que a rota /passageiro funciona, com o layout base
// (AppHeader + área de conteúdo). A busca, as categorias e o botão de QR Code
// (seção 2.2 do spec) são implementados na Fase 7.

import AppHeader from '../../shared/components/AppHeader';

function HomeScreen() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader title="Passageiro" accentColor="var(--color-passenger)" />
      <main style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-muted)' }}>
          Módulo Passageiro — busca, categorias e QR Code chegam na Fase 7.
        </p>
      </main>
    </div>
  );
}

export default HomeScreen;
