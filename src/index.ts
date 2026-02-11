#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { baseUrl } from "./config.js";
import { ErsatzTVClient } from "./api-client.js";
import { definitions, dispatch } from "./tools/index.js";

const client = new ErsatzTVClient(baseUrl);

const server = new Server(
  { name: "ersatztv-mcp-server", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: definitions,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(`[Info] Tool call: ${name}`);
  return dispatch(name, (args || {}) as Record<string, unknown>, client);
});

async function main() {
  const transport = new StdioServerTransport();
  server.onerror = (error) => console.error("[MCP Error]", error);
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
  await server.connect(transport);
  console.error("[Setup] ErsatzTV MCP server running on stdio.");
}

main().catch((error) => {
  console.error("[Fatal]", error);
  process.exit(1);
});
