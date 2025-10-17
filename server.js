/**
 * Minimal Node/Express backend for GitHub OAuth code exchange + save-config.
 *
 * Endpoints:
 *  - POST /auth/exchange   { code }  -> exchanges code for access_token and stores it in session
 *  - GET  /auth/status                -> returns { authenticated: true/false, user }
 *  - POST /save-config     { json, path?, commitMessage?, preferPRWhenProtected? }
 *
 * Usage:
 *  - npm install express body-parser cors dotenv express-session axios @octokit/rest
 *  - Create .env with GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET, ORIGIN, REPO_OWNER, REPO_NAME, DEFAULT_BRANCH
 *  - Run: node server.js
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();
const { Octokit } = require('@octokit/rest');

const app = express();

const PORT = process.env.PORT || 4000;
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this';
const ORIGIN = process.env.ORIGIN || '*'; // set to actual origin in production
const OWNER = process.env.REPO_OWNER || 'rsilver875';
const REPO = process.env.REPO_NAME || 'OCM_Simulation_App';
const DEFAULT_BRANCH = process.env.DEFAULT_BRANCH || 'main';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in .env');
}

app.use(cors({
  origin: ORIGIN,
  credentials: true
}));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false // set true in production with HTTPS
  }
}));

function getOctokitForSession(req) {
  if (!req.session || !req.session.token) return null;
  return new Octokit({ auth: req.session.token });
}

// Exchange code for access token and store in session
app.post('/auth/exchange', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ ok: false, error: 'Missing code' });

    const tokenResp = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code
    }, {
      headers: { Accept: 'application/json' }
    });

    if (tokenResp.data.error) {
      return res.status(400).json({ ok: false, error: tokenResp.data.error_description || tokenResp.data.error });
    }
    const access_token = tokenResp.data.access_token;
    req.session.token = access_token;

    // Fetch user info
    const octokit = new Octokit({ auth: access_token });
    const { data: user } = await octokit.users.getAuthenticated();
    req.session.user = { login: user.login };

    return res.json({ ok: true, user: req.session.user });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Check session auth status
app.get('/auth/status', (req, res) => {
  if (req.session && req.session.token) {
    return res.json({ authenticated: true, user: req.session.user || null });
  }
  return res.json({ authenticated: false });
});

// Save config endpoint (uses session token)
app.post('/save-config', async (req, res) => {
  try {
    if (!req.session || !req.session.token) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { json, path = 'config.json', commitMessage = 'Update config via Admin app', preferPRWhenProtected = true } = req.body;
    if (!json || typeof json !== 'object') return res.status(400).json({ ok: false, error: 'Missing or invalid json' });

    const octokit = getOctokitForSession(req);
    if (!octokit) return res.status(401).json({ ok: false, error: 'No token' });

    const contentString = JSON.stringify(json, null, 2);
    const contentBase64 = Buffer.from(contentString, 'utf8').toString('base64');

    // check branch protection
    let protectedMain = false;
    try {
      await octokit.repos.getBranchProtection({ owner: OWNER, repo: REPO, branch: DEFAULT_BRANCH });
      protectedMain = true;
    } catch (e) {
      if (e.status === 404) protectedMain = false;
      else throw e;
    }

    async function createOrUpdateFile({ path, contentBase64, message, branch }) {
      try {
        const { data: file } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path, ref: branch });
        return await octokit.repos.createOrUpdateFileContents({
          owner: OWNER, repo: REPO, path, message,
          content: contentBase64, sha: file.sha, branch
        });
      } catch (err) {
        if (err.status === 404) {
          return await octokit.repos.createOrUpdateFileContents({
            owner: OWNER, repo: REPO, path, message,
            content: contentBase64, branch
          });
        }
        throw err;
      }
    }

    if (!protectedMain || !preferPRWhenProtected) {
      await createOrUpdateFile({ path, contentBase64, message: commitMessage, branch: DEFAULT_BRANCH });
      return res.json({ ok: true, method: 'direct-commit', branch: DEFAULT_BRANCH });
    }

    // create branch & PR
    const timestamp = Date.now();
    const newBranch = `admin-save-${timestamp}`;
    // get main ref sha
    const refData = await octokit.git.getRef({ owner: OWNER, repo: REPO, ref: `heads/${DEFAULT_BRANCH}` });
    const sha = refData.data.object.sha;
    // create new ref
    await octokit.git.createRef({ owner: OWNER, repo: REPO, ref: `refs/heads/${newBranch}`, sha });
    // create/update file on new branch
    await createOrUpdateFile({ path, contentBase64, message: commitMessage, branch: newBranch });
    // open PR
    const { data: pr } = await octokit.pulls.create({
      owner: OWNER, repo: REPO, title: commitMessage, head: newBranch, base: DEFAULT_BRANCH,
      body: `Config updated by Admin app. Branch: ${newBranch}`
    });
    return res.json({ ok: true, method: 'branch-pr', branch: newBranch, prUrl: pr.html_url });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message, status: err.status });
  }
});

app.listen(PORT, () => console.log(`OAuth server listening on ${PORT}`));
