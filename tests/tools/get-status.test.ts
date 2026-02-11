import { describe, it, expect, vi } from 'vitest';
import { handler } from '../../src/tools/get-status.js';
import type { ErsatzTVClient } from '../../src/api-client.js';

function mockClient(overrides: Partial<ErsatzTVClient> = {}): ErsatzTVClient {
  return {
    baseUrl: 'http://192.168.0.161:8409',
    getVersion: vi.fn().mockResolvedValue({ apiVersion: 3, appVersion: 'v26.1.1-linux-x64' }),
    getChannels: vi.fn().mockResolvedValue([
      { id: 1, number: '1', name: 'ErsatzTV', ffmpegProfile: '1920x1080 x264 aac', streamingMode: 'MPEG-TS' },
      { id: 2, number: '2', name: 'Cartoons', ffmpegProfile: '1920x1080 x264 aac', streamingMode: 'MPEG-TS' },
    ]),
    ...overrides,
  } as unknown as ErsatzTVClient;
}

describe('get_status handler', () => {
  it('returns status text with version and channel count', async () => {
    const client = mockClient();
    const result = await handler({}, client);

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain('Online');
    expect(text).toContain('v26.1.1-linux-x64');
    expect(text).toContain('API Version: 3');
    expect(text).toContain('Channels: 2');
  });
});
