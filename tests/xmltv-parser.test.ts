import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  parseXmltvTime,
  parseXmltvChannels,
  parseXmltvProgrammes,
  getNowPlaying,
  getProgrammesInWindow,
  searchProgrammes,
} from '../src/xmltv-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleXml = readFileSync(join(__dirname, 'fixtures/xmltv-sample.xml'), 'utf-8');

describe('parseXmltvTime', () => {
  it('parses XMLTV time with negative offset', () => {
    const d = parseXmltvTime('20260211100000 -0600');
    expect(d.toISOString()).toBe('2026-02-11T16:00:00.000Z'); // -0600 means UTC+6h
  });

  it('parses XMLTV time with positive offset', () => {
    const d = parseXmltvTime('20260211100000 +0000');
    expect(d.toISOString()).toBe('2026-02-11T10:00:00.000Z');
  });

  it('throws on invalid format', () => {
    expect(() => parseXmltvTime('invalid')).toThrow('Invalid XMLTV time format');
  });
});

describe('parseXmltvChannels', () => {
  it('parses channels from sample XML', () => {
    const channels = parseXmltvChannels(sampleXml);
    expect(channels).toHaveLength(3);
    expect(channels[0]).toMatchObject({
      id: 'C1.145.ersatztv.org',
      number: '1',
      name: 'ErsatzTV',
    });
    expect(channels[1]).toMatchObject({
      id: 'C2.146.ersatztv.org',
      number: '2',
      name: 'Cartoons',
      categories: ['Anime', 'Cartoons'],
    });
    expect(channels[2]).toMatchObject({
      id: 'C3.147.ersatztv.org',
      number: '3',
      name: 'Horror',
      categories: ['Horror'],
    });
  });
});

describe('parseXmltvProgrammes', () => {
  it('parses programmes from sample XML', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    expect(progs.length).toBe(6);
  });

  it('extracts title, subtitle, description', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const bleach1 = progs.find(p => p.subtitle === 'The Entry');
    expect(bleach1).toBeDefined();
    expect(bleach1!.title).toBe('Bleach');
    expect(bleach1!.description).toBe('Ichigo enters the Soul Society.');
    expect(bleach1!.channelNumber).toBe('1');
    expect(bleach1!.channelName).toBe('ErsatzTV');
  });

  it('extracts categories as array', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const bleach1 = progs.find(p => p.subtitle === 'The Entry');
    expect(bleach1!.categories).toContain('Series');
    expect(bleach1!.categories).toContain('Action & Adventure');
    expect(bleach1!.categories).toContain('Animation');
  });

  it('extracts episode number', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const bleach1 = progs.find(p => p.subtitle === 'The Entry');
    expect(bleach1!.episodeNum).toBe('S01E01');
  });

  it('handles programmes without subtitle (movies)', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const shining = progs.find(p => p.title === 'The Shining');
    expect(shining).toBeDefined();
    expect(shining!.subtitle).toBe('');
    expect(shining!.categories).toContain('Horror');
  });

  it('parses start/stop times correctly', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const bleach1 = progs.find(p => p.subtitle === 'The Entry');
    expect(bleach1!.start.toISOString()).toBe('2026-02-11T16:00:00.000Z');
    expect(bleach1!.stop.toISOString()).toBe('2026-02-11T16:30:00.000Z');
  });
});

describe('getNowPlaying', () => {
  it('returns programmes airing at a given time', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    // 10:15 AM CST = 16:15 UTC — should be within the 10:00-10:30 slots
    const at = new Date('2026-02-11T16:15:00.000Z');
    const playing = getNowPlaying(progs, at);
    expect(playing.length).toBe(3); // Bleach on ch1, DBZ on ch2, Shining on ch3
    const titles = playing.map(p => p.title).sort();
    expect(titles).toEqual(['Bleach', 'Dragon Ball Z', 'The Shining']);
  });

  it('returns empty if no programme is airing', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const at = new Date('2026-02-12T00:00:00.000Z'); // way past all schedules
    const playing = getNowPlaying(progs, at);
    expect(playing).toHaveLength(0);
  });
});

describe('getProgrammesInWindow', () => {
  it('returns programmes within a time window', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const start = new Date('2026-02-11T16:00:00.000Z'); // 10:00 CST
    const result = getProgrammesInWindow(progs, start, 1); // 1 hour
    // Should include everything that overlaps with 10:00-11:00 CST
    expect(result.length).toBeGreaterThanOrEqual(4);
  });
});

describe('searchProgrammes', () => {
  it('finds programmes by title', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const start = new Date('2026-02-11T16:00:00.000Z');
    const results = searchProgrammes(progs, 'Bleach', start, 24);
    expect(results.length).toBe(2);
    expect(results.every(r => r.title === 'Bleach')).toBe(true);
  });

  it('finds programmes by description', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const start = new Date('2026-02-11T16:00:00.000Z');
    const results = searchProgrammes(progs, 'Hokage', start, 24);
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Naruto');
  });

  it('is case-insensitive', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const start = new Date('2026-02-11T16:00:00.000Z');
    const results = searchProgrammes(progs, 'bleach', start, 24);
    expect(results.length).toBe(2);
  });

  it('returns empty for no matches', () => {
    const progs = parseXmltvProgrammes(sampleXml);
    const start = new Date('2026-02-11T16:00:00.000Z');
    const results = searchProgrammes(progs, 'xyznonexistent', start, 24);
    expect(results).toHaveLength(0);
  });
});
