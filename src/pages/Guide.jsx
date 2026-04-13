import React from 'react';
import { 
  CloudUpload, 
  MessageSquare, 
  Play, 
  Code, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Database,
  Cpu,
  Lock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { cn } from '../utils/cn';

const Guide = () => {
  const steps = [
    {
      icon: CloudUpload,
      title: "1. Build Your Neural Vault",
      desc: "Upload PDFs, lecture videos, or code snippets. SOLO TUTOR performs neural indexing to create a semantic map of your learning materials and keep them ready for downstream tools.",
      color: "text-red-400"
    },
    {
      icon: MessageSquare,
      title: "2. Contextual Interaction",
      desc: "Chat with your materials. The AI references your specific documents with source badges, ensuring every answer is grounded in your actual study material.",
      color: "text-blue-400"
    },
    {
      icon: Play,
      title: "3. Video Intelligence",
      desc: "Paste any lecture URL. Solo Tutor generates timestamped summaries and lets you ask follow-up questions that cross-reference your entire vault.",
      color: "text-purple-400"
    },
    {
      icon: Code,
      title: "4. Code Mentor",
      desc: "Paste buggy code. The system analyzes logic, suggests 'Neural Fixes', and explains complexity—all while referencing your learned patterns.",
      color: "text-green-400"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Hero Header */}
      <div className="text-center space-y-4 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border/40">
          <BookOpen className="w-3.5 h-3.5 text-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Platform Guide</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">How Solo Tutor Works</h2>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed font-medium">
          A deep dive into the architecture and workflows that make Solo Tutor the ultimate neural companion for your studies.
        </p>
      </div>

      {/* The Core Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step, i) => (
          <div key={i} className="group p-8 bg-card border border-border/40 rounded-[32px] hover:border-foreground/20 transition-all shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-foreground/[0.02] to-transparent rounded-bl-full" />
             <div className={cn("w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", step.color)}>
                <step.icon className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold mb-3 tracking-tight">{step.title}</h3>
             <p className="text-sm text-muted-foreground leading-relaxed font-medium">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Local AI Architecture Explainer */}
      <div className="bg-foreground text-background rounded-[48px] p-8 md:p-16 space-y-12 shadow-2xl">
        <div className="text-center space-y-4">
          <h3 className="text-3xl font-black tracking-tighter uppercase italic">The Neural Edge Architecture</h3>
          <p className="opacity-60 max-w-2xl mx-auto font-medium leading-relaxed">
            SOLO TUTOR is built around a local-first workspace. Your vault stays local, while live integrations such as YouTube transcript retrieval run only when you trigger them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-background/10 rounded-3xl flex items-center justify-center mx-auto border border-background/20">
              <Database className="w-8 h-8 text-background" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-widest text-sm">Local Storage</h4>
              <p className="text-xs opacity-50 leading-relaxed">Your study assets stay local and are persisted in the browser for quick access between sessions.</p>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-background/10 rounded-3xl flex items-center justify-center mx-auto border border-background/20">
              <Cpu className="w-8 h-8 text-background" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-widest text-sm">Edge Inference</h4>
              <p className="text-xs opacity-50 leading-relaxed">Interactive features prioritize local UI speed, while live transcript fetches run through the SOLO TUTOR API when an external source is required.</p>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-background/10 rounded-3xl flex items-center justify-center mx-auto border border-background/20">
              <Lock className="w-8 h-8 text-background" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-widest text-sm">Zero-Knowledge</h4>
              <p className="text-xs opacity-50 leading-relaxed">No mandatory cloud sync for your vault. External requests happen only for the features that need outside content, such as YouTube caption retrieval.</p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex justify-center">
           <div className="inline-flex items-center gap-3 px-6 py-3 bg-background/5 rounded-2xl border border-background/10">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Verified Secure Implementation</span>
           </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
           <div className="absolute inset-0 bg-foreground/20 blur-3xl rounded-full" />
           <Sparkles className="w-12 h-12 text-foreground relative animate-bounce" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Ready to accelerate your learning?</h3>
          <p className="text-muted-foreground text-sm font-medium">Launch the Neural Vault and begin your mastery journey.</p>
        </div>
        <button className="px-8 py-4 bg-foreground text-background rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
          Get Started Now
        </button>
      </div>
    </div>
  );
};

export default Guide;
