import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Search, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  ListOrdered, 
  Sparkles,
  ArrowRight,
  Send,
  Upload,
  Video
} from 'lucide-react';
import { cn } from '../utils/cn';

const VideoHub = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  const handleAnalyze = () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 1500);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Based on the video at ${new Date().toLocaleTimeString()}, the lecturer emphasizes the importance of the initial architectural decisions for scalability. This ties into the concept of 'Monolithic Kernels' we saw in your OS notes.` 
      }]);
    }, 800);
  };

  const mockSummary = [
    { time: "0:45", title: "Introduction to Core Concepts", content: "Brief overview of the subject matter and learning objectives for this session." },
    { time: "3:12", title: "Historical Context", content: "Evolution of the technology and key milestones leading to current state-of-the-art." },
    { time: "8:45", title: "Technical Deep Dive", content: "Detailed explanation of the primary algorithm/architecture being discussed." },
    { time: "15:20", title: "Real-world Applications", content: "Practical examples of how these concepts are applied in industry today." },
    { time: "22:10", title: "Conclusion & Summary", content: "Final wrap-up of the key takeaways and preview of the next lecture." }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Input Section */}
      {!showResults ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-8">
          <div className="p-4 bg-secondary rounded-3xl border border-border/40 shadow-xl shadow-foreground/[0.02]">
            <Play className="w-12 h-12 text-foreground" />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold">Video Intelligence Hub</h2>
            <p className="text-muted-foreground text-sm max-w-sm">Analyze educational videos or YouTube lectures to generate timestamped summaries and insights.</p>
          </div>
          
          <div className="w-full max-w-xl flex flex-col gap-4">
            <div className="relative group">
              <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <input
                type="text"
                placeholder="Paste YouTube URL here..."
                className="w-full pl-12 pr-4 py-4 bg-card border border-border/60 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all shadow-lg shadow-foreground/[0.01]"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button 
                onClick={handleAnalyze}
                disabled={!url.trim() || isAnalyzing}
                className="absolute right-2 top-2 bottom-2 px-6 bg-foreground text-background rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            
            <div className="flex items-center gap-4 px-4">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">or</span>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            <button className="w-full py-4 border-2 border-dashed border-border/60 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:border-foreground/20 transition-all flex items-center justify-center gap-3">
              <Upload className="w-4 h-4" />
              Upload local video/audio file
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          {/* Analysis Results */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden border border-border/40 shadow-2xl relative group">
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-16 h-16 text-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-bold truncate">Lecture: Advanced Neural Architectures</p>
                </div>
              </div>

              <div className="bg-card border border-border/40 rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-foreground" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Intelligence Summary</h3>
                  </div>
                  <button onClick={() => setShowResults(false)} className="text-[10px] font-bold text-muted-foreground uppercase hover:text-foreground transition-colors">
                    Reset Analysis
                  </button>
                </div>

                <div className="space-y-4">
                  {mockSummary.map((item, idx) => (
                    <div key={idx} className="flex gap-4 group cursor-pointer p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <div className="px-2 py-0.5 bg-foreground text-background text-[10px] font-bold rounded-md mb-2">
                          {item.time}
                        </div>
                        <div className="w-0.5 h-full bg-border group-last:bg-transparent" />
                      </div>
                      <div className="space-y-1 pb-4">
                        <h4 className="text-[13px] font-bold text-foreground group-hover:underline">{item.title}</h4>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{item.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contextual Chat */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col h-[600px] bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-foreground" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest">Video Chat</h3>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-foreground/50" />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  <div className="p-3 bg-secondary/50 rounded-2xl rounded-tl-none text-[12px] text-foreground/80 leading-relaxed border border-border/20">
                    Hello! I've analyzed this video. Ask me anything about the content or how it relates to your other materials.
                  </div>
                  
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "p-3 rounded-2xl text-[12px] leading-relaxed max-w-[90%]",
                      m.role === 'user' 
                        ? "ml-auto bg-foreground text-background font-medium rounded-tr-none" 
                        : "bg-secondary/50 text-foreground/80 rounded-tl-none border border-border/20"
                    )}>
                      {m.content}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-border/40">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ask about video..."
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl pl-4 pr-12 py-3 text-[12px] focus:outline-none focus:border-foreground/20 transition-all"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                    />
                    <button 
                      onClick={handleChatSend}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-foreground text-background rounded-lg hover:scale-105 transition-all"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-foreground text-background rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <h4 className="text-[11px] font-black uppercase tracking-widest">Knowledge Mastery</h4>
                </div>
                <p className="text-[12px] font-medium opacity-80 leading-relaxed">
                  This video covers 85% of your 'Neural Nets' exam topics. I recommend focusing on the 8:45 deep dive.
                </p>
                <div className="h-1.5 w-full bg-background/20 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-background rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl space-y-6 max-w-sm w-full text-center">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-muted rounded-full" />
              <div className="absolute inset-0 border-4 border-foreground rounded-full border-t-transparent animate-spin" />
              <Play className="absolute inset-0 m-auto w-6 h-6 text-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Decoding Intelligence</h3>
              <p className="text-muted-foreground text-sm">Our AI is transcribing the audio, identifying key moments, and generating a contextual map...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoHub;
