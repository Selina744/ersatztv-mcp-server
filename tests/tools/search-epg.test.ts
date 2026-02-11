import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { handler } from '../../src/tools/search-epg.js';
import type { ErsatzTVClient } from '../../src/api-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleXml = readFileSync(join(__dirname, '../fixtures/xmltv-sample.xml'), 'utf-8');

function mockClient(): ErsatzTVClient {
  return {
    baseUrl: 'http://192.168.0.161:8409',
    getXmltvRaw: vi.fn().mockResolvedValue(sampleXml),
  } as unknown as ErsatzTVClient;
}

describe('search_epg handler', () => {
  it('finds shows by title', async () => {
    vi.useFakeTimers({ now: new Date('2026-02-11T16:00:00.000Z') });
    try {
      const client = mockClient();
      const result = await handler({ query: 'Bleach' }, client);
      const text = result.content[0].text;

      expect(text).toContain('Bleach');
      expect(text).toContain('2 result');
    } finally {
      vi.useRealTimers();
    }
  });

  it('finds shows by description keyword', async () => {
    vi.useFakeTimers({ now: new Date('2026-02-11T16:00:00.000Z') });
    try {
      const client = mockClient();
      const result = await handler({ query: 'spirits' }, client);
      const text = result.content[0].text;

      expect(text).toContain('Spirited Away');
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns no results message', async () => {
    vi.useFakeTimers({ now: new Date('2026-02-11T16:00:00.000Z') });
    try {
      const client = mockClient();
      const result = await handler({ query: 'xyznotfound' }, client);
      expect(result.content[0].text).toContain('No results');
    } finally {
      vi.useRealTimers();
    }
  });
});
