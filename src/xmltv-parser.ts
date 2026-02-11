import { XMLParser } from "fast-xml-parser";
import type { XmltvProgramme, XmltvChannel } from "./types.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => {
    return ['channel', 'programme', 'display-name', 'category', 'episode-num', 'image'].includes(name);
  },
  textNodeName: "#text",
});

/**
 * Parse XMLTV time string like "20260211100000 -0600" into a Date.
 */
export function parseXmltvTime(timeStr: string): Date {
  // Format: YYYYMMDDHHmmss +/-HHMM
  const match = timeStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})$/);
  if (!match) {
    throw new Error(`Invalid XMLTV time format: ${timeStr}`);
  }

  const [, year, month, day, hour, min, sec, tz] = match;
  // Build ISO string: 2026-02-11T10:00:00-06:00
  const tzFormatted = tz.slice(0, 3) + ':' + tz.slice(3);
  const iso = `${year}-${month}-${day}T${hour}:${min}:${sec}${tzFormatted}`;
  return new Date(iso);
}

/**
 * Parse XMLTV XML string into structured channel and programme data.
 */
export function parseXmltvChannels(xml: string): XmltvChannel[] {
  const parsed = parser.parse(xml);
  const tv = parsed.tv;
  if (!tv || !tv.channel) return [];

  const channels: XmltvChannel[] = [];
  for (const ch of tv.channel) {
    const displayNames: string[] = (ch['display-name'] || []).map((d: any) =>
      String(typeof d === 'object' ? d['#text'] ?? '' : d)
    );

    // Second display-name is usually just the number
    const number = displayNames.length >= 2 ? displayNames[1] : '';
    // Third display-name is usually just the name
    const name = displayNames.length >= 3 ? displayNames[2] : displayNames[0] || '';

    const categories: string[] = (ch.category || []).map((c: any) =>
      typeof c === 'string' ? c : c['#text'] || ''
    );

    channels.push({
      id: ch['@_id'] || '',
      number,
      name,
      categories,
      icon: ch.icon?.['@_src'] || '',
    });
  }

  return channels;
}

/**
 * Parse XMLTV XML string into programme entries.
 */
export function parseXmltvProgrammes(xml: string): XmltvProgramme[] {
  const parsed = parser.parse(xml);
  const tv = parsed.tv;
  if (!tv || !tv.programme) return [];

  // Build channel lookup: id -> { number, name }
  const channelMap = new Map<string, { number: string; name: string }>();
  if (tv.channel) {
    for (const ch of tv.channel) {
      const displayNames: string[] = (ch['display-name'] || []).map((d: any) =>
        String(typeof d === 'object' ? d['#text'] ?? '' : d)
      );
      const number = displayNames.length >= 2 ? displayNames[1] : '';
      const name = displayNames.length >= 3 ? displayNames[2] : displayNames[0] || '';
      channelMap.set(ch['@_id'] || '', { number, name });
    }
  }

  const programmes: XmltvProgramme[] = [];
  for (const prog of tv.programme) {
    const channelId = prog['@_channel'] || '';
    const chInfo = channelMap.get(channelId) || { number: '', name: '' };

    const title = typeof prog.title === 'string' ? prog.title :
      (prog.title?.['#text'] || '');

    const subtitle = typeof prog['sub-title'] === 'string' ? prog['sub-title'] :
      (prog['sub-title']?.['#text'] || '');

    const desc = typeof prog.desc === 'string' ? prog.desc :
      (prog.desc?.['#text'] || '');

    const categories: string[] = (prog.category || []).map((c: any) =>
      typeof c === 'string' ? c : c['#text'] || ''
    );

    // Extract episode number from onscreen format (e.g., "S01E01")
    let episodeNum = '';
    const episodeNums = prog['episode-num'] || [];
    for (const en of episodeNums) {
      const system = en['@_system'] || '';
      const value = typeof en === 'string' ? en : en['#text'] || '';
      if (system === 'onscreen') {
        episodeNum = value;
        break;
      }
    }

    const rating = prog.rating?.value || '';
    const icon = prog.icon?.['@_src'] || '';

    programmes.push({
      channel: channelId,
      channelNumber: chInfo.number,
      channelName: chInfo.name,
      start: parseXmltvTime(prog['@_start']),
      stop: parseXmltvTime(prog['@_stop']),
      title,
      subtitle,
      description: desc,
      categories,
      episodeNum,
      rating,
      icon,
    });
  }

  return programmes;
}

/**
 * Get programmes airing at a specific time (default: now).
 */
export function getNowPlaying(programmes: XmltvProgramme[], at?: Date): XmltvProgramme[] {
  const now = at || new Date();
  return programmes.filter(p => p.start <= now && p.stop > now);
}

/**
 * Get programmes within a time window from a start time.
 */
export function getProgrammesInWindow(
  programmes: XmltvProgramme[],
  startTime: Date,
  hours: number
): XmltvProgramme[] {
  const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
  return programmes.filter(p => p.start < endTime && p.stop > startTime);
}

/**
 * Search programmes by title or description (case-insensitive).
 */
export function searchProgrammes(
  programmes: XmltvProgramme[],
  query: string,
  startTime: Date,
  hours: number
): XmltvProgramme[] {
  const windowProgs = getProgrammesInWindow(programmes, startTime, hours);
  const lowerQuery = query.toLowerCase();
  return windowProgs.filter(
    p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.subtitle.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
  );
}
