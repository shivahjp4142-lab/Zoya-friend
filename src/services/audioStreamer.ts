/**
 * AudioStreamer: Handles gapless playback of 24kHz raw PCM16 audio chunks
 * received from Gemini Live API, with interruption handling and frequency analysis.
 */

export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying: boolean = false;
  private onStateChange?: (isPlaying: boolean) => void;
  private frequencyDataArray: Uint8Array | null = null;

  constructor(onStateChange?: (isPlaying: boolean) => void) {
    this.onStateChange = onStateChange;
  }

  /**
   * Initializes or resumes the 24kHz playback AudioContext
   */
  public async init(): Promise<void> {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx({ sampleRate: 24000 });

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;
      this.frequencyDataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  /**
   * Schedules a raw base64 PCM16 24kHz chunk for gapless playback
   */
  public playPcmChunk(base64Data: string): void {
    if (!base64Data) return;

    if (!this.audioCtx) {
      this.init();
    }
    if (!this.audioCtx || !this.gainNode) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    try {
      // Decode base64 to binary
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit signed PCM little-endian to Float32
      const numSamples = Math.floor(len / 2);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const float32 = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true); // true = little-endian
        float32[i] = int16 < 0 ? int16 / 32768.0 : int16 / 32767.0;
      }

      // Create audio buffer at 24000 Hz
      const audioBuffer = this.audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      // Create buffer source
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const currentTime = this.audioCtx.currentTime;
      // Gapless scheduling
      const startTime = Math.max(currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);

      if (!this.isPlaying) {
        this.isPlaying = true;
        this.onStateChange?.(true);
      }

      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
        if (this.activeSources.length === 0 && this.audioCtx && this.audioCtx.currentTime >= this.nextStartTime - 0.05) {
          this.isPlaying = false;
          this.nextStartTime = 0;
          this.onStateChange?.(false);
        }
      };
    } catch (err) {
      console.error('[AudioStreamer] Error decoding or scheduling chunk:', err);
    }
  }

  /**
   * Stop all playback immediately when interrupted by user
   */
  public stopAll(): void {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {
        // Source may have already stopped
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    } else {
      this.nextStartTime = 0;
    }
    if (this.isPlaying) {
      this.isPlaying = false;
      this.onStateChange?.(false);
    }
  }

  /**
   * Retrieves current output frequency levels for audio visualizer
   */
  public getFrequencies(): Uint8Array {
    if (!this.analyser || !this.frequencyDataArray || !this.isPlaying) {
      return new Uint8Array(64);
    }
    this.analyser.getByteFrequencyData(this.frequencyDataArray as any);
    return this.frequencyDataArray;
  }

  /**
   * Returns current average volume level (0 to 1)
   */
  public getVolumeLevel(): number {
    if (!this.isPlaying || !this.analyser || !this.frequencyDataArray) return 0;
    this.analyser.getByteFrequencyData(this.frequencyDataArray as any);
    let sum = 0;
    for (let i = 0; i < this.frequencyDataArray.length; i++) {
      sum += this.frequencyDataArray[i];
    }
    return Math.min(1, sum / (this.frequencyDataArray.length * 128));
  }

  public getPlaybackState(): boolean {
    return this.isPlaying;
  }

  public setVolume(volume: number): void {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(2, volume)), this.audioCtx.currentTime);
    }
  }

  public close(): void {
    this.stopAll();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
