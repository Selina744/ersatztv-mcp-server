// --- API Response Types ---

export interface VersionResponse {
  apiVersion: number;
  appVersion: string;
}

export interface ChannelResponse {
  id: number;
  number: string;
  name: string;
  ffmpegProfile: string;
  streamingMode: string;
}

export interface FfmpegProfile {
  id: number;
  name: string;
  threadCount: number;
  hardwareAcceleration: string;
  resolution: string;
  videoFormat: string;
  videoProfile: string;
  videoBitrate: number;
  videoBufferSize: number;
  audioFormat: string;
  audioBitrate: number;
  audioChannels: number;
  audioSampleRate: number;
  normalizeFramerate: boolean;
  deinterlaceVideo: boolean;
  [key: string]: unknown;
}

// --- M3U Parsed Types ---

export interface M3UChannel {
  number: string;
  name: string;
  tvgId: string;
  logo: string;
  group: string;
  streamUrl: string;
}

// --- XMLTV Parsed Types ---

export interface XmltvProgramme {
  channel: string;
  channelNumber: string;
  channelName: string;
  start: Date;
  stop: Date;
  title: string;
  subtitle: string;
  description: string;
  categories: string[];
  episodeNum: string;
  rating: string;
  icon: string;
}

export interface XmltvChannel {
  id: string;
  number: string;
  name: string;
  categories: string[];
  icon: string;
}

// --- Merged Channel Info ---

export interface ChannelInfo {
  id: number;
  number: string;
  name: string;
  group: string;
  logo: string;
  ffmpegProfile: string;
  streamingMode: string;
  streamUrl: string;
}
