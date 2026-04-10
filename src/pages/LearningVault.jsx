import React, { useState, useRef, useMemo, useCallback } from 'react';
import { 
  Upload, 
  Search, 
  FileText, 
  Video, 
  Code, 
  Image as ImageIcon, 
  MoreVertical, 
  Trash2, 
  ExternalLink, 
  LayoutGrid, 
  List,
  Filter,
  CheckSquare,
  Square,
  Package,
  X,
  Plus,
  History,
  CloudUpload,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  FolderPlus,
  Sparkles
} from 'lucide-react';
import { useVault } from '../hooks/useVault';
import { cn } from '../utils/cn';

const LearningVault = () => {
  const { items, history, addItem, deleteItems, loadSampleData, clearHistory } = useVault();
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef(null);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                           item.subject?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [items, search, filterType]);

  const handleFileUpload = useCallback((files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    // Mock upload delay
    setTimeout(() => {
      Array.from(files).forEach(file => {
        const type = file.type.includes('pdf') ? 'pdf' : 
                    file.type.includes('video') ? 'video' :
                    file.type.includes('image') ? 'image' : 
                    file.name.match(/\.(py|js|ts|cpp|java)$/) ? 'code' : 'text';
        
        addItem({
          name: file.name,
          type: type,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          subject: "Unsorted",
          preview: `Mock preview for ${file.name}...`
        });
      });
      setIsUploading(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1200);
  }, [addItem]);

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    deleteItems(selectedIds);
    setSelectedIds([]);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'video': return <Video className="w-5 h-5 text-blue-400" />;
      case 'code': return <Code className="w-5 h-5 text-green-400" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-purple-400" />;
      default: return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Main Content */}
      <div className="flex-1 space-y-8 min-w-0">
        {/* Advanced Upload Section */}
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "relative group transition-all duration-300",
            isDragging ? "scale-[0.99]" : "scale-100"
          )}
        >
          <div className={cn(
            "border-2 border-dashed rounded-[32px] p-8 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-4",
            isDragging 
              ? "border-foreground bg-secondary/80 shadow-2xl" 
              : "border-border/40 bg-secondary/20 hover:border-foreground/20 hover:bg-secondary/30"
          )}>
            <div className={cn(
              "p-4 rounded-2xl bg-card border border-border shadow-sm transition-transform duration-500",
              isDragging ? "scale-110 rotate-12" : "scale-100"
            )}>
              <CloudUpload className="w-8 h-8 text-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Upload to Neural Vault</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Drag and drop your study materials here, or <button onClick={() => fileInputRef.current?.click()} className="text-foreground font-bold hover:underline">browse files</button>
              </p>
            </div>
            <div className="flex gap-6 pt-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI-Ready</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e.target.files)} multiple className="hidden" />
          </div>

          {/* Upload Progress Overlay */}
          {isUploading && (
            <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-md rounded-[32px] flex items-center justify-center animate-in fade-in duration-300">
              <div className="text-center space-y-4 max-w-xs px-6">
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden border border-border/40">
                  <div className="h-full bg-foreground animate-progress-indeterminate" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-widest">Neural Indexing...</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">Analyzing document structure and extracting semantic context for your Global Tutor.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters & Actions Header */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pt-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search neural vault..."
              className="w-full pl-10 pr-4 py-2 bg-secondary/40 border border-border/40 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/40">
              <button 
                onClick={() => setView('grid')}
                className={cn("p-1.5 rounded-md transition-all", view === 'grid' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setView('list')}
                className={cn("p-1.5 rounded-md transition-all", view === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "p-2 rounded-xl border transition-all",
                showHistory ? "bg-foreground text-background border-foreground" : "bg-secondary/40 border-border/40 text-muted-foreground hover:border-foreground/20"
              )}
            >
              <History className="w-4 h-4" />
            </button>

            <button 
              onClick={loadSampleData}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/40 border border-border/40 text-foreground rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-secondary/60 transition-all"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Load Sample</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-foreground text-background rounded-2xl animate-in slide-in-from-top-4 duration-300 shadow-xl">
            <div className="flex items-center gap-4 pl-2">
              <span className="text-[11px] font-black uppercase tracking-widest">{selectedIds.length} Selected</span>
              <button onClick={() => setSelectedIds([])} className="p-1 hover:bg-background/10 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 hover:bg-background/10 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Export
              </button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Main List Area */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/40 rounded-[40px] space-y-6 bg-secondary/10">
            <div className="p-5 bg-card rounded-2xl border border-border shadow-sm">
              <Package className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">Vault Empty</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                Your neural storage is currently offline. Upload documents to begin training your StudyOS Global Tutor.
              </p>
            </div>
          </div>
        ) : (
          <div className={cn(
            "grid gap-4 transition-all duration-500",
            view === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={cn(
                  "group relative p-5 bg-card border border-border/40 rounded-3xl transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-foreground/[0.04] overflow-hidden",
                  selectedIds.includes(item.id) ? "border-foreground ring-1 ring-foreground bg-secondary/40 shadow-xl" : "hover:border-foreground/30",
                  view === 'list' ? "flex items-center gap-5" : "flex flex-col gap-4"
                )}
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-foreground/[0.03] to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className={cn(
                  "p-3.5 rounded-2xl bg-secondary/80 group-hover:bg-background transition-all duration-300 group-hover:scale-105",
                  view === 'list' ? "w-14 h-14 flex items-center justify-center shrink-0" : "w-fit"
                )}>
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[14px] font-bold truncate pr-6 text-foreground/90 leading-tight">{item.name}</h4>
                    <button className="absolute top-5 right-5 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all z-10">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-70">
                    <span>{item.size}</span>
                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                    <span>{item.subject}</span>
                  </div>

                  {view === 'grid' && (
                    <p className="text-[12px] text-muted-foreground/70 line-clamp-2 leading-relaxed pt-2 group-hover:text-foreground/70 transition-colors">
                      {item.preview}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {item.tags?.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-secondary/60 text-foreground/60 text-[9px] font-black rounded-md uppercase tracking-widest border border-border/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedIds.includes(item.id) ? (
                  <div className="absolute top-5 right-5 text-foreground animate-in zoom-in-75">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="absolute top-5 right-5 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Square className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="w-80 shrink-0 space-y-6 animate-in slide-in-from-right-8 duration-500">
          <div className="bg-card border border-border/40 rounded-[32px] p-6 shadow-sm flex flex-col h-full max-h-[800px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-foreground" />
                <h3 className="text-[11px] font-black uppercase tracking-widest">Neural History</h3>
              </div>
              <button onClick={clearHistory} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors">
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pr-1">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-40">
                  <Clock className="w-6 h-6" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No recent activity</p>
                </div>
              ) : (
                history.map((event) => (
                  <div key={event.id} className="relative pl-6 pb-6 border-l border-border/40 last:pb-0">
                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-foreground rounded-full border-2 border-card shadow-sm" />
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                          event.type === 'UPLOAD' ? "bg-green-500/10 text-green-500" :
                          event.type === 'DELETE' ? "bg-red-500/10 text-red-500" :
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          {event.type}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[12px] font-bold text-foreground/90 truncate leading-tight">
                        {event.name || event.message}
                      </p>
                      {event.fileType && (
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                          Indexed as {event.fileType}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 p-4 bg-foreground text-background rounded-2xl space-y-3 shadow-lg">
               <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Vault Status</h4>
               </div>
               <div className="flex justify-between items-end">
                  <span className="text-[11px] font-bold">Neural Health</span>
                  <span className="text-sm font-black tracking-tight">Optimal</span>
               </div>
               <div className="h-1 w-full bg-background/20 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-background rounded-full" />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for progress animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s infinite linear;
        }
      `}} />
    </div>
  );
};

export default LearningVault;
