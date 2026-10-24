// Tiny GitHub REST client for the private editor.
// Everything runs in Kirill's browser with his own token; nothing is stored anywhere else.

export const REPO = { owner: 'JazzFOXTROT', repo: 'portfolio', branch: 'main' };
export const DATA_PATH = 'src/data/works.json';
export const UPLOAD_DIR = 'public/assets/'; // card/page paths in works.json are relative to this

const API = 'https://api.github.com';

export class GitHubError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function client(token) {
  const base = `${API}/repos/${REPO.owner}/${REPO.repo}`;
  const call = async (path, opts = {}) => {
    const res = await fetch(path.startsWith('http') ? path : `${base}${path}`, {
      ...opts,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
    });
    if (!res.ok) {
      let msg = res.statusText;
      try { msg = (await res.json()).message || msg; } catch { /* empty body */ }
      throw new GitHubError(res.status, msg);
    }
    return res.status === 204 ? null : res.json();
  };

  return {
    // Who is this and may they write to the repo?
    async check() {
      const [user, repo] = await Promise.all([call(`${API}/user`).catch(() => null), call('')]);
      return { login: user?.login || REPO.owner, canWrite: !!repo.permissions?.push };
    },

    async headSha() {
      const ref = await call(`/git/ref/heads/${REPO.branch}`);
      return ref.object.sha;
    },

    async readData() {
      const f = await call(`/contents/${DATA_PATH}?ref=${REPO.branch}`);
      const bytes = Uint8Array.from(atob(f.content.replace(/\n/g, '')), c => c.charCodeAt(0));
      return { data: JSON.parse(new TextDecoder().decode(bytes)), sha: f.sha };
    },

    async dataSha() {
      const f = await call(`/contents/${DATA_PATH}?ref=${REPO.branch}`);
      return f.sha;
    },

    /*
     * One commit with everything: new images, removed images, the updated works.json.
     * files: [{ path, base64 } | { path, text } | { path, remove: true }]
     */
    async commit(files, message) {
      const head = await this.headSha();
      const headCommit = await call(`/git/commits/${head}`);
      const tree = [];
      for (const f of files) {
        if (f.remove) {
          tree.push({ path: f.path, mode: '100644', type: 'blob', sha: null });
          continue;
        }
        const blob = await call('/git/blobs', {
          method: 'POST',
          body: f.base64 != null ? { content: f.base64, encoding: 'base64' } : { content: f.text, encoding: 'utf-8' },
        });
        tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
      }
      const newTree = await call('/git/trees', { method: 'POST', body: { base_tree: headCommit.tree.sha, tree } });
      const commit = await call('/git/commits', {
        method: 'POST',
        body: { message, tree: newTree.sha, parents: [head] },
      });
      await call(`/git/refs/heads/${REPO.branch}`, { method: 'PATCH', body: { sha: commit.sha } });
      return commit.sha;
    },

    // Deploy status of the site build for a commit (needs "Actions: read"; optional).
    async deployStatus(sha) {
      const r = await call(`/actions/runs?head_sha=${sha}&per_page=1`);
      const run = r.workflow_runs?.[0];
      if (!run) return { status: 'queued' };
      return { status: run.status, conclusion: run.conclusion, url: run.html_url };
    },
  };
}
