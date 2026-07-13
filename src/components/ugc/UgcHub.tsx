'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Check, Clock, X, Wand2, BookOpen, Award, MessageSquare, Bot } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFSkeleton } from '@/components/ui/SFSkeleton';
import { useUgc, type ContentView } from '@/hooks/useUgc';
import { useActiveChild } from '@/hooks/useChildren';
import { useAgentAtelierStore } from '@/stores/agentAtelierStore';
import {
  QUESTION_BANK, TITLE_PREFIXES, TITLE_NOUNS, buildTitle, validateQuiz,
  validatePromptText, PROMPT_MAX_LEN, kindLabel,
  MIN_QUESTIONS, MAX_QUESTIONS, getCreatorGreeting,
  type ModerationStatus, type ContentKind,
} from '@/lib/ugc/UgcEngine';

const KIND_ICON: Record<ContentKind, typeof BookOpen> = {
  quiz: BookOpen,
  agent: Bot,
  prompt: MessageSquare,
};

/** Kind-appropriate one-line description for a creation row. */
function describeContent(c: ContentView): string {
  if (c.kind === 'quiz') return `${c.questionIds.length} questions`;
  if (c.kind === 'agent') return String((c.payload as { summary?: string }).summary || 'Shared agent');
  return String((c.payload as { text?: string }).text || 'Shared prompt');
}

/** Display title — prompts show their text, not the placeholder title. */
function displayTitle(c: ContentView): string {
  if (c.kind === 'prompt') return String((c.payload as { text?: string }).text || c.title);
  return c.title;
}

const STATUS_BADGE: Record<ModerationStatus, { label: string; color: string; Icon: typeof Check }> = {
  draft: { label: 'Draft', color: '#8C94AC', Icon: Clock },
  pending: { label: 'Awaiting grown-up', color: '#F59E0B', Icon: Clock },
  approved: { label: 'Published', color: '#2ECC71', Icon: Check },
  rejected: { label: 'Not approved', color: '#EF4444', Icon: X },
};

