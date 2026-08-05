// Leitura de QR Code (seção 2.2 do spec: "Escaneia QR Code → sistema
// identifica onde ele está → centraliza o mapa"). Usa `html5-qrcode` pra
// acessar a câmera. Ao reconhecer um código do Click Way (prefixo
// `CLICKWAY:LOC:`, ver QrGenerator.tsx), resolve pro ponto real no mapa —
// posição do POI ou do nó do grafo — e entrega esse ponto pra quem chamou
// (a HomeScreen usa isso pra preencher `originPoint` automaticamente).

import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getGraphNodes, getPois, getQrCodeLinks } from '../../shared/lib/storage';
import { QR_CODE_PREFIX } from './QrGenerator';
import { Z_INDEX } from '../../shared/lib/zIndex';
import type { Point } from '../../shared/types';

const SCANNER_ELEMENT_ID = 'clickway-qr-scanner-region';

interface QrScannerProps {
  onLocationFound: (point: Point) => void;
  onClose: () => void;
}

function resolveCodeToPoint(code: string): Point | null {
  const link = getQrCodeLinks().find((item) => item.code === code);
  if (!link) return null;

  if (link.targetType === 'poi') {
    const poi = getPois().find((item) => item.id === link.targetId);
    return poi?.position ?? null;
  }

  const node = getGraphNodes().find((item) => item.id === link.targetId);
  return node?.position ?? null;
}

function QrScanner({ onLocationFound, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    let cancelled = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        (decodedText) => {
          if (cancelled) return;
          if (!decodedText.startsWith(QR_CODE_PREFIX)) return; // QR de outro app — ignora e continua escaneando

          const code = decodedText.slice(QR_CODE_PREFIX.length);
          const point = resolveCodeToPoint(code);

          if (!point) {
            setNotFoundMessage('Este QR Code não corresponde a nenhum local cadastrado.');
            return;
          }

          setNotFoundMessage(null);
          onLocationFound(point);
        },
        () => {
          // Callback de erro do html5-qrcode dispara a cada frame sem QR
          // detectado — não é um erro de verdade, é o comportamento normal
          // enquanto a câmera procura um código. Ignorado de propósito.
        },
      )
      .catch(() => {
        if (!cancelled) {
          setError('Não foi possível acessar a câmera. Verifique se você deu permissão ao navegador.');
        }
      });

    return () => {
      cancelled = true;
      if (scanner.isScanning) {
        scanner.stop().catch(() => {
          // Câmera pode já ter sido liberada (ex: usuário navegou rápido) — sem problema.
        });
      }
    };
  }, [onLocationFound]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: Z_INDEX.modal,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#fff', fontWeight: 600 }}>Aponte para o QR Code</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '0.85rem',
          }}
        >
          Cancelar
        </button>
      </div>

      <div id={SCANNER_ELEMENT_ID} style={{ flex: 1 }} />

      <div style={{ padding: '16px', minHeight: '48px' }}>
        {error && (
          <p style={{ color: '#fff', background: 'var(--color-severity-urgente)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem' }}>
            {error}
          </p>
        )}
        {notFoundMessage && !error && (
          <p style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem' }}>
            {notFoundMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default QrScanner;
