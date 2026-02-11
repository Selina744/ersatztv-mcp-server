import type { ErsatzTVClient } from "../api-client.js";

export const definition = {
  name: "get_ffmpeg_profiles",
  description: "View ErsatzTV transcoding/FFmpeg profiles.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export async function handler(_args: Record<string, unknown>, client: ErsatzTVClient) {
  const profiles = await client.getFfmpegProfiles();

  if (profiles.length === 0) {
    return {
      content: [{ type: "text" as const, text: 'No FFmpeg profiles configured.' }],
    };
  }

  const lines = profiles.map(p => [
    `Profile: ${p.name} (ID: ${p.id})`,
    `  Resolution: ${p.resolution}`,
    `  Video: ${p.videoFormat} (${p.videoProfile}), ${p.videoBitrate} kbps`,
    `  Audio: ${p.audioFormat}, ${p.audioBitrate} kbps, ${p.audioChannels}ch @ ${p.audioSampleRate} kHz`,
    `  Hardware Acceleration: ${p.hardwareAcceleration}`,
    `  Normalize Framerate: ${p.normalizeFramerate}`,
    `  Deinterlace: ${p.deinterlaceVideo}`,
  ].join('\n'));

  return {
    content: [{ type: "text" as const, text: `FFmpeg Profiles (${profiles.length}):\n\n${lines.join('\n\n')}` }],
  };
}
