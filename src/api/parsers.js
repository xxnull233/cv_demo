const M3U8_PATTERN = /\$?(https?:\/\/[^"'\s]+?\.m3u8[^"'\s]*)/g;
const HLS_URL_PATTERN = /^https?:\/\/.+?\.m3u8(?:[?#][^\s]*)?$/i;

export function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseEpisodeGroup(group = "") {
  return String(group)
    .split("#")
    .map((episode, index) => {
      const parts = episode.split("$");
      const title = parts.length > 1 ? parts[0] : `第 ${index + 1} 集`;
      const url = parts.length > 1 ? parts[1] : parts[0];
      return {
        title: title || `第 ${index + 1} 集`,
        url: (url || "").trim()
      };
    })
    .filter((episode) => HLS_URL_PATTERN.test(episode.url));
}

export function parseLinesFromPlayUrl(playUrl = "", playFrom = "") {
  if (!playUrl) return [];

  const names = String(playFrom || "")
    .split("$$$")
    .map((name) => name.trim())
    .filter(Boolean);

  return String(playUrl)
    .split("$$$")
    .map((group, index) => ({
      name: names[index] || `线路 ${index + 1}`,
      episodes: parseEpisodeGroup(group)
    }))
    .filter((line) => line.episodes.length > 0);
}

export function parseEpisodesFromText(text = "") {
  const matches = [];
  let match;
  while ((match = M3U8_PATTERN.exec(text))) {
    matches.push({
      title: `第 ${matches.length + 1} 集`,
      url: match[1].replace(/[),]+$/, "")
    });
  }
  return uniqueBy(matches, (episode) => episode.url);
}

export function linesFromText(text = "", name = "线路 1") {
  const episodes = parseEpisodesFromText(text);
  return episodes.length ? [{ name, episodes }] : [];
}
