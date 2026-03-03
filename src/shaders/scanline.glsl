// ================================================================
// SparkForge Scanline Overlay Fragment Shader
// ================================================================
// Decision 2.3: Toggleable in accessibility settings
// Very subtle CRT screen texture — opacity 0.03

precision mediump float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uOpacity; // Default 0.03, set to 0.0 when disabled

varying vec2 vUv;

void main() {
  // Horizontal scan lines — repeating every 3 pixels
  float scanline = sin(vUv.y * uResolution.y * 1.5) * 0.5 + 0.5;
  scanline = pow(scanline, 1.5);

  // Slow vertical scroll — barely perceptible
  float scroll = sin(uTime * 0.5 + vUv.y * 4.0) * 0.02;

  // Combine
  float intensity = scanline * uOpacity + scroll * uOpacity;

  // Dark lines on bright background
  gl_FragColor = vec4(0.0, 0.0, 0.0, intensity);
}
