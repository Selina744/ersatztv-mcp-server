import type { ErsatzTVClient } from "../api-client.js";
import { parseXmltvProgrammes, getProgrammesInWindow } from "../xmltv-parser.js";

export const definition = {
  name: "get_channel_schedule",
  description: "Get the upcoming schedule for a specific channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      channel_number: {
        type: "string",
        description: "The channel number (e.g., '1', '102').",
      },
      hours: {
        type: "number",
        description: "How many hours ahead to show (default: 6).",
      },
    },
    required: ["channel_number"],
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

export async function handler(args: Record<string, unknown>, client: ErsatzTVClient) {
  const channelNumber = args.channel_number as string;
  const hours = (args.hours as number) || 6;

  const xmltvRaw = await client.getXmltvRaw();
  const allProgrammes = parseXmltvProgrammes(xmltvRaw);
  const now = new Date();

  const channelProgs = allProgrammes.filter(p => p.channelNumber === channelNumber);
  if (channelProgs.length === 0) {
    return {
      content: [{ type: "text" as const, text: `No schedule data for channel ${channelNumber}.` }],
    };
  }

  const upcoming = getProgrammesInWindow(channelProgs, now, hours);
  if (upcoming.length === 0) {
    return {
      content: [{ type: "text" as const, text: `No upcoming programmes for channel ${channelNumber} in the next ${hours} hours.` }],
    };
  }

  const channelName = upcoming[0].channelName;
  const lines = upcoming.map(p => {
    const marker = p.start <= now && p.stop > now ? ' << NOW' : '';
    const parts = [`  ${formatTime(p.start)} - ${formatTime(p.stop)} (${formatDuration(p.start, p.stop)})${marker}`];
    parts.push(`    ${p.title}${p.subtitle ? ' - ' + p.subtitle : ''}`);
    if (p.episodeNum) parts.push(`    ${p.episodeNum}`);
    if (p.categories.length > 0) parts.push(`    [${p.categories.join(', ')}]`);
    return parts.join('\n');
  });

  return {
    content: [{
      type: "text" as const,
      text: `Schedule for Ch ${channelNumber} (${channelName}) — next ${hours}h:\n\n${lines.join('\n\n')}`,
    }],
  };
}
