import type { ErsatzTVClient } from "../api-client.js";
import { parseXmltvProgrammes, getProgrammesInWindow } from "../xmltv-parser.js";

export const definition = {
  name: "get_guide_data",
  description: "Get structured JSON programme data for a channel, suitable for further processing.",
  inputSchema: {
    type: "object" as const,
    properties: {
      channel_number: {
        type: "string",
        description: "The channel number (e.g., '1', '102').",
      },
      hours: {
        type: "number",
        description: "How many hours of data to return (default: 12).",
      },
    },
    required: ["channel_number"],
  },
};

export async function handler(args: Record<string, unknown>, client: ErsatzTVClient) {
  const channelNumber = args.channel_number as string;
  const hours = (args.hours as number) || 12;

  const xmltvRaw = await client.getXmltvRaw();
  const allProgrammes = parseXmltvProgrammes(xmltvRaw);
  const now = new Date();

  const channelProgs = allProgrammes.filter(p => p.channelNumber === channelNumber);
  const windowed = getProgrammesInWindow(channelProgs, now, hours);

  const data = windowed.map(p => ({
    title: p.title,
    subtitle: p.subtitle || undefined,
    description: p.description || undefined,
    start: p.start.toISOString(),
    stop: p.stop.toISOString(),
    durationMinutes: Math.round((p.stop.getTime() - p.start.getTime()) / 60000),
    categories: p.categories,
    episodeNum: p.episodeNum || undefined,
    rating: p.rating || undefined,
    isPlaying: p.start <= now && p.stop > now,
  }));

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        channel: channelNumber,
        channelName: windowed[0]?.channelName || 'Unknown',
        from: now.toISOString(),
        hours,
        programmeCount: data.length,
        programmes: data,
      }, null, 2),
    }],
  };
}
