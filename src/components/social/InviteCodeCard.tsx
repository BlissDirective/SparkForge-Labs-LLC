'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, UserPlus, Ticket } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFInput } from '@/components/ui/SFInput';

interface InviteCodeCardProps {
  onGenerate: () => Promise<{ code: string; expiresAt: string } | null>;
  onRedeem: (code: string) => Promise<{ ok: boolean; message: string }>;
  canAddMore: boolean;
}

export function InviteCodeCard({ onGenerate, onRedeem, canAddMore }: InviteCodeCardProps) {
  const [myCode, setMyCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await onGenerate();
    if (result) setMyCode(result.code);
    setGenerating(false);
  };

  const handleCopy = () => {
    if (!myCode) return;
    navigator.clipboard?.writeText(myCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRedeem = async () => {
    if (!redeemInput.trim()) return;
    setRedeeming(true);
    setRedeemMsg(null);
    const res = await onRedeem(redeemInput.trim());
    setRedeemMsg({ ok: res.ok, text: res.message });
    if (res.ok) setRedeemInput('');
    setRedeeming(false);
  };

  return (
    <SFCard variant="elevated" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-5 h-5" style={{ color: '#4F6EF7' }} />
        <h3 className="text-base font-bold" style={{ color: '#1A1D2B' }}>
          Add a Study Buddy
        </h3>
      </div>

      {/* Share my code */}
      <div className="mb-5">
        <p className="text-xs font-medium mb-2" style={{ color: '#8C94AC' }}>
          Share your code with a friend
        </p>
        {myCode ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <div
              className="flex-1 px-4 py-3 rounded-sf-md text-lg font-bold tracking-widest text-center"
              style={{ backgroundColor: 'rgba(79,110,247,0.08)', color: '#4F6EF7' }}
            >
              {myCode}
            </div>
            <SFButton variant="outline" size="md" onClick={handleCopy} aria-label="Copy invite code">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </SFButton>
          </motion.div>
        ) : (
          <SFButton
            variant="primary"
            size="md"
            fullWidth
            loading={generating}
            onClick={handleGenerate}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Get My Invite Code
          </SFButton>
        )}
      </div>

      {/* Redeem a code */}
      <div className="pt-4 border-t" style={{ borderColor: '#EEF2FA' }}>
        <p className="text-xs font-medium mb-2" style={{ color: '#8C94AC' }}>
          Got a code from a friend?
        </p>
        <div className="flex items-center gap-2">
          <SFInput
            value={redeemInput}
            onChange={(e) => setRedeemInput(e.target.value)}
            placeholder="ABCD-2345"
            aria-label="Enter friend's invite code"
            disabled={!canAddMore}
            className="flex-1"
          />
          <SFButton
            variant="accent"
            size="md"
            loading={redeeming}
            disabled={!canAddMore || !redeemInput.trim()}
            onClick={handleRedeem}
          >
            Connect
          </SFButton>
        </div>
        {!canAddMore && (
          <p className="text-xs mt-2" style={{ color: '#FF6B35' }}>
            You&apos;ve reached your buddy limit.
          </p>
        )}
        {redeemMsg && (
          <p className="text-xs mt-2" style={{ color: redeemMsg.ok ? '#2ECC71' : '#EF4444' }}>
            {redeemMsg.text}
          </p>
        )}
      </div>

      <p className="text-[10px] mt-4 leading-relaxed" style={{ color: '#A8AEC2' }}>
        🔒 A grown-up approves every new buddy. No real names or photos are ever shared.
      </p>
    </SFCard>
  );
}

export default InviteCodeCard;
