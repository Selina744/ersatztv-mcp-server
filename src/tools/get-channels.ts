import type { ErsatzTVClient } from "../api-client.js";
import { parseM3U } from "../m3u-parser.js";
import type { ChannelInfo } from "../types.js";

export const definition = {
  name: "get_channels",
  description: "List all ErsatzTV channels with group info. Optionally filter by group name.",
  inputSchema: {
    type: "object" as const,
    properties: {
      group: {
        type: "string",
        description: "Filter channels by group name (e.g., 'FamJam', 'ErsatzTV').",
      },
    },
    required: [],
  },
};

export async function handler(args: Record<string, unknown>, client: ErsatzTVClient) {
  const [apiChannels, m3uRaw] = await Promise.all([
    client.getChannels(),
    client.getM3uRaw(),
  ]);

  const m3uChannels = parseM3U(m3uRaw);
  const m3uMap = new Map(m3uChannels.map(c => [c.number, c]));

  let channels: ChannelInfo[] = apiChannels.map(ch => {
    const m3u = m3uMap.get(ch.number);
    return {
      id: ch.id,
      number: ch.number,
      name: ch.name,
      group: m3u?.group || '',
      logo: m3u?.logo || '',
      ffmpegProfile: ch.ffmpegProfile,
      streamingMode: ch.streamingMode,
      streamUrl: m3u?.streamUrl || `${client.baseUrl}/iptv/channel/${ch.number}.ts`,
    };
  });

  const groupFilter = args.group as string | undefined;
  if (groupFilter) {
    const lower = groupFilter.toLowerCase();
    channels = channels.filter(c => c.group.toLowerCase() === lower);
  }

  // Sort by channel number
  channels.sort((a, b) => parseInt(a.number) - parseInt(b.number));

  if (channels.length === 0) {
    return {
      content: [{ type: "text" as const, text: groupFilter ? `No channels found in group "${groupFilter}".` : 'No channels configured.' }],
    };
  }

  const groups = [...new Set(channels.map(c => c.group).filter(Boolean))];
  const header = groupFilter
    ? `Channels in group "${groupFilter}" (${channels.length}):`
    : `All channels (${channels.length}), groups: ${groups.join(', ')}:`;

  const lines = channels.map(c =>
    `  ${c.number.padStart(3)} | ${c.name}${c.group ? ` [${c.group}]` : ''} | ${c.streamingMode}`
  );

  return {
    content: [{ type: "text" as const, text: `${header}\n${lines.join('\n')}` }],
  };
}
