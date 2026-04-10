import React from 'react';
import { 
  MessageCircle, 
  PlayCircle, 
  Code2, 
  HelpCircle, 
  FolderOpen, 
  ChevronLeft,
  BookOpen
} from 'lucide-react';
import { cn } from '../../utils/cn';

const menuItems = [
  { id: 'chat', label: 'Knowledge Chat', icon: MessageCircle },
  { id: 'video', label: 'Video Hub', icon: PlayCircle },
  { id: 'code', label: 'Code Mentor', icon: Code2 },
  { id: 'quiz', label: 'Quiz Lab', icon: HelpCircle },
  { id: 'vault', label: 'Learning Vault', icon: FolderOpen },
  { id: 'guide', label: 'How It Works', icon: BookOpen },
];

const Sidebar = ({ activePage, setActivePage, isCollapsed, setIsCollapsed, onLogoClick }) => {
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full border-r bg-card/30 backdrop-blur-xl transition-all duration-300 z-50",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div 
        className="flex h-16 items-center px-6 border-b border-border/40 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={onLogoClick}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-foreground rounded-lg">
            <span className="text-sm font-black italic text-background">S</span>
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground uppercase tracking-widest">
              Solo Tutor
            </span>
          )}
        </div>
      </div>

      <nav className="p-3 flex flex-col gap-1.5 mt-4 overflow-y-auto h-[calc(100vh-200px)] scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={cn(
              "flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
              activePage === item.id 
                ? "bg-secondary text-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 shrink-0 transition-transform duration-200",
              activePage === item.id ? "text-foreground" : "group-hover:scale-105"
            )} />
            {!isCollapsed && (
              <span className="text-[14px] font-medium tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            )}
            {activePage === item.id && (
              <div className="absolute right-0 top-2 bottom-2 w-1 bg-foreground rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-6 right-[-12px] p-1 bg-background border border-border rounded-full shadow-sm hover:bg-secondary transition-colors"
      >
        <ChevronLeft className={cn(
          "w-4 h-4 text-muted-foreground transition-transform duration-300",
          isCollapsed ? "rotate-180" : ""
        )} />
      </button>

      {!isCollapsed && (
        <div className="absolute bottom-10 left-4 right-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
          <div className="flex justify-between items-end mb-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Weekly Progress</p>
            <p className="text-[11px] font-bold text-foreground">67%</p>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-foreground rounded-full transition-all duration-500" />
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
