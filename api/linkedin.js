const { URLSearchParams } = require('url');

async function getLinkedInAccessToken() {
  const {
    LINKEDIN_CLIENT_ID,
    LINKEDIN_CLIENT_SECRET,
    LINKEDIN_REDIRECT_URI,
    LINKEDIN_ACCESS_TOKEN,
    LINKEDIN_AUTHORIZATION_CODE
  } = process.env;

  if (LINKEDIN_ACCESS_TOKEN) {
    return LINKEDIN_ACCESS_TOKEN;
  }

  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !LINKEDIN_REDIRECT_URI || !LINKEDIN_AUTHORIZATION_CODE) {
    return null;
  }

  const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: LINKEDIN_AUTHORIZATION_CODE,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    client_id: LINKEDIN_CLIENT_ID,
    client_secret: LINKEDIN_CLIENT_SECRET
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`LinkedIn OAuth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token || null;
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
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Only POST is allowed' });
    }

    if (!hasValidAdminSecret(req)) {
      return res.status(401).json({ ok: false, error: 'Admin secret required.' });
    }

    const body = await readRequestBody(req);
    const item = body.item || body;

    if (!item || !item.title) {
      return res.status(400).json({ ok: false, error: 'A valid content item is required.' });
    }

    const accessToken = await getLinkedInAccessToken();

    if (!accessToken) {
      return res.status(400).json({
        ok: false,
        error: 'LinkedIn is not configured. Add LINKEDIN_ACCESS_TOKEN or OAuth variables in Vercel environment settings.'
      });
    }

    const memberUrn = process.env.LINKEDIN_MEMBER_URN;
    if (!memberUrn) {
      return res.status(400).json({
        ok: false,
        error: 'LINKEDIN_MEMBER_URN is required to post an article to your profile.'
      });
    }

    const text = `${item.title}\n\n${item.description || item.short_description || ''}\n\n${item.github_url || item.live_url || ''}`.trim();

    const payload = {
      author: `urn:li:person:${memberUrn.replace(/^urn:li:person:/, '')}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.text();

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: 'LinkedIn publish failed',
        details: data
      });
    }

    return res.status(200).json({
      ok: true,
      published: true,
      linkedinResponse: data,
      item
    });
  } catch (error) {
    console.error('linkedin publish error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Unexpected error' });
  }
};
