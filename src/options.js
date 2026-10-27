(async function () {
  const core = globalThis.BBS;
  const linksEl = document.getElementById('links');
  const pinnedEl = document.getElementById('pinned');
  const savedEl = document.getElementById('saved');

  let settings = core.normalizeSettings((await chrome.storage.sync.get('settings')).settings);

  for (const link of core.LINKS) {
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = link.key;
    box.checked = settings.links.includes(link.key);
    const label = document.createElement('label');
    label.append(box, ' ', link.label);
    linksEl.append(label);
  }
  pinnedEl.checked = settings.pinned;

  async function save() {
    settings = core.normalizeSettings({
      links: [...linksEl.querySelectorAll('input:checked')].map((b) => b.value),
      pinned: pinnedEl.checked,
    });
    await chrome.storage.sync.set({ settings });
    savedEl.textContent = 'Saved. Open Bitbucket tabs update right away.';
  }

  linksEl.addEventListener('change', save);
  pinnedEl.addEventListener('change', save);
})();
