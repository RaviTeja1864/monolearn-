import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  AlertCircle,
  CloudUpload,
  Clock,
  FileJson,
  Filter,
  FolderPlus,
  History,
  LayoutGrid,
  List,
  Map as MapIcon,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import VaultCommandBar from '../components/vault/VaultCommandBar';
import VaultKnowledgeMap from '../components/vault/VaultKnowledgeMap';
import VaultItemCard from '../components/vault/VaultItemCard';
import { useVault } from '../hooks/useVault';
import { dispatchNavigationIntent } from '../utils/studyIntent';
import { cn } from '../utils/cn';

const STUDY_QUEUE_STORAGE_KEY = 'solo-tutor-study-session-queue';
const LEGACY_STUDY_QUEUE_STORAGE_KEY = 'studyos-study-session-queue';

const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'pdf', label: 'Docs' },
  { id: 'video', label: 'Video' },
  { id: 'code', label: 'Code' },
  { id: 'text', label: 'Notes' },
];

const viewOptions = [
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'list', label: 'List', icon: List },
  { id: 'map', label: 'Map', icon: MapIcon },
];

const readStoredQueue = () => {
  try {
    const raw =
      localStorage.getItem(STUDY_QUEUE_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STUDY_QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const inferSubjectFromName = (name) => {
  const normalized = name.toLowerCase();

  if (normalized.includes('neural') || normalized.includes('gradient') || normalized.includes('ml')) {
    return 'Machine Learning';
  }

  if (normalized.includes('kernel') || normalized.includes('deadlock') || normalized.includes('os')) {
    return 'Operating Systems';
  }

  if (normalized.includes('graph') || normalized.includes('sort') || normalized.includes('dsa') || normalized.includes('recursion')) {
    return 'Data Structures';
  }

  return 'Unsorted';
};

const inferTags = (name, type) => {
  const normalized = name.toLowerCase();
  const tags = new Set();

  if (type === 'code') tags.add('Code');
  if (type === 'video') tags.add('Lecture');
  if (type === 'pdf') tags.add('Reference');
  if (normalized.includes('final') || normalized.includes('review')) tags.add('Review');
  if (normalized.includes('lab')) tags.add('Lab');
  if (normalized.includes('notes')) tags.add('Notes');

  if (tags.size === 0) {
    tags.add('Indexed');
  }

  return [...tags];
};

const formatScopeLabel = (count, subject) => {
  if (count === 0) {
    return 'Neural indexing online. Load a course pack to start issuing vault commands.';
  }

  if (count === 1) {
    return `Focused on 1 live asset${subject ? ` in ${subject}` : ''}.`;
  }

  return `Focused on ${count} live assets${subject ? ` across ${subject}` : ''}.`;
};

const LearningVault = () => {
  const { items, history, addItem, deleteItems, loadSampleData, clearHistory } = useVault();
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [pinnedMenuId, setPinnedMenuId] = useState(null);
  const [studyQueue, setStudyQueue] = useState(readStoredQueue);
  const [commandFeedback, setCommandFeedback] = useState(null);
  const [activeCommand, setActiveCommand] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STUDY_QUEUE_STORAGE_KEY, JSON.stringify(studyQueue));
  }, [studyQueue]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = search.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.subject?.toLowerCase().includes(query) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(query));
      const matchesFilter = filterType === 'all' || item.type === filterType;

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filterType]);

  const scopedItems = useMemo(() => {
    if (selectedIds.length > 0) {
      return items.filter((item) => selectedIds.includes(item.id));
    }

    return filteredItems.slice(0, Math.min(filteredItems.length, 4));
  }, [filteredItems, items, selectedIds]);

  const dominantSubject = useMemo(() => {
    const subjectCounts = scopedItems.reduce((accumulator, item) => {
      if (!item.subject) return accumulator;
      accumulator[item.subject] = (accumulator[item.subject] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }, [scopedItems]);

  const focusLabel = useMemo(() => {
    if (commandFeedback?.summary) {
      return commandFeedback.summary;
    }

    return formatScopeLabel(scopedItems.length || filteredItems.length, dominantSubject);
  }, [commandFeedback, dominantSubject, filteredItems.length, scopedItems.length]);

  const filteredSignature = useMemo(
    () => filteredItems.map((item) => item.id).join('-'),
    [filteredItems],
  );

  const handleFileUpload = useCallback(
    (files) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);

      window.setTimeout(async () => {
        for (const file of Array.from(files)) {
          const type = file.type.includes('pdf')
            ? 'pdf'
            : file.type.includes('video')
              ? 'video'
              : file.type.includes('image')
                ? 'image'
                : file.name.match(/\.(py|js|ts|cpp|java|rs|go)$/)
                  ? 'code'
                  : 'text';

          let preview = `Semantic preview extracted for ${file.name}. Neural parsing isolated the primary topics, examples, and revision cues.`;
          let contentStr = '';
          
          if (type === 'pdf') {
            try {
              const formData = new FormData();
              formData.append('file', file);
              const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
              const response = await fetch(`${apiBase}/api/pdf/extract`, {
                method: 'POST',
                body: formData,
                headers: {
                  'bypass-tunnel-reminder': 'true',
                  'ngrok-skip-browser-warning': 'true'
                }
              });
              if (response.ok) {
                const data = await response.json();
                if (data.text) {
                  contentStr = data.text;
                  preview = data.text.substring(0, 150) + "...";
                }
              }
            } catch (e) {
              console.warn("Failed to extract PDF", e);
            }
          }

          addItem({
            name: file.name,
            type,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            subject: inferSubjectFromName(file.name),
            tags: inferTags(file.name, type),
            preview: preview,
            content: contentStr,
          });
        }

        setIsUploading(false);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 100);
    },
    [addItem],
  );

  const toggleSelect = useCallback((id) => {
    setPinnedMenuId(null);
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((itemId) => itemId !== id) : [...previous, id],
    );
  }, []);

  const handleBulkDelete = useCallback(() => {
    deleteItems(selectedIds);
    setSelectedIds([]);
    setPinnedMenuId(null);
    setCommandFeedback({
      title: 'Selection deleted',
      summary: `${selectedIds.length} vault assets were removed and neural history updated.`,
      description: 'The command surface is now tracking the refreshed vault footprint.',
      pills: ['Vault Synced', 'History Updated'],
    });
  }, [deleteItems, selectedIds]);

  const queueStudyItem = useCallback((item) => {
    setStudyQueue((previous) => {
      if (previous.some((entry) => entry.id === item.id)) {
        return previous;
      }

      return [
        {
          id: item.id,
          name: item.name,
          subject: item.subject,
          queuedAt: new Date().toISOString(),
        },
        ...previous,
      ].slice(0, 8);
    });

    setCommandFeedback({
      title: 'Study session queue updated',
      summary: `${item.name} is now pinned for your next focused study block.`,
      description: 'The queue is persisted locally so Phase 4 can build guided sessions from the same stack.',
      pills: [item.subject || 'General', 'Study Queue'],
    });
  }, []);

  const exportItems = useCallback((scope) => {
    const payload = {
      exportedAt: new Date().toISOString(),
      itemCount: scope.length,
      items: scope,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solo-tutor-vault-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setCommandFeedback({
      title: 'Vault export generated',
      summary: `Exported ${scope.length} indexed asset${scope.length === 1 ? '' : 's'} as a portable JSON snapshot.`,
      description: 'You now have a portable local backup of the active vault scope.',
      pills: ['Portable Snapshot', 'JSON'],
    });
  }, []);

  const handleCommandAction = useCallback(
    (actionId) => {
      if (items.length === 0) return;

      const activeScope = scopedItems.length > 0 ? scopedItems : items;
      const scopeIds = activeScope.map((item) => item.id);
      const scopeNames = activeScope.map((item) => item.name);
      const primarySubject = dominantSubject || activeScope[0]?.subject || 'General Study';

      setActiveCommand(actionId);
      window.setTimeout(() => setActiveCommand(null), 1200);

      if (actionId === 'ask') {
        dispatchNavigationIntent({
          page: 'chat',
          status: 'Vault context loaded',
          payload: {
            itemIds: scopeIds,
            prompt: `Help me master ${primarySubject} using ${scopeNames.join(', ')}.`,
            notice: `${scopeNames.length} vault asset${scopeNames.length === 1 ? '' : 's'} loaded into Knowledge Chat.`,
            message: `I pulled in ${scopeNames.join(', ')} from your vault. Ask for an explanation, a summary, or a citation-grounded review.`,
          },
        });
        return;
      }

      if (actionId === 'quiz') {
        dispatchNavigationIntent({
          page: 'quiz',
          status: 'Quiz synthesis queued',
          payload: {
            subject: primarySubject,
            autoGenerate: true,
            notice: `Adaptive quiz seeded from ${primarySubject}.`,
          },
        });
        return;
      }

      if (actionId === 'plan') {
        dispatchNavigationIntent({
          page: 'chat',
          status: 'Plan context loaded',
          payload: {
            itemIds: scopeIds,
            prompt: `Create a rigorous study plan for ${primarySubject} based on ${scopeNames.join(', ')}. Include a timeline, key concepts, and exact review checkpoints.`,
            notice: `Drafting study plan for ${primarySubject}.`,
            message: `I pulled in ${scopeNames.length} Vault asset(s) to generate your custom study plan.`,
          },
        });
        return;
      }

      if (actionId === 'map') {
        setView('map');
        setCommandFeedback({
          title: 'Concept scaffold prepared',
          summary: `Mapped the first neural anchors for ${primarySubject} and switched the vault into graph view.`,
          description:
            'Detected a clean connection spine across your selected assets, including seed concepts, bridge nodes, and likely weak links worth revisiting.',
          pills: ['Neural Networks', 'Deadlocks', 'Backpropagation'],
        });
        return;
      }

      exportItems(activeScope);
    },
    [dominantSubject, exportItems, items, scopedItems],
  );

  const handleQuickAction = useCallback(
    (actionId, item) => {
      setPinnedMenuId(null);

      if (actionId === 'chat') {
        dispatchNavigationIntent({
          page: 'chat',
          status: 'Vault context loaded',
          payload: {
            itemIds: [item.id],
            prompt: `Explain ${item.name} like I am preparing for a high-stakes exam.`,
            notice: `${item.name} is ready inside Knowledge Chat.`,
            message: `I attached ${item.name} from your vault. I can now explain it, quiz you on it, or connect it to nearby concepts.`,
          },
        });
        return;
      }

      if (actionId === 'code') {
        dispatchNavigationIntent({
          page: 'code',
          status: 'Code context synced',
          payload: {
            item,
            notice: `${item.name} handed off to Code Mentor for analysis.`,
          },
        });
        return;
      }

      if (actionId === 'video') {
        const relatedVideo = items.find(
          (candidate) =>
            candidate.id !== item.id &&
            candidate.type === 'video' &&
            candidate.subject === item.subject,
        );

        setCommandFeedback({
          title: relatedVideo ? 'Video comparison ready' : 'Comparison queue prepared',
          summary: relatedVideo
            ? `${item.name} can be cross-checked against ${relatedVideo.name}.`
            : `No matching lecture found for ${item.subject}. Add a video and this slot will auto-link later.`,
          description: relatedVideo
            ? 'Use this pairing to contrast explanation style, timing, and concept coverage before your next revision cycle.'
            : 'The vault saved a comparison target so the next uploaded lecture can snap into place automatically.',
          pills: [item.subject || 'General', relatedVideo ? 'Matched Lecture' : 'Awaiting Lecture'],
        });
        return;
      }

      queueStudyItem(item);
    },
    [items, queueStudyItem],
  );

  const handleGraphNodeOpen = useCallback(
    (node) => {
      const relatedItems = items.filter((item) => node.relatedItemIds.includes(item.id));
      const scopeNames = relatedItems.map((item) => item.name).join(', ');

      dispatchNavigationIntent({
        page: 'chat',
        status: 'Knowledge map synced',
        payload: {
          itemIds: relatedItems.map((item) => item.id),
          prompt:
            node.type === 'concept'
              ? `Build me a precise mental model of ${node.label} using ${scopeNames}.`
              : `Walk me through ${node.label} with citations and exam-level intuition.`,
          notice:
            node.type === 'concept'
              ? `${node.label} opened with ${relatedItems.length} supporting vault source${relatedItems.length === 1 ? '' : 's'}.`
              : `${node.label} opened from the concept map.`,
          message:
            node.type === 'concept'
              ? `I loaded the ${node.label} concept cluster from your map. We can trace the idea, quiz it, or connect it to nearby nodes.`
              : `I opened ${node.label} directly from your knowledge graph. Ask for a summary, comparison, or concept breakdown.`,
        },
      });
    },
    [items],
  );

  const handleMapRegenerate = useCallback((meta) => {
    setCommandFeedback({
      title: 'Concept map regenerated',
      summary: `Rebuilt ${meta.conceptCount} concepts and ${meta.documentCount} document anchors with fresh neural connections.`,
      description:
        'Mock AI re-balanced the graph density and refreshed the subject bridges so your next study sweep starts from a cleaner topology.',
      pills: ['Graph Refreshed', `${meta.subjectCount} Subject Clusters`],
    });
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      handleFileUpload(event.dataTransfer.files);
    },
    [handleFileUpload],
  );

  return (
    <div className="flex h-full gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex-1 min-w-0 space-y-8">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'group relative transition-all duration-300',
            isDragging ? 'scale-[0.99]' : 'scale-100',
          )}
        >
          <div
            className={cn(
              'relative flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-[32px] border-2 border-dashed p-8 text-center transition-all duration-300',
              isDragging
                ? 'border-foreground bg-secondary/85 shadow-[0_32px_90px_rgba(0,0,0,0.38)]'
                : 'border-border/40 bg-secondary/20 hover:border-white/12 hover:bg-secondary/30',
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_28%)] opacity-90" />

            <div
              className={cn(
                'relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform duration-500',
                isDragging ? 'scale-110 rotate-12' : 'scale-100',
              )}
            >
              <CloudUpload className="h-8 w-8 text-foreground" />
            </div>

            <div className="relative space-y-1">
              <h3 className="text-lg font-semibold">Upload to Neural Vault</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Drag and drop your study materials here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="font-semibold text-foreground hover:underline"
                >
                  browse files
                </button>
              </p>
            </div>

            <div className="relative flex gap-6 pt-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI-Ready</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(event) => handleFileUpload(event.target.files)}
              multiple
              className="hidden"
            />
          </div>

          {isUploading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[32px] bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="max-w-xs space-y-4 px-6 text-center">
                <div className="h-1.5 w-full overflow-hidden rounded-full border border-border/40 bg-secondary">
                  <div className="h-full bg-foreground animate-progress-indeterminate" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-[0.28em]">Neural Indexing...</h4>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Analyzing structure, extracting concepts, and preparing grounded context for your learning tools.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 pt-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search neural vault..."
              className="w-full rounded-xl border border-border/40 bg-secondary/40 py-2 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-foreground/20"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-secondary/45 p-1">
              {viewOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setView(option.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all',
                    view === option.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground',
                  )}
                  aria-label={`${option.label} view`}
                >
                  <option.icon className="h-4 w-4" />
                  <span className="hidden text-[10px] font-black uppercase tracking-[0.22em] sm:inline">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-secondary/35 p-1">
              <div className="px-2 text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
              </div>
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFilterType(option.id)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] transition-all',
                    filterType === option.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground/80',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                'rounded-xl border p-2 transition-all',
                showHistory
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border/40 bg-secondary/40 text-muted-foreground hover:border-foreground/20',
              )}
              aria-label="Toggle history"
            >
              <History className="h-4 w-4" />
            </button>

            <button
              onClick={loadSampleData}
              className="flex items-center gap-2 rounded-xl border border-border/40 bg-secondary/40 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-foreground transition-all hover:bg-secondary/60"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Load Sample</span>
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl bg-foreground p-3 text-background shadow-xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4 pl-2">
              <span className="text-[11px] font-black uppercase tracking-[0.24em]">
                {selectedIds.length} Selected
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="rounded-md p-1 hover:bg-background/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportItems(items.filter((item) => selectedIds.includes(item.id)))}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] hover:bg-background/10"
              >
                <FileJson className="h-3.5 w-3.5" />
                Export
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-white shadow-lg transition-colors hover:bg-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-6 rounded-[40px] border border-dashed border-border/40 bg-secondary/10 py-24">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">Vault Empty</h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                Your neural storage is currently offline. Upload documents to begin training your SOLO TUTOR command center.
              </p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-6 rounded-[40px] border border-dashed border-border/40 bg-secondary/10 py-24">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <Search className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">No Matching Assets</h3>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                Adjust the search or filter stack to repopulate your vault grid and concept map.
              </p>
            </div>
          </div>
        ) : view === 'map' ? (
          <VaultKnowledgeMap
            key={filteredSignature}
            items={filteredItems}
            onNodeOpen={handleGraphNodeOpen}
            onRegenerate={handleMapRegenerate}
          />
        ) : (
          <div
            className={cn(
              'grid gap-4 transition-all duration-500',
              view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1',
            )}
          >
            {filteredItems.map((item) => (
              <VaultItemCard
                key={item.id}
                item={item}
                view={view}
                isSelected={selectedIds.includes(item.id)}
                isMenuVisible={pinnedMenuId === item.id || hoveredCardId === item.id}
                onSelect={toggleSelect}
                onMenuVisibilityChange={setHoveredCardId}
                onMenuToggle={(itemId) =>
                  setPinnedMenuId((previous) => (previous === itemId ? null : itemId))
                }
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        )}

        {commandFeedback && (
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-card/85 p-5 shadow-[0_26px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_30%)]" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                    Neural Brief
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">{commandFeedback.title}</h3>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-foreground/82">
                  {commandFeedback.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {commandFeedback.pills?.map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="max-w-xs rounded-2xl border border-sky-500/12 bg-sky-500/6 px-4 py-3 text-[12px] font-medium leading-relaxed text-sky-100/90">
                  {commandFeedback.summary}
                </div>
                <button
                  onClick={() => setCommandFeedback(null)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <VaultCommandBar
          disabled={items.length === 0}
          activeAction={activeCommand}
          focusLabel={focusLabel}
          selectedCount={selectedIds.length}
          queueCount={studyQueue.length}
          totalItems={items.length}
          onAction={handleCommandAction}
        />
      </div>

      {showHistory && (
        <div className="w-80 shrink-0 space-y-6 animate-in slide-in-from-right-8 duration-500">
          <div className="flex h-full max-h-[920px] flex-col rounded-[32px] border border-border/40 bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-foreground" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.24em]">
                  Neural History
                </h3>
              </div>
              <button
                onClick={clearHistory}
                className="text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-red-500"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-1 no-scrollbar">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-20 text-center opacity-40">
                  <Clock className="h-6 w-6" />
                  <p className="text-[10px] font-black uppercase tracking-[0.24em]">
                    No recent activity
                  </p>
                </div>
              ) : (
                history.map((event) => (
                  <div
                    key={event.id}
                    className="relative border-l border-border/40 pb-6 pl-6 last:pb-0"
                  >
                    <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-foreground shadow-sm" />
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em]',
                            event.type === 'UPLOAD'
                              ? 'bg-green-500/10 text-green-500'
                              : event.type === 'DELETE'
                                ? 'bg-red-500/10 text-red-500'
                                : event.type === 'SYSTEM'
                                  ? 'bg-violet-500/10 text-violet-300'
                                  : 'bg-blue-500/10 text-blue-400',
                          )}
                        >
                          {event.type}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="truncate text-[12px] font-semibold leading-tight text-foreground/90">
                        {event.name || event.message}
                      </p>
                      {event.fileType && (
                        <p className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                          Indexed as {event.fileType}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 space-y-3 rounded-2xl bg-foreground p-4 text-background shadow-lg">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.24em]">Vault Status</h4>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-[11px] font-semibold">Neural Health</span>
                <span className="text-sm font-black tracking-tight">Optimal</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-background/20">
                <div className="h-full w-full rounded-full bg-background" />
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-background/8 p-3 text-[11px] text-background/70">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>Command bar is tracking queue state, export activity, and contextual vault actions in real time.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes progress-indeterminate {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .animate-progress-indeterminate {
              animation: progress-indeterminate 1.5s infinite linear;
            }
          `,
        }}
      />
    </div>
  );
};

export default LearningVault;
