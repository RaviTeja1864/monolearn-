import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain,
  FileText,
  Map as MapIcon,
  Move,
  RefreshCcw,
  Sparkles,
  Waypoints,
} from 'lucide-react';
import {
  buildKnowledgeGraph,
  clampNodePosition,
  createGraphSignature,
  getNodeAccent,
  graphCanvas,
} from '../../utils/knowledgeGraph';
import { cn } from '../../utils/cn';

const MAP_STORAGE_KEY = 'solo-tutor-vault-knowledge-map';
const LEGACY_MAP_STORAGE_KEY = 'studyos-vault-knowledge-map';
const createDefaultMapState = (signature) => ({
  signature,
  seed: Date.now() % 2147483647,
  positions: {},
});

const readStoredState = (signature) => {
  try {
    const raw =
      localStorage.getItem(MAP_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_MAP_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const record = parsed?.[signature];

    if (record) {
      return {
        signature,
        ...record,
      };
    }
  } catch {
    return createDefaultMapState(signature);
  }

  return createDefaultMapState(signature);
};

const buildNodeLookup = (nodes) =>
  nodes.reduce((accumulator, node) => {
    accumulator[node.id] = node;
    return accumulator;
  }, {});

const getVirtualPoint = (event, rect) => ({
  x: ((event.clientX - rect.left) / rect.width) * graphCanvas.width,
  y: ((event.clientY - rect.top) / rect.height) * graphCanvas.height,
});

const createEdgePath = (source, target) => {
  const dx = Math.abs(target.x - source.x);
  const curve = Math.max(80, dx * 0.42);

  return `M ${source.x} ${source.y} C ${source.x} ${source.y - curve}, ${target.x} ${target.y + curve}, ${target.x} ${target.y}`;
};

const VaultKnowledgeMap = ({ items, onNodeOpen, onRegenerate }) => {
  const signature = useMemo(() => createGraphSignature(items), [items]);
  const [mapState, setMapState] = useState(() => readStoredState(signature));
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const clickSuppressRef = useRef(null);
  const pointerUpHandlerRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MAP_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};

      localStorage.setItem(
        MAP_STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          [signature]: {
            seed: mapState.seed,
            positions: mapState.positions,
          },
        }),
      );
    } catch {
      localStorage.setItem(
        MAP_STORAGE_KEY,
        JSON.stringify({
          [signature]: {
            seed: mapState.seed,
            positions: mapState.positions,
          },
        }),
      );
    }
  }, [mapState.positions, mapState.seed, signature]);

  const baseGraph = useMemo(
    () => buildKnowledgeGraph(items, mapState.seed),
    [items, mapState.seed],
  );

  const nodes = useMemo(
    () =>
      baseGraph.nodes.map((node) => ({
        ...node,
        position: mapState.positions[node.id] || node.position,
      })),
    [baseGraph.nodes, mapState.positions],
  );

  const nodeLookup = useMemo(() => buildNodeLookup(nodes), [nodes]);

  const hoveredNode = hoveredNodeId ? nodeLookup[hoveredNodeId] : null;

  const handlePointerMove = useCallback((event) => {
    const dragState = dragRef.current;
    const container = containerRef.current;

    if (!dragState || !container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const point = getVirtualPoint(event, rect);
    const nextPosition = clampNodePosition(
      {
        x: point.x - dragState.offset.x,
        y: point.y - dragState.offset.y,
      },
      dragState.nodeType,
    );

    dragState.moved =
      dragState.moved ||
      Math.abs(point.x - dragState.startPoint.x) > 4 ||
      Math.abs(point.y - dragState.startPoint.y) > 4;

    setMapState((previous) => ({
      ...previous,
      positions: {
        ...previous.positions,
        [dragState.nodeId]: nextPosition,
      },
    }));
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragRef.current?.moved) {
      clickSuppressRef.current = dragRef.current.nodeId;
    }

    dragRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', pointerUpHandlerRef.current);
  }, [handlePointerMove]);

  useEffect(() => {
    pointerUpHandlerRef.current = handlePointerUp;
  }, [handlePointerUp]);

  useEffect(() => () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove, handlePointerUp]);

  const handleNodePointerDown = useCallback(
    (event, node) => {
      if (!containerRef.current) {
        return;
      }

      event.stopPropagation();
      const rect = containerRef.current.getBoundingClientRect();
      const point = getVirtualPoint(event, rect);

      dragRef.current = {
        nodeId: node.id,
        nodeType: node.type,
        offset: {
          x: point.x - node.position.x,
          y: point.y - node.position.y,
        },
        startPoint: point,
        moved: false,
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp],
  );

  const handleNodeClick = useCallback(
    (node) => {
      if (clickSuppressRef.current === node.id) {
        clickSuppressRef.current = null;
        return;
      }

      onNodeOpen(node);
    },
    [onNodeOpen],
  );

  const handleRegenerate = useCallback(() => {
    const nextSeed = Date.now() % 2147483647;
    const nextGraph = buildKnowledgeGraph(items, nextSeed);
    const nextPositions = nextGraph.nodes.reduce((accumulator, node) => {
      accumulator[node.id] = node.position;
      return accumulator;
    }, {});

    setMapState({
      signature,
      seed: nextSeed,
      positions: nextPositions,
    });
    onRegenerate(nextGraph.meta);
  }, [items, onRegenerate, signature]);

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-card/85 shadow-[0_28px_100px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.18),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(139,92,246,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_24%)] opacity-90" />

      <div className="relative flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_0_24px_rgba(96,165,250,0.08)]">
                <MapIcon className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground">
                  Neural Concept Map
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  Drag documents and concepts into your own study topology
                </h3>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-foreground/78">
              The map auto-links vault assets into concept chains, then lets you reshape the layout by hand.
              Click any node to open Knowledge Chat with grounded context from that concept cluster.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                Density
              </p>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Waypoints className="h-4 w-4 text-sky-200" />
                <span>{baseGraph.edges.length} neural edges</span>
              </div>
            </div>

            <button
              onClick={handleRegenerate}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.06]"
            >
              <div className="rounded-xl border border-white/10 bg-black/20 p-2.5 transition-transform duration-300 group-hover:rotate-12">
                <RefreshCcw className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                  Mock AI
                </p>
                <p className="text-[13px] font-semibold text-foreground">Regenerate Map</p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
          <div
            ref={containerRef}
            className="relative min-h-[720px] overflow-hidden rounded-[30px] border border-white/10 bg-black/20 shadow-inner"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:90px_90px] opacity-45" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)]" />

            <svg
              viewBox={`0 0 ${graphCanvas.width} ${graphCanvas.height}`}
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              <defs>
                {nodes.map((node) => (
                  <filter key={node.id} id={`glow-${node.id}`}>
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>

              {baseGraph.edges.map((edge) => {
                const source = nodeLookup[edge.source]?.position;
                const target = nodeLookup[edge.target]?.position;

                if (!source || !target) {
                  return null;
                }

                return (
                  <path
                    key={edge.id}
                    d={createEdgePath(source, target)}
                    stroke={edge.color}
                    strokeWidth={edge.strength === 'bridge' ? 1.2 : 1.6}
                    strokeDasharray={edge.strength === 'bridge' ? '5 12' : '8 10'}
                    fill="none"
                    opacity={edge.strength === 'bridge' ? 0.55 : 0.95}
                    className="animate-neural-edge-flow"
                  />
                );
              })}
            </svg>

            {nodes.map((node) => {
              const accent = getNodeAccent(node.subject);
              const left = `${(node.position.x / graphCanvas.width) * 100}%`;
              const top = `${(node.position.y / graphCanvas.height) * 100}%`;

              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  onPointerDown={(event) => handleNodePointerDown(event, node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId((previous) => (previous === node.id ? null : previous))}
                  className={cn(
                    'group absolute -translate-x-1/2 -translate-y-1/2 rounded-[24px] border text-left transition-all duration-300',
                    'hover:-translate-y-[calc(50%+4px)] hover:scale-[1.01] focus:outline-none focus:ring-1 focus:ring-white/20',
                    node.type === 'concept'
                      ? `w-[190px] border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl ${accent.chip}`
                      : 'w-[220px] border-white/10 bg-card/90 px-4 py-3.5 shadow-[0_18px_42px_rgba(0,0,0,0.32)]',
                  )}
                  style={{ left, top }}
                >
                  <div className={cn('absolute inset-0 rounded-[24px] bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100', accent.glow)} />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                        {node.type === 'concept' ? 'Concept' : node.subject}
                      </p>
                      <h4 className="line-clamp-2 text-[13px] font-semibold leading-tight text-foreground">
                        {node.label}
                      </h4>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-muted-foreground transition-transform duration-300 group-hover:scale-105 group-hover:text-foreground">
                      {node.type === 'concept' ? (
                        <Brain className="h-3.5 w-3.5" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </div>

                  <div className="relative mt-3 flex items-center justify-between">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                      {node.relatedItemIds.length} source{node.relatedItemIds.length === 1 ? '' : 's'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground/70">
                      <Move className="h-3 w-3" />
                      <span>Drag</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {hoveredNode && (
              <div
                className="pointer-events-none absolute z-30 w-[250px] -translate-x-1/2 rounded-[22px] border border-white/10 bg-black/70 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
                style={{
                  left: `${(hoveredNode.position.x / graphCanvas.width) * 100}%`,
                  top: `${Math.max(
                    10,
                    ((hoveredNode.position.y - 120) / graphCanvas.height) * 100,
                  )}%`,
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-muted-foreground">
                      Preview
                    </p>
                    <Sparkles className="h-3.5 w-3.5 text-sky-200" />
                  </div>
                  <p className="text-[12px] leading-relaxed text-foreground/86">
                    {hoveredNode.snippet}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Map Signals
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    Concepts
                  </p>
                  <h4 className="mt-1 text-2xl font-semibold text-foreground">
                    {baseGraph.meta.conceptCount}
                  </h4>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    Indexed Assets
                  </p>
                  <h4 className="mt-1 text-2xl font-semibold text-foreground">
                    {baseGraph.meta.documentCount}
                  </h4>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    Subjects
                  </p>
                  <h4 className="mt-1 text-2xl font-semibold text-foreground">
                    {baseGraph.meta.subjectCount}
                  </h4>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                How To Use
              </p>
              <div className="mt-4 space-y-3 text-[12px] leading-relaxed text-foreground/78">
                <p>Click a document node to open Unified Knowledge Chat with that exact vault context.</p>
                <p>Click a concept node to launch a concept-driven explanation grounded in the related materials.</p>
                <p>Drag nodes to build your own mental map. The layout is persisted in local storage for this vault slice.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(VaultKnowledgeMap);
