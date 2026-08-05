// Geração de QR Code (seção 2.1 do spec: "Gerar QR Code" em vez de "Associar
// QR Code" — fluxo: Criar Local → botão "Gerar QR Code" → sistema gera
// automaticamente → Imprimir). Reaproveitado nos dois fluxos decididos ainda
// na fase de planejamento: via POI (PoiFormModal, fluxo rápido) e via nó do
// grafo (GraphEditorView, fluxo avançado — pontos de localização pura, sem
// nome, como corredores/cruzamentos).
//
// O valor codificado no QR é sempre `CLICKWAY:LOC:{code}`, onde `code` é o
// id gerado para o `QrCodeLink`. O prefixo existe pra o QrScanner (leitura)
// conseguir distinguir um QR Code do Click Way de qualquer outro QR Code que
// o passageiro aponte a câmera por engano.

import { useEffect, useState } from 'react';
import * as QRCode from 'qrcode';
import { getQrCodeLinks, saveQrCodeLink } from '../../shared/lib/storage';
import { generateId } from '../../shared/lib/id';
import type { QrCodeLink, QrTargetType } from '../../shared/types';

export const QR_CODE_PREFIX = 'CLICKWAY:LOC:';

interface QrGeneratorProps {
  targetType: QrTargetType;
  targetId: string;
  /** Nome exibido acima do QR Code (nome do POI, ou "Nó N" no caso do grafo). */
  targetLabel: string;
}

function QrGenerator({ targetType, targetId, targetLabel }: QrGeneratorProps) {
  const [link, setLink] = useState<QrCodeLink | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const existing = getQrCodeLinks().find(
      (item) => item.targetType === targetType && item.targetId === targetId,
    );
    setLink(existing ?? null);
  }, [targetType, targetId]);

  useEffect(() => {
    if (!link) {
      setDataUrl(null);
      return;
    }
    QRCode.toDataURL(`${QR_CODE_PREFIX}${link.code}`, { width: 220, margin: 1 }).then(setDataUrl);
  }, [link]);

  async function handleGenerate() {
    setGenerating(true);
    const newLink: QrCodeLink = {
      id: generateId(),
      code: generateId(),
      targetType,
      targetId,
    };
    saveQrCodeLink(newLink);
    setLink(newLink);
    setGenerating(false);
  }

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        textAlign: 'center',
      }}
    >
      {!link && (
        <>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Nenhum QR Code gerado ainda para "{targetLabel}".
          </span>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            style={{
              background: 'var(--color-admin)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontWeight: 600,
              fontSize: '0.9rem',
              opacity: generating ? 0.6 : 1,
            }}
          >
            {generating ? 'Gerando...' : 'Gerar QR Code'}
          </button>
        </>
      )}

      {link && dataUrl && (
        <>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{targetLabel}</span>
          <img src={dataUrl} alt={`QR Code de ${targetLabel}`} style={{ width: '180px', height: '180px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={dataUrl}
              download={`qrcode-${targetLabel.toLowerCase().replace(/\s+/g, '-')}.png`}
              style={{
                background: 'var(--color-admin)',
                color: '#fff',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Baixar / Imprimir
            </a>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                color: 'var(--color-muted)',
              }}
            >
              Gerar novo código
            </button>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
            "Gerar novo código" invalida qualquer QR Code já impresso para este local.
          </span>
        </>
      )}
    </div>
  );
}

export default QrGenerator;
