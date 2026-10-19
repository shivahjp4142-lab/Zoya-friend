/**
 * AudioRecorder: Captures microphone input at 16000 Hz,
 * converts Float32 audio samples into signed 16-bit PCM little-endian,
 * and streams base64 chunks for Gemini Live API input.
 */

export class AudioRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isRecording: boolean = false;
  private isMuted: boolean = false;
  private onAudioChunk?: (base64Chunk: string) => void;
  private frequencyData: Uint8Array | null = null;
  private onVolumeChange?: (volume: number) => void;

  constructor(
    onAudioChunk?: (base64Chunk: string) => void,
    onVolumeChange?: (volume: number) => void
  ) {
    this.onAudioChunk = onAudioChunk;
    this.onVolumeChange = onVolumeChange;
  }

  /**
   * Requests microphone access and begins recording at 16kHz
   */
  public async start(): Promise<void> {
    if (this.isRecording) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      // Live API specifically expects 16kHz PCM
      this.audioCtx = new AudioCtx({ sampleRate: 16000 });

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

      // ScriptProcessor with bufferSize = 2048 (approx 128ms chunks at 16kHz)
      this.processorNode = this.audioCtx.createScriptProcessor(2048, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording || this.isMuted) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        // Calculate volume level for UI
        let sum = 0;
        for (let i = 0; i < inputChannelData.length; i++) {
          sum += Math.abs(inputChannelData[i]);
        }
        const avgVol = Math.min(1, (sum / inputChannelData.length) * 4);
        this.onVolumeChange?.(avgVol);

        // Convert Float32 to 16-bit PCM (little-endian)
        const pcm16Base64 = this.float32ToPcm16Base64(inputChannelData);
        if (pcm16Base64) {
          this.onAudioChunk?.(pcm16Base64);
        }
      };

      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.processorNode);
      this.processorNode.connect(this.audioCtx.destination);

      this.isRecording = true;
    } catch (err: any) {
      console.error('[AudioRecorder] Failed to start microphone:', err);
      throw err;
    }
  }

  /**
   * Converts Float32Array to base64-encoded Int16Array PCM
   */
  private float32ToPcm16Base64(inputData: Float32Array): string {
    const l = inputData.length;
    const buffer = new ArrayBuffer(l * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < l; i++) {
      let sample = Math.max(-1, Math.min(1, inputData[i]));
      // Convert to 16-bit signed integer (-32768 to 32767)
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(i * 2, int16, true); // true = little-endian
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkLength = 8192;
    for (let i = 0; i < bytes.length; i += chunkLength) {
      const slice = bytes.subarray(i, i + chunkLength);
      binary += String.fromCharCode.apply(null, slice as any);
    }
    return btoa(binary);
  }

  /**
   * Retrieves user microphone frequency spectrum
   */
  public getFrequencies(): Uint8Array {
    if (!this.analyser || !this.frequencyData || !this.isRecording || this.isMuted) {
      return new Uint8Array(64);
    }
    this.analyser.getByteFrequencyData(this.frequencyData as any);
    return this.frequencyData;
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public stop(): void {
    this.isRecording = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
