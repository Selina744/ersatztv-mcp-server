# ErsatzTV MCP Server

A Model Context Protocol (MCP) server for [ErsatzTV](https://github.com/ErsatzTV/ErsatzTV) — a homelab service that creates live TV channels from Jellyfin media libraries.

Query channel listings, check what's playing now, search the EPG, and get stream URLs — all from Claude Code or any MCP-compatible client.

## Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_status` | Health check + version info | — |
| `get_channels` | List channels with group info (merges API + M3U) | `group?` |
| `get_now_playing` | What's currently playing with progress bars | `channel_number?` |
| `get_channel_schedule` | Upcoming schedule for a channel | `channel_number`, `hours?` (default 6) |
| `search_epg` | Search shows/movies by title or description | `query`, `hours?` (default 24) |
| `get_guide_data` | Structured JSON programme data | `channel_number`, `hours?` (default 12) |
| `get_ffmpeg_profiles` | View transcoding settings | — |
| `get_stream_urls` | Get stream, playlist, and guide URLs | `channel_number?` |

All tools are read-only. No authentication required.

## Setup

1. Clone and build:
   ```bash
   git clone https://github.com/Selina744/ersatztv-mcp-server.git
   cd ersatztv-mcp-server
   npm install
   npm run build
   ```

2. Add to `~/.mcp.json`:
   ```json
   {
     "mcpServers": {
       "ersatztv": {
         "command": "node",
         "args": ["/path/to/ersatztv-mcp-server/build/index.js"],
         "env": {
           "ERSATZTV_URL": "http://your-ersatztv-host:8409"
         }
       }
     }
   }
   ```

3. Restart Claude Code. The 8 tools will be available.

## Configuration

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `ERSATZTV_URL` | Yes | Base URL of your ErsatzTV instance (e.g., `http://192.168.0.161:8409`) |

## API Surface

This server queries the following ErsatzTV endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/version` | Version info |
| `GET /api/channels` | Channel list (JSON) |
| `GET /api/ffmpeg/profiles` | Transcoding profiles (JSON) |
| `GET /iptv/channels.m3u` | M3U playlist with groups and logos |
| `GET /iptv/xmltv.xml` | XMLTV EPG with full schedule data |

## Development

```bash
npm run build        # Compile TypeScript
npm test             # Run vitest tests (35 tests)
npm run watch        # Watch mode
npm run inspector    # Test with MCP Inspector
```

## Project Structure

```
src/
  index.ts              Entry point (server setup + wiring)
  config.ts             Env var validation
  api-client.ts         Typed axios wrapper
  types.ts              All interfaces
  errors.ts             Centralized error handling
  xmltv-parser.ts       XMLTV parsing + time utilities
  m3u-parser.ts         M3U text parsing
  tools/
    index.ts            Tool registry + dispatch
    get-status.ts       Each tool: definition + handler
    get-channels.ts
    get-now-playing.ts
    get-channel-schedule.ts
    search-epg.ts
    get-guide-data.ts
    get-ffmpeg-profiles.ts
    get-stream-urls.ts
tests/
  xmltv-parser.test.ts  Parser unit tests
  m3u-parser.test.ts    Parser unit tests
  tools/                Tool handler tests (mocked client)
  fixtures/             Captured live data for tests
```

## Dependencies

- `@modelcontextprotocol/sdk` — MCP protocol
- `axios` — HTTP client
- `fast-xml-parser` — XMLTV parsing
- `vitest` — test framework (dev)
