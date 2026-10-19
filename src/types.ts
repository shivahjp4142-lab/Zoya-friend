export type AssistantState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'interrupted';

export type ZoyaMood = 'sassy_violet' | 'electric_cyan' | 'crimson_fire' | 'neon_emerald' | 'sunset_amber';

export interface MoodTheme {
  id: ZoyaMood;
  name: string;
  glowColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentBg: string;
  borderGlow: string;
  textGlow: string;
}

export interface ToolActionItem {
  id: string;
  timestamp: number;
  toolName: string;
  label: string;
  url?: string;
  message?: string;
  mood?: ZoyaMood;
  soundType?: string;
}

export interface DeviceInfo {
  time: string;
  date: string;
  timezone: string;
  battery?: string;
  isMobile: boolean;
  screen: string;
  online: boolean;
}
