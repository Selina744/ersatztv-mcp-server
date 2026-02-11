import type { ErsatzTVClient } from "../api-client.js";
import { parseXmltvProgrammes, searchProgrammes } from "../xmltv-parser.js";

export const definition = {
  name: "search_epg",
  description: "Search the EPG for shows/movies by title or description.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Search term to match against title, subtitle, or description.",
      },
      hours: {
        type: "number",
        description: "How many hours ahead to search (default: 24).",
      },
    },
    required: ["query"],
  },
};

function formatTime(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export async function handler(args: Record<string, unknown>, client: ErsatzTVClient) {
  const query = args.query as string;
  const hours = (args.hours as number) || 24;

  const xmltvRaw = await client.getXmltvRaw();
  const programmes = parseXmltvProgrammes(xmltvRaw);
  const now = new Date();
  const results = searchProgrammes(programmes, query, now, hours);

  if (results.length === 0) {
    return {
      content: [{
        type: "text" as const,
        text: `No results for "${query}" in the next ${hours} hours.`,
      }],
    };
  }

  // Sort by start time
  results.sort((a, b) => a.start.getTime() - b.start.getTime());

  const lines = results.map(p => {
    const parts = [`${p.title}${p.subtitle ? ' - ' + p.subtitle : ''}`];
    parts.push(`  Ch ${p.channelNumber} (${p.channelName})`);
    parts.push(`  ${formatTime(p.start)} - ${formatTime(p.stop)}`);
    if (p.episodeNum) parts.push(`  ${p.episodeNum}`);
    if (p.description) parts.push(`  ${p.description}`);
    return parts.join('\n');
  });

  return {
    content: [{
      type: "text" as const,
      text: `Found ${results.length} result(s) for "${query}" (next ${hours}h):\n\n${lines.join('\n\n')}`,
    }],
  };
}
