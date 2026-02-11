import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { handler } from '../../src/tools/get-now-playing.js';
import type { ErsatzTVClient } from '../../src/api-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleXml = readFileSync(join(__dirname, '../fixtures/xmltv-sample.xml'), 'utf-8');

function mockClient(): ErsatzTVClient {
  return {
    baseUrl: 'http://192.168.0.161:8409',
    getXmltvRaw: vi.fn().mockResolvedValue(sampleXml),
  } as unknown as ErsatzTVClient;
}

describe('get_now_playing handler', () => {
  it('returns now playing info', async () => {
    // Mock Date.now to be during the schedule window
    const realDate = globalThis.Date;
    const mockNow = new Date('2026-02-11T16:15:00.000Z'); // 10:15 AM CST
    vi.useFakeTimers({ now: mockNow });

    try {
      const client = mockClient();
      const result = await handler({}, client);
      const text = result.content[0].text;

      expect(text).toContain('Now Playing');
      expect(text).toContain('Bleach');
      expect(text).toContain('Dragon Ball Z');
      expect(text).toContain('The Shining');
    } finally {
      vi.useRealTimers();
    }
  });

  it('filters by channel number', async () => {
    const mockNow = new Date('2026-02-11T16:15:00.000Z');
    vi.useFakeTimers({ now: mockNow });

    try {
      const client = mockClient();
      const result = await handler({ channel_number: '2' }, client);
      const text = result.content[0].text;

      expect(text).toContain('Dragon Ball Z');
      expect(text).not.toContain('Bleach');
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns message when nothing is playing', async () => {
    vi.useFakeTimers({ now: new Date('2026-02-12T12:00:00.000Z') });

    try {
      const client = mockClient();
      const result = await handler({}, client);
      expect(result.content[0].text).toContain('No programmes currently playing');
    } finally {
      vi.useRealTimers();
    }
  });
});
