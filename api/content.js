const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'portfolio-content.json');

function readLocalContent() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler conteúdo local:', error);
    return [];
  }
}

function writeLocalContent(items) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

async function readFromSupabase() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;

  if (!SUPABASE_URL) {
    return null;
  }

  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!key) {
    return null;
  }

  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/portfolio_content?select=*`;

  const response = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status}`);
  }

  return response.json();
}

async function upsertToSupabase(item) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;

  if (!SUPABASE_URL) {
    return null;
  }

  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!key) {
    return null;
  }

  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/portfolio_content`;
  const payload = {
    ...item,
    updated_at: new Date().toISOString()
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,id'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase insert failed: ${response.status} - ${text}`);
  }

  return response.json();
}

async function deleteFromSupabase(id) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;

  if (!SUPABASE_URL) {
    return null;
  }

  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!key) {
    return null;
  }

  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/portfolio_content?id=eq.${encodeURIComponent(id)}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase delete failed: ${response.status} - ${text}`);
  }

  return true;
}

async function readRequestBody(req) {
  if (req.body) {
    return req.body;
  }

  return await new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        resolve({ raw });
      }
    });

    req.on('error', reject);
  });
}

function hasValidAdminSecret(req) {
  const configuredSecret = process.env.ADMIN_SECRET || process.env.ADMIN_API_KEY;
  const providedSecret = req.headers?.['x-admin-secret'] || req.headers?.['X-Admin-Secret'];

  if (!configuredSecret) {
    return true;
  }

  return Boolean(providedSecret) && providedSecret === configuredSecret;
}

module.exports = async function handler(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const query = req.query || {};

    if (method === 'GET') {
      const type = query.type || 'project';

      try {
        const remoteContent = await readFromSupabase();
        if (Array.isArray(remoteContent)) {
          const filtered = remoteContent.filter((item) => item.type === type || !type || type === 'all');
          return res.status(200).json(filtered);
        }
      } catch (error) {
        console.warn('Falling back to local content due to Supabase issue:', error.message);
      }

      const localContent = readLocalContent();
      const filtered = localContent.filter((item) => item.type === type || !type || type === 'all');
      return res.status(200).json(filtered);
    }

    if (!hasValidAdminSecret(req)) {
      return res.status(401).json({ ok: false, error: 'Admin secret required.' });
    }

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const body = await readRequestBody(req);
      const item = {
        id: body.id || `content-${Date.now()}`,
        type: body.type || 'project',
        title: body.title || 'Novo item',
        description: body.description || '',
        short_description: body.short_description || body.description || '',
        github_url: body.github_url || '',
        live_url: body.live_url || '',
        image_url: body.image_url || '',
        tags: Array.isArray(body.tags) ? body.tags : [],
        featured: Boolean(body.featured),
        status: body.status || 'draft',
        created_at: body.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        const remoteResult = await upsertToSupabase(item);
        if (remoteResult) {
          return res.status(200).json({ ok: true, item, source: 'supabase' });
        }
      } catch (error) {
        console.warn('Supabase unavailable, using local fallback:', error.message);
      }

      const localItems = readLocalContent();
      const existingIndex = localItems.findIndex((entry) => entry.id === item.id);

      if (existingIndex >= 0) {
        localItems[existingIndex] = item;
      } else {
        localItems.push(item);
      }

      writeLocalContent(localItems);
      return res.status(200).json({ ok: true, item, source: 'local-file' });
    }

    if (method === 'DELETE') {
      const body = await readRequestBody(req);
      const itemId = body.id || query.id;

      if (!itemId) {
        return res.status(400).json({ ok: false, error: 'id is required' });
      }

      try {
        const remoteResult = await deleteFromSupabase(itemId);
        if (remoteResult) {
          return res.status(200).json({ ok: true, deleted: itemId, source: 'supabase' });
        }
      } catch (error) {
        console.warn('Supabase delete unavailable, using local fallback:', error.message);
      }

      const localItems = readLocalContent().filter((entry) => entry.id !== itemId);
      writeLocalContent(localItems);
      return res.status(200).json({ ok: true, deleted: itemId, source: 'local-file' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('content api error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
  }
};
