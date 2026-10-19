import React, { useEffect, useRef } from 'react';
import { AssistantState, ZoyaMood } from '../types';
import { MOOD_THEMES } from '../theme';

interface AudioWaveformProps {
  state: AssistantState;
  mood: ZoyaMood;
  getFrequencies: () => Uint8Array;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  state,
  mood,
  getFrequencies,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = MOOD_THEMES[mood] || MOOD_THEMES.sassy_violet;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const draw = () => {
      step += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = getFrequencies();
      const numBars = 36;
      const barWidth = 3;
      const spacing = (width - numBars * barWidth) / (numBars - 1);

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + spacing);
        const centerDist = Math.abs(i - numBars / 2) / (numBars / 2);
        const envelope = 1 - Math.pow(centerDist, 1.5);

        let barHeight = 4;
        if (state === 'speaking' || state === 'listening') {
          const freqIdx = Math.floor((i / numBars) * freqData.length);
          const rawVal = (freqData[freqIdx] || 0) / 255;
          barHeight = Math.max(4, rawVal * (height - 8) * envelope);
        } else if (state === 'connecting') {
          const wave = Math.sin(step * 3 + i * 0.25);
          barHeight = 4 + Math.max(0, wave * 18 * envelope);
        } else {
          // Idle ambient shimmer
          const wave = Math.sin(step + i * 0.2);
          barHeight = 3 + Math.max(0, wave * 4 * envelope);
        }

        const y = (height - barHeight) / 2;

        // Gradient bar
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (state === 'disconnected') {
          grad.addColorStop(0, 'rgba(255,255,255,0.25)');
          grad.addColorStop(1, 'rgba(255,255,255,0.05)');
        } else {
          grad.addColorStop(0, theme.primaryColor);
          grad.addColorStop(1, theme.secondaryColor + '44');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, mood, getFrequencies, theme]);

  return (
    <div className="w-full flex items-center justify-center px-4">
      <canvas
        ref={canvasRef}
        width={320}
        height={48}
        className="w-full max-w-[320px] h-10 pointer-events-none opacity-85"
      />
    </div>
  );
};
