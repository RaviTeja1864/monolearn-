import React, { memo, useMemo } from 'react';
import {
  ArrowUpRight,
  Brain,
  CheckSquare,
  Code,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  MoreVertical,
  PlayCircle,
  Plus,
  Square,
  Video,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const quickActions = [
  {
    id: 'chat',
    label: 'Open in Chat',
    icon: MessageSquare,
  },
  {
    id: 'code',
    label: 'Analyze with Code Mentor',
    icon: Brain,
  },
  {
    id: 'video',
    label: 'Compare to Video',
    icon: PlayCircle,
  },
  {
    id: 'session',
    label: 'Add to Study Session',
    icon: Plus,
  },
];

const getTypeIcon = (type) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-400" />;
    case 'video':
      return <Video className="h-5 w-5 text-sky-400" />;
    case 'code':
      return <Code className="h-5 w-5 text-emerald-400" />;
    case 'image':
      return <ImageIcon className="h-5 w-5 text-violet-400" />;
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
};

const getAccentClasses = (subject = '') => {
  const normalized = subject.toLowerCase();

  if (normalized.includes('machine') || normalized.includes('neural')) {
    return {
      glow: 'from-sky-500/20 via-violet-500/10 to-transparent',
      accent: 'shadow-[0_0_42px_rgba(96,165,250,0.12)]',
      chip: 'bg-sky-500/10 text-sky-200 border-sky-500/20',
    };
  }

  if (normalized.includes('operating') || normalized.includes('systems')) {
    return {
      glow: 'from-cyan-500/18 via-blue-500/10 to-transparent',
      accent: 'shadow-[0_0_42px_rgba(34,211,238,0.1)]',
      chip: 'bg-cyan-500/10 text-cyan-100 border-cyan-500/20',
    };
  }

  if (normalized.includes('data') || normalized.includes('algorithm')) {
    return {
      glow: 'from-emerald-500/18 via-sky-500/10 to-transparent',
      accent: 'shadow-[0_0_42px_rgba(16,185,129,0.1)]',
      chip: 'bg-emerald-500/10 text-emerald-100 border-emerald-500/20',
    };
  }

  return {
    glow: 'from-white/10 via-white/[0.04] to-transparent',
    accent: 'shadow-[0_0_34px_rgba(255,255,255,0.05)]',
    chip: 'bg-white/[0.04] text-foreground/75 border-white/10',
  };
};

const VaultItemCard = ({
  item,
  view,
  isSelected,
  isMenuVisible,
  onSelect,
  onMenuVisibilityChange,
  onMenuToggle,
  onQuickAction,
}) => {
  const accent = useMemo(() => getAccentClasses(item.subject), [item.subject]);

  return (
    <div
      onClick={() => onSelect(item.id)}
      onMouseEnter={() => onMenuVisibilityChange(item.id)}
      onMouseLeave={() => onMenuVisibilityChange(null)}
      className={cn(
        'group relative overflow-hidden rounded-[28px] border border-border/40 bg-card p-5 transition-all duration-300 cursor-pointer',
        'hover:-translate-y-1 hover:border-white/14 hover:bg-secondary/30',
        isSelected
          ? `border-white/20 bg-secondary/45 ring-1 ring-white/12 ${accent.accent}`
          : 'hover:shadow-[0_18px_60px_rgba(0,0,0,0.28)]',
        view === 'list' ? 'flex items-center gap-5' : 'flex flex-col gap-4',
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', accent.glow)} />
      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <button
        onClick={(event) => {
          event.stopPropagation();
          onMenuToggle(item.id);
        }}
        className="absolute right-4 top-4 z-20 rounded-xl border border-white/8 bg-black/20 p-2 text-muted-foreground opacity-0 backdrop-blur-xl transition-all duration-300 hover:border-white/16 hover:text-foreground group-hover:opacity-100"
        data-vault-menu-trigger="true"
        aria-label={`Open actions for ${item.name}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isSelected ? (
        <div className="absolute left-4 top-4 z-20 text-foreground animate-in zoom-in-75">
          <CheckSquare className="h-5 w-5" />
        </div>
      ) : (
        <div className="absolute left-4 top-4 z-10 text-muted-foreground/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Square className="h-5 w-5" />
        </div>
      )}

      <div
        className={cn(
          'relative z-10 rounded-[22px] border border-white/8 bg-black/15 p-3.5 transition-all duration-300 group-hover:scale-105 group-hover:border-white/14',
          view === 'list' ? 'flex h-14 w-14 shrink-0 items-center justify-center' : 'w-fit',
        )}
      >
        {getTypeIcon(item.type)}
      </div>

      <div className="relative z-10 min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <h4 className="pr-6 text-[14px] font-semibold leading-tight text-foreground/92">{item.name}</h4>
          <ArrowUpRight className="mt-0.5 hidden h-4 w-4 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/70 sm:block" />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/80">
          <span>{item.size}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span>{item.subject}</span>
        </div>

        {view === 'grid' && (
          <p className="pt-2 text-[12px] leading-relaxed text-muted-foreground/70 transition-colors duration-300 group-hover:text-foreground/72">
            {item.preview}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 pt-3">
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className={cn(
                'rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.22em]',
                accent.chip,
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div
        className={cn(
          'absolute inset-x-3 bottom-3 z-30 rounded-[22px] border border-white/10 bg-black/55 p-2.5 backdrop-blur-2xl transition-all duration-300',
          'grid grid-cols-1 gap-2 sm:grid-cols-2',
          isMenuVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-3 scale-[0.98] opacity-0',
        )}
        data-vault-card-menu="true"
        onClick={(event) => event.stopPropagation()}
      >
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onQuickAction(action.id, item)}
            className="group/action flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-left transition-all duration-300 hover:border-white/16 hover:bg-white/[0.06] hover:shadow-[0_0_24px_rgba(96,165,250,0.08)]"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                <action.icon className="h-3.5 w-3.5 text-foreground" />
              </div>
              <span className="text-[11px] font-semibold leading-tight text-foreground/90">
                {action.label}
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5 group-hover/action:text-foreground/80" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default memo(VaultItemCard);
