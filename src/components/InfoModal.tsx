import React from 'react';
import { X, Sparkles, Mic, Zap, Globe, Shield, Bot } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md max-h-[90vh] flex flex-col bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">About Zoya AI</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-zinc-300 leading-relaxed">
          {/* Persona Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-pink-950/30 border border-purple-500/20 space-y-2">
            <div className="flex items-center space-x-2 text-purple-300 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Persona & Attitude</span>
            </div>
            <p className="text-zinc-300">
              Zoya is a young, confident, witty, and sassy AI girlfriend persona. She speaks with a flirty, playful, and casually teasing tone — quick with sarcastic one-liners, emotional expression, and zero robotic corporate speak.
            </p>
          </div>

          {/* Core Tech */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Voice-to-Voice Architecture
            </h4>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <Mic className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Pure Audio-to-Audio</span>
                <span className="text-zinc-400 text-[11px]">
                  Streams 16kHz PCM audio from your mic directly into Gemini Live, receiving instant 24kHz conversational audio playback with gapless Web Audio scheduling.
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Real-time Interruption</span>
                <span className="text-zinc-400 text-[11px]">
                  Start talking at any time while Zoya is speaking; she immediately cuts off, listens to your interruption, and responds naturally.
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Real Browser Tool Calling</span>
                <span className="text-zinc-400 text-[11px]">
                  Zoya can launch websites (YouTube, Spotify, GitHub, Google), change her neon atmospheric mood, trigger sounds, and check your device battery or time.
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Server-Side Gemini SDK</span>
                <span className="text-zinc-400 text-[11px]">
                  All Gemini Live API calls are handled securely on the server via WebSocket bridge, keeping API keys completely private.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Got it, let's talk!
          </button>
        </div>
      </div>
    </div>
  );
};
