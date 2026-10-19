import React from 'react';
import { AssistantState, ZoyaMood } from '../types';
import { MOOD_THEMES } from '../theme';
import { Sparkles, Radio, HelpCircle, Palette } from 'lucide-react';

interface HeaderProps {
  state: AssistantState;
  mood: ZoyaMood;
  onOpenMoodPicker: () => void;
  onOpenInfo: () => void;
  activeModel: string;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  mood,
  onOpenMoodPicker,
  onOpenInfo,
  activeModel,
}) => {
  const currentTheme = MOOD_THEMES[mood] || MOOD_THEMES.sassy_violet;

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/30 backdrop-blur-md z-30 select-none">
      {/* Brand logo & tagline */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm border bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md transition-all duration-300 ${currentTheme.borderGlow}`}
          >
            <span className="bg-gradient-to-tr from-purple-400 to-pink-300 bg-clip-text text-transparent font-black tracking-tight">
              Z
            </span>
          </div>
          {state !== 'disconnected' && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              ZOYA
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/5">
                LIVE
              </span>
            </h1>
          </div>
          <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
            Voice-to-Voice AI • {state !== 'disconnected' ? 'Connected' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2">
        {/* Model & Audio specs tag (desktop / tablet) */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-400">
          <Radio className={`w-3 h-3 ${state !== 'disconnected' ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
          <span className="truncate max-w-[140px]">{activeModel.replace('gemini-', '')}</span>
          <span className="text-white/20">•</span>
          <span className="text-zinc-300">16k in / 24k out</span>
        </div>

        {/* Mood Vibe Button */}
        <button
          onClick={onOpenMoodPicker}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-medium text-zinc-300 transition-all cursor-pointer"
          title="Change Zoya's neon visual theme"
        >
          <Palette className="w-3.5 h-3.5" style={{ color: currentTheme.primaryColor }} />
          <span className="hidden xs:inline text-[11px]">{currentTheme.name}</span>
        </button>

        {/* Info button */}
        <button
          onClick={onOpenInfo}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          title="About Zoya & Voice-to-Voice Persona"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
