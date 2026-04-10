import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

const Navbar = ({ activePage, theme, toggleTheme, onLogoClick, status = 'Ready' }) => {
  const getPageTitle = () => {
    switch (activePage) {
      case 'chat': return 'Knowledge Chat';
      case 'video': return 'Video Hub';
      case 'code': return 'Code Mentor';
      case 'quiz': return 'Quiz Lab';
      case 'vault': return 'Learning Vault';
      case 'guide': return 'How It Works';
      default: return 'Solo Tutor';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center px-8 justify-between">
        <div className="flex items-center gap-6">
          <h1 
            className="text-[15px] font-bold tracking-tight text-foreground/90 uppercase cursor-pointer hover:text-foreground transition-colors"
            onClick={onLogoClick}
          >
            {getPageTitle()}
          </h1>
          
          <div className="flex items-center gap-2 px-2.5 py-1 bg-secondary rounded-full border border-border/50">
            <Sparkles className="w-3.5 h-3.5 text-foreground/70" />
            <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest">{status}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-secondary transition-all border border-transparent hover:border-border"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-foreground/70" /> : <Moon className="w-4 h-4 text-foreground/70" />}
          </button>
          
          <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center text-background text-[11px] font-black">
            VS
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
