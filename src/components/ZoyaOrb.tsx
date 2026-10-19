import React, { useEffect, useRef } from 'react';
import { AssistantState, ZoyaMood } from '../types';
import { MOOD_THEMES } from '../theme';
import { Power, Mic, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface ZoyaOrbProps {
  state: AssistantState;
  mood: ZoyaMood;
  micVolume: number;
  getFrequencies: () => Uint8Array;
  onOrbClick: () => void;
}

export const ZoyaOrb: React.FC<ZoyaOrbProps> = ({
  state,
  mood,
  micVolume,
  getFrequencies,
  onOrbClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = MOOD_THEMES[mood] || MOOD_THEMES.sassy_violet;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      angle += 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(centerX, centerY) * 0.42;

      ctx.clearRect(0, 0, width, height);

      // Get real audio frequency data
      const frequencies = getFrequencies();
      let avgFreq = 0;
      for (let i = 0; i < frequencies.length; i++) {
        avgFreq += frequencies[i];
      }
      avgFreq = frequencies.length > 0 ? avgFreq / (frequencies.length * 255) : 0;

      // Influence by state
      let pulseMultiplier = 1;
      if (state === 'speaking') {
        pulseMultiplier = 1 + avgFreq * 0.55;
      } else if (state === 'listening') {
        pulseMultiplier = 1 + micVolume * 0.45;
      } else if (state === 'connecting') {
        pulseMultiplier = 1 + Math.sin(angle * 4) * 0.08;
      } else {
        // disconnected
        pulseMultiplier = 1 + Math.sin(angle * 1.5) * 0.03;
      }

      const activeRadius = baseRadius * pulseMultiplier;

      // 1. Ambient outer aura gradient
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        activeRadius * 0.3,
        centerX,
        centerY,
        activeRadius * 1.7
      );
      auraGradient.addColorStop(0, theme.glowColor);
      auraGradient.addColorStop(0.5, theme.glowColor.replace('0.45', '0.15'));
      auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, activeRadius * 1.7, 0, Math.PI * 2);
      ctx.fillStyle = auraGradient;
      ctx.fill();

      // 2. Orbital dashed radar rings
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle * 0.5);

      ctx.beginPath();
      ctx.arc(0, 0, activeRadius * 1.35, 0, Math.PI * 2);
      ctx.setLineDash([6, 14]);
      ctx.strokeStyle = state === 'disconnected' ? 'rgba(255,255,255,0.1)' : theme.primaryColor + '44';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Counter-rotating outer thin ring
      ctx.rotate(-angle * 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, activeRadius * 1.5, 0, Math.PI * 2);
      ctx.setLineDash([4, 20]);
      ctx.strokeStyle = state === 'disconnected' ? 'rgba(255,255,255,0.06)' : theme.secondaryColor + '33';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();

      // 3. Audio Frequency Node Ring (when speaking or listening)
      if (state === 'speaking' || state === 'listening') {
        const numPoints = 48;
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const theta = (i / numPoints) * Math.PI * 2;
          const freqIndex = Math.floor((i / numPoints) * frequencies.length);
          const fVal = (frequencies[freqIndex] || 0) / 255;
          const rOffset = state === 'speaking' ? fVal * 32 : micVolume * 22;
          const r = activeRadius * 1.12 + rOffset;

          const px = centerX + Math.cos(theta + angle * 0.3) * r;
          const py = centerY + Math.sin(theta + angle * 0.3) * r;

          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = theme.primaryColor + 'cc';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // 4. Inner Holographic Core
      const coreGradient = ctx.createRadialGradient(
        centerX - activeRadius * 0.25,
        centerY - activeRadius * 0.25,
        5,
        centerX,
        centerY,
        activeRadius
      );

      if (state === 'disconnected') {
        coreGradient.addColorStop(0, '#27272a');
        coreGradient.addColorStop(0.6, '#18181b');
        coreGradient.addColorStop(1, '#09090b');
      } else if (state === 'interrupted') {
        coreGradient.addColorStop(0, '#fca5a5');
        coreGradient.addColorStop(0.5, '#ef4444');
        coreGradient.addColorStop(1, '#450a0a');
      } else {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.3, theme.primaryColor);
        coreGradient.addColorStop(0.7, theme.secondaryColor);
        coreGradient.addColorStop(1, '#09090b');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, activeRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Core border glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, activeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = state === 'disconnected' ? 'rgba(255,255,255,0.15)' : theme.primaryColor;
      ctx.lineWidth = state === 'speaking' ? 3.5 : 2;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, mood, micVolume, getFrequencies, theme]);

  return (
    <div className="relative flex flex-col items-center justify-center my-auto select-none">
      {/* Interactive canvas orb container */}
      <div
        onClick={onOrbClick}
        role="button"
        tabIndex={0}
        aria-label="Toggle Zoya voice assistant"
        className="relative group cursor-pointer transition-transform duration-300 active:scale-95 flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          className="max-w-[85vw] max-h-[42vh] aspect-square pointer-events-none drop-shadow-2xl"
        />

        {/* Center icon / emblem overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {state === 'disconnected' && (
            <div className="flex flex-col items-center space-y-2 text-zinc-400 group-hover:text-white transition-colors">
              <div className="p-4 rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-inner group-hover:border-purple-500/50">
                <Power className="w-8 h-8 text-zinc-300 group-hover:text-purple-400 transition-colors" />
              </div>
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 font-medium uppercase">
                Tap to Wake
              </span>
            </div>
          )}

          {state === 'connecting' && (
            <div className="flex flex-col items-center space-y-2 text-white">
              <Sparkles className="w-7 h-7 text-white animate-spin duration-1000" />
              <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-white/90">
                Tuning In...
              </span>
            </div>
          )}

          {state === 'listening' && (
            <div className="flex flex-col items-center space-y-1 text-white">
              <Mic className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-white/90 drop-shadow">
                Listening
              </span>
            </div>
          )}

          {state === 'speaking' && (
            <div className="flex flex-col items-center space-y-1 text-white">
              <Volume2 className="w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-bounce" />
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-white/90 drop-shadow">
                Speaking
              </span>
            </div>
          )}

          {state === 'interrupted' && (
            <div className="flex flex-col items-center space-y-1 text-rose-200">
              <AlertCircle className="w-7 h-7 text-rose-300 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold">
                Interrupted
              </span>
            </div>
          )}
        </div>
      </div>

      {/* State badge caption */}
      <div className="mt-4 flex flex-col items-center space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span
            className={`w-2 h-2 rounded-full ${
              state === 'speaking'
                ? 'bg-purple-400 animate-ping'
                : state === 'listening'
                ? 'bg-cyan-400 animate-pulse'
                : state === 'connecting'
                ? 'bg-amber-400 animate-bounce'
                : state === 'interrupted'
                ? 'bg-rose-400 animate-pulse'
                : 'bg-zinc-600'
            }`}
          />
          <span className="text-xs font-mono tracking-wide text-zinc-300">
            {state === 'disconnected' && 'Zoya is in standby mode'}
            {state === 'connecting' && 'Establishing Gemini Live 3.1 session...'}
            {state === 'listening' && "I'm listening, say anything..."}
            {state === 'speaking' && 'Zoya is responding...'}
            {state === 'interrupted' && 'You cut me off! Listening again...'}
          </span>
        </div>
      </div>
    </div>
  );
};
