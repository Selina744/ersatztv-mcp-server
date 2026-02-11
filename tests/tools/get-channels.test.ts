import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { handler } from '../../src/tools/get-channels.js';
import type { ErsatzTVClient } from '../../src/api-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleM3U = readFileSync(join(__dirname, '../fixtures/channels.m3u'), 'utf-8');
const channelsJson = JSON.parse(readFileSync(join(__dirname, '../fixtures/channels.json'), 'utf-8'));

function mockClient(): ErsatzTVClient {
  return {
    baseUrl: 'http://192.168.0.161:8409',
    getChannels: vi.fn().mockResolvedValue(channelsJson),
    getM3uRaw: vi.fn().mockResolvedValue(sampleM3U),
  } as unknown as ErsatzTVClient;
}

describe('get_channels handler', () => {
  it('lists all channels with groups', async () => {
    const client = mockClient();
    const result = await handler({}, client);
    const text = result.content[0].text;

    expect(text).toContain('ErsatzTV');
    expect(text).toContain('Cartoons');
    expect(text).toContain('FamJam');
  });

  it('filters by group', async () => {
    const client = mockClient();
    const result = await handler({ group: 'FamJam' }, client);
    const text = result.content[0].text;

    expect(text).toContain('FamJam');
    expect(text).toContain("Jasmine's Enchanted Theater");
    // Channels not in FamJam shouldn't appear
    expect(text).not.toContain('Duck Noir');
  });

  it('returns message for unknown group', async () => {
    const client = mockClient();
    const result = await handler({ group: 'NonExistent' }, client);
    expect(result.content[0].text).toContain('No channels found');
  });
});
