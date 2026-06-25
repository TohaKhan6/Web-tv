import type { Channel, PlaylistData } from "@/types";

export function parseM3U(content: string): PlaylistData {
  const lines = content.split("\n");
  const channels: Channel[] = [];
  const categorySet = new Set<string>();
  const seenNames = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF:")) {
      const extinf = line;

      const nameMatch = extinf.match(/,(.+)$/);
      const name = nameMatch ? nameMatch[1].trim() : "Unknown";

      if (seenNames.has(name)) continue;
      seenNames.add(name);

      const tvgIdMatch = extinf.match(/tvg-id="([^"]*)"/);
      const tvgId = tvgIdMatch ? tvgIdMatch[1] : "";

      const logoMatch = extinf.match(/tvg-logo="([^"]*)"/);
      const logo = logoMatch ? logoMatch[1] : "";

      const groupMatch = extinf.match(/group-title="([^"]*)"/);
      const category = groupMatch ? groupMatch[1] : "Uncategorized";

      if (category) {
        categorySet.add(category);
      }

      if (i + 1 < lines.length) {
        const url = lines[i + 1].trim();
        if (url && !url.startsWith("#")) {
          channels.push({
            id: `ch-${channels.length}`,
            name,
            logo,
            url,
            category: category || "Uncategorized",
            tvgId,
          });
        }
      }
    }
  }

  return {
    channels,
    categories: Array.from(categorySet).sort(),
  };
}

export async function fetchPlaylist(url: string): Promise<PlaylistData | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch playlist");
    const text = await response.text();
    return parseM3U(text);
  } catch {
    return null;
  }
}

export function generateId(): string {
  return `ch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
