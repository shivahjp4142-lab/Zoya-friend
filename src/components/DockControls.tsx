import React from 'react';
import { AssistantState, ZoyaMood } from '../types';
import { MOOD_THEMES } from '../theme';
import { Mic, MicOff, Power, PhoneOff, MessageSquare, VolumeX, Sparkles, Volume2 } from 'lucide-react';

interface DockControlsProps {
  state: AssistantState;
  mood: ZoyaMood;
  isMuted: boolean;
  onTogglePower: () => void;
  onToggleMute: () => void;
  onTogglePrompts: () => void;
  onPlayWink: () => void;
}

export const DockControls: React.FC<DockControlsProps> = ({
  state,
  mood,
  isMuted,
  onTogglePower,
  onToggleMute,
  onTogglePrompts,
  onPlayWink,
}) => {
  const isConnected = state !== 'disconnected';
  const theme = MOOD_THEMES[mood] || MOOD_THEMES.sassy_violet;

  return (
    <div className="w-full flex flex-col items-center pb-6 pt-2 px-4 z-20">
      {/* Floating Glass Dock */}
      <div className="flex items-center justify-between w-full max-w-sm px-4 py-2.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl shadow-2xl">
        {/* Icebreakers / Prompts drawer button */}
        <button
          onClick={onTogglePrompts}
          className="p-3 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          title="Voice prompt suggestions"
          aria-label="Open voice prompt suggestions"
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
        </button>

        {/* Mic Mute toggle (only when connected) */}
        {isConnected ? (
          <button
            onClick={onToggleMute}
            className={`p-3 rounded-full active:scale-95 transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5" />}
          </button>
        ) : (
          <button
            onClick={onPlayWink}
            className="p-3 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Preview Zoya's chime"
            aria-label="Play chime"
          >
            <Volume2 className="w-5 h-5 text-purple-300" />
          </button>
        )}

        {/* Central Power / Live Call Button */}
        <div className="relative -my-4">
          <button
            onClick={onTogglePower}
            className={`relative flex items-center justify-center w-16 h-16 rounded-full font-bold shadow-2xl transition-all duration-300 cursor-pointer active:scale-90 ${
              isConnected
                ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.5)]'
                : 'bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500 text-white shadow-[0_0_30px_rgba(192,132,252,0.6)] animate-pulse'
            }`}
            title={isConnected ? 'End voice session' : 'Connect to Zoya Live Voice'}
            aria-label={isConnected ? 'End voice session' : 'Connect to Zoya Live Voice'}
          >
            {isConnected ? (
              <PhoneOff className="w-7 h-7" />
            ) : (
              <Power className="w-7 h-7" />
            )}
          </button>
        </div>

        {/* Playful sound effect / wink trigger */}
        <button
          onClick={onPlayWink}
          className="p-3 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          title="Playful wink sound"
          aria-label="Play wink sound"
        >
          <span className="text-lg">😉</span>
        </button>

        {/* Secondary End/Status action */}
        {isConnected ? (
          <button
            onClick={onTogglePower}
            className="p-3 rounded-full text-zinc-400 hover:text-rose-400 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Disconnect"
            aria-label="Disconnect"
          >
            <Power className="w-5 h-5" />
          </button>
        ) : (
          <div className="p-3 text-zinc-600">
            <span className="block w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
        )}
      </div>

      <p className="mt-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
        {isConnected ? 'Tap red to disconnect • Speak naturally' : 'Audio-to-Audio Live Stream Only'}
      </p>
    </div>
  );
};
