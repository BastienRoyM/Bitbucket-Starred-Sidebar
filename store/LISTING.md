# Chrome Web Store listing

Copy-paste values for the Developer Dashboard. Assets are in this folder.

## Store listing tab

**Name** (from manifest): Starred Sidebar for Bitbucket

**Summary** (from manifest, max 132 chars):
Keeps your starred repos always open at the top of the Bitbucket Cloud sidebar, with PR counters. Not affiliated with Atlassian.

**Category:** Developer Tools

**Language:** English

**Description:**

```
Bitbucket's sidebar collapses on its own, reorders your recent repos and hides the pages you use most under a long menu. Starred Sidebar for Bitbucket puts a calm, predictable list at the top of the sidebar instead.

WHAT YOU GET
• Your Bitbucket starred repositories, always expanded, in the same order on every page.
• Pull requests and Pipelines under every repo, one click away, each with its own icon.
• Two counters next to Pull requests: open PRs you wrote, and open PRs waiting for your review. They only appear when there is something to see.
• The repo and page you're on are highlighted, without anything moving.
• Bitbucket's own sidebar is still there, collapsed under a "Bitbucket" divider. Click it to expand.

SETTINGS
• Choose which links appear under each repo: Source, Commits, Branches, Pull requests, Pipelines, Deployments, Downloads, Repository settings.
• Pin the section to the top of the sidebar, or let it scroll away.

PRIVACY
The extension talks only to bitbucket.org, using the session you're already signed in with. No account, token or tracking. Nothing is sent anywhere else.

To change the list, star or unstar repositories in Bitbucket.

COMPATIBILITY
Works with Bitbucket Cloud (bitbucket.org), in any workspace. It does not work with self-hosted Bitbucket Server or Bitbucket Data Center.

Bitbucket is a trademark of Atlassian. This extension is not affiliated with or endorsed by Atlassian.
```

**Icon:** `icon-128.png` (upload `../icons/icon128.png`)

**Screenshots:** `screenshot-1280x800.png`

**Small promo tile (440x280):** optional, not provided.

## Privacy practices tab

**Single purpose:**
Adds an always-open list of the user's starred Bitbucket repositories, with links and pull request counters, to the top of Bitbucket's sidebar.

**Permission justification: storage**
Saves the user's settings (which links to show, pinned or not) and caches the last loaded list of starred repositories and pull request counts so the sidebar renders instantly.

**Permission justification: host permission (https://bitbucket.org/\*)**
The extension adds its section to Bitbucket pages and reads the user's starred repositories and pull request counts from Bitbucket's API, using the user's existing Bitbucket session.

**Remote code:** No, I am not using remote code.

**Data usage:**
- Tick **Website content**. The extension reads repository names and pull request counts from bitbucket.org to show them on the page. Leave every other data type unticked.
- Certify all three statements: data is not sold to third parties, not used or transferred for purposes unrelated to the single purpose, and not used for creditworthiness or lending.

**Privacy policy URL:** https://github.com/BastienRoyM/Bitbucket-Starred-Sidebar/blob/main/store/PRIVACY.md

**Support URL / homepage:** https://github.com/BastienRoyM/Bitbucket-Starred-Sidebar

## Distribution tab

- **Visibility:** Unlisted (link only) or Private (your Google Workspace domain only), unless you want it public.
- **Regions:** all.
