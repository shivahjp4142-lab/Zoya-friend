import { AssistantState, ZoyaMood, ToolActionItem, DeviceInfo } from '../types';
import { AudioRecorder } from './audioRecorder';
import { AudioStreamer } from './audioStreamer';
import { soundEffects } from './soundEffects';

export interface LiveSessionCallbacks {
  onStateChange: (state: AssistantState) => void;
  onMoodChange: (mood: ZoyaMood, reason?: string) => void;
  onToolAction: (action: ToolActionItem) => void;
  onError: (error: string) => void;
  onModelReady?: (model: string) => void;
  onMicVolumeChange?: (volume: number) => void;
  onModelSpeakingChange?: (isSpeaking: boolean) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private recorder: AudioRecorder | null = null;
  private streamer: AudioStreamer | null = null;
  private state: AssistantState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private activeModel: string = 'gemini-3.1-flash-live-preview';
  private currentVoice: string = 'Kore';
  private isMuted: boolean = false;
  private pingInterval: any = null;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
  }

  public getState(): AssistantState {
    return this.state;
  }

  private setState(newState: AssistantState) {
    if (this.state === newState) return;
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  /**
   * Connect to WebSocket and initiate Gemini Live session
   */
  public async connect(): Promise<void> {
    if (this.state !== 'disconnected') {
      this.disconnect();
    }

    this.setState('connecting');
    soundEffects.playWake();

    try {
      // 1. Initialize streamer
      this.streamer = new AudioStreamer((isSpeaking) => {
        this.callbacks.onModelSpeakingChange?.(isSpeaking);
        if (isSpeaking) {
          this.setState('speaking');
        } else {
          // If we are connected and not speaking, we're listening
          if (this.state === 'speaking' || this.state === 'interrupted') {
            this.setState('listening');
          }
        }
      });
      await this.streamer.init();

      // 2. Setup WebSocket connection to server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        console.log('[LiveSession] WebSocket connected to backend');

        // 3. Start microphone recording
        try {
          this.recorder = new AudioRecorder(
            (base64Chunk) => {
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'audio', data: base64Chunk }));
              }
            },
            (micVol) => {
              this.callbacks.onMicVolumeChange?.(micVol);
            }
          );

          await this.recorder.start();
          this.setState('listening');
        } catch (micErr: any) {
          console.error('[LiveSession] Mic error:', micErr);
          this.callbacks.onError('Microphone permission denied or unavailable. Please enable mic access.');
          this.disconnect();
        }
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            this.activeModel = msg.model || 'gemini-3.1-flash-live-preview';
            this.callbacks.onModelReady?.(this.activeModel);
            this.setState('listening');
          } else if (msg.type === 'audio' && msg.data) {
            // Audio from Zoya
            this.streamer?.playPcmChunk(msg.data);
          } else if (msg.type === 'interrupted') {
            // User interrupted Zoya
            console.log('[LiveSession] Interruption triggered');
            this.streamer?.stopAll();
            soundEffects.playInterruptionBlip();
            this.setState('interrupted');
            setTimeout(() => {
              if (this.state === 'interrupted') {
                this.setState('listening');
              }
            }, 600);
          } else if (msg.type === 'turnComplete') {
            // Model finished speaking its current turn
            // AudioStreamer onStateChange will transition to 'listening' when buffers finish playing
          } else if (msg.type === 'toolCall' && msg.functionCalls) {
            await this.handleToolCalls(msg.functionCalls);
          } else if (msg.type === 'error') {
            console.error('[LiveSession] Server error:', msg.message);
            this.callbacks.onError(msg.message || 'Session error encountered');
          } else if (msg.type === 'sessionClosed') {
            this.disconnect();
          }
        } catch (err) {
          console.error('[LiveSession] Failed to process incoming message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[LiveSession] WebSocket error:', err);
        this.callbacks.onError('Connection error with voice server.');
      };

      this.ws.onclose = () => {
        console.log('[LiveSession] WebSocket closed');
        if (this.state !== 'disconnected') {
          this.disconnect();
        }
      };
    } catch (err: any) {
      console.error('[LiveSession] Connection failure:', err);
      this.callbacks.onError(err?.message || 'Failed to initialize session');
      this.disconnect();
    }
  }

  /**
   * Execute tool calls dispatched by Gemini Live and return responses
   */
  private async handleToolCalls(functionCalls: any[]): Promise<void> {
    const responses: any[] = [];

    for (const call of functionCalls) {
      const { id, name, args } = call;
      console.log(`[LiveSession] Executing tool '${name}':`, args);

      let resultObj: any = { status: 'success' };

      if (name === 'openWebsite') {
        const url = args.url || 'https://www.google.com';
        const label = args.label || 'Website';
        const message = args.message || 'Here you go, opening it for you!';

        // Dispatch UI notification
        const actionItem: ToolActionItem = {
          id: id || Math.random().toString(),
          timestamp: Date.now(),
          toolName: 'openWebsite',
          label,
          url,
          message,
        };
        this.callbacks.onToolAction(actionItem);

        // Attempt browser open (works if permissions/popups allow, otherwise card button in UI is clickable)
        try {
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch (e) {
          console.warn('Direct popup open caught, card UI will serve as fallback', e);
        }

        soundEffects.playSparkle();
        resultObj = {
          opened: true,
          url,
          label,
          note: 'Website launched successfully in user browser.',
        };
      } else if (name === 'setMood') {
        const mood = (args.mood || 'sassy_violet') as ZoyaMood;
        const reason = args.reason || 'Shifting vibes';

        this.callbacks.onMoodChange(mood, reason);
        soundEffects.playWink();

        const actionItem: ToolActionItem = {
          id: id || Math.random().toString(),
          timestamp: Date.now(),
          toolName: 'setMood',
          label: `Mood: ${mood.replace('_', ' ').toUpperCase()}`,
          message: reason,
          mood,
        };
        this.callbacks.onToolAction(actionItem);

        resultObj = {
          updatedMood: mood,
          message: `Atmosphere updated to ${mood}.`,
        };
      } else if (name === 'triggerHapticOrTone') {
        const soundType = args.soundType || 'wink';
        soundEffects.playByType(soundType);

        const actionItem: ToolActionItem = {
          id: id || Math.random().toString(),
          timestamp: Date.now(),
          toolName: 'triggerHapticOrTone',
          label: `Sound: ${soundType}`,
          soundType,
        };
        this.callbacks.onToolAction(actionItem);

        resultObj = {
          sound: soundType,
          played: true,
        };
      } else if (name === 'getDeviceContext') {
        const now = new Date();
        const deviceInfo: DeviceInfo = {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          isMobile: window.innerWidth < 768,
          screen: `${window.innerWidth}x${window.innerHeight}`,
          online: navigator.onLine,
        };

        // Try getting battery if supported
        try {
          if ('getBattery' in navigator) {
            const battery: any = await (navigator as any).getBattery();
            deviceInfo.battery = `${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Battery'})`;
          }
        } catch (e) {
          // Battery API not supported or restricted
        }

        resultObj = {
          device: deviceInfo,
          userLocalTime: deviceInfo.time,
          battery: deviceInfo.battery || 'Unknown',
        };
      } else {
        resultObj = {
          status: 'acknowledged',
          message: `Executed tool ${name}`,
        };
      }

      responses.push({
        id,
        name,
        response: resultObj,
      });
    }

    // Send toolResponse back instantly so Gemini Live can continue speech
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[LiveSession] Returning toolResponse to Gemini:', responses);
      this.ws.send(JSON.stringify({
        type: 'toolResponse',
        functionResponses: responses,
      }));
    }
  }

  /**
   * Send a conversational icebreaker/nudge to Zoya
   */
  public sendPromptNudge(text: string): void {
    if (this.state === 'disconnected') {
      this.connect().then(() => {
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'text', text }));
          }
        }, 1200);
      });
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', text }));
    }
  }

  /**
   * Toggles microphone mute
   */
  public toggleMute(): boolean {
    if (!this.recorder) return false;
    this.isMuted = !this.isMuted;
    this.recorder.setMute(this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Get frequency spectrum for visuals:
   * Returns Zoya's output frequencies when speaking, or user's mic frequencies when listening
   */
  public getVisualizerFrequencies(): Uint8Array {
    if (this.state === 'speaking' && this.streamer) {
      return this.streamer.getFrequencies();
    }
    if ((this.state === 'listening' || this.state === 'interrupted') && this.recorder && !this.isMuted) {
      return this.recorder.getFrequencies();
    }
    return new Uint8Array(64);
  }

  /**
   * Clean disconnect
   */
  public disconnect(): void {
    if (this.state === 'disconnected') return;

    soundEffects.playSleep();
    this.setState('disconnected');

    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }

    if (this.streamer) {
      this.streamer.stopAll();
      this.streamer.close();
      this.streamer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
