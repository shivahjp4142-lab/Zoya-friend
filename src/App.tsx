/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AssistantState, ZoyaMood, ToolActionItem } from './types';
import { MOOD_THEMES } from './theme';
import { LiveSession } from './services/liveSession';
import { soundEffects } from './services/soundEffects';
import { Header } from './components/Header';
import { ZoyaOrb } from './components/ZoyaOrb';
import { AudioWaveform } from './components/AudioWaveform';
import { DockControls } from './components/DockControls';
import { QuickPrompts } from './components/QuickPrompts';
import { ToolActionBanner } from './components/ToolActionBanner';
import { MoodPickerModal } from './components/MoodPickerModal';
import { InfoModal } from './components/InfoModal';
import { AlertCircle, ShieldAlert, Sparkles, X } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AssistantState>('disconnected');
  const [mood, setMood] = useState<ZoyaMood>('sassy_violet');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.1-flash-live-preview');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [currentToolAction, setCurrentToolAction] = useState<ToolActionItem | null>(null);
  const [showPrompts, setShowPrompts] = useState<boolean>(false);
  const [showMoodPicker, setShowMoodPicker] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasServerKey, setHasServerKey] = useState<boolean>(true);

  const sessionRef = useRef<LiveSession | null>(null);
  const theme = MOOD_THEMES[mood] || MOOD_THEMES.sassy_violet;

  // Check backend health & key status
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasKey === 'boolean') {
          setHasServerKey(data.hasKey);
        }
      })
      .catch((err) => {
        console.warn('Backend health check error:', err);
      });
  }, []);

  // Initialize LiveSession
  useEffect(() => {
    const session = new LiveSession({
      onStateChange: (newState) => {
        setState(newState);
      },
      onMoodChange: (newMood, reason) => {
        setMood(newMood);
      },
      onToolAction: (action) => {
        setCurrentToolAction(action);
        // Auto-dismiss banner after 8 seconds
        setTimeout(() => {
          setCurrentToolAction((prev) => (prev?.id === action.id ? null : prev));
        }, 8000);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onModelReady: (model) => {
        setActiveModel(model);
      },
      onMicVolumeChange: (vol) => {
        setMicVolume(vol);
      },
    });

    sessionRef.current = session;

    return () => {
      session.disconnect();
    };
  }, []);

  // Central Orb / Power toggle
  const handleTogglePower = useCallback(async () => {
    if (!sessionRef.current) return;

    if (state === 'disconnected') {
      setErrorMessage(null);
      await sessionRef.current.connect();
    } else {
      sessionRef.current.disconnect();
    }
  }, [state]);

  // Toggle mic mute
  const handleToggleMute = useCallback(() => {
    if (!sessionRef.current) return;
    const muted = sessionRef.current.toggleMute();
    setIsMuted(muted);
  }, []);

  // Send a quick voice prompt nudge
  const handleSelectPrompt = useCallback((promptText: string) => {
    if (!sessionRef.current) return;
    sessionRef.current.sendPromptNudge(promptText);
  }, []);

  // Play synthetic flirty chime
  const handlePlayWink = useCallback(() => {
    soundEffects.playWink();
  }, []);

  // Get frequency spectrum function passed to visualizer
  const getFrequencies = useCallback((): Uint8Array => {
    if (!sessionRef.current) return new Uint8Array(64);
    return sessionRef.current.getVisualizerFrequencies();
  }, []);

  return (
    <div
      className={`relative w-full h-screen overflow-hidden flex flex-col justify-between bg-zinc-950 text-white font-sans transition-colors duration-700 bg-gradient-to-b ${theme.accentBg}`}
    >
      {/* Ambient background holographic grid & glowing orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full blur-[140px] opacity-25 transition-all duration-1000"
          style={{ background: theme.primaryColor }}
        />
        <div
          className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 transition-all duration-1000"
          style={{ background: theme.secondaryColor }}
        />
        {/* Subtle cyber grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      {/* Top Header */}
      <Header
        state={state}
        mood={mood}
        activeModel={activeModel}
        onOpenMoodPicker={() => setShowMoodPicker(true)}
        onOpenInfo={() => setShowInfo(true)}
      />

      {/* Error alert toast */}
      {errorMessage && (
        <div className="fixed top-18 inset-x-4 max-w-md mx-auto z-40 animate-slide-down">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/40 backdrop-blur-xl shadow-2xl text-rose-200 text-xs">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 rounded-lg hover:bg-rose-900/50 text-rose-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* API Key warning if not set */}
      {!hasServerKey && (
        <div className="fixed top-18 inset-x-4 max-w-md mx-auto z-40 animate-slide-down">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-950/90 border border-amber-500/40 backdrop-blur-xl shadow-2xl text-amber-200 text-xs">
            <div className="flex items-center space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>GEMINI_API_KEY is not configured. Connect your key in Settings &gt; Secrets.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tool Action Floating Banner */}
      <ToolActionBanner
        action={currentToolAction}
        onDismiss={() => setCurrentToolAction(null)}
        mood={mood}
      />

      {/* Center Main Stage (Audio Orb & Persona) */}
      <main className="relative flex-1 flex flex-col items-center justify-center z-10 px-4">
        {/* Floating Persona Badge */}
        <div className="mb-2 flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px] font-medium tracking-wide text-zinc-300">
            Witty • Confident • Flirty Girlfriend AI
          </span>
        </div>

        {/* The Central Audio Visualizer Orb */}
        <ZoyaOrb
          state={state}
          mood={mood}
          micVolume={micVolume}
          getFrequencies={getFrequencies}
          onOrbClick={handleTogglePower}
        />

        {/* Real-time Frequency Waveform Display */}
        <div className="w-full max-w-xs mt-3">
          <AudioWaveform
            state={state}
            mood={mood}
            getFrequencies={getFrequencies}
          />
        </div>
      </main>

      {/* Mobile-first Floating Dock Controls */}
      <DockControls
        state={state}
        mood={mood}
        isMuted={isMuted}
        onTogglePower={handleTogglePower}
        onToggleMute={handleToggleMute}
        onTogglePrompts={() => setShowPrompts(true)}
        onPlayWink={handlePlayWink}
      />

      {/* Modals & Drawers */}
      <QuickPrompts
        isOpen={showPrompts}
        onClose={() => setShowPrompts(false)}
        onSelectPrompt={handleSelectPrompt}
        mood={mood}
      />

      <MoodPickerModal
        isOpen={showMoodPicker}
        onClose={() => setShowMoodPicker(false)}
        currentMood={mood}
        onSelectMood={(m) => setMood(m)}
      />

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </div>
  );
}
