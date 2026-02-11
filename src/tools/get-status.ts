import type { ErsatzTVClient } from "../api-client.js";

export const definition = {
  name: "get_status",
  description: "Check ErsatzTV health and version info.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export async function handler(_args: Record<string, unknown>, client: ErsatzTVClient) {
  const version = await client.getVersion();
  const channels = await client.getChannels();

  return {
    content: [{
      type: "text" as const,
      text: [
        `ErsatzTV Status: Online`,
        `App Version: ${version.appVersion}`,
        `API Version: ${version.apiVersion}`,
        `URL: ${client.baseUrl}`,
        `Channels: ${channels.length}`,
      ].join('\n'),
    }],
  };
}
