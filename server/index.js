import { createReadStream, existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { fetchTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';
import { buildVideoAnalysis, extractYouTubeVideoId } from '../src/utils/videoIntelligence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const PORT = Number(process.env.PORT || 8787);

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
};

const fetchYouTubeMetadata = async (url) => {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  );

  if (!response.ok) {
    throw new Error('Unable to retrieve YouTube metadata.');
  }

  return response.json();
};

const fetchPreferredTranscript = async (url) => {
  try {
    return await fetchTranscript(url, { lang: 'en' });
  } catch {
    return fetchTranscript(url);
  }
};

const handleAnalyze = async (requestUrl, response) => {
  const sourceUrl = requestUrl.searchParams.get('url');

  if (!sourceUrl) {
    sendJson(response, 400, { error: 'Missing YouTube URL.' });
    return;
  }

  const videoId = extractYouTubeVideoId(sourceUrl);

  if (!videoId) {
    sendJson(response, 400, { error: 'Invalid YouTube URL.' });
    return;
  }

  try {
    const [metadata, transcript] = await Promise.all([
      fetchYouTubeMetadata(sourceUrl),
      fetchPreferredTranscript(sourceUrl),
    ]);

    if (!Array.isArray(transcript) || transcript.length === 0) {
      throw new Error('No transcript available for this video.');
    }

    const analysis = buildVideoAnalysis({
      url: sourceUrl,
      metadata,
      transcript,
    });

    sendJson(response, 200, { analysis });
  } catch (error) {
    sendJson(response, 500, {
      error:
        error instanceof Error
          ? error.message
          : 'YouTube analysis failed. Please try another public video with captions.',
    });
  }
};

const serveStaticAsset = async (pathname, response) => {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(distDir, safePath);
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(distDir) || !existsSync(resolvedPath)) {
    return false;
  }

  const extension = path.extname(resolvedPath);
  response.writeHead(200, {
    'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
  });
  createReadStream(resolvedPath).pipe(response);
  return true;
};

const serveIndex = async (response) => {
  const indexPath = path.join(distDir, 'index.html');
  const html = await fs.readFile(indexPath);

  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
  });
  response.end(html);
};

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === '/api/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/youtube/analyze') {
    await handleAnalyze(requestUrl, response);
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    const served = await serveStaticAsset(requestUrl.pathname, response);

    if (served) {
      return;
    }

    await serveIndex(response);
    return;
  }

  sendJson(response, 404, { error: 'Not found.' });
});

server.listen(PORT, () => {
  console.log(`SOLO TUTOR API ready on http://localhost:${PORT}`);
});
