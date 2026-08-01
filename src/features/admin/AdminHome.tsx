// Tela inicial (menu) do módulo Admin.
//
// Este arquivo não estava listado na seção 6 do spec original — a seção 6 lista
// as telas de cada funcionalidade (MapUpload, PoiEditor, GraphEditorView...),
// mas não uma tela-índice que reúna elas. Como nenhuma dessas telas existe
// ainda, esta página serve de menu de navegação do módulo admin, com cada
// seção marcada com a fase que vai implementá-la. Decisão registrada no
// PROGRESS.md (seção "Decisões tomadas ao longo do caminho").

import { Link } from 'react-router-dom';
import AppHeader from '../../shared/components/AppHeader';

interface AdminMenuItem {
  label: string;
  phaseLabel: string;
  /** Presente quando a tela já foi implementada; ausente = "em breve". */
  path?: string;
}

const ADMIN_SECTIONS: AdminMenuItem[] = [
  { label: 'Mapa e escala', phaseLabel: 'Fase 3', path: '/admin/mapa' },
  { label: 'Locais', phaseLabel: 'Fase 4' },
  { label: 'Grafo', phaseLabel: 'Fase 5' },
  { label: 'QR Codes', phaseLabel: 'Fase 9' },
  { label: 'Viagens', phaseLabel: 'Fase 10' },
  { label: 'Notificações', phaseLabel: 'Fase 11' },
];

function AdminHome() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader title="Administrador" accentColor="var(--color-admin)" />
      <main style={{ flex: 1, padding: '16px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Configuração da rodoviária. Cada seção abaixo é implementada em uma
          fase do roadmap.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ADMIN_SECTIONS.map((section) => {
            const itemStyle = {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'inherit',
              textDecoration: 'none',
              opacity: section.path ? 1 : 0.6,
            } as const;

            const badge = (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-admin)',
                  background: 'var(--color-admin-bg)',
                  padding: '2px 10px',
                  borderRadius: '999px',
                }}
              >
                {section.path ? 'Abrir' : section.phaseLabel}
              </span>
            );

            return (
              <li key={section.label}>
                {section.path ? (
                  <Link to={section.path} style={itemStyle}>
                    <span style={{ fontWeight: 600 }}>{section.label}</span>
                    {badge}
                  </Link>
                ) : (
                  <div style={itemStyle}>
                    <span style={{ fontWeight: 600 }}>{section.label}</span>
                    {badge}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

export default AdminHome;
