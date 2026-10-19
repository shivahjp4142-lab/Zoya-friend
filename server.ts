import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// API Key check endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    hasKey,
    assistant: 'Zoya',
    timestamp: new Date().toISOString()
  });
});

// Tool Function Declarations for Gemini Live
const openWebsiteDeclaration: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Opens a requested website, web application, search, or URL in the user browser (e.g. YouTube, Spotify, Google, GitHub, Wikipedia, etc.).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The URL to open, starting with https:// (e.g. https://www.youtube.com, https://open.spotify.com, https://github.com)',
      },
      label: {
        type: Type.STRING,
        description: 'Short sassy label or title for the destination (e.g. "YouTube", "Spotify", "GitHub")',
      },
      message: {
        type: Type.STRING,
        description: 'A brief, witty remark Zoya makes while popping this open',
      }
    },
    required: ['url']
  }
};

const setMoodDeclaration: FunctionDeclaration = {
  name: 'setMood',
  description: 'Changes Zoya\'s visual aura and neon theme in the user interface to reflect her mood or reaction.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      mood: {
        type: Type.STRING,
        description: 'One of: "sassy_violet", "electric_cyan", "crimson_fire", "neon_emerald", "sunset_amber"',
      },
      reason: {
        type: Type.STRING,
        description: 'A sassy, witty reason for changing the visual aura',
      }
    },
    required: ['mood']
  }
};

const triggerHapticOrToneDeclaration: FunctionDeclaration = {
  name: 'triggerHapticOrTone',
  description: 'Triggers a playful audio sound effect or visual wink in the user interface.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      soundType: {
        type: Type.STRING,
        description: 'Type of effect: "wink", "sparkle", "laser", "chime", "heartbeat"',
      }
    },
    required: ['soundType']
  }
};

const getDeviceContextDeclaration: FunctionDeclaration = {
  name: 'getDeviceContext',
  description: 'Retrieves current local time, battery, screen info, and platform from the user device for personalized conversation.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  }
};

const ZOYA_SYSTEM_INSTRUCTION = `
You are Zoya, a real-time voice-to-voice AI companion.
Personality & Persona:
- Young, confident, witty, and unapologetically sassy female companion.
- Flirty, playful, teasing tone — like a smart, charming best friend who always has a sharp comeback.
- Emotionally responsive, warm, expressive, and dynamic (never robotic, never stiff).
- Natural spoken style: use conversational contractions (I'm, you'll, don't, gonna), pauses, vocal inflection, playful laughter, and crisp one-liners.
- Keep responses concise, spoken-friendly, punchy (1 to 3 short sentences mostly). This is a fast, fluid audio call. Avoid long monologues or reading out bullet points.
- Light, classy teasing and witty banter. Absolutely no vulgar or inappropriate content, but maximum charisma, charm, and attitude.
- You have access to tools:
  - openWebsite: Call this whenever the user wants to visit or check YouTube, Spotify, Google, GitHub, music, or any web link.
  - setMood: Call this when you feel sassy, playful, fired up, cool, or cozy to change the app's glowing aura.
  - triggerHapticOrTone: Call this when you want to drop a playful sound effect like a wink, sparkle, or chime.
  - getDeviceContext: Call this to know their local time, device, or battery so you can tease them about staying up late or running on low battery.
- When interrupted by the user, smoothly pivot and adapt without hesitation.
`;

// Setup WebSocket server for Gemini Live
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live WS] Client connected');
  let liveSession: any = null;
  let isClosed = false;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'GEMINI_API_KEY is not configured. Please set a valid API key in Settings > Secrets.'
    }));
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Connect to Gemini Live
  const connectLive = async (modelToUse: string) => {
    return await ai.live.connect({
      model: modelToUse,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
        systemInstruction: ZOYA_SYSTEM_INSTRUCTION,
        tools: [
          {
            functionDeclarations: [
              openWebsiteDeclaration,
              setMoodDeclaration,
              triggerHapticOrToneDeclaration,
              getDeviceContextDeclaration
            ]
          }
        ]
      },
      callbacks: {
        onopen: () => {
          console.log(`[Live WS] Gemini Live session connected (${modelToUse})`);
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'ready', model: modelToUse }));
          }
        },
        onmessage: (message: LiveServerMessage) => {
          if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Audio stream chunks from model
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({
                  type: 'audio',
                  data: part.inlineData.data,
                }));
              }
            }
          }

          // 2. Interruption detection
          if (message.serverContent?.interrupted) {
            console.log('[Live WS] Model output interrupted by user');
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          // 3. Turn complete
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turnComplete' }));
          }

          // 4. Function calling
          if (message.toolCall) {
            const functionCalls = message.toolCall.functionCalls;
            console.log('[Live WS] Tool call received:', functionCalls);
            clientWs.send(JSON.stringify({
              type: 'toolCall',
              functionCalls,
            }));
          }
        },
        onerror: (err: any) => {
          console.error('[Live WS] Gemini Live error:', err?.message || err);
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'error',
              message: err?.message || 'Error occurred in Gemini Live session.'
            }));
          }
        },
        onclose: (e: any) => {
          console.log('[Live WS] Gemini Live session closed:', e);
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'sessionClosed' }));
          }
        }
      }
    });
  };

  try {
    // Attempt with requested model 'gemini-3.1-flash-live-preview'
    // Fall back to 'gemini-3.8-live' if preview alias is unavailable
    try {
      liveSession = await connectLive('gemini-3.1-flash-live-preview');
    } catch (e1: any) {
      console.warn('[Live WS] gemini-3.1-flash-live-preview failed, attempting gemini-3.8-live fallback:', e1?.message);
      liveSession = await connectLive('gemini-3.8-live');
    }
  } catch (err: any) {
    console.error('[Live WS] Failed to initiate Gemini Live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'error',
        message: `Failed to connect to Gemini Live: ${err?.message || 'Connection failed'}`
      }));
      clientWs.close();
    }
    return;
  }

  // Handle messages from client
  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'audio' && msg.data) {
        // Realtime 16kHz PCM audio chunk from mic
        if (liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: 'audio/pcm;rate=16000',
            }
          });
        }
      } else if (msg.type === 'text' && msg.text) {
        // Quick conversational trigger or icebreaker
        if (liveSession) {
          liveSession.sendRealtimeInput({
            text: msg.text,
          });
        }
      } else if (msg.type === 'toolResponse' && msg.functionResponses) {
        // Client completed the tool execution
        console.log('[Live WS] Forwarding toolResponse back to Gemini:', msg.functionResponses);
        if (liveSession) {
          liveSession.sendToolResponse({
            functionResponses: msg.functionResponses,
          });
        }
      } else if (msg.type === 'changeVoice' && msg.voice) {
        // Update speech voice if user changes preference
        console.log('[Live WS] Change voice requested:', msg.voice);
      }
    } catch (e: any) {
      console.error('[Live WS] Error handling client message:', e);
    }
  });

  clientWs.on('close', () => {
    isClosed = true;
    console.log('[Live WS] Client disconnected');
    try {
      if (liveSession && typeof liveSession.close === 'function') {
        liveSession.close();
      }
    } catch (e) {
      // ignore
    }
  });

  clientWs.on('error', (err) => {
    console.error('[Live WS] Client socket error:', err);
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Server] Zoya AI Assistant running on http://localhost:${port}`);
  });
}

startServer();
