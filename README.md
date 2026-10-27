# Starred Sidebar for Bitbucket

A Chrome extension that adds a stable, always-open list of your **Bitbucket starred repos** at the top of Bitbucket's sidebar, above a "Bitbucket" divider. Bitbucket's own sidebar stays underneath, untouched.

- Every starred repo is always expanded with the same links, so nothing collapses or shifts.
- The "Pull requests" link shows two counters, each only when above zero:
  - person icon: open PRs you wrote
  - eye icon: open PRs where you're a reviewer
- The current repo/section is highlighted.
- Bitbucket's own sidebar starts collapsed under the "Bitbucket" divider; click the divider to expand or collapse it. The choice is remembered.

## Compatibility

Works with **Bitbucket Cloud** (`bitbucket.org`), in any workspace, with Bitbucket's current navigation sidebar. It does **not** work with self-hosted Bitbucket Server or Bitbucket Data Center.

## Install (unpacked)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Open any `https://bitbucket.org/<workspace>/...` page.

After pulling changes, click the reload icon on the extension card and refresh Bitbucket.

## Settings

Click the gear in the sidebar section, or the extension's toolbar icon:

- **Links under every repo**: Source, Commits, Branches, Pull requests, Pipelines, Deployments, Downloads, Repository settings. The default is Pull requests and Pipelines.
- **Pin to the top of the sidebar**: on by default. When off, the section scrolls away with Bitbucket's sidebar.

Settings sync through your Chrome profile and apply to open tabs immediately.

## How it gets its data

It uses your existing Bitbucket session (no token needed), from the page's own origin:

- starred repos: `/!api/internal/workspaces/<ws>/starred` (internal endpoint Bitbucket's own sidebar uses; it may change without notice, in which case the section shows an error)
- PR counters: `/!api/2.0/repositories/<repo>/pullrequests?q=...` (two requests per starred repo, refreshed at most once a minute)

The last known list and counts are cached so the section renders instantly on page load.

## Building and publishing

```
zip -qrX build/starred-sidebar-<version>.zip manifest.json icons src README.md -x '*.DS_Store'
```

Store listing text, privacy answers, the privacy policy, icon sources and the mock screenshot are in `store/`. To re-render the screenshot after editing `store/screenshot.html`:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1280,800 --screenshot="$PWD/store/screenshot-1280x800.png" "file://$PWD/store/screenshot.html"
```

## Tests

```
node --test test/*.test.js
```
