// Injects the "Starred" section at the top of Bitbucket's sidebar.
(function () {
  const core = globalThis.BBS;
  const ROOT_ID = 'bbs-root';
  const COUNTS_TTL_MS = 60 * 1000;

  const ICON_MINE = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="8" cy="5" r="3"/><path d="M2 15c0-3.3 2.7-5 6-5s6 1.7 6 5"/></svg>';
  const ICON_REVIEW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>';
  const ICON_GEAR = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></svg>';

  const svg = (d) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const LINK_ICONS = {
    source: svg('<path d="M5.5 4L1.5 8l4 4M10.5 4l4 4-4 4"/>'),
    commits: svg('<circle cx="8" cy="8" r="2.5"/><path d="M1 8h4.5M10.5 8H15"/>'),
    branches: svg('<circle cx="4.5" cy="3.5" r="1.75"/><circle cx="4.5" cy="12.5" r="1.75"/><circle cx="11.5" cy="5" r="1.75"/><path d="M4.5 5.25v5.5M11.5 6.75c0 3-7 2.25-7 4"/>'),
    pullrequests: svg('<circle cx="4" cy="3.5" r="1.75"/><circle cx="4" cy="12.5" r="1.75"/><circle cx="12" cy="12.5" r="1.75"/><path d="M4 5.25v5.5M12 10.75V6.5a2 2 0 0 0-2-2H7.5M9 3L7.5 4.5 9 6"/>'),
    pipelines: svg('<path d="M13.5 8A5.5 5.5 0 1 1 11.9 4.1M13.5 1.5V4.5H10.5"/>'),
    deployments: svg('<path d="M8 10.5V2M5 5l3-3 3 3M2.5 10v3.5h11V10"/>'),
    downloads: svg('<path d="M8 2v8.5M5 7.5l3 3 3-3M2.5 10v3.5h11V10"/>'),
    settings: ICON_GEAR,
  };

  const ICON_CHEVRON ='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 4l4 4-4 4"/></svg>';

  const state = {
    settings: core.normalizeSettings(),
    bitbucketCollapsed: true, // UI state, remembered per device

    workspace: null,
    repos: null, // null = not loaded yet
    error: null,
    userUuid: null,
    counts: {}, // fullName -> {mine, review}
    countsAt: 0,
    href: null,
  };

  // Bitbucket's sidebar scroll container: the first scrollable element in the nav.
  let scrollerCache = null;
  function findScroller() {
    if (scrollerCache && scrollerCache.isConnected) return scrollerCache;
    scrollerCache = null;
    const nav = document.querySelector('nav[data-testid="global-side-nav-test-id"]');
    if (!nav) return null;
    for (const node of nav.querySelectorAll('div')) {
      const oy = getComputedStyle(node).overflowY;
      if (oy === 'auto' || oy === 'scroll') return (scrollerCache = node);
    }
    return null;
  }

  async function getJson(url) {
    const res = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    for (const c of children || []) node.append(c);
    return node;
  }

  function badge(kind, n) {
    const title = kind === 'mine' ? `${n} open PR${n > 1 ? 's' : ''} you wrote` : `${n} open PR${n > 1 ? 's' : ''} where you're a reviewer`;
    const b = el('span', { class: `bbs-cnt bbs-cnt-${kind}`, title, html: kind === 'mine' ? ICON_MINE : ICON_REVIEW });
    b.append(String(n));
    return b;
  }

  function render() {
    const scroller = findScroller();
    if (!scroller) return;
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = el('section', { id: ROOT_ID, 'aria-label': 'Starred repositories' });
      scroller.prepend(root);
    } else if (root.parentElement !== scroller) {
      scroller.prepend(root);
    }
    root.classList.toggle('bbs-pinned', state.settings.pinned);

    const gear = el('button', { class: 'bbs-gear', type: 'button', title: 'Sidebar settings', 'aria-label': 'Sidebar settings', html: ICON_GEAR });
    gear.addEventListener('click', () => chrome.runtime.sendMessage({ type: 'open-options' }));
    const header = el('div', { class: 'bbs-head' }, [el('span', {}, ['Starred']), gear]);

    const body = el('div', { class: 'bbs-body' });
    const path = location.pathname;
    const links = core.selectedLinks(state.settings);

    if (state.error) {
      body.append(el('div', { class: 'bbs-msg' }, [`Couldn't load starred repos (${state.error}).`]));
    } else if (!state.repos) {
      body.append(el('div', { class: 'bbs-msg' }, ['Loading…']));
    } else if (!state.repos.length) {
      body.append(el('div', { class: 'bbs-msg' }, ['No starred repositories. Star one in Bitbucket to see it here.']));
    }

    for (const repo of state.repos || []) {
      const isCurrent = core.isCurrentRepo(path, repo);
      const key = isCurrent ? core.activeLinkKey(path) : null;
      // Highlight the repo row itself when the current section isn't one of the shown links.
      const active = links.some((l) => l.key === key) ? key : null;
      const avatar = repo.avatar ? el('img', { class: 'bbs-av', src: repo.avatar, alt: '' }) : el('span', { class: 'bbs-av' });
      const head = el('a', { class: 'bbs-repo' + (isCurrent && !active ? ' bbs-on' : ''), href: `/${repo.fullName}` }, [avatar, el('span', { class: 'bbs-name' }, [repo.name])]);
      const group = el('div', { class: 'bbs-group' + (isCurrent ? ' bbs-current' : '') }, [head]);
      for (const link of links) {
        const a = el('a', { class: 'bbs-link' + (active === link.key ? ' bbs-on' : ''), href: core.linkHref(repo.fullName, link) }, [
          el('span', { class: 'bbs-ico', html: LINK_ICONS[link.key] || '' }),
          el('span', { class: 'bbs-name' }, [link.label]),
        ]);
        if (link.key === 'pullrequests') {
          const c = state.counts[repo.fullName];
          if (c && (c.mine || c.review)) {
            const wrap = el('span', { class: 'bbs-cnts' });
            if (c.mine) wrap.append(badge('mine', c.mine));
            if (c.review) wrap.append(badge('review', c.review));
            a.append(wrap);
          }
        }
        group.append(a);
      }
      body.append(group);
    }

    // Bitbucket's own sidebar is hidden with CSS (never removed) so React keeps managing it.
    if (state.bitbucketCollapsed) scroller.setAttribute('data-bbs-collapsed', '');
    else scroller.removeAttribute('data-bbs-collapsed');
    const divider = el('button', {
      class: 'bbs-divider', type: 'button', 'aria-expanded': String(!state.bitbucketCollapsed),
      title: state.bitbucketCollapsed ? "Show Bitbucket's sidebar" : "Hide Bitbucket's sidebar",
      html: ICON_CHEVRON,
    });
    divider.append('Bitbucket');
    divider.addEventListener('click', () => {
      state.bitbucketCollapsed = !state.bitbucketCollapsed;
      chrome.storage.local.set({ bitbucketCollapsed: state.bitbucketCollapsed });
      render();
    });

    root.replaceChildren(header, body, divider);
  }

  async function loadRepos() {
    const ws = core.workspaceFromPath(location.pathname) || (await chrome.storage.local.get('workspace')).workspace;
    if (!ws) return;
    if (ws === state.workspace && state.repos) return;
    state.workspace = ws;
    const cacheKey = `starred:${ws}`;
    const cached = (await chrome.storage.local.get(cacheKey))[cacheKey];
    if (cached) {
      state.repos = cached.repos;
      state.counts = cached.counts || {};
      render();
    }
    try {
      const repos = core.parseStarred(await getJson(core.starredUrl(ws)));
      state.repos = repos;
      state.error = null;
      await chrome.storage.local.set({ workspace: ws, [cacheKey]: { repos, counts: state.counts } });
    } catch (e) {
      if (!cached) state.error = e.message.split(' ')[0];
    }
    render();
  }

  async function loadCounts(force) {
    if (!state.repos || !state.repos.length) return;
    if (!force && Date.now() - state.countsAt < COUNTS_TTL_MS) return;
    state.countsAt = Date.now();
    try {
      if (!state.userUuid) state.userUuid = (await getJson('/!api/2.0/user?fields=uuid')).uuid;
      const counts = {};
      await Promise.all(state.repos.map(async (r) => {
        const [mine, review] = await Promise.all(['mine', 'review'].map((k) =>
          getJson(core.prCountUrl(r.fullName, state.userUuid, k)).then((j) => j.size || 0, () => 0)));
        counts[r.fullName] = { mine, review };
      }));
      state.counts = counts;
      await chrome.storage.local.set({ [`starred:${state.workspace}`]: { repos: state.repos, counts } });
      render();
    } catch (_) {
      // Keep the last known counts; the next navigation retries.
    }
  }

  async function onNavigate() {
    state.href = location.href;
    render();
    await loadRepos();
    loadCounts(false);
  }

  // Bitbucket is a single-page app: watch for URL changes and for the sidebar re-rendering without us.
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (location.href !== state.href) onNavigate();
      else if (!document.getElementById(ROOT_ID) || document.getElementById(ROOT_ID).parentElement !== findScroller()) render();
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings) {
      state.settings = core.normalizeSettings(changes.settings.newValue);
      render();
    }
  });

  Promise.all([chrome.storage.sync.get('settings'), chrome.storage.local.get('bitbucketCollapsed')]).then(([{ settings }, { bitbucketCollapsed }]) => {
    state.settings = core.normalizeSettings(settings);
    state.bitbucketCollapsed = bitbucketCollapsed !== false;
    onNavigate();
  });
})();
