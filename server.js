const http = require('http');
const fs = require('fs');
const path = require('path');

const contentHandler = require('./api/content');
const linkedinHandler = require('./api/linkedin');

const PORT = process.env.PORT || 3000;
const rootDir = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

function parseQueryFromUrl(rawUrl) {
  const url = new URL(rawUrl, 'http://localhost');
  return {
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams.entries())
  };
}

function buildResponseAdapter(res) {
  return {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      const body = JSON.stringify(payload);
      res.writeHead(this.statusCode || 200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret'
      });
      res.end(body);
      return this;
    },
    send(payload) {
      res.writeHead(this.statusCode || 200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret'
      });
      res.end(String(payload));
      return this;
    }
  };
}

async function dispatchApi(req, res, handler) {
  const parsed = parseQueryFromUrl(req.url);
  req.url = parsed.pathname;
  req.query = parsed.query;

  const responseAdapter = buildResponseAdapter(res);
  await handler(req, responseAdapter);
}

async function serveStaticFile(req, res) {
  let safePath = decodeURIComponent(req.url.split('?')[0]);
  if (safePath === '/') {
    safePath = '/index.html';
  }

  const filePath = path.join(rootDir, safePath);
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acesso negado');
    return;
  }

  try {
    const stat = await fs.promises.stat(normalizedPath);
    if (stat.isDirectory()) {
      const dirIndex = path.join(normalizedPath, 'index.html');
      const dirContents = await fs.promises.readFile(dirIndex);
      res.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
      res.end(dirContents);
      return;
    }

    const fileData = await fs.promises.readFile(normalizedPath);
    const ext = path.extname(normalizedPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(fileData);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Arquivo não encontrado');
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret'
    });
    res.end();
    return;
  }

  if (req.url.startsWith('/api/content')) {
    await dispatchApi(req, res, contentHandler);
    return;
  }

  if (req.url.startsWith('/api/linkedin')) {
    await dispatchApi(req, res, linkedinHandler);
    return;
  }

  await serveStaticFile(req, res);
});

server.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
});
