import type { ErsatzTVClient } from "../api-client.js";

export const definition = {
  name: "get_stream_urls",
  description: "Get stream, playlist, and guide URLs for ErsatzTV. Optionally get URLs for a specific channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      channel_number: {
        type: "string",
        description: "Optional channel number to get its specific stream URL.",
      },
    },
    required: [],
  },
};

export async function handler(args: Record<string, unknown>, client: ErsatzTVClient) {
  const channelNumber = args.channel_number as string | undefined;

  const lines = [
    `ErsatzTV URLs:`,
    `  M3U Playlist: ${client.baseUrl}/iptv/channels.m3u`,
    `  XMLTV Guide:  ${client.baseUrl}/iptv/xmltv.xml`,
    `  Web UI:       ${client.baseUrl}`,
  ];

  if (channelNumber) {
    lines.push('');
    lines.push(`Channel ${channelNumber} Stream:`);
    lines.push(`  MPEG-TS: ${client.baseUrl}/iptv/channel/${channelNumber}.ts`);
  } else {
    const channels = await client.getChannels();
    lines.push('');
    lines.push('Channel Streams:');
    channels
      .sort((a, b) => parseInt(a.number) - parseInt(b.number))
      .forEach(ch => {
        lines.push(`  Ch ${ch.number.padStart(3)} (${ch.name}): ${client.baseUrl}/iptv/channel/${ch.number}.ts`);
      });
  }

  return {
    content: [{ type: "text" as const, text: lines.join('\n') }],
  };
}
