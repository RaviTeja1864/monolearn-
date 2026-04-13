import React from 'react';
import {
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  MessageSquare, 
  Play, 
  Code, 
  HelpCircle, 
  FolderOpen, 
  Star,
  Globe,
  Lock
} from 'lucide-react';

const ScrollingText = () => {
  const items = [
    "NEURAL INDEXING", "LIVE TRANSCRIPTS", "ZERO LATENCY", "ENCRYPTED VAULT", 
    "CODE MENTOR", "VIDEO INTELLIGENCE", "ADAPTIVE QUIZ", "W3C COMPLIANT",
    "DEEP FOCUS", "LOCAL-FIRST", "NEURAL SYNC", "PRIVATE LEARNING"
  ];

  return (
    <div className="py-10 border-y border-border/40 bg-background overflow-hidden flex whitespace-nowrap">
      <div className="animate-scroll flex gap-20 items-center">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-6xl md:text-8xl font-black tracking-tighter text-foreground/5 uppercase italic">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const LandingPage = ({ onStart }) => {
  const features = [
    { icon: MessageSquare, title: "Neural Chat", desc: "Interact with your documents using context-aware AI." },
    { icon: Play, title: "Video Intel", desc: "Pull live YouTube transcripts and turn lectures into timestamped study notes." },
    { icon: Code, title: "Code Mentor", desc: "Real-time debugging and optimization with neural fixes." },
    { icon: HelpCircle, title: "Adaptive Quiz", desc: "Personalized testing to master your specific material." },
    { icon: FolderOpen, title: "Secure Vault", desc: "Encrypted storage for your entire knowledge base." },
    { icon: Zap, title: "Fast Sync", desc: "Local-first persistence with lightning-fast response." }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-foreground rounded-xl flex items-center justify-center text-background shadow-lg">
              <span className="text-lg font-black italic">S</span>
            </div>
            <span className="text-xl font-black uppercase tracking-widest">Solo Tutor</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
            <button 
              onClick={onStart}
              className="px-6 py-2.5 bg-foreground text-background rounded-xl hover:scale-105 transition-all shadow-xl shadow-foreground/10"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-center space-y-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border/40 animate-in fade-in slide-in-from-top-4 duration-1000">
          <Sparkles className="w-3.5 h-3.5 text-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural Learning OS 2026</span>
        </div>
        
        <div className="space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            YOUR ENTIRE BRAIN,<br />
            <span className="text-muted-foreground/30">DIGITALLY ACCELERATED.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            A premium local-first educational workspace with live transcript analysis, contextual tools, and a private neural vault powered by SOLO TUTOR.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
          <button 
            onClick={onStart}
            className="w-full sm:w-auto px-10 py-5 bg-foreground text-background rounded-[20px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-foreground/20 flex items-center justify-center gap-3"
          >
            Launch Neural Vault
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="w-full sm:w-auto px-10 py-5 bg-secondary text-foreground border border-border/40 rounded-[20px] font-black text-sm uppercase tracking-widest hover:bg-border transition-all">
            View Manifesto
          </button>
        </div>

        {/* Hero Visual */}
        <div className="pt-20 animate-in fade-in zoom-in-95 duration-1000 delay-500">
          <div className="relative max-w-5xl mx-auto aspect-[16/9] bg-card border border-border/40 rounded-[40px] shadow-2xl shadow-foreground/5 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-6 p-12 w-full opacity-40 group-hover:opacity-60 transition-opacity">
                 {[...Array(6)].map((_, i) => (
                   <div key={i} className="h-40 rounded-3xl bg-secondary/50 border border-border/40 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                 ))}
              </div>
            </div>
            {/* Play Button Mock */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-foreground text-background rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer">
                <Play className="w-8 h-8 ml-1 fill-current" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ScrollingText />

      {/* Stats Section */}
      <section className="py-20 border-y border-border/40 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: "Neural Speed", val: "0.02ms" },
            { label: "Privacy Rating", val: "A+" },
            { label: "Global Users", val: "1.2M" },
            { label: "Mastery Rate", val: "94%" }
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
              <h3 className="text-3xl font-black">{stat.val}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Intelligence Suite</h2>
          <h3 className="text-4xl md:text-5xl font-black tracking-tight">DESIGNED FOR DEEP FOCUS.</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-8 bg-card border border-border/40 rounded-[32px] hover:border-foreground/20 transition-all group">
              <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                <f.icon className="w-6 h-6 text-foreground" />
              </div>
              <h4 className="text-lg font-bold mb-2">{f.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust/Security Section */}
      <section id="security" className="py-32 bg-foreground text-background rounded-[60px] mx-6 mb-20 shadow-2xl">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <div className="inline-flex p-4 bg-background/10 rounded-3xl border border-background/20">
            <Lock className="w-8 h-8 text-background" />
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">PRIVACY BY DEFAULT.<br />COMPUTED LOCALLY.</h2>
            <p className="text-lg opacity-60 font-medium leading-relaxed">
              SOLO TUTOR keeps your vault local-first while using live online retrieval only for features that require it, like YouTube transcript analysis. Your uploaded study materials remain stored on your machine unless you choose otherwise.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8">
            <div className="space-y-2">
              <Star className="w-5 h-5 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest">End-to-End Local</p>
            </div>
            <div className="space-y-2">
              <Globe className="w-5 h-5 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest">Zero Latency</p>
            </div>
            <div className="space-y-2">
              <ShieldCheck className="w-5 h-5 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest">W3C Compliant</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-border/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center text-background">
              <span className="text-sm font-black italic">S</span>
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Solo Tutor</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
            © 2026 Solo Tutor Neural Systems. All rights reserved.
          </p>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Manifesto</a>
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
            <a href="#" className="hover:text-foreground transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
