// ════════════════════════════════════════════════════════════════
// LED-dot face for the 3D placeholder screen (spec §5 / W3-03).
// Expression *names* match SparkyCore; this is not a 2D rewrite.
// ════════════════════════════════════════════════════════════════

import { SPARKY_FACE_GLOW, SPARKY_PALETTE } from '@/config/sparkyPalette';
import type { ForgeSparkyExpression } from './types';

export const SPARKY_FACE_SIZE = 256;

export interface SparkyFaceDrawOpts {
  expression: ForgeSparkyExpression;
  /** Eye-dot offset in UV-ish −1..1 (look-at). */
  lookX?: number;
  lookY?: number;
  /** 0..1; 1 = eyes closed. */
  blink?: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  const v = Number.parseInt(n, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Mouth row as a short LED smile / frown / O. Coordinates in face px.
 */
function mouthDots(
  expression: ForgeSparkyExpression,
): { x: number; y: number }[] {
  const cy = 168;
  switch (expression) {
    case 'happy':
    case 'excited':
    case 'celebrating':
      return [
        { x: 88, y: cy - 4 },
        { x: 108, y: cy + 10 },
        { x: 128, y: cy + 16 },
        { x: 148, y: cy + 10 },
        { x: 168, y: cy - 4 },
      ];
    case 'sad':
      return [
        { x: 92, y: cy + 10 },
        { x: 108, y: cy + 2 },
        { x: 128, y: cy - 4 },
        { x: 148, y: cy + 2 },
        { x: 164, y: cy + 10 },
      ];
    case 'sleepy':
      return [
        { x: 108, y: cy + 4 },
        { x: 128, y: cy + 6 },
        { x: 148, y: cy + 4 },
      ];
    case 'thinking':
      return [
        { x: 112, y: cy },
        { x: 132, y: cy + 2 },
        { x: 148, y: cy - 2 },
      ];
    case 'surprised':
      return [
        { x: 128, y: cy - 6 },
        { x: 116, y: cy + 6 },
        { x: 140, y: cy + 6 },
        { x: 128, y: cy + 16 },
      ];
    case 'speaking':
      return [
        { x: 108, y: cy },
        { x: 128, y: cy + 12 },
        { x: 148, y: cy },
        { x: 128, y: cy - 4 },
      ];
    default:
      return [
        { x: 100, y: cy },
        { x: 128, y: cy + 8 },
        { x: 156, y: cy },
      ];
  }
}

export function drawSparkyFace(
  ctx: CanvasRenderingContext2D,
  opts: SparkyFaceDrawOpts,
): void {
  const size = ctx.canvas.width;
  const scale = size / SPARKY_FACE_SIZE;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = SPARKY_PALETTE.faceBase;
  ctx.fillRect(0, 0, SPARKY_FACE_SIZE, SPARKY_FACE_SIZE);

  const glow = SPARKY_FACE_GLOW[opts.expression];
  const [r, g, b] = hexToRgb(glow);
  const lookX = Math.max(-1, Math.min(1, opts.lookX ?? 0)) * 18;
  const lookY = Math.max(-1, Math.min(1, opts.lookY ?? 0)) * 12;
  const blink = Math.max(0, Math.min(1, opts.blink ?? 0));

  const vignette = ctx.createRadialGradient(128, 128, 20, 128, 128, 140);
  vignette.addColorStop(0, `rgba(${r},${g},${b},0.28)`);
  vignette.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, SPARKY_FACE_SIZE, SPARKY_FACE_SIZE);

  const eyeY = 108 + lookY;
  const eyeR = blink > 0.6 ? 3 : 11 - blink * 8;
  const leftX = 92 + lookX;
  const rightX = 164 + lookX;

  if (opts.expression === 'sleepy' || blink > 0.75) {
    ctx.strokeStyle = glow;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(leftX - 14, eyeY);
    ctx.quadraticCurveTo(leftX, eyeY + 6, leftX + 14, eyeY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightX - 14, eyeY);
    ctx.quadraticCurveTo(rightX, eyeY + 6, rightX + 14, eyeY);
    ctx.stroke();
  } else {
    dot(ctx, leftX, eyeY, eyeR + 4, glow, 0.35);
    dot(ctx, leftX, eyeY, eyeR, glow, 0.95);
    dot(ctx, rightX, eyeY, eyeR + 4, glow, 0.35);
    dot(ctx, rightX, eyeY, eyeR, glow, 0.95);
  }

  for (const p of mouthDots(opts.expression)) {
    dot(ctx, p.x + lookX * 0.15, p.y, 5.5, glow, 0.95);
  }
}

export function createSparkyFaceCanvas(
  expression: ForgeSparkyExpression = 'idle',
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SPARKY_FACE_SIZE;
  canvas.height = SPARKY_FACE_SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) drawSparkyFace(ctx, { expression });
  return canvas;
}
