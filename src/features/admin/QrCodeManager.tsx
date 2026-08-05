// Tela de admin "QR Codes" (seção 6 do spec: "visão geral de todos os QR
// gerados"). Não gera QR Code aqui — geração acontece nos dois fluxos já
// existentes (PoiFormModal, ao editar um local; GraphEditorView, ao tocar
// num nó). Esta tela só lista o que já foi gerado, com prévia e exclusão.

import { useEffect, useState } from 'react';
import * as QRCode from 'qrcode';
import { Link } from 'react-router-dom';
import AppHeader from '../../shared/components/AppHeader';
import { getQrCodeLinks, deleteQrCodeLink, getPois, getGraphNodes } from '../../shared/lib/storage';
import { QR_CODE_PREFIX } from '../qrcode/QrGenerator';
import type { GraphNode, Poi, QrCodeLink } from '../../shared/types';

interface QrRow {
  link: QrCodeLink;
  label: string;
  dataUrl: string | null;
}

function resolveLabel(link: QrCodeLink, pois: Poi[], nodes: GraphNode[]): string {
  if (link.targetType === 'poi') {
    const poi = pois.find((item) => item.id === link.targetId);
    return poi ? poi.name : 'Local removido';
  }
  const index = nodes.findIndex((node) => node.id === link.targetId);
  return index >= 0 ? `Nó ${index + 1}` : 'Nó removido';
}

function QrCodeManager() {
  const [rows, setRows] = useState<QrRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const links = getQrCodeLinks();
      const pois = getPois();
      const nodes = getGraphNodes();

      const withDataUrl = await Promise.all(
        links.map(async (link) => ({
          link,
          label: resolveLabel(link, pois, nodes),
          dataUrl: await QRCode.toDataURL(`${QR_CODE_PREFIX}${link.code}`, { width: 120, margin: 1 }),
        })),
      );
      setRows(withDataUrl);
      setLoading(false);
    }
    load();
  }, []);

  function handleDelete(linkId: string) {
    deleteQrCodeLink(linkId);
    setRows((current) => current.filter((row) => row.link.id !== linkId));
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader title="QR Codes" accentColor="var(--color-admin)" />
      <main style={{ flex: 1, padding: '16px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Para gerar um novo QR Code, edite um local em{' '}
          <Link to="/admin/locais" style={{ color: 'var(--color-admin)' }}>
            Locais
          </Link>{' '}
          ou toque num nó em{' '}
          <Link to="/admin/grafo" style={{ color: 'var(--color-admin)' }}>
            Grafo
          </Link>
          .
        </p>

        {loading && <p style={{ color: 'var(--color-muted)' }}>Carregando...</p>}

        {!loading && rows.length === 0 && (
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '24px 0' }}>
            Nenhum QR Code gerado ainda.
          </p>
        )}

        {!loading && rows.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rows.map((row) => (
              <li
                key={row.link.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                }}
              >
                {row.dataUrl && <img src={row.dataUrl} alt="" style={{ width: '56px', height: '56px', flexShrink: 0 }} />}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    {row.link.targetType === 'poi' ? 'Local' : 'Nó do grafo'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(row.link.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.8rem',
                    color: 'var(--color-severity-urgente)',
                  }}
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default QrCodeManager;
