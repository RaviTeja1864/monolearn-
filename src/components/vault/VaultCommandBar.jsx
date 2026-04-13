import React, { memo } from 'react';
import {
  BookOpen,
  Brain,
  HelpCircle,
  Map,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const commandActions = [
  {
    id: 'ask',
    label: 'Ask Anything',
    description: 'Send live vault context into chat',
    icon: MessageSquare,
    glow: 'from-sky-500/18 via-sky-500/6 to-transparent',
  },
  {
    id: 'quiz',
    label: 'Generate Quiz',
    description: 'Spin up an adaptive checkpoint',
    icon: HelpCircle,
    glow: 'from-violet-500/18 via-violet-500/8 to-transparent',
  },
  {
    id: 'plan',
    label: 'Create Study Plan',
    description: 'Draft a focused recovery sprint',
    icon: BookOpen,
    glow: 'from-emerald-500/18 via-emerald-500/8 to-transparent',
  },
  {
    id: 'map',
    label: 'Build Concept Map',
    description: 'Prepare a neural concept scaffold',
    icon: Map,
    glow: 'from-cyan-500/18 via-blue-500/8 to-transparent',
  },
  {
    id: 'export',
    label: 'Export All',
    description: 'Download the active vault payload',
    icon: Share2,
    glow: 'from-zinc-100/10 via-zinc-100/4 to-transparent',
  },
];

const VaultCommandBar = ({
  disabled,
  activeAction,
  focusLabel,
  selectedCount,
  queueCount,
  totalItems,
  onAction,
}) => {
  return (
    <div className="sticky bottom-5 z-30 mt-10 flex justify-center px-2 sm:px-0">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/8 bg-card/80 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl animate-neural-float">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.18),transparent_34%),radial-gradient(circle_at_80%_120%,rgba(139,92,246,0.18),transparent_28%)] opacity-90" />
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_0_24px_rgba(96,165,250,0.08)]">
                <Brain className="h-5 w-5 text-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground">
                  Vault Command Bar
                </p>
                <h3 className="text-sm font-semibold text-foreground sm:text-[15px]">
                  {focusLabel}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                {selectedCount > 0 ? `${selectedCount} selected` : `${totalItems} indexed`}
              </div>
              <div className="rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-sky-200">
                {queueCount} in study queue
              </div>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {commandActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onAction(action.id)}
                disabled={disabled}
                className={cn(
                  'group relative min-w-[188px] flex-1 overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all duration-300',
                  'border-white/8 bg-white/[0.03] hover:-translate-y-1 hover:border-white/16 hover:bg-white/[0.05]',
                  'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0',
                  activeAction === action.id && 'border-white/18 bg-white/[0.06] shadow-[0_0_32px_rgba(96,165,250,0.12)]',
                )}
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100', action.glow)} />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-2.5 transition-transform duration-300 group-hover:scale-105">
                      <action.icon className="h-4 w-4 text-foreground" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                      Execute
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[13px] font-semibold text-foreground">{action.label}</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(VaultCommandBar);
