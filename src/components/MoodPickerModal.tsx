import React from 'react';
import { ZoyaMood } from '../types';
import { MOOD_THEMES } from '../theme';
import { Check, X, Palette, Sparkles } from 'lucide-react';

interface MoodPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMood: ZoyaMood;
  onSelectMood: (mood: ZoyaMood) => void;
}

export const MoodPickerModal: React.FC<MoodPickerModalProps> = ({
  isOpen,
  onClose,
  currentMood,
  onSelectMood,
}) => {
  if (!isOpen) return null;

  const moodList: ZoyaMood[] = [
    'sassy_violet',
    'electric_cyan',
    'crimson_fire',
    'neon_emerald',
    'sunset_amber',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full sm:max-w-sm flex flex-col bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Zoya's Neon Vibe</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {moodList.map((m) => {
            const item = MOOD_THEMES[m];
            const isSelected = currentMood === m;

            return (
              <button
                key={m}
                onClick={() => {
                  onSelectMood(m);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/10 border-white/30 shadow-lg'
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-5 h-5 rounded-full shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${item.primaryColor}, ${item.secondaryColor})`,
                      boxShadow: `0 0 10px ${item.glowColor}`,
                    }}
                  />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-white block">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-mono">
                      {m.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-white/5 bg-black/40 text-center">
          <p className="text-[10px] text-zinc-400 font-mono">
            Zoya can also dynamically switch her mood during voice chat!
          </p>
        </div>
      </div>
    </div>
  );
};
