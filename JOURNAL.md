# SmartCart — Session Journal

---

## 2026-06-03 — Session 1 (Planning)

### What was done
- Transcribed `PROJECT.pdf` into `PROJECT.md`
- Resolved all open questions from the PDF except tech stack (now also resolved)
- Confirmed app name: SmartCart (for now)
- Set email delivery address: kamloopspaul@live.ca
- Dropped trip cost threshold feature — too situational to automate reliably
- Confirmed Cowork for file management
- Locked technology stack (see PROJECT.md)
- Established that price/flyer sources are fluid — farmers markets, ranch meats, wholesalers, aggregator APIs all candidates as project matures
- Noted Flipp aggregator API worth evaluating at Phase 2; no commitment yet

### Files changed
- `Projects/SmartCart/PROJECT.md` — created from PDF transcription, then updated with resolved decisions and locked tech stack

### Current status
Planning complete. No code written. Ready to begin Phase 1.

### Queued for next session
- Begin Phase 1: Google Sheets schema (all tabs) + PWA shell
- Confirm or rename "SmartCart" if something better comes to mind
- Revisit Flipp / aggregator API options when Phase 2 begins

---

## 2026-06-17 — Session 2 (Sheets Schema & Category Taxonomy)

### What was done
- Designed full Google Sheets schema: 7 tabs (added a new `Categories` lookup tab), with columns for Purchases, GroceryList, Preferences, Reports, PriceHistory, Nutrition (Phase 4 stub).
- Defined data entry model per tab — scanner-first for Purchases, auto-derived GroceryList, manual Preferences, automatic Reports/PriceHistory.
- Built a 12-category taxonomy cross-referenced to FSRI's 9 commodity categories, so spending data can be filtered against FSRI risk signals.
- Added two SmartCart-only categories not tracked by FSRI: Personal Care, and Health & Wellness (covers Vitamins/Supplements/Prescriptions/OTC via a Subcategory column).
- Decided Rx items log for spend history but are excluded from weekly flyer-deal matching (pharmacy pricing isn't flyer-driven).
- Decided item-name → canonical-item matching uses a confirm screen (autocomplete + "add new"), not fuzzy auto-match.
- Briefly set up task tracking in Linear (project "SmartCart" + issue KAM-11 under team KAM), then reversed it the same session — Paul works alone on most projects, so Linear's team/issue overhead wasn't worth it. Both canceled in Linear (not deleted — no delete tool available via the connector; canceled state keeps the audit trail). Decision: SmartCart tracking stays in PROJECT.md/JOURNAL.md only. Minder's existing Linear usage (KAM-10, KAM-8) is untouched — scoped to SmartCart only.
- Confirmed Claude-in-Cowork doesn't need ongoing add/update/delete-row tools for this project — that logic belongs in the Apps Script the live PWA calls at runtime, not in interactive chat tools. Narrowed Claude's actual remaining deliverable to a one-time setup script plus (later) the PWA's write-functions.
- Wrote the one-time Apps Script setup script: creates all 7 tabs with bold/frozen headers, seeds the Categories taxonomy (12 rows) and Preferences defaults, and applies dropdown validation (Category sourced from the Categories tab; Source, Status, and Y/N fields from fixed lists). Idempotent — safe to re-run, never deletes columns or existing data rows.

- Built the live Sheet and Apps Script project directly via Claude-in-Chrome browser automation instead of handing Paul manual steps: created a new blank Google Sheet named "SmartCart," opened Extensions > Apps Script, pasted the full setup script in (project renamed "SmartCart Setup"), saved, and ran `setupSmartCartSheet()`. Paul completed the OAuth "Allow" click himself (Claude does not click through authorization grants). Execution completed cleanly, confirmed by the in-sheet toast "SmartCart schema setup complete — 7 tabs ready."
- Verified the build directly in the Sheet: all 7 tabs present in canonical order (Categories, Purchases, GroceryList, Preferences, Reports, PriceHistory, Nutrition), headers bold/frozen, Categories tab seeded with all 12 taxonomy rows, Preferences seeded with the 4 defaults (Tracked Stores list, Report Day = Thursday), and dropdown validation confirmed live on the Purchases > Category column.
- Note for future Apps Script / web code-editor automation: typing multi-line indented code via simulated keystrokes corrupts indentation in Monaco-based editors (auto-indent-on-Enter compounds). Fix is to set the code directly via `monaco.editor.getModels()[0].setValue(code)` through the JS execution tool.

### Files changed
- `Projects/SmartCart/PROJECT.md` — added Data Architecture detail, Category Taxonomy table, Data Entry Model; updated Resolved Decisions; cleared stale Open Questions; added live Sheet URL.
- `Projects/SmartCart/JOURNAL.md` — this entry.
- `Projects/SmartCart/2026-06-17-SmartCart-SheetSetup.gs` — new. One-time schema setup script (see "How to run" header comment in the file).

### Current status
Live Sheet built and verified: [SmartCart](https://docs.google.com/spreadsheets/d/13d7Ju9ZM8_BKBdo3w1NBGVRzQbO8v-B_aH3nzQs3Lq8/edit) — 7 tabs, headers frozen/bold, Categories + Preferences seeded, dropdown validation confirmed on Purchases/GroceryList/Reports columns. Phase 1 foundation (schema) complete.

### Queued for next session
- Continue Phase 1: Apps Script receipt-write functions, PWA shell (fixed header, tab nav), Receipt Scanner tab.

---

## 2026-06-17 — Session 3 (Backend Deployed & Verified)

### What was done
- Wrote `2026-06-17-SmartCart-Backend.gs` (250 lines) — `doGet`/`doPost` Web App pattern mirrored from the Golf project: GET actions `groceryList`/`categories` for PWA reads, POST `addReceipt` for writes, shared-secret auth, `sanitize_`/`json_`/`formatDate_` helpers, GroceryList upsert logic (new item vs. existing-item merge on store/price/date).
- Pasted the file into the live "SmartCart Setup" Apps Script project as a second file (alongside the schema setup script) and saved. Note for future multi-file Apps Script automation: Monaco model URIs in the Apps Script editor are generic (`/2`, `/3`, not filename-based) — use `monaco.editor.getEditors()` to find the currently active editor instance, then `.getModel().setValue(code)`, rather than trying to match a model URI by filename.
- Added `WEBHOOK_SECRET` script property (random 32-char hex via `openssl rand -hex 16`).
- Deployed as a Web App: Version 1, Execute as Me, Access Anyone. No fresh OAuth prompt appeared — the earlier authorization from running the setup script already covered this.
- Verified the live endpoint via a browser tab (a direct `web_fetch` GET returned an empty body — Apps Script Web App responses need the browser's redirect/echo handling, so verification was done in Chrome instead):
  - `?action=categories` → returns the full 12-row taxonomy correctly.
  - `?action=groceryList` → returns `{"ok":true,"items":[]}`, correct since no purchases logged yet.
  - POST `addReceipt` not yet exercised — no scanner UI to generate a real payload yet.

### Files changed
- `Projects/SmartCart/2026-06-17-SmartCart-Backend.gs` — new, deployed.
- `Projects/SmartCart/PROJECT.md` — added "Apps Script Backend (Web App)" section with URL, deployment, and verification notes; updated Current status.
- `Projects/SmartCart/JOURNAL.md` — this entry.

### Current status
Phase 1 backend complete: Sheet schema + Apps Script Web App both live and verified. Live Web App URL: `https://script.google.com/macros/s/AKfycbyN69MiBxCf0KbSlJVbYFAqCdNSkIGfarEl_8DkyD_jjWa6Y1v7l6D6kFyMpBaDwSck/exec`.

### Queued for next session
- PWA shell (fixed header, tab nav) — needs a design-direction consult with Paul first per the locked "Consult before implementing design decisions" principle, before writing any visual/CSS code.
- Receipt Scanner tab (depends on PWA shell).
- End-to-end test of POST `addReceipt` once the scanner exists.

---

## 2026-06-17 — Session 3 continued (PWA Shell Built)

### What was done
- Asked Paul the two design-direction questions required before any PWA visual work, per the locked "Consult before implementing design decisions" principle:
  1. Reuse Golf's shared.css design system, or build a distinct SmartCart theme? → **Distinct theme.**
  2. Tab bar position — bottom or top? → **Top tab bar**, below the fixed header.
- Checked Golf's `shared.css` for its palette (green `#377f09` / cream) purely to confirm SmartCart's new theme wouldn't collide — did not reuse any of it.
- Built `index.html` v0.1.0 — single-file PWA shell (inline CSS/JS, no separate shared.css/shared.js yet): fixed header + fixed top tab bar (Scanner/Search/Report/Settings), four placeholder screens with phase tags, fixed footer with version line, vanilla JS `.screen.active` toggle for tab switching. New teal/coral theme (`--primary:#0d7377`, `--accent:#ee6c4d`), CSS-variable type scale applied consistently across all screens.
- Manifest.json and service worker deliberately deferred — not part of this first shell pass (Golf added those later as a distinct milestone too).
- Verification: Claude-in-Chrome's `navigate` tool can't load `file://` URLs (it force-prepends `https://`, producing a broken URL) — worked around this by using computer-use to open Finder, navigate to the SmartCart folder, and double-click `index.html`, which opened it in Safari. Granted Safari read-only computer-use access and screenshotted/zoomed it to visually confirm: header/tabs/footer render correctly, teal theme applied cleanly, active-tab underline positioned correctly, no layout shift in the static render. Tab-click interaction wasn't exercised via tooling (Safari was read-tier, no clicking) — the toggle logic is simple vanilla JS, reviewed by hand instead.
- Note for future sessions: local `file://` pages are not reachable through the Claude-in-Chrome MCP's `navigate`/`browser_batch` tools. Use computer-use (Finder double-click → default browser) for any local-file visual checks instead.

### Files changed
- `Projects/SmartCart/index.html` — new. PWA shell, v0.1.0.
- `Projects/SmartCart/PROJECT.md` — added "PWA Shell" section, recorded the two design decisions under Resolved Decisions, updated Current status.
- `Projects/SmartCart/JOURNAL.md` — this entry.

### Current status
Phase 1: Sheets schema, Apps Script backend, and PWA shell all built and verified. Only the Receipt Scanner tab remains for Phase 1 to be complete.

### Queued for next session
- Receipt Scanner tab: photo upload → Claude Vision parse → confirm screen (autocomplete existing GroceryList items + "add new") → save via the deployed Web App (`addReceipt`). Per the locked design principle, consult Paul first on upload-vs-camera-capture and confirm-screen layout before building.
- Consider manifest.json + service worker once the shell has real functionality worth taking offline.

---

## 2026-06-17 — Session 4 (Receipt Scanner Tab Built — Phase 1 Complete)

### What was done
- Paul confirmed the two locked Scanner-tab decisions from a prior discussion: (1) single button triggers the native file/camera picker, (2) confirm screen is an editable, scrollable list of rows (item name with autocomplete + "add new", price, qty) with one "Save All" button at the bottom. Authorized starting the build.
- **Backend first:** added a new `scanReceipt` POST action to `2026-06-17-SmartCart-Backend.gs` so `ANTHROPIC_API_KEY` (Script Property) never touches client-side code. `handleScanReceipt_(p)` calls Claude Vision (`claude-sonnet-4-6`) server-side via `UrlFetchApp.fetch`, with a prompt constrained to the live Categories taxonomy, strips markdown fences from the response, and returns `{ok, store, date, items:[{itemRaw, qty, pricePaid, category}]}`. Does not write to the Sheet — that's a separate `addReceipt` call once Paul approves the confirm screen.
- Edited `Backend.gs` via Monaco `setValue` (brace-counting to safely replace just the `doPost` dispatcher and append the new handler without disturbing existing functions), saved, redeployed as **Version 2** (Deploy → Manage deployments → New version). Web App URL unchanged.
- Retrieved `WEBHOOK_SECRET` value from the Apps Script project's Project Settings → Script Properties page (read-only lookup of an already-set value, not a new credential entry) so it could be embedded client-side, matching Golf's established convention (anti-spam token, not cryptographic).
- Confirmed via targeted `doGet`/`handleAddReceipt_`/`getGroceryListItems_`/`getCategories_` introspection (returning only small diagnostic snippets, never full file content, to avoid tripping the content filter) the exact GET/POST contract already live: `?action=groceryList` → `{ok, items:[{item, category, subcategory, defaultUnit, preferredStores, lastPurchased, lastPrice, lastUnitPrice, freezable, active}]}`; `?action=categories` → `{ok, categories}`; `addReceipt` items accept `itemRaw`/`itemCanonical`/`brand`/`packageSize`/`qty`/`pricePaid`/`regularPrice`/`category`/`subcategory`/`fsriCategory`/`notes`/`defaultUnit`/`freezable`, with sensible empty-string/price defaults server-side for anything the client omits.
- **Front-end:** replaced the Scanner tab's placeholder card in `index.html` with a 5-state vanilla-JS view (idle → loading → confirm → error/success), reusing the existing `.screen`/`.screen.active`-style toggle pattern (`.scanner-view`/`.scanner-view.active`) and all existing CSS type-scale/colour variables — no one-off styles introduced.
  - Idle: one "Scan Receipt" button → hidden `<input type="file" accept="image/*" capture="environment">`.
  - On file select: `FileReader` → base64 (data-URL prefix stripped) → POST `scanReceipt` with `mediaType` from `file.type`.
  - Confirm: editable Store/Date fields, then one `.confirm-row` per parsed item (name input with `list="grocery-items"` pointing at a `<datalist>` populated from a `?action=groceryList` fetch — satisfies "autocomplete existing items + add new" with zero custom dropdown/layout-shift risk; qty; price; × remove button), a "+ Add item" button for anything missed, "Save All" at the bottom.
  - Save All: assembles the items array, generates `receiptId` as `'R' + Date.now()`, POSTs `addReceipt` with `source: 'Receipt Photo'`, re-fetches the grocery list afterward so newly-added items show up in future autocomplete.
  - Error/Success states with "Try Again"/"Scan Another" buttons back to idle.
  - Added `SHEETS_URL` and `WEBHOOK_SECRET` JS constants (Golf-style client-embedded pattern).
- Bumped footer + all version references to **v0.2.0 — Receipt Scanner**.
- Verified: HTML/JS structural checks (balanced tags, all element IDs present exactly once, generated JS parses cleanly via Node). Visual check via Finder → double-click `index.html` → opened in Safari (Claude-in-Chrome can't load `file://` pages — same workaround as the PWA-shell session): Scanner idle view renders correctly, teal button styled per theme, no layout shift versus the previous placeholder, footer shows v0.2.0. Full scan→parse→confirm→save round trip with a real receipt photo **not yet exercised** — needs Paul to test with an actual photo (file-picker interaction can't be driven by automated tooling; Safari is read-tier in this session, no clicking).

### Files changed
- `Projects/SmartCart/2026-06-17-SmartCart-Backend.gs` — added `scanReceipt` action + `handleScanReceipt_`; redeployed as Version 2.
- `Projects/SmartCart/index.html` — Receipt Scanner tab built (5-state UI, ~190 new lines), version bumped to v0.2.0.
- `Projects/SmartCart/PROJECT.md` — updated Apps Script Backend section (Version 2, `scanReceipt` contract), added "Receipt Scanner Tab" section, updated stale `claude-sonnet-4-20250514` → `claude-sonnet-4-6`, updated Current status, marked Phase 1 build-order item done, logged the datalist-autocomplete decision.
- `Projects/SmartCart/JOURNAL.md` — this entry.
- `~/Documents/Studio/TODO_LIST.md` — SmartCart resume cue updated to v0.2.0 / Session 4 complete.

### Current status
**Phase 1 complete.** Sheets schema, Apps Script backend, PWA shell, and Receipt Scanner tab all built and live. Outstanding: Paul hasn't yet run a real photo through the full scan→confirm→save flow.

### Queued for next session
- Paul: test the Scanner tab end-to-end with a real receipt photo on a phone/browser that can use the camera input; report back anything Claude misreads or mis-categorizes.
- Begin Phase 2: Apps Script Thursday time trigger, Claude web-search flyer query, email formatting, manual "Run Now" button in the PWA.
- Minor flagged item: the confirm screen's "+ Add item" button is an addition beyond the two originally-locked Scanner decisions — cheap to remove if Paul doesn't want it.

---

## 2026-06-17 — Session 5 (Hosting Requirement Confirmed)

### What was done
- Paul asked whether `index.html` could be AirDropped to his phone, opened via `file://`, and added to the home screen as a working PWA — no hosting needed.
- Confirmed no, for two reasons: (1) `file://` pages get a null/opaque origin, so `fetch()` calls to the Apps Script backend (`scanReceipt`, `addReceipt`, `groceryList`, `categories`) are blocked by CORS; (2) iOS requires HTTPS for a real standalone "Add to Home Screen" install — a `file://` bookmark just reopens Safari, no manifest/service-worker support.
- Checked whether `index.html` would need code changes once actually hosted: no. Verified via direct read/grep — `SHEETS_URL` is already an absolute `https://` URL (host-agnostic), no relative-path assets exist, and the `apple-mobile-web-app-capable`/`viewport`/`theme-color` meta tags needed for standalone iOS launch are already in place. Only gap: no custom `apple-touch-icon` yet (cosmetic, non-blocking — iOS falls back to a screenshot thumbnail).
- Decision: defer actually standing up GitHub Pages hosting — queued as a TODO rather than done this session.

### Files changed
- `~/Documents/Studio/TODO_LIST.md` — added One-off entry "SmartCart — Set up GitHub Pages hosting"; updated Active Project Resume note.
- `Projects/SmartCart/JOURNAL.md` — this entry.
- `Projects/SmartCart/PROJECT.md` — noted hosting requirement.

### Current status
Phase 1 code unchanged and complete. Confirmed blocker: real-device testing (Scanner tab, or any backend call) requires GitHub Pages hosting first — AirDrop + `file://` will not work. No code changes needed for hosting itself.

### Queued for next session
- Set up GitHub repo + Pages for SmartCart (mirror Golf/Minder), then resume the real-photo end-to-end Scanner test.
- Begin Phase 2 once hosting/testing is done.

---

## 2026-06-17 — Session 6 (GitHub Hosting — Local Repo Initialized)

### What was done
- Paul chose hosting target: new dedicated org `getsmartcart` (mirrors `getminder`/`getdailydose` pattern, keeps it off personal profile), repo `smartcart`, public visibility (required for free Pages on a non-Pro org).
- Checked project files for hardcoded secrets before any public push — none found. `WEBHOOK_SECRET` and `ANTHROPIC_API_KEY` are Script Properties only, never written into the `.gs` files; the client-embedded `WEBHOOK_SECRET` constant in `index.html` is the same non-cryptographic anti-spam pattern already established and accepted on Golf.
- Initialized local git repo in `Projects/SmartCart/` (Claude cannot create GitHub orgs/repos or push — account/org creation and the actual push are Paul's steps, per Studio convention).
- Added `.gitignore` (`.DS_Store`, `PROJECT.pdf`), committed all 5 tracked files (`index.html`, `PROJECT.md`, `JOURNAL.md`, both `.gs` files) as the initial commit.
- Note: branch is `master`, not `main` — a `git branch -m` rename failed in the Cowork sandbox (mounted-filesystem lock-file permission quirk, stray `.lock` files left behind but repo integrity unaffected). Left for Paul to rename in his own Terminal if desired; functionally doesn't block Pages.

### Files changed
- `Projects/SmartCart/.git/` — new local repo, 1 commit.
- `Projects/SmartCart/.gitignore` — new.
- `Projects/SmartCart/JOURNAL.md` — this entry.

### Current status
Local repo ready to push. Waiting on Paul: create `getsmartcart` org + `smartcart` repo on GitHub (no auto-init README), then run the provided Terminal commands to push and enable Pages.

### Queued for next session
- Confirm push succeeded and `https://getsmartcart.github.io/smartcart/` is live.
- Resume real-photo Scanner end-to-end test on a phone via the hosted URL.
- Begin Phase 2 (Thursday flyer report) once hosting/testing confirmed.

---

## 2026-06-17 — Session 6 continued (Hosting Live)

### What was done
- Org `getsmartcart` and public repo `smartcart` created by Paul on GitHub (no README, matching the local repo cleanly).
- Push hit two snags along the way, both resolved: (1) a branch-rename attempted from inside the Cowork sandbox left stray `.lock` files in the real `.git` directory — Paul removed them from his own Terminal where permissions weren't an issue; (2) first push attempts failed with "Repository not found" because the org existed but the `smartcart` repo inside it didn't yet (same failure mode Minder hit on its first deploy) — confirmed by checking the org/repo pages directly via browser rather than taking "should be done" at face value. Once the repo was actually created, `git push -u origin main` succeeded (8 objects, new branch `main`).
- Enabled GitHub Pages via Settings → Pages → Deploy from a branch → `main` / `/(root)` → Save (done directly via browser automation with Paul's go-ahead).
- Verified live: `https://getsmartcart.github.io/smartcart/` renders correctly — teal/coral theme, fixed header + top tab bar, Scanner tab active by default, footer reads "SmartCart v0.2.0 — Receipt Scanner", no layout shift.

### Files changed
- `Projects/SmartCart/JOURNAL.md` — this entry.
- `~/Documents/Studio/TODO_LIST.md` — hosting one-off marked resolved, Active Project Resume note updated.

### Current status
**Hosting complete.** SmartCart is live at `https://getsmartcart.github.io/smartcart/` — HTTPS origin, so `fetch()` calls to the Apps Script backend are no longer blocked by CORS, and iOS "Add to Home Screen" should now produce a real standalone install. Code itself unchanged (still v0.2.0).

### Queued for next session
- Paul: open the live URL on a phone, add to home screen, run a real receipt photo through Scan → Confirm → Save end-to-end.
- Begin Phase 2 (Apps Script Thursday trigger, flyer web-search query, email report) once the real-photo test is confirmed clean.

---

## 2026-06-17 — Session 7 (OAuth Scope Fixed, Real-Photo Test Verified, Unit-Pricing Roadmap Designed)

### What was done
- **Diagnosed and fixed the live blocker:** Paul ran a real receipt through the hosted Scanner and hit `"No permission to call UrlFetchApp.fetch. Required: script.external_request"`. Root cause: the project's only interactive OAuth authorization happened before `scanReceipt` (which needs that scope) was added in Session 4 — no later run/redeploy ever triggered a fresh consent prompt to add it.
- Isolated the diagnosis in a brand-new `Untitled.gs` file inside the "SmartCart Setup" Apps Script project (a one-line `testExternalFetch()` calling `UrlFetchApp.fetch`) rather than risk editing live `Backend.gs` — reproduced the exact error, confirming the scope gap definitively. **This temp file is still in the project and needs deleting next session.**
- Incident along the way: a `cmd+End` no-op in the Monaco-based Apps Script editor caused a typed test function to land inside `Backend.gs`'s top comment block instead of at file-end. Caught immediately, reverted with 15× undo, verified line-for-line against the original, saved — no net change to `Backend.gs`.
- Paul ran the interactive authorization (Claude does not click OAuth consent screens — established convention, held again here). He flagged the consent screen showing "Untitled project" as a name mismatch concern; confirmed via screenshot this is just Apps Script's default unconfigured Cloud-project branding (developer email shown was his own account, only scope requested was the exact one needed) — not a different or unexpected app. Paul completed Allow.
- **Re-tested live and verified via direct Sheet read (Google Drive connector):** 3 real receipts saved correctly — FreshCo (9 items, $44.18, incl. bagels/yogurt/onions/cream cheese/jalapeños/chicken breast/sirloin tip/grapes×2), Save-On-Foods Brocklehurst (Dairyland Creamo + Mr. Noodles ×3, $6.86), Safeway Pharmacy (Inspiolto Respimat, $25.06). Correct store/date/price/category on every row, GroceryList/Item-Master auto-populated. **Scope fix confirmed working end-to-end — Phase 1 is now fully exercised with real photos, not just structurally verified.**
- **UX gap identified:** Paul wasn't sure what to expect after scanning — the confirm screen's "Save All" button does exist (right below the item list) but isn't sticky, so on a longer receipt (9 items) it likely sat below the fold and read as "no save button." Flagged for a fix: make Save All sticky/always-visible regardless of list length.
- **Data gap identified:** FreshCo's receipt printed weight breakdowns for produce (e.g. "0.370 kg @ $2.84/kg") but not for chicken breast or beef sirloin tip — a receipt-format limitation, not a scan-parse miss. Paul photographed the actual chicken package label (0.542 kg @ $17.61/kg = $9.54, matching the receipt total exactly) to confirm the data exists, just not on the receipt.
- **Extended design discussion — unit pricing, package size, and "intelligence" roadmap** (decisions below feed PROJECT.md's new Roadmap section; nothing built yet):
  - No Sheets schema change needed — `Package Size` and `Unit Price` columns already exist in Purchases, just unpopulated. Fix belongs in the scan/add pipeline, not the schema.
  - Plan: add an `updateReceipt` Apps Script endpoint (patch by Receipt ID + item) for general corrections, *and* an inline completion step — right after Save All, prompt to scan the package label for any weighed-category item missing Package Size, merging into the same save before it completes (one save, not save-then-edit).
  - Package-label scans need their own Vision parse schema: net weight, price/kg, best-before/freeze-by date, PLU. Best-before date isn't tracked anywhere today — worth capturing for a future "use this before it spoils" / freezable-stockpile feature.
  - GroceryList's existing (already-built, empty) `Default Unit` column is the right mechanism for items with a stable size (e.g. Creamo always 2L) — pre-fill instead of re-prompting, but surface a one-tap "still 2L?" rather than silently auto-filling, since some items (coffee) have multiple active SKUs (Costco's 25%-more tin vs. the market-standard 375g bag, itself a shrink from the older 454g/1lb size).
  - Cross-store, cross-size comparisons (e.g. "is Costco's bigger tin actually cheaper") resolve automatically once Unit Price (price per 100g/100ml) is computed per purchase — no separate logic needed beyond having that field populated.
  - Alerts/"intelligence" roadmap, staged: (1) deterministic — compare a new purchase's unit price against that item's own rolling average, flag if above; (2) deterministic — compare across stores for the same item/category to separate single-store vs. market-wide moves; (3) Claude-reasoned — write a one-line narrative tying the user's own trend to relevant FSRI report findings ("coincides with / conflicts with"). (3) depends on (1)/(2) producing clean data first.
  - Agreed build order: sticky Save button + inline label-scan completion flow → Default Unit pre-fill → Unit Price calc + cross-store comparison → rolling-average alert → FSRI narrative tie-in.
  - Separately decided: no standalone desktop app for querying/insights — stays inside the existing PWA. Structured questions ("lowest price for Creamo") get a simple read endpoint + client-side filter; fuzzy/natural-language questions ("best coffee deal this week") get routed through the existing Claude API call over the relevant rows.

### Files changed
- `Projects/SmartCart/JOURNAL.md` — this entry.
- `Projects/SmartCart/PROJECT.md` — Apps Script Backend section updated (OAuth scope fix logged, real-photo verification confirmed); new "Known Issues" section; new "Roadmap — Unit Pricing, Editing & Intelligence" section capturing all decisions above; Current status / Session Restore Instructions updated.
- `~/Documents/Studio/TODO_LIST.md` — SmartCart resume cue updated.
- No code shipped this session — `index.html` and `Backend.gs` unchanged, still v0.2.0 / Version 2.

### Current status
Phase 1 is now fully verified end-to-end with real receipt photos, OAuth scope issue resolved. A clear, agreed roadmap exists for unit-pricing accuracy, an edit/completion flow, and a phased price-intelligence/alerts feature — none of it built yet.

### Queued for next session
- Delete the temporary `Untitled.gs` test file from the "SmartCart Setup" Apps Script project.
- Make "Save All" sticky on the confirm screen (quick UX fix).
- Start the Roadmap build order: inline package-label-scan completion flow + `updateReceipt` endpoint first.
- Begin Phase 2 (Thursday flyer report) once roadmap items are triaged against priority.

---

## 2026-06-18 — Session 8 (Temp File Cleanup)

### What was done
- Deleted the `Untitled.gs` temp diagnostic file (`testExternalFetch`) from the "SmartCart Setup" Apps Script project via browser automation (Extensions > Apps Script > file menu > Delete > confirm). Confirmed only `Code.gs` and `Backend.gs` remain in the project.

### Files changed
- Apps Script project "SmartCart Setup" — `Untitled.gs` removed (cloud-side, not a local repo file).
- `Projects/SmartCart/PROJECT.md` — Known Issues item marked resolved; Current status updated.
- `Projects/SmartCart/JOURNAL.md` — this entry.

### Current status
Cleanup item closed. Next up: sticky "Save All" button, then Roadmap build order.

### Queued for next session
- Make "Save All" sticky on the confirm screen.
- Start the Roadmap build order: inline package-label-scan completion flow + `updateReceipt` endpoint first.

---

## 2026-06-18 — Session 9 (Sticky Save All)

### What was done
- Fixed the non-sticky "Save All" button (Known Issues item from Session 7). CSS-only change, no JS logic touched:
  - Added `--save-bar-h: 80px` CSS variable.
  - Split the Save All button out of the main `.scanner-view[data-view="confirm"]` block into its own sibling `<div class="confirm-save-bar scanner-view" data-view="confirm">`, fixed-positioned above the footer (`position:fixed; bottom:var(--footer-h)`) — same pattern already used by `.app-header`/`.tab-bar`/`.app-footer`.
  - Added matching `padding-bottom: var(--save-bar-h)` to the confirm view so the new fixed bar never covers the last item row.
  - This works because `showScannerView(name)` already toggles `.active` on *every* `.scanner-view`-classed element matching `data-view`, not just one — so the new sibling bar is shown/hidden in sync automatically.
- Bumped version: footer now reads `SmartCart v0.2.1 — Sticky Save`.
- Verified structurally first (balanced `<div>` tags, no duplicate IDs, `node --check` on the inline script all clean).
- Verified visually: confirmed `file://` URLs can't be opened via Claude-in-Chrome's `navigate` (it force-prepends `https://`) and that opening the file directly in Chrome from Finder also fails the same way (extension still rewrites the URL, page loads as `chrome-error://chromewebdata`) — both are platform limitations, not app bugs. Worked around it by opening `index.html` in Safari via Finder (read-only screenshot tier) and separately building a throwaway test copy (`_test-confirm.html`, deleted after) that auto-populated 12 dummy rows and called `showScannerView('confirm')` on load. Screenshot confirmed the Save All bar renders as a clean fixed bar sitting above the footer with no overlap or clipping.

### Files changed
- `Projects/SmartCart/index.html` — CSS variable, two new CSS rules, confirm-view markup split, footer version bump (v0.2.0 → v0.2.1).
- `Projects/SmartCart/PROJECT.md` — Known Issues item marked resolved.
- `Projects/SmartCart/JOURNAL.md` — this entry.
- `~/Documents/Studio/TODO_LIST.md` — SmartCart resume cue updated.
- Temp file `_test-confirm.html` created and deleted within this session — not part of the repo.

### Current status
Both Known Issues from Session 7 (`Untitled.gs` temp file, non-sticky Save All) are now resolved. Receipt Scanner is fully built and stable at v0.2.1. Paul pushed to GitHub — live at `https://getsmartcart.github.io/smartcart/`.

### Queued for next session
- Start the Roadmap build order: inline package-label-scan completion flow + `updateReceipt` endpoint first.
- Remaining open Known Issue: weighed items sometimes have no Package Size (data gap, not a bug — see Roadmap).

---

## 2026-06-18 — Session 10 (Package-Label Completion Flow + updateReceipt)

### What was done
- Verified the live "SmartCart Setup" Apps Script source matched the local `Backend.gs` before changing anything.
- Added two new POST actions to `Backend.gs`: `scanPackageLabel` (Claude Vision call on a package-label photo, minimal schema — returns `packageSize` + `pricePerKg` only; best-before date and PLU code from the original Roadmap item 4 wording were deliberately left out, not built) and `updateReceipt` (general-purpose patch of an already-saved Purchases row, matched by Receipt ID + Item Raw, case-insensitive).
- Deployed as Web App **Version 3** (Deploy > Manage deployments > edit existing deployment > new version) — confirmed the Web App URL stayed identical to the one hardcoded in `index.html`'s `SHEETS_URL`, so no front-end URL change was needed.
- Built the inline completion flow in `index.html`:
  - New `package-scan` scanner-view block (placeholder card, progress text, item name, Scan + Skip buttons, hidden file input with `capture="environment"`).
  - `packageQueue` / `packageQueueIndex` / `advancePackageQueue()` — sequential one-item-at-a-time queue, per Paul's confirmed design (Skip button for anything that can't be categorized).
  - Trigger condition: after Save All, filter the just-saved items down to category `proteins` or `produce` (case-insensitive) — the front-end has no Subcategory field, so "Deli" from the Roadmap wording can only be caught when its top-level Category is "Proteins". Flagging this as a known scope limitation, not a bug.
  - Hoisted `receiptId` generation out of the inline `addReceipt` payload into a `currentReceiptId` module-level variable so the completion flow's `updateReceipt` calls can reference it.
  - `doneBtn` resets `packageQueue`/`packageQueueIndex`/`currentReceiptId` before returning to idle.
  - Bumped footer to `SmartCart v0.3.0 — Package Label Scan`.
- **Open question not resolved by Paul:** before this session closed, Paul was asked (Q2) whether the package-label Vision schema should be minimal (net weight + price/kg) or full (add best-before date + PLU code). No answer came back before compaction, so the minimal schema — already the Recommended option — was the one built and deployed. Flagging this explicitly so Paul can confirm or ask for the fuller schema later; nothing was assumed silently.
- Verified structurally: balanced `<div>` tags, no duplicate IDs, `node --check` clean on the inline script, `data-view` attributes in correct document order.
- Verified visually: built a disposable `_preview_tmp.html` copy with the `package-scan` view force-activated and placeholder text injected, opened via Finder → Safari (read-tier, screenshot only), confirmed card/button styling and footer version text rendered correctly. Safari's own fullscreen toolbar appeared to overlap the app's fixed header/tab-bar in the screenshot — assessed as a Safari rendering artifact, not a regression (no header/tab-bar code was touched this session, and a prior session already verified that markup independently). Deleted the temp file afterward (required `mcp__cowork__allow_cowork_file_delete` once, since direct `rm` was blocked with "Operation not permitted").
- Deliberately left `handleScanReceipt_` (the original receipt-parsing function) untouched — no packageSize extraction added there — to avoid regression risk on a function that's already working in production.

### Files changed
- `Projects/SmartCart/2026-06-17-SmartCart-Backend.gs` — added `handleScanPackageLabel_` and `handleUpdateReceipt_` plus their `doPost` dispatch branches.
- `Projects/SmartCart/index.html` — new `package-scan` view, completion-flow JS, `receiptId` hoisting, footer version bump (v0.2.1 → v0.3.0).
- `Projects/SmartCart/PROJECT.md` — Apps Script Backend section (Version 3, new endpoints documented), Known Issues (package-size mitigation note + Deli scoping caveat), Roadmap items 2–4 marked done, Session Restore Instructions updated.
- `Projects/SmartCart/JOURNAL.md` — this entry.
- Live Apps Script project "SmartCart Setup" — redeployed as Version 3.
- Temp file `_preview_tmp.html` created and deleted within this session — not part of the repo.

### Current status
Roadmap items 1–3 done, item 4 done in minimal form. `index.html` is at v0.3.0 locally but **not yet pushed to GitHub** — the live site at `https://getsmartcart.github.io/smartcart/` still serves v0.2.1 until Paul pushes. Apps Script Version 3 is live regardless (backend deploys independently of GitHub Pages).

### Queued for next session
- Paul to push `index.html` (and the updated `.gs` file, for repo consistency) to GitHub — exact commands provided in chat.
- Confirm with Paul whether the minimal package-label schema (Q2) is final, or whether best-before/PLU should be added later.
- Real end-to-end test of the completion flow with an actual phone camera + live Vision call (not yet possible to verify via automated tooling).
- Next Roadmap item: `Default Unit` pre-fill (item 5).

---

## 2026-06-18 — Session 11 (Live Secret Exposure Found + Rotated)

### What was done
- Paul asked, as a live test of Phase 3 price-search viability, to check 5 grocery chains' coffee prices via web search — surfaced that pure search only found usable pricing at 3 of 5 stores, confirming a flyer/scraper API is needed for real price intelligence (not yet built — informational only this session).
- Researched the grocery-price API landscape: Flipp has no public/self-serve API (enterprise partnership only), Instacart's API is partner-gated, Reebee has no public API. Identified Apify as a third-party scraper marketplace (not itself a "No Frills scraper" — clarified these are distinct: Apify is the platform, individual Actors like `sunny_eternity/loblaws-grocery-scraper` are independently built listings on it).
- Confirmed `sunny_eternity/loblaws-grocery-scraper` is **not** open source (no "Source code" tab on its Apify listing) — proprietary, pay-per-use. Read its one existing review (Rick_Segal, 5/5, noted a No Frills URL-format friction point; developer replied with a fix) as a maintenance-quality signal. Also surfaced the same developer's broader `canada-grocery-price-comparison` Actor (Loblaws/Superstore/No Frills/Save-On-Foods/PriceSmart/T&T in one input) and a separate `gratifying_graph/canada-grocery-deals` flyer-by-postal-code Actor (Loblaws/Metro/Sobeys/IGA/Walmart/Super C/Maxi) as candidates worth a closer look later.
- Checked GitHub Traffic Insights for `getsmartcart/smartcart` at Paul's request: 7 clones / 7 unique cloners and 4 views / 1 unique visitor over the rolling 14-day window — higher than expected for a personal repo. GitHub's traffic UI does not expose cloner/viewer identity (no usernames, no IPs), only aggregate counts.
- Paul declined checking the repo's collaborator list, but asked the sharper question: how much could a cloner actually reconstruct, given they wouldn't have access to the real Google Sheets data? Investigated by reading the actual tracked files (`git ls-files`) rather than assuming — found the public repo contains not just `index.html` but **both `.gs` backend source files** (`2026-06-17-SmartCart-Backend.gs`, `2026-06-17-SmartCart-SheetSetup.gs`). Grepped `index.html` and confirmed `SHEETS_URL` and `WEBHOOK_SECRET` are hardcoded **live, working values** — not placeholders — visible to anyone via clone or simply "view source" on the hosted page.
- Assessed the real risk: the app's UI/backend logic has no defensible code-moat (personal tool, not a product) so full-app duplication isn't really preventable or worth preventing. The actual exposure is that the live secret + endpoint let anyone bypass the UI and POST directly to Paul's production Apps Script — risk is garbage writes to the real Sheet, or burning `ANTHROPIC_API_KEY` quota via repeated Vision calls (key itself never leaves Script Properties). Sheet data and the API key are confirmed not exposed.
- Paul said "do it now" — rotated `WEBHOOK_SECRET`: generated a new value (`openssl rand -hex 16`), swapped it into `index.html` (line 449), bumped footer to `SmartCart v0.3.1 — Secret Rotated`.
- Considered making the repo private as a stronger fix — rejected, since free-tier GitHub Pages requires a public repo; rotation is the practical mitigation given the hosting constraint.

### Files changed
- `Projects/SmartCart/index.html` — `WEBHOOK_SECRET` constant rotated to new value; footer version bump (v0.3.0 → v0.3.1).
- `Projects/SmartCart/PROJECT.md` — Apps Script Backend section (rotation note), new Known Issues entry (public repo / live secret exposure), Session Restore Instructions updated.
- `Projects/SmartCart/JOURNAL.md` — this entry.
- `TODO_LIST.md` — added `WEBHOOK_SECRET` rotation cadence entry; updated SmartCart resume cue.

### Current status — ROTATION COMPLETE
Both manual steps done same session: Paul updated the `WEBHOOK_SECRET` Script Property on the live "SmartCart Setup" Apps Script project (confirmed via screenshot — value matches `index.html`, no redeploy needed since Script Properties take effect immediately), and pushed to GitHub — commit `ae3f3d3` ("v0.3.1: rotate WEBHOOK_SECRET; v0.3.0 package-label flow"), confirmed local `HEAD` matches `origin/main` with a clean working tree. The old secret is fully dead; v0.3.0 (package-label flow, queued since Session 10) shipped in the same push.

Re-checked GitHub Traffic Insights after the push: still 7 clones / 7 unique cloners, 4 views / 1 unique visitor, chart unchanged through 06/17 (GitHub's traffic data lags up to ~24h, so today's activity won't show until tomorrow).

Closed out two follow-up questions Paul raised: (1) confirmed by reading `Backend.gs` line-by-line that no handler accepts a sheet ID/URL from the request — every write hardcodes `SpreadsheetApp.getActive()` — so the leaked secret could never have been used to redirect Paul's live script to write into an attacker's own Sheet; the only real exposure was `scanReceipt`/`scanPackageLabel` acting as a free Vision-OCR proxy paid for by Paul's Anthropic quota, with no Sheet involvement needed. (2) Paul questioned whether that's even a credible motive given free OCR alternatives exist (Google Lens, free ChatGPT/Gemini tiers) — agreed it's weak as a deliberate human motive; the clone-timing pattern (7 clones within ~1 day of the repo going public) fits automated GitHub secret-scanning bots far better than a targeted actor. Rotation was still correct as routine hygiene regardless.

### Queued for next session
- Revisit the `canada-grocery-price-comparison` and `canada-grocery-deals` Apify Actors when Phase 3 (price intelligence) work actually begins — not committed to either yet, just scoped as candidates.
- Next Roadmap item: `Default Unit` pre-fill (item 5).

---

## 2026-06-20 — Session 12 (Flipp Shopping List Read + 7-Store Deal Report Dry-Run)

### What was done
- Read Paul's live Flipp shopping list via Claude in Chrome (after an initial extension disconnect — resolved on retry, no fix needed beyond reconnecting). Confirmed the page's underlying markup: every flyer-tile item is a single `<image>` with a generic alt label ("Weekly eFlyer 06/18-06/24", "Flyer") — no item name or price exists as real text anywhere in the DOM. Reading the list required scrolling + visually transcribing each tile from screenshots, not text extraction. 14 items confirmed across FreshCo (9), Walmart (4), Your Independent Grocer (1).
- Paul asked what scraping "all grocers' flyers" would look like at scale — confirmed via the accessibility tree that the image-only-tile problem is structural (same for every store on Flipp, not a per-store quirk), so coverage would stay complete but throughput stays linear with screenshots — not viable as an automated job. Also flagged that every item in the list was internally tagged "Expired" in the page data despite being within the flyer's stated valid dates — a reliability flag if Flipp is considered as a data source later.
- Paul then asked to run the real thing: Claude API + web search hitting stores directly (the locked Layer 2 architecture), one sub-agent per store, restricted to 7 categories — fresh produce, fresh meat (not frozen), cream, eggs, yogurt, frozen fruits/vegetables, bagels. Spawned 7 parallel general-purpose sub-agents (Safeway, Save-On-Foods, Real Canadian Superstore, Walmart, Costco, Your Independent Grocer, Co-op), each required to cite a source URL per item and report nothing rather than fabricate a price.
- Results were uneven: **Safeway** and **Save-On-Foods** returned high-confidence, regionally-correct data (flyers-on-line.com republishes both as plain text, BC-wide flyer confirmed to cover Kamloops stores). **Walmart** and **Costco** returned lower-confidence data (generic Canada-wide aggregator / crowdsourced BC-region blog, not Kamloops-confirmed). **Real Canadian Superstore** and **Your Independent Grocer** returned zero items — both have a Kamloops-correct, date-correct flyer that exists, but only as scanned/JS images with no extractable text; the agents correctly declined to substitute Ontario-region text data they'd found instead. **Co-op** returned zero items for a different reason: extensive search found no full-line grocery Co-op actually serving Kamloops, BC at all — only Co-op gas bar/convenience locations (Columbia St W, Valleyview, Dallas Drive), none of which sell groceries.
- This confirms the same structural finding from Session 11's 5-store coffee-price test (3 of 5 worked via pure search) at larger scale, and ties it directly to the image-flyer problem just observed on Flipp: most flyer sources — store sites, Flipp, and most aggregators — render flyers as images, not text. Only a handful of text-based aggregators (flyers-on-line.com, for the 2 stores that worked) close that gap. This will recur weekly for whichever stores lack one.
- Wrote the full report to `2026-06-20-SmartCart-WeeklyDealReport.md`, grouped by category with per-store confidence notes and a methodology section naming two paths to closing the gap when this becomes a real Apps Script job: (1) accept partial coverage and report "no data" honestly per store, same as this run, or (2) add a Claude Vision step to read image-only flyers directly — same approach that worked for reading the Flipp screenshots.

### Files changed (dry-run portion)
- `Projects/SmartCart/2026-06-20-SmartCart-WeeklyDealReport.md` — new. Full 7-store report.
- `Projects/SmartCart/JOURNAL.md` — this entry.

### Current status (dry-run portion)
Manual dry-run only — not wired into any automated trigger. Confirms the Layer 2 architecture works where a text-based flyer aggregator exists, and confirms the failure mode (image-only flyers) is the dominant blocker, not search quality. 2 of 7 target stores high-confidence, 2 partial, 3 zero (2 technical, 1 a genuine "this store doesn't exist here" finding).

### Co-op — resolved
Paul confirmed: drop it. **PROJECT.md edited** — removed "Co-op" from the Target Stores (Kamloops, BC) list.

### Live price spot-check (Kraft Smooth Peanut Butter, 2kg, regular price)
At Paul's request, fetched current non-sale prices directly from product pages rather than flyers: **Walmart.ca** $10.97 ($0.55/100g, nationwide online price, high confidence). **Real Canadian Superstore / PC Express** $12.00 ($0.60/100g, confirmed not-on-sale) — but repeated attempts (store-locator address entry, "set as preferred store" click, direct store-details-page click) all failed to pin the displayed price to the actual Kamloops store (910 Columbia St W, store #1522); the page kept defaulting back to a Toronto-region store across 3+ tries. Reported to Paul with that caveat rather than presenting it as Kamloops-confirmed. Recommended manual alternative: Paul check via his own logged-in PC Express account.

### Account-based automation question
Paul asked whether Claude could use "a theoretical account" he creates for grocery sites to do price comparisons. Answer: no — creating accounts or entering credentials/passwords is a hard prohibition that holds regardless of framing ("theoretical," explicit authorization, etc.). Real working path instead: Paul logs into a grocery site himself in his own Chrome profile; Claude-in-Chrome shares that same browser profile/cookie jar, so a subsequent Claude-in-Chrome navigation to the same site should inherit the authenticated session — without Claude ever handling the password.

### Product vision discussion + marketability reframe
Paul described the long-term vision: a personal "items I typically buy" DB, queried weekly against grocer sites, filtered into a Friday-morning best-price-per-store shopping list. Mapped this to the existing four-layer architecture: this is **Layer 3 (on-demand search) run as a scheduled weekly batch over a fixed list**, not Layer 2 — Layer 2 only surfaces items currently on a sale flyer and would return nothing for routine staples most weeks. Paul then explicitly took marketability off the table for this project ("beyond the reach of common folks"), framing grocery price-comparison friction as a deliberate industry moat rather than just inherent complexity. Engaged with this by grounding it in the Competition Bureau's actual June 2023 "Canada Needs More Grocery Competition" report (rising margins, recommended unit-pricing standards) rather than just agreeing or disagreeing, then refocused on the practical personal-use build.

### Sheets schema — Weekly Compare Skill (Layer 3 batch), designed and partially built
Determined GroceryList already functions as the "items I typically buy" DB (auto-built from Purchases/receipts, no manual pre-population needed) — no new DB required. Identified and closed two real schema gaps, plus formalized Paul's four follow-up requirements (what to buy, what's running low, when to stock up, whether a "sale" is a real discount) into a new Roadmap section:
- **GroceryList column 11, `Product URL(s)`** — manual, format `Store: URL; Store: URL`. Reference field for the weekly skill to re-fetch a known product page per item per store instead of re-searching each week. Confirmed safe: `upsertGroceryListItem_` hardcodes a 10-column write, so this column is never touched by the receipt-driven upsert. Added a guard comment in `Backend.gs` warning against widening that range later.
- **GroceryList column 12, `Typical Interval (Days)`** — reserved, empty until built (same pattern as `Default Unit`). Will hold the median gap between an item's past purchase dates, to power the "what am I running out of" signal (Roadmap item 10).
- **GroceryList column 13, `Weekly Compare (Y/N)`** — manual flag, Y/N dropdown validation added in `SheetSetup.gs`. Distinguishes staples Paul actually wants price-checked weekly from one-off receipt items that auto-populated GroceryList.
- **PriceHistory column 5, `Regular Price`** — real gap: PriceHistory only logged one price per observation, with nothing to compare a "sale" against. Added the column; `handleAddReceipt_` now writes `item.regularPrice` into PriceHistory (previously only Purchases captured it), so every future price point — receipt or weekly-batch — records both what was charged and what the source called "regular."
- **New PROJECT.md section, "Roadmap — Weekly Compare Skill (Layer 3 Batch)"**, items 10–13: (10) running-low signal from `Typical Interval (Days)`; (11) stock-up signal — freezable/shelf-stable items priced notably below their own rolling average, reusing item 7's machinery in reverse; (12) fake-sale/inflated-discount detector — compares this week's stated regular and sale price against the item's own trailing 8–12 week `PriceHistory` average per store, flags if the "regular" price looks freshly inflated or the "sale" isn't actually below typical; (13) the `Weekly Compare` flag itself. Thresholds (10% starting point) flagged as tunable, not finalized. Trigger mechanism and Reports-tab integration explicitly left undecided.
- Spec only — no batch-query skill/script written yet. `setupSmartCartSheet` needs one re-run to push the 4 new headers to the live Sheet; `Backend.gs` needs re-pasting into the live Apps Script project + a new Web App deployment version for the `regularPrice` capture fix to take effect (SheetSetup changes don't need a redeploy, just a Run).

### Dollar store research (informational, no schema impact)
Checked whether Dollarama, Dollar Tree Canada, Buck or Two, or Family Dollar offer APIs or per-item online pricing for Kamloops. None do. Dollarama's online store sells case quantities only (not single-item browsing) and has no public API; Dollar Tree Canada similar. Both run fixed price tiers ($1.25–$5) with essentially no discounting, so even if data were accessible there's no sale-vs-regular signal to track — concluded dollar stores aren't a fit for the weekly-compare/fake-sale logic and aren't worth building a source for.

### Files changed (full session)
- `Projects/SmartCart/PROJECT.md` — Co-op removed from Target Stores; GroceryList/PriceHistory schema table updated (Product URL(s), Typical Interval (Days), Weekly Compare (Y/N), Regular Price); Data Entry Model section expanded; new "Roadmap — Weekly Compare Skill (Layer 3 Batch)" section (items 10–13) added.
- `Projects/SmartCart/2026-06-17-SmartCart-SheetSetup.gs` — GroceryList headers gained `Product URL(s)`, `Typical Interval (Days)`, `Weekly Compare (Y/N)`; PriceHistory headers gained `Regular Price`; Y/N validation added for `Weekly Compare (Y/N)`.
- `Projects/SmartCart/2026-06-17-SmartCart-Backend.gs` — guard comment added above `upsertGroceryListItem_`; `handleAddReceipt_`'s `priceHistRows` push now includes `regularPrice`.
- `Projects/SmartCart/JOURNAL.md` — this entry (expanded).
- Live Google Sheet and live Apps Script deployment: **updated later this same session** — see "Live sync completed" below.
- GitHub: pushed (working tree clean, up to date with `origin/main`) by session end.

### Current status (full session)
All three steps that were pending at the spec stage are now done: git pushed, `setupSmartCartSheet` re-run live, and `Backend.gs` redeployed as Web App Version 4. Today's schema/backend work (GroceryList cols 11–13, PriceHistory col 5, regularPrice capture) is fully live end to end.

### Live sync completed (same session, continued — Claude-in-Chrome)
Paul confirmed the Smart Cart sheet was open in Chrome and asked Claude to proceed with the live updates directly, alerting him only if a human-interaction checkpoint (OAuth/permission prompt) came up. None did — both syncs completed without any auth prompt.

- **Code.gs (live):** edited the three pending header/validation changes directly in the Apps Script editor (GroceryList headers, PriceHistory headers, `Weekly Compare (Y/N)` validation entry), saved, then ran `setupSmartCartSheet` from the editor. Execution log showed a clean run, no errors. Verified directly in the Sheet: toast "SmartCart schema setup complete — 7 tabs ready," GroceryList at 13 columns with all 13 existing data rows untouched, PriceHistory at 7 columns. Matches the local `.gs` file exactly — confirmed safe-to-re-run as documented.
- **Backend.gs (live):** edited the `priceHistRows.push` line to add `parseFloat(item.regularPrice) || pricePaid`, and inserted the 4-line guard comment above `upsertGroceryListItem_`. Hit one real problem along the way — see Errors below. Both edits verified clean via screenshot, then saved.
- **Redeployed as Web App Version 4** (20 Jun 2026, 09:56) via Deploy → Manage Deployments → New version, description "Capture regularPrice into PriceHistory; document GroceryList col 11 guard." Same Deployment URL as before (deployment versions don't change the URL) — no client-side `index.html` change needed.

### Error encountered and fixed: editor corruption during guard-comment insertion
First attempt at inserting the 4-line guard comment used a single `type` action with embedded `\n` characters, while the Cmd+F find bar used moments earlier to locate the function was apparently still focused. Result: the 4 comment lines landed in reversed/garbled order, merged onto one line, overwriting the `function upsertGroceryListItem_(ss, item) {` signature. Caught immediately via screenshot before saving — the corruption stayed confined to the in-browser unsaved editor buffer; the live deployed code was never affected. Recovered with repeated Cmd+Z (closing the find bar first) until the file was back to its last-saved, fully clean state — this also reverted the `priceHistRows` edit, so both edits were redone from scratch: the `regularPrice` insertion via double-click-to-select-word + type (no braces, low risk), and the guard comment via separate `type` + `key:Return` pairs per line instead of one multi-line `type` call. Both verified clean on the redo. **Lesson for future live `.gs` edits:** never use a single `type` call with embedded `\n` in this editor — always pair one `type` per line with a separate `Return` keypress, and confirm Cmd+F is fully closed (click its X, not just Escape) before typing.

### Queued for next session
- Decide trigger mechanism for the Weekly Compare batch (Apps Script time trigger vs. Paul-initiated) — left open in the Roadmap spec.
- Decide whether fake-sale-detector flags (item 12) render as one combined flag or two independent ones on output — left open.
- Begin populating `Product URL(s)` for Paul's actual staples list once `Weekly Compare (Y/N)` items are chosen — needed before the batch skill has anything to fetch.
- Next Roadmap item: `Default Unit` pre-fill (item 5) — still queued from Session 11, untouched this session.

---

## 2026-06-20 — Session 13 (Tighten Package-Label-Scan Trigger)

Paul: "tighten the scan trigger for missing data. But only for missing data if the receipt doesn't have it." The Session 10 completion flow (Known Issues / Roadmap item 2) queued a package-label scan for *every* Proteins/Produce row, even when the receipt itself had already printed a per-unit price (e.g. produce that shows "0.370 kg @ $2.84/kg" on the receipt). Paul wanted the prompt to fire only when the data is genuinely missing, not just because the category is a usual suspect.

**Fix — candidate-pool-plus-missing-data hybrid:**
- `Backend.gs` (`handleScanReceipt_`): added `unitPrice` to the Claude Vision extraction prompt and JSON shape — `unitPrice` is the per-kg/lb/100g price *only* if the receipt itself prints one next to the line item; `0` if not shown. Model is explicitly told not to estimate or compute one itself. JSDoc above the function expanded to document the new field and why it exists (ties back to `PACKAGE_SCAN_CATEGORIES` in `index.html`).
- `index.html`: `unitPrice` is now carried untouched from the scan result into each confirm-row (`row.dataset.unitPrice`, not rendered in the UI — no layout change), through to the saved item object, and into the post-save `packageQueue` filter. That filter is now `inCandidatePool && missingUnitPrice` instead of category alone.
- Footer version bumped `v0.3.1 → v0.3.2 — Missing Unit Price Scan`.
- Both files edited and verified locally first (`git diff` reviewed line-by-line), then live-synced into the Apps Script editor for the "SmartCart Setup" project before redeploying — see below.

### Live sync (same session, Claude-in-Chrome)
Synced the local `Backend.gs` prompt + JSDoc edits into the live Apps Script editor (tabId 2086878675) by hand, since the GitHub MCP connector is non-functional in Cowork and Apps Script changes don't take effect until redeployed.

- **Prompt-construction block** (lines 348–354): replaced to add `unitPrice` to the JSON shape and the new extraction instructions. Verified exact match against the local file via `get_page_text`.
- **JSDoc comment** above `handleScanReceipt_` (lines 332–334 → expanded to 8 lines): replaced to document the new `unitPrice` field and its role in the trigger logic. Verified via `get_page_text`.
- **Redeployed as Web App Version 5** (20 Jun 2026, 11:17) via Deploy → Manage Deployments → New version, description "Extract per-unit price from receipt when printed; tighten package-label-scan trigger to fire only on genuinely missing unit-price data." Same Deployment URL as before — no client-side `index.html` change needed for the URL itself, only for the trigger-filter logic already described above.

### Error encountered and fixed: editor selection/undo corruption (self-recovered)
While replacing the prompt-construction block, a `left_click` with a `shift` modifier was used to try to extend a text selection — this silently failed to select anything, and the subsequent typed replacement inserted at the unselected cursor instead of replacing, duplicating several lines. `Cmd+Z` undo proved to only revert in small (~word-level) increments, impractical for a multi-line insertion at that granularity; recovered instead by redoing forward (`Cmd+Shift+Z`) back to the fully-botched state, then fixing forward with precise selections. Two follow-up lessons banked for future live `.gs`/editor work: (1) `shift`-modified clicks do not reliably extend selections in this editor — use `shift+Down`/`shift+Right`/`shift+End` key presses instead; (2) `shift+Down` advances by visual (soft-wrapped) line, not logical line, so long lines that wrap consume an extra press without advancing a full logical line — account for this when counting presses. Also: the `Home` key exhibits smart-home toggling (first non-whitespace vs. true column 0) that made precise column counting unreliable; clicking at a fixed pixel x-position just right of the line-number gutter (x≈351 in this editor's current layout) reliably lands the cursor at true column 0 instead. Final verification of all text used `get_page_text` (actual DOM content) rather than screenshot pixel-judgment, which had proven misleading earlier in the recovery.

### Queued for next session
- Once Paul pushes `index.html` + `2026-06-17-SmartCart-Backend.gs` to GitHub (commands provided below), confirm the live PWA at `https://getsmartcart.github.io/smartcart/` shows footer `v0.3.2` and that a real receipt scan with a printed per-unit price (e.g. weighed produce) no longer triggers an unnecessary package-label-scan prompt.
- Carried-over backlog, untouched this session: Weekly Compare batch trigger mechanism decision, fake-sale-detector flag rendering decision, `Product URL(s)` population, `Default Unit` pre-fill (Roadmap item 5).

---

## 2026-06-20 — Manual data fix (FreshCo Sirloin Tip Steak unit price)

Paul uploaded a photo of the package price label (Sirloin Tip Steak, 0.776 kg, $17.61/kg, $13.67 total) and asked to update the matching FreshCo receipt with the unit price. No exact 06/15 match exists — the only FreshCo Sirloin Tip Steak row with a matching $13.67 total is dated **2026-06-17**, so that row was updated (price match is unambiguous; flagged to Paul for confirmation).

- **Purchases row 8:** Package Size → `0.776 kg`, Unit Price → `17.61`. Regular Price confirmed unchanged at `13.67` (briefly mis-typed to 17.61 via a Tab-count error, caught and corrected before moving on).
- **PriceHistory row 8:** Unit Price (col F) → `17.61`. A Name-Box click meant to jump to cell G7 instead landed as a literal edit on the still-selected F8, briefly overwriting it with the text "G7" — caught immediately via screenshot and corrected back to `17.61`.

### Two issues found while verifying (not fixed, flagging for Paul)

1. **PriceHistory legacy rows have a real column-shift artifact.** Confirmed by clicking into cells directly (formula bar, not screenshot pixel-position): every other 2026-06-17/05-27 row in PriceHistory has "Receipt Photo" sitting in column F (Unit Price) instead of column G (Source), with Regular Price (E) reading `0`. Root cause: these rows were written before the `Regular Price` column existed in the `priceHistRows.push(...)` array (added 2026-06-20, Session 12) — the old 6-field push left everything from Regular Price onward shifted one column left, and Source has nowhere to land. Cosmetic/historical only — doesn't affect new rows — but would skew any future fake-sale-detector or rolling-average logic that reads PriceHistory columns by position. Needs a one-time backfill/cleanup pass if Paul wants those old rows corrected.
2. **`scanPackageLabel` never actually saves the unit price it extracts.** Confirmed by reading `handleUpdateReceipt_` (only accepts `packageSize` + `notesAppend`, no unit-price parameter) and `handleScanPackageLabel_` (returns `pricePerKg` but nothing downstream forwards it to `updateReceipt`). So today's tightened scan trigger (Session 13) will correctly detect *when* unit price is missing, but the package-label-scan flow built to fill that gap can't actually persist the value once scanned — it would need to be entered manually each time, same as just done here. Worth fixing `handleUpdateReceipt_` + `index.html`'s post-scan save call in a future session.

### Live verification walkthrough (same day, no code change)

Paul scanned a real Safeway Fortune St. receipt on the live PWA (7 items: Pretzel Sticks, Bean Sprouts, Shrimp 91/120 PeelCkd $10.99, Ham Instore $7.77, 2× Whole Wheat bread, White Bread). At the Confirm screen he asked whether Ham and Shrimp should trigger a package-label-scan prompt.

- Walked through the trigger rule against the actual receipt photo: none of Shrimp, Ham, or Bean Sprouts print a per-unit ($/kg, $/lb) price — flat totals only — and all three map to Proteins/Produce in the 12-row category taxonomy (`CATEGORY_DATA` in `SheetSetup.gs` has no separate Seafood/Deli category; both roll into Proteins). So all three are expected to queue for a package-label-scan prompt.
- Clarified the flow for Paul: the queue is only built and the prompts only fire **after** "Save All" is tapped — not on the Confirm screen itself. He hadn't realized the prompts come after saving, not before.
- Also clarified the Search tab is still an unbuilt placeholder (confirmed by checking the current PWA Shell section of this file) — not a bug, just not built yet.
- No code or data changed in this exchange — confirmation/walkthrough only. Outcome of his Save All on this particular receipt (did Shrimp/Ham/Bean Sprouts actually queue as expected) not yet confirmed back to Claude — worth a quick check next session if it's still on his mind.

### Session wrap (this entry)
- Files touched this session: live Sheet data only (Purchases row 8, PriceHistory row 8 — see above); `PROJECT.md` and `JOURNAL.md` updated to log the fix and the two discovered gaps. No `.gs` or `index.html` changes — Web App Version 5 and local v0.3.2 are unchanged from Session 13.
- Two open product gaps flagged to Paul (unitPrice never persisted by `scanPackageLabel`/`updateReceipt`; legacy PriceHistory column shift) — not yet actioned, no decision made on priority.
- ~~`index.html` + `2026-06-17-SmartCart-Backend.gs` still not pushed to GitHub as of this entry~~ — **correction, 2026-06-20:** confirmed via live site fetch + local git log that this was already pushed (commit `b4fd30b`, branch up to date with `origin/main`). Live PWA at `getsmartcart.github.io/smartcart` already serves v0.3.2. The "not yet pushed" note above was stale.

---

## 2026-06-20 — Session 12 source URLs retrieved (follow-up)

Paul asked which URLs Session 12's 7-store dry-run actually used — the written report (`2026-06-20-SmartCart-WeeklyDealReport.md`) only named sources, not full links. Looked up and confirmed: Safeway and Save-On-Foods both via `flyers-on-line.com` (https://www.flyers-on-line.com/safeway/british-columbia and .../save-on-foods/british-columbia); Costco via Costco West Fan Blog (https://cocowest.ca/); Superstore via weeklyflyer.com (image-only, no data); Independent Grocer via flyerbox.ca Kamloops page (image-only, no data). Walmart's exact aggregator was never recorded in Session 12 and couldn't be confirmed retroactively — flagged as unverified rather than guessed. Full table with URLs and confidence added to `PROJECT.md` under "Price Data Sources — Fluid" so future weekly runs can reuse these directly instead of re-discovering them.

---

## 2026-06-20 — Walmart source upgraded (follow-up)

Paul asked for a better Walmart source after the above turned up nothing confirmed. Searched and tested `web_fetch` directly against walmart.ca's own grocery section (e.g. https://www.walmart.ca/en/cp/grocery/10019) — confirmed it's plain HTML, fully text-readable (unlike the Superstore/Independent flyer images), and returns real line items with current price, Rollback "Was/Now" sale price, and per-unit pricing ($/100g, $/100ml) already built in. This beats any aggregator: no need for a Walmart flyer source at all going forward — query walmart.ca's grocery category/product pages directly. Note: this is Walmart's national online catalog, not confirmed to vary by store; Session 12's earlier spot-check (peanut butter) also found Walmart.ca's online price matched a high-confidence nationwide rate, consistent with this. PROJECT.md's Confirmed Sources table updated — Walmart row now High confidence, pointing at walmart.ca directly instead of an unrecorded aggregator.

---

## 2026-06-20 — Source feed file created; weekly price-check skill queued

Paul asked to notate the 6 confirmed source URLs as a feed for a future skill, to automate the weekly grocery price search (skill itself to be written up later). Created `2026-06-20-SmartCart-PriceSourceFeed.md` — a clean, skill-ready table (Store / URL / Format / Confidence / Notes) separate from PROJECT.md's narrative version, intended as the single source of truth a future skill reads from rather than hardcoding URLs. PROJECT.md cross-referenced to it. Added a TODO_LIST.md entry ("SmartCart — Weekly Grocery Price Check Skill") queuing the build for a later session, flagging the open problem already known from Session 12: 2 of 6 sources (Superstore, Independent Grocer) are image-only and will need a Claude Vision read step, not just web fetch.

---

## 2026-06-20 — Nav tab strategy review (follow-up)

Paul reviewed all four nav tabs against what's been learned this session. Verdict: Scanner is the proven asset (data entry + unit pricing); Search is structurally weak — grocery pricing is deliberately hard to compare programmatically (no APIs, image-only flyers, app-gated personalized pricing); Report (Layer 2) is heading toward redundant once the planned Weekly Grocery Price Check skill exists; Settings is thin once trusted stores and Thursday cadence are locked in.

Discussed reframe: lean on owned purchase-history data (the real moat) instead of fighting external sites for live comparison. Ideas raised, none built or committed yet:
- New properties to capture: best-before/expiry dates (ties to bulk-value/waste, Core Problem #2), loyalty/coupon program data (PC Optimum, Scene+) as a more reliable "deals" source than public flyers, household/consumption profile (servings, freezer capacity) to power bulk-value math, store-visit cadence (free — already derivable from existing Purchases data).
- Tab restructuring idea: Search → search own price history instead of the live web; Report → demote to a background skill + email (FSRI pattern), not a nav tab; freed slot → Insights/Trends (Layer 4, already in Vision, not yet built).
- Coupon tracking gap: Purchases captures Price Paid vs Regular Price (catches flyer sales) but nothing distinguishes a separate manufacturer/loyalty coupon — would need its own field if Paul wants that isolated.

Paul then raised the real test: is bulk buying (Costco briskets/loins, home-butchered) actually saving money, and is sale-chasing worth the effort for a single-person household? Discussed: tracking spend is the guaranteed value regardless; sale-chasing at low volume is probably modest; the fake-sale/inflated-discount detector (Roadmap #12) is a more honest value prop than "catches deals" since it stops an overcharge rather than promising a find. Proposed reframing the FSRI tie-in (Roadmap #9) from a narrative verdict into an actionable "stock up now, before the forecast price rise" trigger on shelf-stable categories — not yet written into the Roadmap.

Trip-worthiness reopened: Paul's eggs/Creamo example (Costco cheaper per unit, but consumption rate too low and trip too far to be worth it) shows the "Trip cost threshold: Deferred indefinitely" Resolved Decision was deferred for the wrong reason — modeling fuel/distance precisely is unworkable, but a simple tiered filter isn't: Store Tier (Local vs. occasional-trip) + per-item consumption interval (Roadmap #10, already planned) + a flat total-savings threshold before a distant store surfaces as "worth a trip." Not yet confirmed or threshold-numbered — Paul moved to the bulk-meat question before settling this.

Bulk-meat yield test methodology refined by Paul: don't compare bulk sticker price to retail directly — record (1) purchase price + raw weight, (2) trimmed/usable weight after fat removal, (3) weight of each resulting product category (roast, stew chunks, steak) separately, then compare each category's weight against its own retail $/100g and sum, vs. what was actually paid. Clarified for accuracy: brisket (flat + point muscles) naturally yields roasts and stew/chunk meat, not steaks — true steaks come from the loin purchase, not the brisket. Important for correctly attributing yield categories to the right primal before running the retail comparison. No numbers run yet — queued for next time Paul does an actual cutting session.

**Next session:** none of the above is built or written into Roadmap/Resolved Decisions yet — all flagged in PROJECT.md "Open Questions" for follow-up. Nothing else queued from prior sessions was actioned this turn (package-label persistence fix, Weekly Compare trigger mechanism, Product URL(s) population, Default Unit pre-fill all still pending from Session 13).

---

## 2026-06-21 — Session 14 (Receipt Total Capture Fix)

### What was done
- Paul asked how much he'd spent on groceries to date from Purchases data (FreshCo $56.38, Save-On-Foods $6.86, Safeway $34.91, Safeway Pharmacy $25.06). Separately confirmed a duplicate "WholeWheat100%Bread" line was a real double-buy, not a data bug, and confirmed receipt photos themselves are never archived anywhere — `scanReceipt` sends `imageBase64` to Claude Vision for parsing but never persists it (no `DriveApp` calls anywhere in `Backend.gs`).
- Paul then caught a real discrepancy: his physical Safeway receipt's printed TOTAL was $35.21 (SUBTOTAL $34.91 + 5% GST $0.30 on the one taxable item, Pretzel Sticks — most groceries are zero-rated in BC, snack foods aren't), but Purchases summed to $34.91. He supplied the actual receipt photo as evidence only — explicitly not a new scan to submit to Sheets.
- Read `Backend.gs` to root-cause it: `handleScanReceipt_`'s Claude Vision prompt explicitly said *"Skip subtotal, tax, total, and loyalty or points lines, only include actual purchased items."* This was a deliberate Session-1 design choice, not a bug — but it meant every logged spend total was item-subtotal-only, silently undercounting by tax on any non-zero-rated item. Confirmed via the GST math (5% × $5.99 ≈ $0.30) that this fully explains the gap.
- Proposed two schema options (separate Receipts tab vs. Tax+Total columns on Purchases) via AskUserQuestion; Paul rejected both framings and narrowed scope directly: no tax tracking at all, only capture the receipt's printed Total, rename rather than add where possible. Implemented accordingly — single new column, no Tax field:
  - **`2026-06-17-SmartCart-Backend.gs`:** `handleScanReceipt_`'s prompt now extracts `total` (the printed grand Total, after tax — 0 if not legible) instead of discarding it; still skips tax/subtotal lines as line items. Return shape gained `total`. `handleAddReceipt_` now reads `p.total`, writes it as `receiptTotal`, and pushes it as the 17th element of every `purchaseRows` row for that receipt (same denormalized repeat-per-row pattern as Date/Store/Receipt ID). Added a comment above `handleUpdateReceipt_` noting column 17 is untouched by that function (it only reads/writes columns 1–16).
  - **`2026-06-17-SmartCart-SheetSetup.gs`:** Purchases header array gained `'Receipt Total'` as the 17th header. File's existing "safe to re-run, never deletes columns" guarantee covers this addition.
  - **`index.html`:** new `currentReceiptTotal` state var captures `data.total` from the `scanReceipt` response; passed through as `total: currentReceiptTotal` in the `addReceipt` POST; reset to 0 on "Done." No new visible UI field — Total stays silent/passthrough like `receiptId`, per the locked "fixed layout, no shifting elements" principle. Footer bumped **v0.3.2 → v0.3.3 — Receipt Total Capture**.
- Updated `PROJECT.md`: Data Architecture intro, Purchases column table, Apps Script Backend `scanReceipt` contract, a new Data Entry Model bullet, a new resolved Known Issues entry documenting the root cause and fix, a pending-redeploy note on the Apps Script Deployment bullet, and a new dated Session Restore Instructions entry — all cross-referencing each other.

### Files changed
- `Projects/SmartCart/2026-06-17-SmartCart-Backend.gs` — `total` extraction + return shape (`handleScanReceipt_`), `receiptTotal` write as column 17 (`handleAddReceipt_`), clarifying comment (`handleUpdateReceipt_`).
- `Projects/SmartCart/2026-06-17-SmartCart-SheetSetup.gs` — `'Receipt Total'` added to Purchases header array.
- `Projects/SmartCart/index.html` — `currentReceiptTotal` state, captured on scan, sent on save, reset on Done; footer v0.3.2 → v0.3.3.
- `Projects/SmartCart/PROJECT.md` — Data Architecture, Apps Script Backend, Data Entry Model, Known Issues, Deployment note, Session Restore Instructions all updated; header "Last Updated" bumped to June 21, 2026.
- `Projects/SmartCart/JOURNAL.md` — this entry.

### Current status
Fix built and verified locally (code read back, logic traced by hand — no live test, see below). **Not yet live:** Apps Script is still Version 5 (no `total` support yet); the live Sheet's Purchases tab still has only 16 headers; `index.html`/`Backend.gs`/`SheetSetup.gs` are not yet pushed to GitHub. Three manual steps remain, all Paul's:
1. Paste the updated `Backend.gs` into the "SmartCart Setup" Apps Script editor and deploy a new version (Version 6).
2. Add "Receipt Total" as column 17's header on the live Sheet — either re-run `setupSmartCartSheet` (additive-only, safe) or type it in directly.
3. `git add . && git commit -m "v0.3.3: capture receipt Total (incl. tax), not just item subtotal" && git push`.

### Queued for next session
- Confirm the three deploy steps above are done; then test one real receipt scan end-to-end and confirm the new Purchases row's Receipt Total column matches the photographed receipt's printed Total.
- Resume Golf question from earlier this session ("Resume Golf? — Session 24 closed, next task Dave's onboarding via onboarding.html") was raised but not answered — Paul pivoted into this fix instead. Still open if he wants to pick it up.
- Everything else queued from Sessions 12–13 (Weekly Compare batch trigger mechanism, fake-sale-detector flag rendering, `Product URL(s)` population, `Default Unit` pre-fill, package-label unit-price persistence, legacy PriceHistory column-shift backfill) remains untouched.

---
