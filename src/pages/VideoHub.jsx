import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Languages,
  ListOrdered,
  MessageSquare,
  Play,
  RefreshCcw,
  Search,
  Sparkles,
  Video,
  Waves,
} from 'lucide-react';
import { answerTranscriptQuestion } from '../utils/videoIntelligence';
import { cn } from '../utils/cn';

const ANALYSIS_CACHE_KEY = 'solo-tutor-last-video-analysis';

const readCachedAnalysis = () => {
  try {
    const raw = localStorage.getItem(ANALYSIS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed?.transcript?.blocks || !Array.isArray(parsed.transcript.blocks)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const buildAssistantIntro = (analysis) => ({
  id: crypto.randomUUID(),
  role: 'assistant',
  content: `I analyzed "${analysis.title}" using its live transcript. Ask for a detailed explanation, a timestamp breakdown, or one of these themes: ${analysis.keyThemes
    .slice(0, 3)
    .join(', ')}.`,
  citations: analysis.segments.slice(0, 2).map((segment) => ({
    label: segment.startLabel,
    title: segment.title,
  })),
});

const VideoHub = () => {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState(() => readCachedAnalysis());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copyState, setCopyState] = useState('');
  const [messages, setMessages] = useState(() =>
    readCachedAnalysis() ? [buildAssistantIntro(readCachedAnalysis())] : [],
  );
  const chatEndRef = useRef(null);
  const copyResetRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  useEffect(() => {
    return () => {
      window.clearTimeout(copyResetRef.current);
    };
  }, []);

  useEffect(() => {
    if (analysis) {
      localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(analysis));
    } else {
      localStorage.removeItem(ANALYSIS_CACHE_KEY);
    }
  }, [analysis]);

  const stats = useMemo(() => {
    if (!analysis) {
      return [];
    }

    return [
      {
        label: 'Duration',
        value: analysis.durationLabel,
        icon: Clock,
      },
      {
        label: 'Transcript',
        value: `${analysis.transcriptItemCount} cues`,
        icon: FileText,
      },
      {
        label: 'Language',
        value: analysis.transcriptLanguage.toUpperCase(),
        icon: Languages,
      },
    ];
  }, [analysis]);

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setError('');
    setCopyState('');

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/youtube/analyze?url=${encodeURIComponent(url.trim())}`, {
        headers: {
          'bypass-tunnel-reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to analyze this YouTube video.');
      }

      setAnalysis(payload.analysis);
      setMessages([buildAssistantIntro(payload.analysis)]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Video analysis failed. Try another public YouTube lecture with captions enabled.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [url]);

  const handleReset = useCallback(() => {
    setAnalysis(null);
    setMessages([]);
    setChatInput('');
    setCopyState('');
    setError('');
    setUrl('');
    window.clearTimeout(copyResetRef.current);
  }, []);

  const handleCopyTranscript = useCallback(async () => {
    if (!analysis?.transcript?.timestampedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(analysis.transcript.timestampedText);
      setCopyState('Copied');
    } catch {
      setCopyState('Copy failed');
    }

    window.clearTimeout(copyResetRef.current);
    copyResetRef.current = window.setTimeout(() => {
      setCopyState('');
    }, 2400);
  }, [analysis]);

  const handleChatSend = useCallback(() => {
    if (!chatInput.trim() || !analysis) {
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: chatInput,
    };

    const response = answerTranscriptQuestion(chatInput, analysis);

    setMessages((previous) => [
      ...previous,
      userMessage,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
      },
    ]);
    setChatInput('');
  }, [analysis, chatInput]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {!analysis ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-8">
          <div className="p-4 bg-secondary rounded-3xl border border-border/40 shadow-xl shadow-foreground/[0.02]">
            <Play className="w-12 h-12 text-foreground" />
          </div>

          <div className="text-center space-y-3 max-w-2xl">
            <h2 className="text-2xl font-bold">Real-Time YouTube Intelligence</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Paste a YouTube lecture and SOLO TUTOR will fetch the live transcript, build timestamped
              summaries, and let you ask grounded follow-up questions against the actual video content.
            </p>
          </div>

          <div className="w-full max-w-2xl flex flex-col gap-4">
            <div className="relative group">
              <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <input
                type="text"
                placeholder="Paste YouTube URL here..."
                className="w-full pl-12 pr-36 py-4 bg-card border border-border/60 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all shadow-lg shadow-foreground/[0.01]"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleAnalyze();
                  }
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={!url.trim() || isAnalyzing}
                className="absolute right-2 top-2 bottom-2 px-6 bg-foreground text-background rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-100/90">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-border/40 bg-card p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Live Caption Fetch
                </p>
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                  Pulls the public transcript in real time instead of using a timed mock.
                </p>
              </div>
              <div className="rounded-3xl border border-border/40 bg-card p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Timestamped Summary
                </p>
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                  Breaks the lecture into real timeline windows and surfaces key moments.
                </p>
              </div>
              <div className="rounded-3xl border border-border/40 bg-card p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Grounded Q&A
                </p>
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                  Follow-up answers are matched against the analyzed transcript, not fabricated filler.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-foreground" />
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Live Transcript Mode
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{analysis.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  <span>{analysis.author}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span>{analysis.durationLabel}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span>{analysis.transcriptLanguage.toUpperCase()} transcript</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={analysis.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-foreground transition-all hover:border-foreground/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Watch on YouTube
              </a>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-2xl border border-border/40 bg-secondary/40 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-foreground transition-all hover:bg-secondary/60"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                New Analysis
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="aspect-video w-full overflow-hidden rounded-[32px] border border-border/40 bg-black shadow-2xl">
                <iframe
                  src={analysis.embedUrl}
                  title={analysis.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-border/40 bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-secondary p-3">
                        <stat.icon className="w-4 h-4 text-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                          {stat.label}
                        </p>
                        <h4 className="text-lg font-bold">{stat.value}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[32px] border border-border/40 bg-card p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-foreground" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Transcript Timeline</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    <Waves className="w-3.5 h-3.5" />
                    <span>{analysis.transcriptWordCount} transcript words</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {analysis.segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="group rounded-2xl border border-border/30 bg-secondary/20 p-4 transition-all hover:border-foreground/15 hover:bg-secondary/35"
                    >
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center shrink-0 pt-1">
                          <div className="px-2.5 py-1 bg-foreground text-background text-[10px] font-black rounded-md mb-2">
                            {segment.startLabel}
                          </div>
                          <div className="w-0.5 h-full bg-border group-last:bg-transparent" />
                        </div>

                        <div className="space-y-2 pb-4">
                          <h4 className="text-[13px] font-bold text-foreground">{segment.title}</h4>
                          <p className="text-[12px] text-muted-foreground leading-relaxed">
                            {segment.summary}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {segment.keywords.map((keyword) => (
                              <span
                                key={keyword}
                                className="px-2 py-0.5 rounded-md border border-sky-500/20 bg-sky-500/8 text-[10px] font-black uppercase tracking-[0.18em] text-sky-100"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-border/40 bg-card p-6 space-y-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-foreground" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Full Transcript</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Created from the video&apos;s live public captions with readable timestamped blocks.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                      {analysis.transcript.blocks.length} transcript sections
                    </div>
                    <button
                      onClick={handleCopyTranscript}
                      className="inline-flex items-center gap-2 rounded-2xl border border-border/40 bg-secondary/40 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-foreground transition-all hover:bg-secondary/60"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copyState || 'Copy Transcript'}</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  {analysis.transcript.blocks.map((block) => (
                    <div
                      key={block.id}
                      className="rounded-2xl border border-border/30 bg-secondary/20 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-3 pb-3">
                        <span className="rounded-md bg-foreground px-2.5 py-1 text-[10px] font-black text-background">
                          {block.startLabel}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                          {block.cueCount} cues
                        </span>
                      </div>
                      <p className="text-[13px] leading-7 text-foreground/88">{block.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[32px] border border-border/40 bg-card p-6 shadow-sm space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-foreground" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Lecture Brief</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Generated from the video’s real transcript and refreshed on each analysis run.
                  </p>
                </div>

                <div className="space-y-3">
                  {analysis.overview.map((line, index) => (
                    <div key={`${line}-${index}`} className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-foreground/60 shrink-0" />
                      <p className="text-[13px] text-foreground/85 leading-relaxed">{line}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.keyThemes.map((theme) => (
                    <span
                      key={theme}
                      className="px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-black uppercase tracking-[0.2em] text-violet-100"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col h-[620px] bg-card border border-border/40 rounded-[32px] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-foreground" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest">Transcript Chat</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                    <Search className="w-3.5 h-3.5" />
                    <span>Grounded in transcript</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  {messages.map((message) => (
                    <div key={message.id} className={cn(
                      'space-y-2 max-w-[92%]',
                      message.role === 'user' ? 'ml-auto' : 'mr-auto',
                    )}>
                      <div
                        className={cn(
                          'p-3 rounded-2xl text-[12px] leading-relaxed',
                          message.role === 'user'
                            ? 'ml-auto bg-foreground text-background font-medium rounded-tr-none'
                            : 'bg-secondary/50 text-foreground/82 rounded-tl-none border border-border/20 whitespace-pre-wrap',
                        )}
                      >
                        {message.content}
                      </div>

                      {message.citations && message.citations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.citations.map((citation) => (
                            <div
                              key={`${citation.label}-${citation.title}`}
                              className="flex items-center gap-2 px-2 py-1 rounded-lg bg-card border border-border/40 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground"
                            >
                              <Clock className="w-3 h-3" />
                              <span>{citation.label}</span>
                              <span className="text-foreground/75">{citation.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-border/40">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ask for a detailed explanation, summary, or timestamp..."
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl pl-4 pr-12 py-3 text-[12px] focus:outline-none focus:border-foreground/20 transition-all"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleChatSend();
                        }
                      }}
                    />
                    <button
                      onClick={handleChatSend}
                      disabled={!chatInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-foreground text-background rounded-lg hover:scale-105 transition-all disabled:opacity-40 disabled:scale-100"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-100/90">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl space-y-6 max-w-sm w-full text-center">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-muted rounded-full" />
              <div className="absolute inset-0 border-4 border-foreground rounded-full border-t-transparent animate-spin" />
              <Play className="absolute inset-0 m-auto w-6 h-6 text-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Fetching Live Transcript</h3>
              <p className="text-muted-foreground text-sm">
                SOLO TUTOR is retrieving YouTube metadata, loading captions, and building the lecture timeline.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoHub;
