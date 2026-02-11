import type { ErsatzTVClient } from "../api-client.js";
import { parseXmltvProgrammes, getNowPlaying } from "../xmltv-parser.js";

export const definition = {
  name: "get_now_playing",
  description: "Show what's currently playing on all channels, or a specific channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      channel_number: {
        type: "string",
        description: "Optional channel number to filter (e.g., '1', '102').",
      },
    },
    required: [],
  },
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDuration(start: Date, stop: Date): string {
  const mins = Math.round((stop.getTime() - start.getTime()) / 60000);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

function progressBar(start: Date, stop: Date, now: Date): string {
  const total = stop.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  const filled = Math.round(pct / 5);
  return `[${'#'.repeat(filled)}${'-'.repeat(20 - filled)}] ${pct}%`;
}

export async function handler(args: Record<string, unknown>, client: ErsatzTVClient) {
  const xmltvRaw = await client.getXmltvRaw();
  const programmes = parseXmltvProgrammes(xmltvRaw);
  const now = new Date();
  let playing = getNowPlaying(programmes, now);

  const channelNumber = args.channel_number as string | undefined;
  if (channelNumber) {
    playing = playing.filter(p => p.channelNumber === channelNumber);
  }

  if (playing.length === 0) {
    return {
      content: [{
        type: "text" as const,
        text: channelNumber
          ? `Nothing currently playing on channel ${channelNumber}.`
          : 'No programmes currently playing.',
      }],
    };
  }

  // Sort by channel number
  playing.sort((a, b) => parseInt(a.channelNumber) - parseInt(b.channelNumber));

  const lines = playing.map(p => {
    const parts = [
      `Ch ${p.channelNumber} (${p.channelName}): ${p.title}`,
    ];
    if (p.subtitle) parts.push(`  Episode: ${p.subtitle}`);
    if (p.episodeNum) parts.push(`  ${p.episodeNum}`);
    parts.push(`  ${formatTime(p.start)} - ${formatTime(p.stop)} (${formatDuration(p.start, p.stop)})`);
    parts.push(`  ${progressBar(p.start, p.stop, now)}`);
    if (p.description) parts.push(`  ${p.description}`);
    return parts.join('\n');
  });

  return {
    content: [{ type: "text" as const, text: `Now Playing (${now.toLocaleString()}):\n\n${lines.join('\n\n')}` }],
  };
}
