// Content drawn ONTO the centre glass (canvas → texture), so it scales
// and merges with the screen instead of floating over it. POC stand-in
// for the real DOM-projection / render-to-texture content pipeline.

import { CanvasTexture, SRGBColorSpace } from 'three';
import type { PocContent } from '@/lib/forge-hub/poc/pocStage';

function rr(
  x: CanvasRenderingContext2D,
  px: number,
  py: number,
  w: number,
  h: number,
  r: number,
) {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}

export function makeContentTexture(kind: PocContent): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 760;
  c.height = 760;
  const x = c.getContext('2d')!;
  const cyan = '#c9f6ff';
  const dim = '#8fd6e6';
  const gold = '#ffd79f';
  x.clearRect(0, 0, 760, 760);
  x.textAlign = 'left';
  x.textBaseline = 'alphabetic';

  if (kind === 'welcome') {
    x.fillStyle = cyan;
    x.font = '700 60px Sora, system-ui, sans-serif';
    x.fillText('Welcome to', 70, 180);
    x.fillText('SparkForge', 70, 250);
    x.fillStyle = dim;
    x.font = '600 30px Sora, system-ui, sans-serif';
    x.fillText('Sign in to your forge', 70, 320);
    x.strokeStyle = 'rgba(150,230,255,.55)';
    x.lineWidth = 3;
    rr(x, 70, 380, 620, 74, 16);
    x.stroke();
    rr(x, 70, 478, 620, 74, 16);
    x.stroke();
    x.fillStyle = dim;
    x.font = '400 26px JetBrains Mono, monospace';
    x.fillText('username', 96, 426);
    x.fillText('••••••••', 96, 524);
    x.fillStyle = gold;
    rr(x, 70, 590, 300, 80, 18);
    x.fill();
    x.fillStyle = '#5b3a1a';
    x.font = '700 30px Sora, system-ui, sans-serif';
    x.fillText('Enter the Forge', 104, 640);
  } else if (kind === 'hub') {
    x.fillStyle = gold;
    x.font = '700 26px JetBrains Mono, monospace';
    x.fillText("TODAY'S MISSION", 70, 150);
    x.fillStyle = cyan;
    x.font = '700 56px Sora, system-ui, sans-serif';
    x.fillText('Decode the', 70, 240);
    x.fillText('Emoji Cipher', 70, 306);
    x.strokeStyle = 'rgba(150,230,255,.4)';
    x.lineWidth = 2;
    rr(x, 70, 360, 620, 150, 18);
    x.stroke();
    x.fillStyle = dim;
    x.font = '400 27px JetBrains Mono, monospace';
    x.fillText('Lab 3 · Neural Networks', 96, 430);
    x.fillText('Reward  ·  120 XP', 96, 470);
    x.fillStyle = 'rgba(150,230,255,.2)';
    rr(x, 70, 560, 620, 26, 13);
    x.fill();
    x.fillStyle = cyan;
    rr(x, 70, 560, 620 * 0.62, 26, 13);
    x.fill();
    x.fillStyle = dim;
    x.font = '600 24px JetBrains Mono, monospace';
    x.fillText('62%  ·  streak 4', 70, 632);
  } else {
    x.fillStyle = gold;
    x.font = '700 26px JetBrains Mono, monospace';
    x.fillText('LAB 3 · EMOJI DECODER', 70, 120);
    const emo = ['\u{1F642}', '⚡', '\u{1F916}', '\u{1F525}', '\u{1F4A7}', '⭐', '\u{1F9E9}', '\u{1F3AF}', '\u{1F680}'];
    const cols = ['#2b6f7e', '#7a5a2a', '#2f6a45', '#6a2f4f', '#28506f', '#5a4a1f', '#265f6f', '#4f2f6a', '#6a3a28'];
    let i = 0;
    for (let r = 0; r < 3; r++) {
      for (let cc = 0; cc < 3; cc++) {
        const px = 70 + cc * 220;
        const py = 170 + r * 180;
        x.fillStyle = cols[i];
        rr(x, px, py, 190, 150, 20);
        x.fill();
        x.font = '90px system-ui, sans-serif';
        x.textAlign = 'center';
        x.fillText(emo[i], px + 95, py + 108);
        x.textAlign = 'left';
        i++;
      }
    }
    x.fillStyle = cyan;
    x.font = '700 30px Sora, system-ui, sans-serif';
    x.fillText('Score 480', 70, 740);
  }

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
