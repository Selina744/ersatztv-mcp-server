import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseM3U } from '../src/m3u-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleM3U = readFileSync(join(__dirname, 'fixtures/channels.m3u'), 'utf-8');

describe('parseM3U', () => {
  it('parses all channels from M3U', () => {
    const channels = parseM3U(sampleM3U);
    expect(channels.length).toBe(6);
  });

  it('extracts channel number', () => {
    const channels = parseM3U(sampleM3U);
    const ch1 = channels.find(c => c.number === '1');
    expect(ch1).toBeDefined();
    expect(ch1!.name).toBe('ErsatzTV');
  });

  it('extracts group-title', () => {
    const channels = parseM3U(sampleM3U);
    const groups = new Map(channels.map(c => [c.number, c.group]));
    expect(groups.get('1')).toBe('ErsatzTV');
    expect(groups.get('2')).toBe('Cartoons');
    expect(groups.get('100')).toBe('FamJam');
    expect(groups.get('109')).toBe('Peeps');
  });

  it('extracts tvg-id', () => {
    const channels = parseM3U(sampleM3U);
    const ch1 = channels.find(c => c.number === '1');
    expect(ch1!.tvgId).toBe('C1.145.ersatztv.org');
  });

  it('extracts logo URL', () => {
    const channels = parseM3U(sampleM3U);
    const ch1 = channels.find(c => c.number === '1');
    expect(ch1!.logo).toContain('logos/gen');
  });

  it('extracts stream URL', () => {
    const channels = parseM3U(sampleM3U);
    const ch1 = channels.find(c => c.number === '1');
    expect(ch1!.streamUrl).toBe('http://192.168.0.161:8409/iptv/channel/1.ts');
  });

  it('handles empty input', () => {
    const channels = parseM3U('');
    expect(channels).toHaveLength(0);
  });

  it('handles header-only M3U', () => {
    const channels = parseM3U('#EXTM3U\n');
    expect(channels).toHaveLength(0);
  });
});
