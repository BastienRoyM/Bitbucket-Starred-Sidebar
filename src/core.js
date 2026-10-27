// Pure helpers shared by the content script, the options page and the tests.
(function (root) {
  // Links that can be shown under each starred repo, in display order.
  const LINKS = [
    { key: 'source', label: 'Source', path: '/src' },
    { key: 'commits', label: 'Commits', path: '/commits' },
    { key: 'branches', label: 'Branches', path: '/branches' },
    { key: 'pullrequests', label: 'Pull requests', path: '/pull-requests' },
    { key: 'pipelines', label: 'Pipelines', path: '/pipelines' },
    { key: 'deployments', label: 'Deployments', path: '/deployments' },
    { key: 'downloads', label: 'Downloads', path: '/downloads' },
    { key: 'settings', label: 'Repository settings', path: '/admin' },
  ];

  const DEFAULT_SETTINGS = { links: ['pullrequests', 'pipelines'], pinned: true };

  // First path segments that are Bitbucket pages, not workspaces.
  const RESERVED = new Set(['account', 'dashboard', 'repo', 'workspace', 'workspaces', 'snippets', 'product', 'site', 'socialauth', 'gateway', '!api']);

  function normalizeSettings(raw) {
    const s = Object.assign({}, DEFAULT_SETTINGS, raw || {});
    const known = new Set(LINKS.map((l) => l.key));
    s.links = Array.isArray(s.links) ? s.links.filter((k) => known.has(k)) : DEFAULT_SETTINGS.links.slice();
    s.pinned = s.pinned !== false;
    return s;
  }

  // Links to render, in catalog order (never in the order they were ticked).
  function selectedLinks(settings) {
    const keys = new Set(normalizeSettings(settings).links);
    return LINKS.filter((l) => keys.has(l.key));
  }

  function workspaceFromPath(pathname) {
    const seg = (pathname || '').split('/').filter(Boolean)[0];
    if (!seg || RESERVED.has(seg.toLowerCase())) return null;
    return seg;
  }

  // "ws/repo" for /ws/repo/..., or null outside a repository.
  function repoFromPath(pathname) {
    const segs = (pathname || '').split('/').filter(Boolean);
    if (segs.length < 2 || !workspaceFromPath(pathname)) return null;
    return `${segs[0]}/${segs[1]}`.toLowerCase();
  }

  function linkHref(fullName, link) {
    return `/${fullName}${link.path}`;
  }

  // The link the current page belongs to, so it can be highlighted.
  function activeLinkKey(pathname, fullName) {
    const prefix = `/${fullName}`.toLowerCase();
    const p = (pathname || '').toLowerCase();
    if (p !== prefix && !p.startsWith(prefix + '/')) return null;
    const rest = p.slice(prefix.length);
    const hit = LINKS.find((l) => rest === l.path || rest.startsWith(l.path + '/'));
    return hit ? hit.key : null;
  }

  // BBQL filter for open PRs the user wrote ("mine") or reviews ("review").
  function prQuery(userUuid, kind) {
    const field = kind === 'mine' ? 'author.uuid' : 'reviewers.uuid';
    return `state="OPEN" AND ${field}="${userUuid}"`;
  }

  function prCountUrl(fullName, userUuid, kind) {
    return `/!api/2.0/repositories/${fullName}/pullrequests?pagelen=1&fields=size&q=${encodeURIComponent(prQuery(userUuid, kind))}`;
  }

  function starredUrl(workspace) {
    return `/!api/internal/workspaces/${encodeURIComponent(workspace)}/starred?object_type=repositories&pagelen=100`;
  }

  // Starred API values -> [{fullName, name, avatar}], keeping Bitbucket's order.
  function parseStarred(json) {
    return ((json && json.values) || [])
      .map((v) => v && v.resource)
      .filter((r) => r && r.full_name)
      .map((r) => ({
        fullName: r.full_name,
        name: r.name || r.full_name.split('/')[1],
        avatar: (r.links && r.links.avatar && r.links.avatar.href) || null,
      }));
  }

  const api = {
    LINKS, DEFAULT_SETTINGS, normalizeSettings, selectedLinks, workspaceFromPath, repoFromPath,
    linkHref, activeLinkKey, prQuery, prCountUrl, starredUrl, parseStarred,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BBS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
