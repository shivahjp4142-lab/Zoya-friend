import React from 'react';
import { ToolActionItem, ZoyaMood } from '../types';
import { MOOD_THEMES } from '../theme';
import { ExternalLink, Sparkles, Check, Globe, Palette, Volume2, X } from 'lucide-react';

interface ToolActionBannerProps {
  action: ToolActionItem | null;
  onDismiss: () => void;
  mood: ZoyaMood;
}

export const ToolActionBanner: React.FC<ToolActionBannerProps> = ({
  action,
  onDismiss,
  mood,
}) => {
  if (!action) return null;

  const theme = MOOD_THEMES[mood] || MOOD_THEMES.sassy_violet;

  return (
    <div className="fixed top-18 inset-x-4 max-w-md mx-auto z-40 animate-slide-down">
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/90 border border-white/15 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
            {action.toolName === 'openWebsite' && <Globe className="w-5 h-5 text-cyan-400" />}
            {action.toolName === 'setMood' && <Palette className="w-5 h-5 text-pink-400" />}
            {action.toolName === 'triggerHapticOrTone' && <Volume2 className="w-5 h-5 text-amber-400" />}
            {action.toolName === 'getDeviceContext' && <Sparkles className="w-5 h-5 text-purple-400" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-semibold">
                Action Executed
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-xs font-bold text-white truncate">
                {action.label}
              </span>
            </div>
            {action.message && (
              <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                "{action.message}"
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1.5 ml-2 shrink-0">
          {action.url && (
            <a
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs transition-transform active:scale-95 shadow-md cursor-pointer"
            >
              <span>Visit</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss action notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
