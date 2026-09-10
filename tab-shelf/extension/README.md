# Tab Shelf

A local-first Chrome extension by [Solomon Alemu](https://www.linkedin.com/in/solomon-a-00b67a1a3/). Review stale tabs, save useful URLs, and close what you no longer need.

[Homepage](https://solomonalemu.com/tab-shelf/) · [Privacy](https://solomonalemu.com/tab-shelf/privacy.html)

## Install the preview release

1. Download and extract the ZIP from the homepage.
2. In Chrome, open Extensions → Manage Extensions.
3. Enable Developer mode, choose Load unpacked, and select the extracted folder containing manifest.json.
4. Pin Tab Shelf from the extensions menu and click its icon.

This is a manual-install preview release, not a Chrome Web Store installation. To update an existing unpacked installation, replace its files in the same folder, click Reload in the extension manager, and refresh the dashboard. Saved tabs stay in the same extension's local storage. Uninstalling the extension deletes that storage; export a backup first.

## Review your tabs

Start with the default 2+ hours filter or choose Suggested. Filters cover 30 minutes, 1/2/4/6/12 hours, and 1/3/7/30/90 days. Last-used times come from Chrome's last activation timestamp, not reading time. Restarts or restored sessions can affect dates; unknown dates sort last and are excluded from age filters.

Suggested prioritizes exact-URL duplicates unused for 2+ hours, then non-sleeping tabs unused for 6+ hours. One duplicate keeper is excluded, preferring protected or most recently used copies. Suggestions are optional rules, not knowledge of whether a page matters. Quick-filter counts follow Hide protected tabs but ignore text search.

- **Save & close** stores selected titles and URLs before closing their tabs. If that initial storage write fails, no tabs close.
- **Just close** requires confirmation and creates no shelf copy. Use it for disposable tabs.
- **Your shelf** searches saved URLs. Open reuses an existing exact-URL tab when possible, otherwise opens a background tab. Saved copies remain.
- **Export / Import backup** transfers the shelf as a JSON file. Imports skip already-saved exact URLs. Keep backups private: URLs can contain personal query parameters.

## Protection and recovery

Active tabs in each window, pinned tabs, audio-producing tabs, loading tabs, private tabs, non-HTTP(S) pages, and tabs Chrome marks non-discardable are protected. Actions recheck URL, last access, and protection immediately before closure. Up to 500 tabs can be handled in one batch. There is no automatic closing.

Saved URLs do not preserve unsaved form text, page contents, navigation history, login state, or exact window/group layouts. Duplicate URLs can have different unsaved state. The extension cannot detect every unsaved form or silent call. Chrome does not provide an atomic check-and-close operation, so a small race remains if a tab changes between the final check and closure.

Chrome's local storage quota applies. Save & close retains a recovery record even if a later closure or status update fails. Export regularly and before uninstalling. This version intentionally offers no archive deletion button.

## Privacy and resource use

Only tabs and storage permissions. No host permissions, content scripts, external libraries, analytics, scheduled polling, or background network requests. Metadata and saved URLs stay in this Chrome profile. Opening a saved URL or a developer link navigates to that website. No Memory Saver settings are modified.

## Development and testing

Node 20+: run `npm test`. Tests simulate Chrome APIs for filtering, protection, storage failure, changed tabs, suggestions, close-only and restore behavior. They are not a live Chrome integration test.

Serve the project locally and open `index.html?demo=1` for a read-only interface preview with synthetic tabs. Real tabs cannot be closed from preview mode.

Before relying on a release, load it in Chrome and test with two disposable tabs: select only those tabs, Save & close, restore from the shelf, and export/re-import the backup. Confirm unrelated tabs remain untouched. Test Just close only on a disposable tab.
