/* global process */
// Público: últimos videos del canal de YouTube de Radio Araucana, separados en
// capítulos (podcast / entrevistas) y shorts (reels verticales).
//
// Fuente: el feed Atom público del canal (sin API key ni cuota). Trae los 15
// videos más recientes con título, fecha, miniatura, descripción y vistas.
//
// Un video es "short" si YouTube publica alguna de sus miniaturas verticales
// (i.ytimg.com/vi/<id>/oar2.jpg a 1080×1920, o oardefault.jpg; para videos
// horizontales ambas responden 404). No todos los shorts tienen las dos: hay
// shorts con oar2 y sin oardefault, así que se prueban en orden y se guarda
// cuál existe para usarla como miniatura. Como apoyo se mira también
// "#shorts" en el título.
//
// Cache: CDN 5 min + stale-while-revalidate 10 min. Un capítulo recién
// publicado aparece en la portada en pocos minutos y el feed se consulta a lo
// más una vez cada 5 min por región del CDN, aunque la portada reciba mucho
// tráfico. La clasificación de shorts se memoriza en el lambda (un video no
// cambia de tipo).

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UC1VJdF1eurA5mZ42diw83Zw";
const CHANNEL_URL = "https://www.youtube.com/@araucanafm";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export const config = { runtime: "nodejs" };

const shortCache = new Map(); // videoId -> { short: boolean, thumb: string|null }
const VERTICAL_THUMBS = ["oar2.jpg", "oardefault.jpg"];

function decode(s = "") {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function pick(block, re) {
  const m = block.match(re);
  return m ? decode(m[1].trim()) : "";
}

function parseFeed(xml) {
  const entries = xml.split("<entry>").slice(1);
  return entries.map((block) => {
    const id = pick(block, /<yt:videoId>([^<]+)<\/yt:videoId>/);
    const title = pick(block, /<title>([^<]*)<\/title>/);
    const published = pick(block, /<published>([^<]+)<\/published>/);
    const description = pick(block, /<media:description>([\s\S]*?)<\/media:description>/);
    const views = Number(pick(block, /<media:statistics[^>]*views="(\d+)"/)) || 0;
    return { id, title, published, description: description.slice(0, 280), views };
  }).filter((v) => v.id && v.title);
}

async function classify(video) {
  if (shortCache.has(video.id)) return shortCache.get(video.id);
  let thumb = null;
  for (const name of VERTICAL_THUMBS) {
    try {
      const r = await fetch(`https://i.ytimg.com/vi/${video.id}/${name}`, { method: "HEAD" });
      if (r.status === 200) { thumb = `https://i.ytimg.com/vi/${video.id}/${name}`; break; }
    } catch {
      // sin red hacia i.ytimg.com: seguimos con el siguiente candidato
    }
  }
  const result = { short: Boolean(thumb) || /#shorts?\b/i.test(video.title), thumb };
  shortCache.set(video.id, result);
  return result;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const r = await fetch(FEED_URL, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; radioaraucana.cl feed reader)" },
    });
    if (!r.ok) throw new Error(`feed ${r.status}`);
    const xml = await r.text();
    const videos = parseFeed(xml);

    const kinds = await Promise.all(videos.map(classify));
    const episodes = [];
    const shorts = [];
    videos.forEach((v, i) => {
      const { short, thumb } = kinds[i];
      // Para un short sin miniatura vertical, hqdefault trae el cuadro
      // vertical centrado sobre 16:9; la tarjeta lo recorta con object-fit.
      const vertical = thumb || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
      const item = {
        ...v,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        thumb: short ? vertical : `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        thumbHd: short ? vertical : `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`,
        thumbFallback: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
      };
      if (short) {
        item.url = `https://www.youtube.com/shorts/${v.id}`;
        shorts.push(item);
      } else {
        episodes.push(item);
      }
    });

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      channel: { id: CHANNEL_ID, url: CHANNEL_URL },
      episodes,
      shorts,
    });
  } catch (err) {
    console.error("[/api/youtube]", err?.message ?? err);
    res.setHeader("Cache-Control", "public, s-maxage=120");
    return res.status(503).json({ error: "youtube_unavailable", episodes: [], shorts: [] });
  }
}
