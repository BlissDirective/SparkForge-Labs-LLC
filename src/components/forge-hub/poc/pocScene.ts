// ════════════════════════════════════════════════════════════════
// Forge Stage POC — imperative scene graph (five live objects)
// ════════════════════════════════════════════════════════════════
// Backdrop (empty warm room, NO baked holograms) + desk + SF emitter +
// three glass screens + beams, driven by one pose clock via
// samplePocPose(). Glow is baked into the materials (additive edges +
// emitter sprite) so it reads even without post-processing; the R3F
// wrapper layers a gentle Bloom on top on capable GPUs.
//
// Two modes:
//  - includeObjects: true  → procedural stand-in desk/emitter/screens
//    (default; the always-working harness).
//  - includeObjects: false → environment only (lights, backdrop, emitter
//    glow, beams, baked-frame demo); authored GLB screens are registered
//    via `registerScreens()` and driven by the SAME pose clock + glass
//    shader. Desk/emitter geometry then comes from the GLBs.
// See docs/forge-hub/FORGE_STAGE_PIPELINE.md.

import {
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  PointLight,
  ShaderMaterial,
  SRGBColorSpace,
  type Texture,
  TorusGeometry,
  Vector2,
} from 'three';
import type { PocContent, PocPose, PocSlot } from '@/lib/forge-hub/poc/pocStage';
import { makeContentTexture } from './pocContent';

export interface PocFrameOpts {
  beams: boolean;
  baked: boolean;
  rm: boolean;
}

export interface PocReadout {
  cw: number;
  side: number;
  emit: number;
  beam: number;
  dim: number;
}

/** Screen handles the pose clock drives (procedural meshes OR GLB nodes). */
export interface PocScreenHandles {
  L: Object3D;
  C: Object3D;
  R: Object3D;
  /** The centre object whose glass material carries the content texture. */
  content: Object3D;
}

export interface PocSceneController {
  group: Group;
  coreLight: PointLight;
  update(pose: PocPose, time: number, opts: PocFrameOpts): PocReadout;
  /** Swap the driven screens (null → none; env keeps running). */
  registerScreens(handles: PocScreenHandles | null): void;
  dispose(): void;
}

const SCREEN_FRAG = `
  varying vec2 vUv; uniform float uTime,uAlpha,uHasTex; uniform vec2 uScale; uniform sampler2D uTex;
  void main(){
    vec2 p=(vUv-0.5)*uScale; vec2 hlf=uScale*0.5; float r=0.42;
    vec2 q=abs(p)-(hlf-r); float d=length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;
    float inside=smoothstep(0.02,-0.05,d);
    float edge=smoothstep(0.16,0.0,abs(d));
    float outGlow=smoothstep(0.40,0.0,d)*step(0.0,d);
    if(inside<0.004 && edge<0.004 && outGlow<0.004) discard;
    vec3 fill=vec3(0.18,0.72,0.86), edgeC=vec3(0.80,0.99,1.0);
    vec3 col=fill; float a=inside*0.34;
    col+=0.06*sin(vUv.y*uScale.y*7.0 - uTime*1.1);
    col+=smoothstep(0.5,0.0,abs(fract(vUv.x-uTime*0.05)-0.5))*0.10*inside;
    if(uHasTex>0.5){ vec4 tc=texture2D(uTex,vUv); float m=inside*tc.a; col=mix(col,tc.rgb,m); a=max(a, m*0.96); }
    col+=edgeC*0.03*sin(vUv.y*uScale.y*46.0+uTime*2.0)*inside;
    col=mix(col,edgeC,edge); a=max(a,edge*0.92);
    col=mix(col,edgeC,outGlow*0.6); a=max(a,outGlow*0.20);
    gl_FragColor=vec4(col,a*uAlpha);
  }`;

const SCREEN_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;

