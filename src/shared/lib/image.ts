// Leitura e compressão de imagem (seção 9 do spec: "Comprimir/redimensionar a
// imagem do mapa antes de salvar no IndexedDB"). Arquivo não estava listado
// explicitamente na seção 6 — adição registrada no PROGRESS.md.
//
// Também reutilizado pelo upload de ícone customizado de POI (revisão da
// Fase 4), com um `maxDimension` bem menor e saída em PNG (preserva
// transparência, comum em ícones/logos).

const DEFAULT_MAX_DIMENSION = 2000;
const DEFAULT_QUALITY = 0.85;

export interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Lê um arquivo de imagem e, se ele passar de `maxDimension` px no maior lado,
 * redimensiona proporcionalmente via canvas antes de gerar o data URL final.
 */
export function loadAndCompressImage(
  file: File,
  options: { maxDimension?: number; quality?: number; outputFormat?: 'image/jpeg' | 'image/png' } = {},
): Promise<LoadedImage> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const outputFormat = options.outputFormat ?? 'image/jpeg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error('O arquivo selecionado não é uma imagem válida.'));

      img.onload = () => {
        const scaleFactor = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scaleFactor);
        const height = Math.round(img.height * scaleFactor);

        if (scaleFactor === 1) {
          resolve({ dataUrl: reader.result as string, width, height });
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Sem contexto de canvas disponível: usa a imagem original mesmo maior.
          resolve({ dataUrl: reader.result as string, width: img.width, height: img.height });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve({ dataUrl: canvas.toDataURL(outputFormat, quality), width, height });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
