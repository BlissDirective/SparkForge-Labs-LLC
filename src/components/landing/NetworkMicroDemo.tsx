'use client';

// ════════════════════════════════════════════════════════════════
// LIGHT THE NETWORK — Forge F6 (Concept 10 §10.6, owner-confirmed)
// ════════════════════════════════════════════════════════════════
// A ~2-minute guided neural-network build distilled from Neural
// Builder. Four auto-advancing rounds + finale. Pure DOM/SVG, zero
// stores/auth/deps. Escape valves (mandatory): the signup CTA is
// persistently visible from Round 1, and "Skip to the finale ▸"
// jumps ahead at any time. The finale pulse escapes onto the Molten
// Thread via a 'forge-pulse-escape' CustomEvent.
//
//   R1 Wire it   — connect the layers; first valid path fires
//   R2 Weight it — fix a mis-weighted net that calls a dog a cat
//   R3 Grow it   — forge a third hidden neuron for a tricky case
//   R4 Fire it   — three rapid cascades (cat/dog/rabbit), then finale

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// ── Geometry (viewBox 0 0 400 260) ──
const INPUTS = [
  { id: 'i0', x: 60, y: 60, emoji: '👂', label: 'pointy ears' },
  { id: 'i1', x: 60, y: 130, emoji: '🐟', label: 'likes fish' },
  { id: 'i2', x: 60, y: 200, emoji: '🧶', label: 'chases yarn' },
] as const;
const HIDDEN = [
  { id: 'h0', x: 200, y: 90 },
  { id: 'h1', x: 200, y: 170 },
] as const;
const H2 = { id: 'h2', x: 200, y: 235 };
const OUTPUT = { id: 'o', x: 340, y: 130 };

type NodeId = 'i0' | 'i1' | 'i2' | 'h0' | 'h1' | 'h2' | 'o';
type ConnId = `${string}-${string}`;

interface Conn {
  id: ConnId;
  from: NodeId;
  to: NodeId;
}

const BASE_CONNS: Conn[] = [
  { id: 'i0-h0', from: 'i0', to: 'h0' },
  { id: 'i1-h0', from: 'i1', to: 'h0' },
  { id: 'i1-h1', from: 'i1', to: 'h1' },
  { id: 'i2-h1', from: 'i2', to: 'h1' },
  { id: 'h0-o', from: 'h0', to: 'o' },
  { id: 'h1-o', from: 'h1', to: 'o' },
];
const GROW_CONNS: Conn[] = [
  { id: 'i0-h2', from: 'i0', to: 'h2' },
  { id: 'h2-o', from: 'h2', to: 'o' },
];

const NODE_POS: Record<NodeId, { x: number; y: number }> = {
  i0: INPUTS[0], i1: INPUTS[1], i2: INPUTS[2],
  h0: HIDDEN[0], h1: HIDDEN[1], h2: H2, o: OUTPUT,
};

type Round = 'r1' | 'r2' | 'r3' | 'r4' | 'finale';

const ROUND_COPY: Record<Round, { title: string; hint: string }> = {
  r1: { title: 'Round 1 — Wire it', hint: 'Tap the dim connections to wire the network. Neurons only fire when they’re connected!' },
  r2: { title: 'Round 2 — Weight it', hint: 'Uh oh — this net thinks a DOG is a cat! Tap the glowing connection to weaken it, then re-fire. Stronger connections shout; weaker ones whisper.' },
  r3: { title: 'Round 3 — Grow it', hint: '🐰 Fluffy AND hops?! Two neurons can’t tell. Tap the pulsing socket to forge a third neuron, then wire it up. Bigger networks learn trickier patterns.' },
  r4: { title: 'Round 4 — Fire it', hint: 'Your network is forged. Watch it classify three animals in a row!' },
  finale: { title: 'You just built a neural network.', hint: 'Wiring, weights, and growth — that’s the real thing.' },
};

