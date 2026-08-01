// Conversões de coordenadas (seção 6 do spec: "conversão pixel <-> percentual
// <-> metros, usa escala"). Tudo o que é salvo (POIs, nós do grafo, pontos de
// escala) usa `Point` em percentual — nunca pixel absoluto (seção 9).

import type { MapScale, Point } from '../types';

export function pixelToPercent(xPx: number, yPx: number, width: number, height: number): Point {
  return {
    xPct: (xPx / width) * 100,
    yPct: (yPx / height) * 100,
  };
}

export function percentToPixel(
  point: Point,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: (point.xPct / 100) * width,
    y: (point.yPct / 100) * height,
  };
}

/** Distância entre dois pontos, em unidades percentuais (não em metros). */
export function percentDistance(a: Point, b: Point): number {
  const dx = a.xPct - b.xPct;
  const dy = a.yPct - b.yPct;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula o fator de escala a partir de dois pontos de referência marcados
 * pelo admin no mapa e da distância real (em metros) entre eles.
 */
export function computeScale(pointA: Point, pointB: Point, realDistanceMeters: number): MapScale {
  const distancePct = percentDistance(pointA, pointB);
  const metersPerPercentUnit = distancePct === 0 ? 0 : realDistanceMeters / distancePct;
  return { pointA, pointB, realDistanceMeters, metersPerPercentUnit };
}

/** Converte uma distância em unidades percentuais para metros reais, usando a escala configurada. */
export function percentDistanceToMeters(distancePct: number, scale: MapScale): number {
  return distancePct * scale.metersPerPercentUnit;
}
