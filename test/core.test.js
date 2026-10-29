const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');

test('defaults show pull requests and pipelines, pinned', () => {
  assert.deepEqual(core.normalizeSettings(undefined), { links: ['pullrequests', 'pipelines'], pinned: true });
});

test('unknown link keys are dropped, pinned can be turned off', () => {
  assert.deepEqual(core.normalizeSettings({ links: ['bogus', 'source'], pinned: false }), { links: ['source'], pinned: false });
});

test('selected links follow catalog order, not tick order', () => {
  const keys = core.selectedLinks({ links: ['pipelines', 'source', 'pullrequests'] }).map((l) => l.key);
  assert.deepEqual(keys, ['source', 'pullrequests', 'pipelines']);
});

test('workspace and repo come from the path', () => {
  assert.equal(core.workspaceFromPath('/acme/workspace/overview/'), 'acme');
  assert.equal(core.workspaceFromPath('/account/settings/'), null);
  assert.equal(core.repoFromPath('/acme/Web-App/src/main/'), 'acme/web-app');
  assert.equal(core.repoFromPath('/acme'), null);
});

test('UUID-addressed paths are decoded, not passed through encoded', () => {
  const path = '/%7B00000000-0000-0000-0000-00000000000a%7D/%7B00000000-0000-0000-0000-00000000000b%7D/pull-requests/1/overview';
  assert.equal(core.workspaceFromPath(path), '{00000000-0000-0000-0000-00000000000a}');
  assert.equal(core.repoFromPath(path), '{00000000-0000-0000-0000-00000000000a}/{00000000-0000-0000-0000-00000000000b}');
  assert.match(core.starredUrl(core.workspaceFromPath(path)), /^\/!api\/internal\/workspaces\/%7B0+-0+-0+-0+-0+a%7D\/starred\?/);
});

test('current repo matches by full name or by repo UUID', () => {
  const repo = { fullName: 'acme/web-app', uuid: '{00000000-0000-0000-0000-00000000000B}' };
  assert.equal(core.isCurrentRepo('/acme/Web-App/src/main/', repo), true);
  assert.equal(core.isCurrentRepo('/%7B00000000-0000-0000-0000-00000000000a%7D/%7B00000000-0000-0000-0000-00000000000b%7D/pull-requests/1', repo), true);
  assert.equal(core.isCurrentRepo('/acme/web-app-admin/pipelines', repo), false);
  assert.equal(core.isCurrentRepo('/acme', repo), false);
  assert.equal(core.isCurrentRepo('/acme/web-app', { fullName: 'acme/other' }), false);
});

test('active link is the section after workspace/repo', () => {
  assert.equal(core.activeLinkKey('/acme/web-app/pull-requests/412'), 'pullrequests');
  assert.equal(core.activeLinkKey('/acme/web-app/pipelines/results/1'), 'pipelines');
  assert.equal(core.activeLinkKey('/%7B0%7D/%7B1%7D/pull-requests/4297/overview'), 'pullrequests');
  assert.equal(core.activeLinkKey('/acme/web-app/pipelines-old'), null);
  assert.equal(core.activeLinkKey('/acme/web-app'), null);
});

test('PR count URL filters open PRs by author or reviewer', () => {
  const uuid = '{00000000-0000-0000-0000-000000000000}';
  const mine = decodeURIComponent(core.prCountUrl('acme/web-app', uuid, 'mine'));
  const review = decodeURIComponent(core.prCountUrl('acme/web-app', uuid, 'review'));
  assert.match(mine, /^\/!api\/2\.0\/repositories\/acme\/web-app\/pullrequests\?/);
  assert.match(mine, /state="OPEN" AND author\.uuid="\{0+-0+-0+-0+-0+\}"/);
  assert.match(review, /reviewers\.uuid=/);
});

test('starred response keeps order and skips broken entries', () => {
  const json = { values: [
    { resource: { full_name: 'acme/payments-api', name: 'payments-api', links: { avatar: { href: 'https://example.com/a.png' } } } },
    { resource: null },
    { resource: { full_name: 'acme/web-app', uuid: '{00000000-0000-0000-0000-00000000000b}' } },
  ] };
  assert.deepEqual(core.parseStarred(json), [
    { fullName: 'acme/payments-api', name: 'payments-api', avatar: 'https://example.com/a.png', uuid: null },
    { fullName: 'acme/web-app', name: 'web-app', avatar: null, uuid: '{00000000-0000-0000-0000-00000000000b}' },
  ]);
});