/** Runtime glass material (shared by procedural screens and GLB screens). */
export function makeGlassMaterial(hasContent: boolean): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: new Vector2(3.7, 3.7) },
      uAlpha: { value: 1 },
      uTex: { value: null as Texture | null },
      uHasTex: { value: hasContent ? 1 : 0 },
    },
    vertexShader: SCREEN_VERT,
    fragmentShader: SCREEN_FRAG,
  });
}

function radialTexture(stops: [number, string][]): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, col] of stops) g.addColorStop(o, col);
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function sfTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, '#d8fbff');
  g.addColorStop(0.55, '#59e6ff');
  g.addColorStop(1, '#0b6f84');
  x.fillStyle = g;
  x.beginPath();
  x.arc(128, 128, 128, 0, 7);
  x.fill();
  x.strokeStyle = 'rgba(220,250,255,.85)';
  x.lineWidth = 6;
  x.beginPath();
  x.arc(128, 128, 96, 0, 7);
  x.stroke();
  x.fillStyle = '#ffd79f';
  x.font = '700 118px system-ui, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('SF', 128, 140);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function glassUniforms(obj: Object3D): ShaderMaterial['uniforms'] | null {
  const mat = (obj as Mesh).material as ShaderMaterial | undefined;
  return mat && mat.uniforms && mat.uniforms.uScale ? mat.uniforms : null;
}

