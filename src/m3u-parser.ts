import type { M3UChannel } from "./types.js";

export function parseM3U(raw: string): M3UChannel[] {
  const channels: M3UChannel[] = [];
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('#EXTINF:')) continue;

    const streamUrl = lines[i + 1] || '';
    if (!streamUrl.startsWith('http')) continue;

    const attr = (name: string): string => {
      const match = line.match(new RegExp(`${name}="([^"]*)"`));
      return match ? match[1] : '';
    };

    channels.push({
      number: attr('channel-number') || attr('tvg-chno'),
      name: attr('tvg-name'),
      tvgId: attr('tvg-id'),
      logo: attr('tvg-logo'),
      group: attr('group-title'),
      streamUrl,
    });
  }

  return channels;
}