export function UgcHub({ childId }: { childId: string }) {
  const { myCreations, community, badges, stats, isLoading, createQuiz, publishPrompt, publishAgent, rateQuiz } = useUgc(childId);
  const band = (useActiveChild()?.age_band ?? 'B') as 'A' | 'B' | 'C';
  const [prefix, setPrefix] = useState(TITLE_PREFIXES[0]);
  const [noun, setNoun] = useState(TITLE_NOUNS[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Prompt composer state (G4b).
  const [promptText, setPromptText] = useState('');
  const [promptBusy, setPromptBusy] = useState(false);
  const [promptMsg, setPromptMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const promptValidation = validatePromptText(promptText);

  const title = buildTitle(prefix, noun);
  const validation = validateQuiz(title, selected);

  const submitPrompt = async () => {
    setPromptBusy(true); setPromptMsg(null);
    const r = await publishPrompt(promptText.trim(), band);
    setPromptMsg({ ok: r.ok, text: r.message });
    if (r.ok) setPromptText('');
    setPromptBusy(false);
  };

  // Agent publishing (G4b) — reads the child's saved Agent Atelier
  // compositions from the client store; each can be shared to the arcade.
  const savedAgents = useAgentAtelierStore((s) => s.savedCompositions).filter((c) => c.childId === childId);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [agentMsg, setAgentMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const shareAgent = async (id: string, name: string, teamSize: number) => {
    setSharingId(id); setAgentMsg(null);
    const r = await publishAgent(id, name, `${teamSize} agent${teamSize === 1 ? '' : 's'}`);
    setAgentMsg({ ok: r.ok, text: r.message });
    setSharingId(null);
  };

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < MAX_QUESTIONS ? [...cur, id] : cur));

  const submit = async () => {
    setBusy(true); setMsg(null);
    const r = await createQuiz(title, selected);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) setSelected([]);
    setBusy(false);
  };

  if (isLoading) return <div className="space-y-4"><SFSkeleton variant="card" className="h-48 rounded-2xl" /><SFSkeleton variant="card" className="h-32 rounded-2xl" /></div>;

  return (
    <div className="space-y-5">
      {/* Creator badges summary */}
      <SFCard variant="elevated" className="p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #E945F5, #4F6EF7)' }}>
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: '#1A1D2B' }}>Quiz Creator</p>
          <p className="text-xs" style={{ color: '#8C94AC' }}>{getCreatorGreeting(stats.published)}</p>
        </div>
        <div className="flex gap-1">
          {badges.map((b) => (
            <span key={b.id} title={b.title} className="text-lg" aria-label={b.title}>{b.emoji}</span>
          ))}
        </div>
      </SFCard>

      {/* Builder */}
      <SFCard variant="elevated" className="p-5">
        <h3 className="text-base font-bold mb-3" style={{ color: '#1A1D2B' }}>Build a Quiz</h3>

        {/* Title pickers */}
        <p className="text-xs font-medium mb-1" style={{ color: '#8C94AC' }}>Pick a title</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TITLE_PREFIXES.map((p) => (
            <button key={p} onClick={() => setPrefix(p)} aria-pressed={prefix === p} className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: prefix === p ? '#E945F5' : 'rgba(233,69,245,0.08)', color: prefix === p ? '#FFF' : '#E945F5' }}>{p}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TITLE_NOUNS.map((n) => (
            <button key={n} onClick={() => setNoun(n)} aria-pressed={noun === n} className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: noun === n ? '#4F6EF7' : 'rgba(79,110,247,0.08)', color: noun === n ? '#FFF' : '#4F6EF7' }}>{n}</button>
          ))}
        </div>
        <p className="text-sm font-bold mb-3" style={{ color: '#1A1D2B' }}>“{title}”</p>

        {/* Question bank */}
        <p className="text-xs font-medium mb-1" style={{ color: '#8C94AC' }}>
          Pick {MIN_QUESTIONS}-{MAX_QUESTIONS} questions ({selected.length} chosen)
        </p>
        <div className="space-y-1.5 max-h-72 overflow-y-auto mb-3">
          {QUESTION_BANK.map((q) => {
            const on = selected.includes(q.id);
            return (
              <button key={q.id} onClick={() => toggle(q.id)} aria-pressed={on} className="w-full text-left flex items-center gap-2 p-2.5 rounded-xl transition-all"
                style={{ background: on ? 'rgba(46,204,113,0.1)' : '#F7F8FC', border: `1px solid ${on ? '#2ECC71' : 'transparent'}` }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? '#2ECC71' : '#EEF0F8' }}>
                  {on && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-xs" style={{ color: '#1A1D2B' }}>{q.prompt}</span>
              </button>
            );
          })}
        </div>

        <SFButton variant="accent" fullWidth disabled={!validation.valid} loading={busy} onClick={submit}>
          Submit for Grown-Up Review
        </SFButton>
        {!validation.valid && <p className="text-[11px] mt-2 text-center" style={{ color: '#8C94AC' }}>{validation.reason}</p>}
        {msg && <p className="text-xs mt-2 text-center" style={{ color: msg.ok ? '#2ECC71' : '#EF4444' }}>{msg.text}</p>}
      </SFCard>

      {/* Share a Prompt (G4b) — the only free-text creation kind, so it is
          double-gated: instant client checks here, then blocklist + Haiku
          screening server-side, then a grown-up must approve before sharing. */}
      <SFCard variant="elevated" className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-5 h-5" style={{ color: '#00B8D4' }} />
          <h3 className="text-base font-bold" style={{ color: '#1A1D2B' }}>Share a Prompt</h3>
        </div>
        <p className="text-xs mb-2" style={{ color: '#8C94AC' }}>
          Write a great prompt to share with other learners. A grown-up reviews it first.
        </p>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          maxLength={PROMPT_MAX_LEN}
          rows={3}
          aria-label="Prompt text to share"
          placeholder="e.g. Explain how a robot learns to tell cats from dogs"
          className="w-full rounded-xl p-3 text-sm resize-none"
          style={{ background: '#F7F8FC', border: '1px solid #E4E8F2', color: '#1A1D2B' }}
        />
        <div className="flex items-center justify-between mt-1 mb-3">
          <span className="text-[11px]" style={{ color: '#8C94AC' }}>
            {promptText.trim().length}/{PROMPT_MAX_LEN}
          </span>
          {!promptValidation.valid && promptText.length > 0 && (
            <span className="text-[11px]" style={{ color: '#EF4444' }}>{promptValidation.reason}</span>
          )}
        </div>
        <SFButton variant="accent" fullWidth disabled={!promptValidation.valid} loading={promptBusy} onClick={submitPrompt}>
          Submit for Grown-Up Review
        </SFButton>
        {promptMsg && <p className="text-xs mt-2 text-center" style={{ color: promptMsg.ok ? '#2ECC71' : '#EF4444' }}>{promptMsg.text}</p>}
      </SFCard>

      {/* Share an Agent (G4b) — surfaces the child's saved Agent Atelier
          builds; publishing routes through the same grown-up review. */}
      {savedAgents.length > 0 && (
        <SFCard variant="elevated" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5" style={{ color: '#6FFFE6' }} />
            <h3 className="text-base font-bold" style={{ color: '#1A1D2B' }}>Share an Agent</h3>
          </div>
          <div className="space-y-2">
            {savedAgents.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F7F8FC' }}>
                <Bot className="w-4 h-4 shrink-0" style={{ color: '#4F6EF7' }} aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#1A1D2B' }}>{c.name}</p>
                  <p className="text-[11px]" style={{ color: '#8C94AC' }}>{c.team.length} agent{c.team.length === 1 ? '' : 's'}</p>
                </div>
                <SFButton variant="outline" loading={sharingId === c.id} onClick={() => shareAgent(c.id, c.name, c.team.length)}>
                  Share
                </SFButton>
              </div>
            ))}
          </div>
          {agentMsg && <p className="text-xs mt-2 text-center" style={{ color: agentMsg.ok ? '#2ECC71' : '#EF4444' }}>{agentMsg.text}</p>}
        </SFCard>
      )}

      {/* My creations */}
      {myCreations.length > 0 && (
        <SFCard variant="elevated" className="p-5">
          <h3 className="text-base font-bold mb-3" style={{ color: '#1A1D2B' }}>My Creations</h3>
          <div className="space-y-2">
            {myCreations.map((q) => {
              const s = STATUS_BADGE[q.status];
              const KindIcon = KIND_ICON[q.kind];
              return (
                <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F7F8FC' }}>
                  <KindIcon className="w-4 h-4 shrink-0" style={{ color: '#4F6EF7' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#1A1D2B' }}>{displayTitle(q)}</p>
                    <p className="text-[11px] inline-flex items-center gap-1" style={{ color: '#8C94AC' }}>
                      <span className="uppercase tracking-wide font-semibold" style={{ color: '#B0B7CC' }}>{kindLabel(q.kind)}</span>
                      <span>·</span>
                      <span className="truncate">{describeContent(q)}</span>
                      {q.ratingCount > 0 && (
                        <>
                          <span>·</span>
                          <Star className="w-3 h-3" style={{ color: '#FFD93D' }} aria-hidden />
                          <span>{q.averageRating}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${s.color}1A`, color: s.color }}>
                    <s.Icon className="w-3 h-3" /> {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </SFCard>
      )}

      {/* Community library */}
      <SFCard variant="elevated" className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5" style={{ color: '#FFD93D' }} />
          <h3 className="text-base font-bold" style={{ color: '#1A1D2B' }}>Community Creations</h3>
        </div>
        {community.length === 0 ? (
          <p className="text-sm py-3 text-center" style={{ color: '#8C94AC' }}>Nothing published yet — be the first!</p>
        ) : (
          <div className="space-y-2">
            {community.map((q, i) => (
              <CommunityRow key={q.id} item={q} mine={q.creatorChildId === childId} index={i} onRate={(s) => rateQuiz(q.id, s)} />
            ))}
          </div>
        )}
      </SFCard>
    </div>
  );
}

function CommunityRow({ item, mine, index, onRate }: { item: ContentView; mine: boolean; index: number; onRate: (stars: number) => void }) {
  const [rated, setRated] = useState(false);
  const KindIcon = KIND_ICON[item.kind];
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F7F8FC' }}>
      <KindIcon className="w-4 h-4 shrink-0" style={{ color: '#4F6EF7' }} aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: '#1A1D2B' }}>{displayTitle(item)}</p>
        <p className="text-[11px] inline-flex items-center gap-1" style={{ color: '#8C94AC' }}>
          <span className="uppercase tracking-wide font-semibold" style={{ color: '#B0B7CC' }}>{kindLabel(item.kind)}</span>
          <span>·</span>
          <Star className="w-3 h-3" style={{ color: '#FFD93D' }} aria-hidden />
          <span>{item.averageRating} ({item.ratingCount})</span>
        </p>
      </div>
      {mine ? (
        <span className="text-[10px]" style={{ color: '#8C94AC' }}>Yours</span>
      ) : (
        <div className="flex gap-0.5 shrink-0" role="group" aria-label="Rate this creation">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} disabled={rated} onClick={() => { setRated(true); onRate(s); }} aria-label={`${s} stars`}>
              <Star className="w-4 h-4" style={{ color: '#FFD93D', fill: rated ? '#FFD93D' : 'none' }} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default UgcHub;