export function buildPocScene(
  opts: { includeObjects?: boolean } = {},
): PocSceneController {
  const includeObjects = opts.includeObjects ?? true;
  const group = new Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(o: T): T => {
    disposables.push(o);
    return o;
  };

  // ---- lights (always) ----
  group.add(new AmbientLight(0xffe9d6, 0.55));
  const key = new DirectionalLight(0xffe4c4, 1.15);
  key.position.set(-3, 6, 7);
  group.add(key);
  const rimLight = new DirectionalLight(0x9fe9ff, 0.5);
  rimLight.position.set(5, 2, 4);
  group.add(rimLight);
  const coreLight = new PointLight(0x6ff2ff, 2.0, 18, 2);
  coreLight.position.set(0, -3.1, 1.2);
  group.add(coreLight);

  // ---- backdrop (always; empty warm room) ----
  const bgMat = track(
    new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uDim: { value: 0 } },
      depthWrite: false,
      vertexShader: `varying vec2 v; void main(){ v=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `
        varying vec2 v; uniform float uTime; uniform float uDim;
        float h(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5); }
        void main(){
          vec2 p=v-0.5;
          vec3 cream=vec3(.96,.90,.82), rose=vec3(.87,.68,.55), deep=vec3(.20,.15,.13);
          float rad=length(p*vec2(1.15,1.0));
          vec3 col=mix(cream,rose,smoothstep(.1,.7,rad));
          col=mix(col,deep,smoothstep(.5,1.05,rad));
          col*=1.0+0.05*sin(v.x*22.0+1.7)*smoothstep(.2,.0,abs(v.y-.62));
          col*=0.97+0.03*h(floor(v*220.0));
          col*=1.0-uDim*0.5;
          gl_FragColor=vec4(col,1.0);
        }`,
    }),
  );
  const backdrop = new Mesh(track(new PlaneGeometry(40, 22)), bgMat);
  backdrop.position.set(0, 0, -7);
  group.add(backdrop);

  // ---- procedural desk + emitter (stand-ins; omitted in GLB mode) ----
  let core: Mesh | null = null;
  let emitter: Group | null = null;
  if (includeObjects) {
    const deskMat = track(new MeshStandardMaterial({ color: 0xdcb79a, metalness: 0.55, roughness: 0.42 }));
    const deskTop = new Mesh(track(new CylinderGeometry(4.4, 4.7, 0.5, 64)), deskMat);
    deskTop.position.set(0, -3.95, 1.0);
    group.add(deskTop);
    const deskRim = new Mesh(
      track(new TorusGeometry(3.05, 0.12, 20, 80)),
      track(new MeshStandardMaterial({ color: 0xffe0b4, metalness: 0.8, roughness: 0.3, emissive: 0x2a1c0e, emissiveIntensity: 0.4 })),
    );
    deskRim.rotation.x = Math.PI / 2;
    deskRim.position.set(0, -3.66, 1.0);
    group.add(deskRim);

    emitter = new Group();
    emitter.position.set(0, -3.62, 1.15);
    group.add(emitter);
    const puck = new Mesh(
      track(new CylinderGeometry(1.35, 1.5, 0.16, 64)),
      track(new MeshStandardMaterial({ color: 0xcfa987, metalness: 0.75, roughness: 0.35 })),
    );
    emitter.add(puck);
    const coreMat = track(new MeshBasicMaterial({ map: track(sfTexture()), transparent: true }));
    core = new Mesh(track(new CircleGeometry(1.02, 64)), coreMat);
    core.rotation.x = -Math.PI / 2;
    core.position.y = 0.1;
    emitter.add(core);
  }

  // ---- emitter glow sprite (always; runtime light) ----
  const emitGlow = new Mesh(
    track(new PlaneGeometry(6, 6)),
    track(
      new MeshBasicMaterial({
        map: track(radialTexture([
          [0, 'rgba(190,250,255,1)'],
          [0.35, 'rgba(95,230,255,.55)'],
          [1, 'rgba(95,230,255,0)'],
        ])),
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  emitGlow.position.set(0, -3.3, 1.25);
  group.add(emitGlow);

  // ---- content textures (always; swapped onto the centre screen) ----
  const contentTex: Record<PocContent, CanvasTexture> = {
    welcome: track(makeContentTexture('welcome')),
    hub: track(makeContentTexture('hub')),
    play: track(makeContentTexture('play')),
  };
  let curContent: PocContent | null = null;

  // ---- procedural glass screens (stand-ins; omitted in GLB mode) ----
  let screens: PocScreenHandles | null = null;
  function makeScreen(hasContent: boolean) {
    const mat = track(makeGlassMaterial(hasContent));
    const m = new Mesh(track(new PlaneGeometry(1, 1)), mat);
    group.add(m);
    return m;
  }
  if (includeObjects) {
    const sL = makeScreen(false);
    const sC = makeScreen(true);
    const sR = makeScreen(false);
    screens = { L: sL, C: sC, R: sR, content: sC };
  }

  function registerScreens(handles: PocScreenHandles | null) {
    screens = handles;
    curContent = null; // force a content re-apply next frame
  }

  // ---- beams (always; target whichever screens are registered) ----
  function makeBeam() {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(18), 3));
    g.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), 2));
    const mat = track(
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uI: { value: 0.7 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec2 vUv; uniform float uTime,uI;
          void main(){ float horiz=smoothstep(0.5,0.0,abs(vUv.x-0.5)); float up=mix(1.0,0.12,vUv.y);
            float flick=0.82+0.18*sin(uTime*7.0+vUv.y*10.0);
            float a=horiz*up*flick*uI*0.5; gl_FragColor=vec4(vec3(0.55,0.95,1.0),a);}`,
      }),
    );
    track(g);
    const m = new Mesh(g, mat);
    group.add(m);
    return m;
  }
  const beams = [makeBeam(), makeBeam(), makeBeam()];
  function updateBeam(mesh: Mesh, screen: Object3D) {
    const w = Math.max(0.001, screen.scale.x) * 0.34;
    const sx = screen.position.x;
    const sy = screen.position.y - screen.scale.y * 0.5 + 0.1;
    const ex = 0;
    const ey = -3.42;
    const ez = 1.2;
    const bh = 0.22;
    const pos = (mesh.geometry.attributes.position as BufferAttribute).array as Float32Array;
    pos.set([ex - bh, ey, ez, ex + bh, ey, ez, sx + w, sy, 0.02, ex - bh, ey, ez, sx + w, sy, 0.02, sx - w, sy, 0.02]);
    mesh.geometry.attributes.position.needsUpdate = true;
  }

  // ---- baked-frame demo (always; fixed, does NOT move) ----
  const bakedGroup = new Group();
  bakedGroup.visible = false;
  group.add(bakedGroup);
  function bakedFrame(x: number, y: number, w: number, h: number) {
    const geo = track(new EdgesGeometry(new PlaneGeometry(w, h)));
    const line = new LineSegments(geo, track(new LineBasicMaterial({ color: 0xff5f6f, transparent: true, opacity: 0.85 })));
    line.position.set(x, y, 0.05);
    const fill = new Mesh(
      track(new PlaneGeometry(w, h)),
      track(new MeshBasicMaterial({ color: 0xff5f6f, transparent: true, opacity: 0.06, depthWrite: false })),
    );
    fill.position.set(x, y, 0.04);
    bakedGroup.add(line);
    bakedGroup.add(fill);
  }
  bakedFrame(-5.0, 1.1, 3.5, 3.4);
  bakedFrame(0, 1.2, 3.7, 3.7);
  bakedFrame(5.0, 1.1, 3.5, 3.4);

  function applyScreen(obj: Object3D, slot: PocSlot, breathe: number, t: number) {
    obj.position.set(slot.x, slot.y, 0);
    obj.scale.set(slot.sx, slot.sy * breathe, 1);
    obj.rotation.y = (slot.yaw * Math.PI) / 180;
    obj.visible = slot.a > 0.01;
    const u = glassUniforms(obj);
    if (u) {
      (u.uScale.value as Vector2).set(slot.sx, slot.sy);
      u.uAlpha.value = slot.a;
      u.uTime.value = t;
    }
  }

  function update(pose: PocPose, t: number, opts: PocFrameOpts): PocReadout {
    const amb = opts.rm ? 1 : 1 + 0.01 * Math.sin(t * 1.3);

    if (screens) {
      applyScreen(screens.L, pose.L, amb, t);
      applyScreen(screens.C, pose.C, amb, t);
      applyScreen(screens.R, pose.R, amb, t);
      if (pose.content !== curContent) {
        curContent = pose.content;
        const u = glassUniforms(screens.content);
        if (u) u.uTex.value = contentTex[pose.content];
      }
    }

    bgMat.uniforms.uTime.value = t;
    bgMat.uniforms.uDim.value = pose.dim;

    const flick = opts.rm ? 1 : 0.9 + 0.1 * Math.sin(t * 6.0);
    if (core) core.scale.setScalar(0.9 + pose.emit * 0.18 * flick);
    coreLight.intensity = 1.3 + pose.emit * 2.4 * flick;
    if (emitter) emitter.position.y = -3.62 + (opts.rm ? 0 : 0.02 * Math.sin(t * 1.6));
    emitGlow.scale.setScalar((1.0 + pose.emit * 0.9) * flick);
    (emitGlow.material as MeshBasicMaterial).opacity = 0.32 + pose.emit * 0.55;

    const beamsOn = opts.beams && !!screens;
    beams[0].visible = beamsOn && pose.L.a > 0.02;
    beams[1].visible = beamsOn;
    beams[2].visible = beamsOn && pose.R.a > 0.02;
    if (screens) {
      updateBeam(beams[0], screens.L);
      updateBeam(beams[1], screens.C);
      updateBeam(beams[2], screens.R);
    }
    for (const b of beams) {
      const mat = b.material as ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uI.value = pose.beam;
    }

    bakedGroup.visible = opts.baked;

    return {
      cw: pose.C.sx,
      side: pose.L.a,
      emit: pose.emit,
      beam: beamsOn ? pose.beam : 0,
      dim: pose.dim,
    };
  }

  function dispose() {
    for (const d of disposables) {
      try {
        d.dispose();
      } catch {
        /* noop */
      }
    }
  }

  return { group, coreLight, update, registerScreens, dispose };
}
