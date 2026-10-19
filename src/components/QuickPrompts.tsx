import React from 'react';
import { ZoyaMood } from '../types';
import { MOOD_THEMES } from '../theme';
import { Sparkles, X, Flame, Coffee, Globe, Compass, Clock, Zap } from 'lucide-react';

interface QuickPromptsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
  mood: ZoyaMood;
}

interface PromptCategory {
  title: string;
  icon: React.ReactNode;
  prompts: string[];
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  mood,
}) => {
  if (!isOpen) return null;

  const theme = MOOD_THEMES[mood] || MOOD_THEMES.sassy_violet;

  const categories: PromptCategory[] = [
    {
      title: 'Sassy & Playful Banter',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      prompts: [
        "Roast my life choices, don't hold back.",
        "Tell me a flirty, witty pick-up line that actually works.",
        "Rate my vibe today based purely on our chemistry.",
        "Give me a sassy comeback for someone who left me on read.",
      ],
    },
    {
      title: 'Browser & Tool Actions',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      prompts: [
        "Open YouTube for me, I need some good music right now.",
        "Open Spotify and put on something with attitude.",
        "Check my device status — what time is it for me?",
        "Change your aura mood to Crimson Fire.",
      ],
    },
    {
      title: 'Girlfriend Advice & Hot Takes',
      icon: <Coffee className="w-4 h-4 text-amber-400" />,
      prompts: [
        "Should I text them first or make them wait?",
        "What should I order for dinner tonight? Decide for me.",
        "I'm feeling unmotivated today, give me a cheeky pep talk.",
        "What's your deepest, most hilarious secret?",
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full sm:max-w-md max-h-[85vh] flex flex-col bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Talk to Zoya</h3>
              <p className="text-[11px] text-zinc-400">Tap any phrase to kick off the voice chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center space-x-2 px-1">
                {cat.icon}
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
                  {cat.title}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {cat.prompts.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => {
                      onSelectPrompt(p);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] active:scale-[0.98] border border-white/5 hover:border-white/15 transition-all group flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-xs text-zinc-200 group-hover:text-white leading-relaxed">
                      "{p}"
                    </span>
                    <Zap className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="px-5 py-3 border-t border-white/5 bg-black/40 text-center">
          <p className="text-[11px] text-zinc-400">
            Tip: Zoya is purely voice-to-voice. Tapping a prompt speaks it into her live ear!
          </p>
        </div>
      </div>
    </div>
  );
};
