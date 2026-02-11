import type { ErsatzTVClient } from "../api-client.js";
import { handleError } from "../errors.js";

import * as getStatus from "./get-status.js";
import * as getChannels from "./get-channels.js";
import * as getNowPlaying from "./get-now-playing.js";
import * as getChannelSchedule from "./get-channel-schedule.js";
import * as searchEpg from "./search-epg.js";
import * as getGuideData from "./get-guide-data.js";
import * as getFfmpegProfiles from "./get-ffmpeg-profiles.js";
import * as getStreamUrls from "./get-stream-urls.js";

const tools = [
  getStatus,
  getChannels,
  getNowPlaying,
  getChannelSchedule,
  searchEpg,
  getGuideData,
  getFfmpegProfiles,
  getStreamUrls,
];

export const definitions = tools.map(t => t.definition);

type ToolResult = { content: { type: "text"; text: string }[] };

const handlerMap = new Map<string, (args: Record<string, unknown>, client: ErsatzTVClient) => Promise<ToolResult>>(
  tools.map(t => [t.definition.name, t.handler])
);

export async function dispatch(
  name: string,
  args: Record<string, unknown>,
  client: ErsatzTVClient
): Promise<ToolResult> {
  const handler = handlerMap.get(name);
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }
  try {
    return await handler(args, client);
  } catch (error) {
    handleError(error);
  }
}