export function NetworkMicroDemo() {
  const reducedMotion = useReducedMotion();
  const [round, setRound] = useState<Round>('r1');
  const [active, setActive] = useState<Set<ConnId>>(new Set());
  const [weights, setWeights] = useState<Record<ConnId, number>>({ 'i0-h0': 3 } as Record<ConnId, number>);
  const [grown, setGrown] = useState(false);
  const [firing, setFiring] = useState(false);
  const [outputLabel, setOutputLabel] = useState('?');
  const [outputLit, setOutputLit] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [r4Step, setR4Step] = useState(0);
  const fireTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conns = useMemo(
    () => (grown ? [...BASE_CONNS, ...GROW_CONNS] : BASE_CONNS),
    [grown]
  );

  useEffect(() => () => { if (fireTimer.current) clearTimeout(fireTimer.current); }, []);

  // ── Fire the network: pulse animation → output ignites ──
  const fire = useCallback(
    (label: string, after?: () => void) => {
      setFiring(true);
      setOutputLit(false);
      const delay = reducedMotion ? 50 : 900;
      fireTimer.current = setTimeout(() => {
        setFiring(false);
        setOutputLit(true);
        setOutputLabel(label);
        setAnnounce(`The network fired: ${label}`);
        after?.();
      }, delay);
    },
    [reducedMotion]
  );

  // ── Round 1: wiring ──
  const toggleConn = useCallback(
    (id: ConnId) => {
      if (round === 'r1') {
        setActive((prev) => {
          const next = new Set(prev);
          next.add(id);
          // Valid path: any input→hidden AND that hidden→output.
          const hasPath =
            (['h0', 'h1'] as const).some(
              (h) =>
                [...next].some((c) => c.endsWith(`-${h}`)) &&
                next.has(`${h}-o` as ConnId)
            );
          if (hasPath) {
            fire("It's a CAT!", () => {
              setTimeout(() => {
                setAnnounce('Round 2: fix the weights.');
                setRound('r2');
                setOutputLit(false);
                setOutputLabel('?');
              }, reducedMotion ? 400 : 1600);
            });
          }
          return next;
        });
      } else if (round === 'r2') {
        if (id === 'i0-h0') {
          setWeights((w) => {
            const cur = w[id] ?? 3;
            const nextW = cur > 1 ? cur - 1 : 1;
            const done = nextW === 1;
            if (done) {
              fire("It's a DOG!", () => {
                setTimeout(() => {
                  setAnnounce('Round 3: grow the network.');
                  setRound('r3');
                  setOutputLit(false);
                  setOutputLabel('?');
                }, reducedMotion ? 400 : 1600);
              });
            }
            return { ...w, [id]: nextW };
          });
        }
      } else if (round === 'r3' && grown) {
        if (id === 'i0-h2' || id === 'h2-o') {
          setActive((prev) => {
            const next = new Set(prev);
            next.add(id);
            if (next.has('i0-h2') && next.has('h2-o')) {
              fire("It's a RABBIT!", () => {
                setTimeout(() => {
                  setAnnounce('Round 4: fire it!');
                  setRound('r4');
                  setOutputLit(false);
                  setOutputLabel('?');
                }, reducedMotion ? 400 : 1600);
              });
            }
            return next;
          });
        }
      }
    },
    [round, grown, fire, reducedMotion]
  );

  // ── Round 3: forge the socket ──
  const forgeNeuron = useCallback(() => {
    if (round !== 'r3' || grown) return;
    setGrown(true);
    setAnnounce('New neuron forged! Wire it to the input and output.');
  }, [round, grown]);

  // ── Round 4: auto-sequence three cascades ──
  useEffect(() => {
    if (round !== 'r4') return;
    const labels = ["It's a CAT!", "It's a DOG!", "It's a RABBIT!"];
    if (r4Step >= 3) {
      // Finale: the pulse escapes onto the Molten Thread.
      window.dispatchEvent(new CustomEvent('forge-pulse-escape'));
      setRound('finale');
      setAnnounce('You just built a neural network.');
      return;
    }
    const t = setTimeout(() => {
      fire(labels[r4Step], () => {
        setTimeout(() => setR4Step((s) => s + 1), reducedMotion ? 300 : 1100);
      });
    }, reducedMotion ? 200 : 600);
    return () => clearTimeout(t);
  }, [round, r4Step, fire, reducedMotion]);

  const skipToFinale = useCallback(() => {
    if (fireTimer.current) clearTimeout(fireTimer.current);
    setActive(new Set(conns.map((c) => c.id)));
    setGrown(true);
    setOutputLit(true);
    setOutputLabel("It's a CAT!");
    window.dispatchEvent(new CustomEvent('forge-pulse-escape'));
    setRound('finale');
  }, [conns]);

  const copy = ROUND_COPY[round];

  // Which connections are interactive right now?
  const isConnActionable = (c: Conn): boolean => {
    if (round === 'r1') return !active.has(c.id);
    if (round === 'r2') return c.id === 'i0-h0';
    if (round === 'r3') return grown && (c.id === 'i0-h2' || c.id === 'h2-o') && !active.has(c.id);
    return false;
  };

  const connState = (c: Conn) => {
    const isActive = round !== 'r1' ? active.has(c.id) || BASE_CONNS.some((b) => b.id === c.id) : active.has(c.id);
    const weight = weights[c.id] ?? 2;
    return { isActive, weight };
  };

  return (
    <section
      aria-label="Light the Network — build a neural network in 2 minutes"
      className="relative py-16 px-4"
      style={{ backgroundColor: '#16100B' }}
    >
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_280px] gap-8 items-start">
        {/* ── The network stage ── */}
        <div
          className="relative rounded-2xl border p-4"
          style={{ borderColor: 'rgba(255,194,74,0.14)', background: 'rgba(41,30,22,0.62)', backdropFilter: 'blur(14px)' }}
        >
          <div className="mb-3">
            <h2
              className="text-xl sm:text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: '#F5EBDC', textShadow: round === 'finale' ? '0 0 18px rgba(255,194,74,0.35)' : 'none' }}
            >
              {copy.title}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#D3C2AC' }}>
              {copy.hint}
            </p>
          </div>

          <svg viewBox="0 0 400 260" className="w-full" role="group" aria-label="Neural network diagram">
            {/* connections */}
            {conns.map((c) => {
              const from = NODE_POS[c.from];
              const to = NODE_POS[c.to];
              const { isActive, weight } = connState(c);
              const actionable = isConnActionable(c);
              const isR2Target = round === 'r2' && c.id === 'i0-h0';
              return (
                <g key={c.id}>
                  {/* visible line */}
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={isActive ? '#FF8C1A' : '#4A3A2C'}
                    strokeWidth={isActive ? weight : 1.5}
                    strokeDasharray={isActive ? undefined : '4 4'}
                    opacity={isActive ? 0.9 : 0.6}
                    style={isR2Target && !reducedMotion ? { animation: 'forge-glow-breathe 1.2s ease-in-out infinite' } : undefined}
                  />
                  {/* firing pulse */}
                  {firing && isActive && !reducedMotion && (
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="#FFE9B8"
                      strokeWidth={weight + 1}
                      strokeDasharray="14 200"
                      style={{ animation: 'forge-conn-pulse 0.9s linear forwards' }}
                    />
                  )}
                  {/* hit area */}
                  {actionable && (
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="transparent"
                      strokeWidth={22}
                      role="button"
                      tabIndex={0}
                      aria-label={
                        isR2Target
                          ? `Connection from ${c.from} to ${c.to}, strength ${weight} of 3 — press to weaken`
                          : `Connect ${c.from} to ${c.to}`
                      }
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleConn(c.id)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleConn(c.id)}
                    />
                  )}
                </g>
              );
            })}

            {/* R3 socket */}
            {round === 'r3' && !grown && (
              <circle
                cx={H2.x} cy={H2.y} r={14}
                fill="rgba(255,140,26,0.15)"
                stroke="#FF8C1A"
                strokeWidth={2}
                strokeDasharray="4 4"
                role="button"
                tabIndex={0}
                aria-label="Forge a new neuron here"
                style={{ cursor: 'pointer', animation: reducedMotion ? undefined : 'forge-glow-breathe 1.2s ease-in-out infinite' }}
                onClick={forgeNeuron}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && forgeNeuron()}
              />
            )}

            {/* input nodes */}
            {INPUTS.map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={22} fill="#291E16" stroke="#C87B3B" strokeWidth={2} />
                <text x={n.x} y={n.y + 7} textAnchor="middle" fontSize="20" aria-hidden="true">{n.emoji}</text>
                <text x={n.x} y={n.y + 40} textAnchor="middle" fontSize="9" fill="#AC9882">{n.label}</text>
              </g>
            ))}

            {/* hidden nodes */}
            {(grown ? [...HIDDEN, H2] : [...HIDDEN]).map((n) => (
              <circle
                key={n.id}
                cx={n.x} cy={n.y} r={16}
                fill={firing && !reducedMotion ? '#FF8C1A' : '#33261C'}
                stroke="#C87B3B"
                strokeWidth={2}
                style={{ transition: 'fill 300ms ease' }}
              />
            ))}

            {/* output node */}
            <g>
              <circle
                cx={OUTPUT.x} cy={OUTPUT.y} r={30}
                fill={outputLit ? '#FF8C1A' : '#291E16'}
                stroke={outputLit ? '#FFC24A' : '#C87B3B'}
                strokeWidth={3}
                style={{
                  transition: 'fill 300ms ease, stroke 300ms ease',
                  filter: outputLit ? 'drop-shadow(0 0 14px rgba(255,140,26,0.7))' : undefined,
                }}
              />
              <text
                x={OUTPUT.x} y={OUTPUT.y + 5}
                textAnchor="middle" fontSize="11" fontWeight="bold"
                fill={outputLit ? '#16100B' : '#AC9882'}
              >
                {outputLabel}
              </text>
            </g>
          </svg>

          {/* round progress dots */}
          <div className="flex justify-center gap-2 mt-2" aria-hidden="true">
            {(['r1', 'r2', 'r3', 'r4'] as const).map((r) => (
              <span
                key={r}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    round === r
                      ? '#FF8C1A'
                      : (['r1', 'r2', 'r3', 'r4'] as const).indexOf(r) <
                          (['r1', 'r2', 'r3', 'r4', 'finale'] as const).indexOf(round)
                        ? '#7FE24A'
                        : '#4A3A2C',
                }}
              />
            ))}
          </div>

          {round !== 'finale' && (
            <button
              type="button"
              onClick={skipToFinale}
              className="absolute bottom-3 right-4 text-xs underline underline-offset-2"
              style={{ color: '#AC9882' }}
            >
              Skip to the finale ▸
            </button>
          )}

          <div aria-live="polite" className="sr-only">{announce}</div>
        </div>

        {/* ── Persistent CTA rail (escape valve #1) ── */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={round === 'finale' ? 'finale' : 'during'}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-5 space-y-3"
              style={{ borderColor: 'rgba(255,194,74,0.14)', background: 'rgba(41,30,22,0.62)' }}
            >
              {round === 'finale' ? (
                <>
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#F5EBDC' }}>
                    You just built a neural network. ⚡
                  </h3>
                  <p className="text-sm" style={{ color: '#D3C2AC' }}>
                    Wiring, weights, and growing the brain — that&apos;s how the real thing works.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#F5EBDC' }}>
                    Try it yourself →
                  </h3>
                  <p className="text-sm" style={{ color: '#D3C2AC' }}>
                    This is a tiny taste of one game. There are 42 more inside.
                  </p>
                </>
              )}
              <a
                href="/signup"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm forge-molten-fill forge-anim"
                style={{ color: '#16100B' }}
              >
                <Sparkles className="w-4 h-4" />
                Forge the real thing
              </a>
              <p className="text-[11px] text-center" style={{ color: '#AC9882' }}>
                Neural Builder is waiting inside — free to start.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
