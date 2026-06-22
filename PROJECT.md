# SmartCart — Personal Grocery Intelligence App

**Project Status:** Phase 1 complete and verified end-to-end with real receipts  
**Last Updated:** June 21, 2026 (Receipt Total capture fix)  
**Developer:** Paul — Kamloops, BC  
**Platform:** PWA + Google Sheets + Apps Script + Claude API  
**Account:** Claude Pro

---

## Vision

A personal grocery management platform that tracks real costs over time, normalizes unit pricing across stores, scans receipts, monitors weekly flyer deals, and eventually builds a full picture of spending, nutrition, and value — including online purchases from Amazon, iHerb, and similar sources.

Inflation tracking and true unit-price comparison are core to the mission. Stores deliberately obfuscate comparative value through inconsistent weights, volumes, and units. SmartCart removes that friction.

---

## Core Problems Being Solved

1. **Unit price opacity** — stores use different units (per 100g, per lb, per unit, per ml) to prevent comparison. SmartCart normalizes everything to a common denominator automatically.
2. **Bulk value illusion** — a bulk deal isn't a deal if product spoils before consumption. Value calculations factor in consumption rate and freezability.
3. **Flyer complexity** — manually checking 6–8 stores weekly is impractical. SmartCart automates this and delivers a ranked report.
4. **Inflation tracking** — purchase history over time reveals true price trends per item, not just whether something is "on sale."
5. **Trip value** — savings at a distant store (e.g. Costco) must be weighed against travel cost. This is user-configurable, not hardcoded.

---

## Target Stores (Kamloops, BC)

**Flyer-based (weekly cadence — flyers reset Thursdays):**
- Safeway
- Save-On-Foods
- Real Canadian Superstore
- Walmart
- Costco
- Independent Grocer

**Online / dynamic pricing:**
- Amazon.ca
- iHerb (vitamins, supplements)
- Vitacost (supplements, specialty)
- Walmart.ca (compare vs. in-store)

---

## Product Scope

- **Weekly flyer tracking:** Full grocery preferences — proteins, dairy, produce, pantry staples, household supplies, personal care.
- **Online purchasing categories:** Vitamins, supplements, foreign foods, condiments, spices, specialty items.
- **On-demand search:** Any item, any time — seasonal (egg nog, turkey), infrequent (oven cleaner, garbage bags), or spontaneous.

---

## App Architecture (Four Layers)

### Layer 1 — Receipt Scanner

- Photo upload (paper receipts) or email parsing (Amazon/online orders)
- Claude Vision extracts: store name, date, items, prices, quantities, units
- Normalizes to common units automatically
- Saves to Google Sheets (purchase history)
- Builds personal grocery list organically from real shopping behaviour

### Layer 2 — Weekly Deal Report

- Triggered automatically every Thursday via Apps Script time-based trigger
- Claude API (with web search enabled) queries current flyers for all Kamloops stores
- Matches deals against user's personal grocery list
- Normalizes units for true price comparison
- Notes distance/effort context where relevant but does not calculate trip cost
- Formatted report delivered by email

### Layer 3 — On-Demand Search

- Search tab in the PWA
- User types any item (e.g. "egg nog", "ibuprofen", "fish sauce")
- Claude API searches current prices across all stores + online sources
- Returns ranked results with normalized unit pricing

### Layer 4 — Analytics (Phase 2)

- Spending trends over time
- Price history per item (is this "sale" actually a sale?)
- Budget vs. actual tracking
- Nutrition tracking per item
- Consumption rate learning (informs bulk purchase recommendations)
- Spoilage risk flagging (bulk size vs. consumption rate vs. freezability)

---

## Data Architecture (Google Sheets)

Single workbook, 7 tabs. Schema locked 2026-06-17, extended 2026-06-20 (GroceryList cols 11–13, PriceHistory col 5) and 2026-06-21 (Purchases col 17, Receipt Total — see Known Issues and Data Entry Model below). One-time setup script: `2026-06-17-SmartCart-SheetSetup.gs` (creates tabs/headers, seeds Categories + Preferences, applies dropdown validation). Live Sheet built and verified 2026-06-17: [SmartCart](https://docs.google.com/spreadsheets/d/13d7Ju9ZM8_BKBdo3w1NBGVRzQbO8v-B_aH3nzQs3Lq8/edit). **Re-run live 2026-06-20:** `setupSmartCartSheet` executed against the live Sheet — GroceryList confirmed at 13 columns (all 13 existing data rows preserved untouched) and PriceHistory confirmed at 7 columns, both matching the extended schema.

## Apps Script Backend (Web App)

Lives in the same Apps Script project as the setup script ("SmartCart Setup"), as a second file: `2026-06-17-SmartCart-Backend.gs`. Deployed and verified 2026-06-17.

- **Web App URL:** `https://script.google.com/macros/s/AKfycbyN69MiBxCf0KbSlJVbYFAqCdNSkIGfarEl_8DkyD_jjWa6Y1v7l6D6kFyMpBaDwSck/exec` — this is `SHEETS_URL` in the PWA front-end (URL stays identical across deployment versions).
- **Deployment:** Version 5, deployed 20 Jun 2026, Execute as Me, Access Anyone. (Version 1 added the original `addReceipt`/GET actions; Version 2 added `scanReceipt`; Version 3 added `scanPackageLabel` + `updateReceipt`; Version 4 added `regularPrice` capture into `PriceHistory` plus a guard comment above `upsertGroceryListItem_` documenting that column 11 is protected; Version 5 added `unitPrice` extraction to the `scanReceipt` Claude Vision prompt, so the PWA can tell "receipt printed a per-unit price" apart from "it didn't" — see Roadmap item 2 tightening below. Same Web App URL — deployment versions don't change it.) **Pending: Version 6** — `Backend.gs` updated locally 2026-06-21 to capture `total` (see Known Issues); not yet pasted into the Apps Script editor or redeployed. Paul to paste + deploy as new version.
- **WEBHOOK_SECRET:** stored as a Script Property on the Apps Script project, also embedded client-side in `index.html` as a plain JS constant (anti-spam token, not cryptographic — same convention as Golf). Required in every POST payload; GET reads (`groceryList`, `categories`) are open, no secret required. **Rotated 2026-06-18 (Session 11)** after an unusual GitHub clone spike (7 clones/14 days) was investigated — see Known Issues. New value generated, swapped into `index.html` locally; Paul to update the matching Script Property and push (steps in JOURNAL.md Session 11 entry). Rotation cadence now tracked in `TODO_LIST.md`.
- **scanReceipt (POST):** `{action:'scanReceipt', secret, imageBase64, mediaType}` → calls Claude Vision (`claude-sonnet-4-6`) server-side using `ANTHROPIC_API_KEY` (Script Property, never sent to the client) → returns `{ok:true, store, date, total, items:[{itemRaw, qty, pricePaid, category}]}`. **`total` added 2026-06-21** — the receipt's printed grand Total (items + tax, what was actually charged); see Known Issues for why this was missing before. Does not write to the Sheet — the PWA confirm screen calls `addReceipt` separately once Paul approves.
- **scanPackageLabel (POST):** `{action:'scanPackageLabel', secret, imageBase64, mediaType}` → calls Claude Vision server-side, same pattern as `scanReceipt` → returns `{ok:true, packageSize, pricePerKg}`. Minimal schema only (net weight + price/kg) — best-before date and PLU code from the original Roadmap item 4 wording were deferred, not built. Does not write to the Sheet.
- **updateReceipt (POST):** `{action:'updateReceipt', secret, receiptId, itemRaw, packageSize, notesAppend}` → patches an already-saved Purchases row, matched by Receipt ID + Item (Raw) (case-insensitive). Returns `{ok:true, updated:true|false}`. General-purpose — used by the PWA's post-save completion flow, but works for any future single-cell correction by Receipt ID + item.
- **Verified live:** `?action=categories` returns the 12-row taxonomy correctly; `?action=groceryList` returns `{ok:true, items:[]}` (correct — empty until first receipt scan). `scanReceipt` and `addReceipt` confirmed end-to-end on the hosted PWA 2026-06-17 (Session 7) with 3 real receipt photos — FreshCo, Save-On-Foods Brocklehurst, Safeway Pharmacy — all rows landed correctly in Purchases with right store/date/price/category.
- **OAuth scope fix (2026-06-17, Session 7):** Live testing initially failed with `"No permission to call UrlFetchApp.fetch... script.external_request"`. Cause: the project's only interactive authorization predated `scanReceipt` (added Session 4), so the new scope it needs was never granted. Fixed by Paul re-running authorization (Review permissions → Allow) on the consent screen — the "Untitled project" label shown there is just Apps Script's default unconfigured Cloud-project branding, not a different app. Scope grants are tied to account + script project, not to a specific deployment, so no redeploy was needed — Version 2 picked up the grant immediately.

## PWA Shell

Single-file `index.html` (inline CSS/JS — no separate shared.css/shared.js yet; will split out if the project grows the way Golf did). Built and verified 2026-06-17.

- **Theme:** Distinct from Golf — teal primary (`#0d7377`), coral accent (`#ee6c4d`), warm off-white background. CSS custom-property type scale (`--fs-title`, `--fs-tab`, `--fs-section`, `--fs-body`, `--fs-caption`, `--fs-micro`) applied consistently across all four screens — no one-off font sizes.
- **Layout:** Fixed header (app name) + fixed top tab bar (Scanner / Search / Report / Settings), both `position: fixed` and centered at a 420px max-width shell. Content area scrolls underneath; header/tabs/footer never move or resize between screens. Footer shows the version line (`SmartCart v0.1.0 — PWA shell`) — must match this file's version going forward.
- **Tab switching:** Plain vanilla JS — `.screen`/`.screen.active` display toggle, mirrors the pattern Golf uses for its screen swaps (structural pattern reused; visual theme is not).
- **Current content:** Search/Report/Settings remain placeholder cards stating what's coming and which phase. Scanner is fully built (v0.2.0) — see "Receipt Scanner Tab" below.
- **Deferred:** `manifest.json` and service worker (offline support) — not part of this first shell pass. Golf added these as a distinct later milestone, not bundled with its initial UI; same approach here.
- **Verified:** opened directly in Safari (file://) and visually confirmed — fixed chrome renders correctly, teal theme applied, active-tab underline correct, footer version line visible, no layout shift in the static render. Tab-click switching not exercised via automated tooling (file:// pages aren't reachable through the Chrome extension's tab tools) — logic is a straightforward 10-line vanilla JS toggle, low risk.

### Receipt Scanner Tab (built 2026-06-17, v0.2.0)

Five-state vanilla-JS view inside the existing Scanner screen (`.scanner-view`/`.scanner-view.active` toggle, same pattern as the tab switcher):

1. **Idle** — single button ("Scan Receipt") opens the native file/camera picker (`<input type="file" accept="image/*" capture="environment">`). Locked decision: one button, no separate upload-vs-camera choice.
2. **Loading** — spinner while the photo is base64-encoded client-side and POSTed to `scanReceipt`.
3. **Confirm** — editable Store/Date header fields, then a scrollable list of item rows (name with `<datalist>` autocomplete sourced from a live `?action=groceryList` fetch, plus free text for new items; qty; price), each row removable. A "+ Add item" button covers anything Claude's parse missed (Paul's addition beyond the two originally locked decisions — flagged here for visibility, easy to remove if unwanted). One "Save All" button at the bottom POSTs `addReceipt`.
4. **Error** — shown on any failed `scanReceipt`/`addReceipt` call or empty-save attempt, with a "Try Again" button back to idle.
5. **Success** — confirms item count saved, "Scan Another" button back to idle.

Category is carried through silently from Claude's `scanReceipt` parse (or matched against the existing GroceryList item if the typed name matches one) — not shown as a UI field, per the locked rows spec (item name / price / qty only).

| Tab | Purpose | Key columns |
|-----|---------|-------------|
| Categories | Master taxonomy + FSRI cross-reference (new) | Category, FSRI_Category |
| Purchases | Full receipt history | Date, Store, Item (raw), Item (canonical), Brand, Package Size, Qty, Price Paid, Regular Price, Unit Price, Category, Subcategory, FSRI_Category, Source, Receipt ID, Notes, Receipt Total |
| GroceryList | Personal item list — auto-derived from Purchases, no manual pre-population | Item (canonical), Category, Subcategory, Default Unit, Preferred Store(s), Last Purchased, Last Price, Last Unit Price, Freezable, Active, Product URL(s), Typical Interval (Days), Weekly Compare (Y/N) |
| Preferences | User settings (key-value) | Setting, Value |
| Reports | Log of weekly reports sent | Date Sent, Items Flagged, Best Deals Summary, Status |
| PriceHistory | Item × store × date price log for trend analysis | Item (canonical), Store, Date, Price, Regular Price, Unit Price, Source |
| Nutrition | Phase 4 stub — empty headers only | Item (canonical), Calories/100g, Protein/100g, Fat/100g, Carbs/100g |

### Category Taxonomy (cross-referenced to FSRI)

| SmartCart Category | FSRI Category |
|---|---|
| Proteins | Proteins |
| Grains & Cereals | Grains & cereals |
| Dairy | Dairy |
| Produce | Fresh produce |
| Pantry & Condiments | Pantry staples |
| Spices & Seasonings | Pantry staples (closest fit — no dedicated FSRI bucket) |
| Sugar & Sweeteners | Sugar & sweeteners |
| Coffee, Tea & Cocoa | Coffee, tea, cocoa |
| Edible Oils | Edible oils |
| Household | Household non-food |
| Personal Care | — (not tracked by FSRI) |
| Health & Wellness | — (not tracked by FSRI) |

Health & Wellness covers Vitamins / Supplements / Prescriptions / OTC via a Subcategory column. Rx items are logged for spend history but excluded from weekly flyer-deal matching (Layer 2) — pharmacy pricing isn't flyer-driven.

### Data Entry Model

- **Purchases:** scanner is the primary path (Phase 1 build); manual row entry for cash/no-receipt buys.
- **GroceryList:** auto-derived from Purchases via Apps Script upsert (columns 1–10 only).
- **Product URL(s)** *(added 2026-06-20, column 11):* manually maintained, never touched by the receipt-driven upsert (`upsertGroceryListItem_` hardcodes a 10-column write — see comment in Backend.gs). Format: `Store: URL; Store: URL` per item, one entry per tracked store carrying that item. This is the reference field the planned weekly-compare skill (Layer 3 batch) will read to re-fetch a known product page per item per store, rather than re-searching from scratch each week.
- **Typical Interval (Days)** *(added 2026-06-20, column 12):* reserved, empty until built — see Roadmap "Weekly Compare Skill" item 10. Same pattern as `Default Unit` (#5 below): column exists now, computation logic comes later.
- **Weekly Compare (Y/N)** *(added 2026-06-20, column 13):* manually set by Paul. Distinguishes "typically buy, run the Friday price check on this" from a one-off receipt item that auto-populated GroceryList but shouldn't be price-checked weekly. See Roadmap item 13.
- **PriceHistory Regular Price** *(added 2026-06-20, column 5):* `handleAddReceipt_` now carries `item.regularPrice` straight into PriceHistory (previously only Purchases captured it), so every logged price point — receipt-driven or, later, weekly-batch-driven — records both what was actually charged and what the source called "regular." This is the baseline the fake-sale detector (Roadmap item 12) compares against.
- **Receipt Total** *(added 2026-06-21, column 17):* `scanReceipt`'s Claude Vision prompt now extracts the receipt's printed grand Total (incl. tax) instead of discarding it; `handleAddReceipt_` writes it as `receiptTotal`, repeated on every item row of that receipt — same denormalized pattern as Date/Store/Receipt ID. No separate Tax column — Paul's call: he only needs the bottom-line Total, not tax tracked independently. See Known Issues for the root cause this fixes.
- **Preferences:** typed directly into the sheet for now — no Settings UI yet.
- **Reports / PriceHistory:** written automatically by Apps Script.
- **Item-name matching:** confirm screen (autocomplete existing GroceryList items + "add new"), not fuzzy auto-match.

---

## Known Issues

- ~~**"Save All" button not sticky**~~ — ✅ fixed 2026-06-18 (Session 9, v0.2.1). "Save All" moved into a new `.confirm-save-bar`, fixed above the footer (same pattern as header/tab-bar/footer), always visible regardless of receipt length. Confirm view gets matching bottom padding (`--save-bar-h`) so the bar never covers the last row.
- **Weighed items sometimes have no Package Size** — some receipt formats print the weight breakdown for produce (e.g. "0.370 kg @ $2.84/kg") but not for meat/deli (FreshCo confirmed: chicken breast and beef sirloin tip both printed only a flat total, no weight). This is a receipt-format limitation, not a `scanReceipt` parsing miss — the data isn't on the receipt to extract. **Mitigated 2026-06-18 (Session 10):** post-save package-label-scan completion flow now prompts for any Proteins/Produce row missing Package Size. Deli is only caught if its top-level Category is "Proteins" — confirmed acceptable by Paul (2026-06-18): the deli items he actually buys are meat/cheese sold by $/100g, which already file under Proteins. Prepared/hot-food deli items (soup, sandwiches, combos) are rare purchases and are knowingly not covered. **Tightened 2026-06-20 (Session 13, v0.3.2):** the original flow fired on category alone — any Proteins/Produce row was queued, even if the receipt had already printed a per-unit price. Paul: "tighten the scan trigger for missing data. But only for missing data if the receipt doesn't have it." Fix: `scanReceipt` now also extracts `unitPrice` per item (0 if not printed on the receipt); the post-save queue filter is now candidate-pool-AND-missing-data, not category alone. A Proteins/Produce row whose receipt already showed a $/kg price no longer gets an unnecessary scan prompt.
- ~~**`Untitled.gs` temp file**~~ — ✅ deleted 2026-06-18 (Session 8). Was a throwaway `testExternalFetch` diagnostic file in the "SmartCart Setup" Apps Script project; removed via the Apps Script file menu, confirmed only `Code.gs` and `Backend.gs` remain.
- **`scanPackageLabel` extracts unit price but never saves it** — found 2026-06-20 while manually back-filling a receipt. `handleScanPackageLabel_` returns `pricePerKg`, but `handleUpdateReceipt_` only accepts `packageSize` + `notesAppend` — there's no parameter or code path to write Unit Price. So the v0.3.2 scan trigger correctly detects missing unit price, but the scan flow built to fill it can't persist the value; it has to be entered manually. Needs a fix to `handleUpdateReceipt_` + `index.html`'s post-scan save call.
- **PriceHistory rows predating the Regular Price column are shifted one column left** — found 2026-06-20. Rows written before Session 12 added the Regular Price field show "Receipt Photo" in the Unit Price column instead of Source, with Regular Price reading 0. Cosmetic/historical only, doesn't affect new rows, but would skew any future fake-sale-detector logic that reads PriceHistory by column position. One-time backfill needed if Paul wants old rows cleaned up.
- ~~**Purchases spend totals undercounted by tax**~~ — ✅ fixed 2026-06-21 (v0.3.3). Paul caught a discrepancy: a Safeway receipt totalled $35.21 (incl. $0.30 GST on one taxable item) but Purchases summed to $34.91. Root cause found in `Backend.gs`: the original `scanReceipt` Vision prompt explicitly said "Skip subtotal, tax, total... only include actual purchased items" — a deliberate Session-1 design choice, not a bug, but it meant spend totals were always item-subtotal-only, undercounting by tax on any non-zero-rated item (snack foods etc. aren't zero-rated BC groceries). Fix: prompt now extracts the receipt's printed grand Total; new "Receipt Total" column (17) on Purchases — see Data Entry Model. Scope deliberately narrow per Paul: no separate Tax field, Total only. **Still needs:** Apps Script Version 6 redeploy + live Sheet header add (see Apps Script Backend deployment note and Session Restore Instructions).
- **Public repo exposes live secret + endpoint, and full backend source** — `getsmartcart/smartcart` is a public GitHub repo (required for free GitHub Pages hosting). It contains `index.html` (with the real, working `SHEETS_URL` and `WEBHOOK_SECRET` hardcoded — not placeholders) plus both `.gs` source files (`Backend.gs`, `SheetSetup.gs`). Anyone who clones the repo, or simply views the live page's source, can: (1) fully replicate the app's UI and backend logic under their own Google account/API key — no real code-moat to protect since this is a personal tool, not a product with defensible IP; (2) POST directly to Paul's live Apps Script endpoint using the exposed secret, bypassing the UI — risk is garbage rows written to the real Sheet, or repeated `scanReceipt`/`scanPackageLabel` calls burning Paul's `ANTHROPIC_API_KEY` quota (the key itself stays server-side, never exposed). **Not exposed:** actual Sheet data (Purchases/PriceHistory/etc. — private Drive resource) and `ANTHROPIC_API_KEY` (Script Property only). **Mitigated 2026-06-18 (Session 11):** `WEBHOOK_SECRET` rotated; periodic rotation cadence added to `TODO_LIST.md`. Making the repo private was considered and rejected — would break free-tier GitHub Pages hosting; the secret rotation is the practical fix instead.

---

## Roadmap — Unit Pricing, Editing & Intelligence (designed 2026-06-17, not yet built)

Triggered by noticing FreshCo's receipt didn't print weight for meat items, and a broader discussion about comparing prices across stores when package sizes vary (shrinkflation: coffee has moved from ~454g/1lb → market-standard 375g, while Costco sells a "25% more" tin — a different size again).

**Agreed build order:**

1. ~~**Sticky Save All button**~~ ✅ done (Session 9, v0.2.1).
2. ~~**Inline missing-data completion flow**~~ ✅ done (Session 10, v0.3.0), ✅ tightened (Session 13, v0.3.2) — right after Save All, any saved Proteins/Produce row missing Package Size triggers a one-at-a-time scan prompt (camera + Skip per item), looping through flagged items and merging results into the just-saved rows via `updateReceipt`. Deli items are only caught when filed under top-level Category "Proteins" — confirmed sufficient by Paul, see Known Issues. As of Session 13 the trigger is candidate-pool-AND-missing-unit-price, not category alone — see Known Issues for detail.
3. ~~**`updateReceipt` Apps Script endpoint**~~ ✅ done (Session 10) — general-purpose patch by Receipt ID + item, live as part of Web App Version 3. Used by #2's completion flow; also callable independently for future corrections.
4. **Package-label Vision parse schema** — ✅ done in minimal form (Session 10): net weight + price/kg only. Best-before/freeze-by date and PLU code were in the original wording but were explicitly deferred, not built — flagged here since Paul hadn't confirmed full vs. minimal scope before this session closed; revisit if the freezable-stockpile feature (see #4 original note) becomes a priority.
5. **`Default Unit` pre-fill** — GroceryList already has an empty `Default Unit` column built for this. Once set for an item with a known stable size (e.g. Creamo = 2L), the app pre-fills Package Size instead of prompting every time — but surfaces a quick one-tap "still 2L?" rather than silently auto-filling, so a genuine size change (like Costco's bigger coffee tin) gets caught instead of mis-recorded.
6. **Unit Price calculation + cross-store comparison** — once Package Size is reliably populated, Unit Price (price per 100g/100ml) can be computed at `addReceipt` time. This is what actually answers "is Costco's bigger tin cheaper than the regular store's bag" — direct $/100g comparison regardless of container size.
7. **Rolling-average price alert** — deterministic, no AI: compare a new purchase's unit price for an item against its own historical average, flag if notably above ("you paid more than usual for X").
8. **Cross-store trend check** — deterministic: compare recent unit prices for the same item/category across all tracked stores, to tell "this store raised its price" apart from "the whole market moved."
9. **FSRI narrative tie-in** — the one genuinely AI-reasoned step: feed the user's own price-trend numbers (from #7/#8) plus the relevant FSRI report excerpt to Claude, and have it produce the one-line verdict ("coincides with" / "conflicts with" the FSRI signal). Depends on #7/#8 existing first.

**Separately decided:** no standalone desktop app for querying purchase history — stays inside the existing PWA, since the Sheet + Apps Script backend is already the single source of truth. Structured questions ("lowest price for Creamo") get a simple read endpoint + client-side filter; fuzzy/natural-language questions ("best coffee deal this week") get routed through the existing Claude API call over the relevant rows — no need to wait for #6 to answer the fuzzy case, Claude can eyeball package sizes in raw item text directly.

---

## Roadmap — Weekly Compare Skill (Layer 3 Batch) (designed 2026-06-20, not yet built)

Personal tool, not a product — see Session 12 JOURNAL entry for the marketability discussion that settled this framing. Goal: a Friday-morning run over GroceryList items flagged for weekly compare, using each item's `Product URL(s)` to re-fetch a known page per store rather than re-searching, answering four questions Paul asked directly:

10. **Running-low / replenishment signal** — deterministic. `Typical Interval (Days)` (GroceryList column 12, reserved) is computed from the gaps between an item's consecutive `Purchases` dates (median of those gaps, recomputed on each new receipt). An item surfaces on the weekly list once `Today − Last Purchased ≥ Typical Interval`. New items with fewer than 2 purchases have no interval yet — they only show up via the manual `Weekly Compare (Y/N)` flag (see below), not via this signal.
11. **Stock-up signal** — deterministic, reuses #7's rolling-average machinery in reverse: an item qualifies as stock-up-worthy when (a) `Freezable = Y` or its Category is inherently shelf-stable (Pantry & Condiments, Grains & Cereals, Sugar & Sweeteners, Coffee/Tea/Cocoa, Edible Oils), and (b) this week's price is notably *below* that item's own rolling average unit price (same threshold #7 uses for "notably above," mirrored). Perishables (Produce, Dairy, fresh Proteins) never qualify regardless of price.
12. **Fake-sale / inflated-discount detector** — deterministic, the one Paul explicitly asked for. For each item+store, compare this week's stated Regular Price against the trailing 8–12 weeks of `PriceHistory` Regular Price entries for that same item+store (now populated for every observation, see Data Entry Model above). Two checks: (a) if today's "Regular Price" sits notably higher than the recent historical average regular price, flag — the "regular" price itself looks freshly inflated to manufacture a discount; (b) if today's "Sale Price" isn't meaningfully below that same historical baseline, flag — you're not actually paying less than you typically have, regardless of what the flyer claims. An item can fail either, both, or neither check. Threshold starts at a flat 10% in both directions — tune after seeing real output, not guessed in advance.
13. **`Weekly Compare (Y/N)` flag** — new GroceryList column, manually set by Paul, separate from `Active`. Marks which items the Friday batch actually runs against (the "typically buy" staples — coffee, olive oil, pasta, etc.), as distinct from one-off receipt items that auto-populated GroceryList but shouldn't be price-checked every week.

**Output:** appends to `PriceHistory` per item/store checked, then a synthesized list — item, best store, price, and any flags from #10–#12 — in the same spirit as the existing Layer 2 Weekly Deal Report markdown, not yet a Reports-tab row (Reports is currently scoped to Layer 2; revisit whether to share or split when this gets built).

**Not yet decided:** trigger mechanism (Apps Script time trigger vs. Paul-initiated), and whether item 12's two checks render as one combined flag or two independent ones on the output list.

---

## Unit Normalization Rules

All prices normalized to:

- **Weight:** per 100g
- **Volume:** per 100ml
- **Count:** per unit

Conversion handled automatically on receipt scan and flyer data import. Freezability flag per item category stored in GroceryList tab.

---


## Email Report Format (Weekly)

```
SmartCart Weekly Report — Week of [Date]
Kamloops, BC

BEST DEALS THIS WEEK (matched to your list)
---
[Item] — [Store] — [Sale Price] vs [Regular ~$X] — [Normalized unit price]
Store distance: [local / requires trip]

ON YOUR LIST, NO DEAL THIS WEEK
---
[Item] — best current price: [Store] at [Price]

ONLINE PICKS
---
[Item] — Amazon/iHerb — [Price] — ships in [X] days

HEADS UP
---
[Any bulk caution flags, spoilage risks, or anomalies]
```

---

## Build Order (Phases)

### Phase 1 — Foundation

- Google Sheets schema (all tabs)
- Apps Script: receipt data write functions
- PWA shell — fixed header, tab navigation (Scanner / Search / Report / Settings)
- ✅ Receipt Scanner tab — photo upload → Claude Vision → parsed output → confirm → save to Sheets (built 2026-06-17, v0.2.0)

### Phase 2 — Weekly Report

- Apps Script: Thursday time trigger
- Claude API call with web search (flyer query, normalized output)
- Email formatting and send
- Manual "Run Now" button in PWA

### Phase 3 — On-Demand Search

- Search tab UI
- Claude API: item search across stores + online
- Unit normalization in results

### Phase 4 — Analytics

- Price history charting
- Budget tracking
- Consumption rate learning
- Nutrition layer
- Spoilage/bulk value calculator

---

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend | HTML / CSS / JS — PWA with manifest + service worker |
| Data store | Google Sheets |
| Backend logic | Google Apps Script |
| AI engine | Claude API — claude-sonnet-4-6 |
| Receipt scanning | Claude Vision (photo → structured JSON → Sheets) |
| Flyer/price queries | Claude API with web search — targets store websites directly (more reliable than general search) |
| Email delivery | Apps Script MailApp — HTML template, same pattern as FSRI |
| Hosting | GitHub Pages — live at `https://getsmartcart.github.io/smartcart/` (org `getsmartcart`, repo `smartcart`, public, deployed from `main` branch root) |
| Nutrition data (Phase 4) | Open Food Facts API (free, Canadian products) + USDA FoodData Central as fallback |

### Price Data Sources — Fluid

The list of sources Claude queries for flyer and price data is intentionally open-ended. Core Kamloops grocery chains are the baseline, but the source list will expand as needed. Candidates include:

- Local farmers markets (seasonal)
- Regional ranch/meat suppliers
- Food wholesalers with published price lists
- Aggregator APIs (e.g. Flipp, Instacart, or similar) — to be evaluated if they offer useful programmatic access
- Any other outlet Paul shops regularly

No source is hardcoded. Claude's web search prompt will be updated to include new sources as they're identified. If an aggregator API proves reliable and well-structured, it may replace direct site scraping for covered stores.

#### Confirmed Sources — Session 12 Dry-Run (2026-06-20), URLs retrieved 2026-06-20

Full URLs were not captured in the original `2026-06-20-SmartCart-WeeklyDealReport.md` (sub-agents cited sources by name only) — looked up afterward for future reference:

| Store | Confidence | Source | URL |
|---|---|---|---|
| Safeway | High | flyers-on-line.com (BC circular, text-readable) | https://www.flyers-on-line.com/safeway/british-columbia |
| Save-On-Foods | High | flyers-on-line.com (BC circular, text-readable) | https://www.flyers-on-line.com/save-on-foods/british-columbia |
| Costco | Moderate | Costco West Fan Blog (crowdsourced, BC/AB/SK/MB) | https://cocowest.ca/ |
| Walmart | High (revised 2026-06-20) | **walmart.ca itself** — category/product pages are plain HTML, fully text-readable via `web_fetch` (confirmed live), and already show current price, Rollback "Was/Now" sale pricing, and per-unit pricing ($/100g, $/100ml) inline — no aggregator needed. Grocery category hub: https://www.walmart.ca/en/cp/grocery/10019. Session 12's original "generic Canada-wide aggregator" was never recorded and is superseded by this — going forward, query walmart.ca directly instead. | — |
| Real Canadian Superstore | None (image-only flyer) | weeklyflyer.com — West region page | https://www.weeklyflyer.com/superstore (West-specific: https://weekly-flyer.ca/realcanadiansuperstore-west) |
| Your Independent Grocer (Kamloops) | None (image-only flyer) | flyerbox.ca — Kamloops store page | https://www.flyerbox.ca/deals/kamloops/independent-grocer/ |

Note: Superstore and Independent Grocer URLs above point to flyers that exist and are Kamloops/region-correct, but render as scanned/JS images with no extractable text — confirmed dead ends for plain web-fetch, would need a Claude Vision step to read (see Methodology Finding in the WeeklyDealReport).

**Skill-ready feed:** `2026-06-20-SmartCart-PriceSourceFeed.md` — same 6 sources, reformatted as a clean lookup table for the planned Weekly Grocery Price Check skill to read directly (build queued in `TODO_LIST.md`).

---

## Design Principles (Paul's Standards)

- Fixed header — no shifting layouts between screens
- Consistent font sizes across equivalent elements
- Visual stability is a priority — nothing moves unexpectedly
- KISS — simple before clever
- Iterative — one working layer at a time
- Consult before implementing design decisions

---

## Session Restore Instructions

Upload this file at the start of each session. If an `index.html` exists, upload that too. State which phase you're working on and Claude will resume without re-litigating prior decisions.

**Current status:** Phase 1 complete and verified end-to-end with real receipts — Google Sheets schema, Apps Script backend (Web App Version 3, `scanReceipt` + `addReceipt` + `scanPackageLabel` + `updateReceipt`), and PWA shell with a fully built Receipt Scanner tab including the post-save completion flow, all built — `index.html` v0.3.0, **built locally but NOT yet pushed to GitHub** (live site still shows v0.2.1 until Paul pushes — see git commands in JOURNAL.md Session 10 entry). **2026-06-17 (Session 7):** fixed a missing OAuth scope (`script.external_request`) that was blocking `scanReceipt`; re-tested live with 3 real receipt photos, all confirmed correctly saved to Sheets. Designed (not yet built) a Roadmap for unit-pricing accuracy, an item-completion/edit flow, and phased price-intelligence alerts — see "Roadmap" section above. **2026-06-18 (Session 8):** deleted temp `Untitled.gs`. **2026-06-18 (Session 9):** fixed the non-sticky Save All button (CSS-only, fixed bar above footer) — v0.2.1, visually verified, pushed to GitHub. **2026-06-18 (Session 10):** built Roadmap items 2–4 — Apps Script Version 3 deployed (`scanPackageLabel` + `updateReceipt`), inline package-label-scan completion flow built in `index.html` (sequential queue, Scan + Skip per item), structural + static visual verification passed — v0.3.0, not yet pushed. Next: Paul pushes to GitHub; then Roadmap item 5 (`Default Unit` pre-fill). **2026-06-18 (Session 11 — closed):** investigated a GitHub clone-activity question (7 clones/14 days) — confirmed the public repo exposes the full Apps Script backend source plus a live, working `WEBHOOK_SECRET`/`SHEETS_URL` hardcoded in `index.html` (see Known Issues). Rotated the secret, bumped to v0.3.1, Script Property updated by Paul and verified, pushed to GitHub (commit `ae3f3d3`) — live site now serves v0.3.1. Confirmed via full read of `Backend.gs` that no handler accepts a sheet ID/URL, so the leaked secret could never redirect writes to an attacker's Sheet; the real (now closed) exposure was OCR-proxy abuse of `scanReceipt`/`scanPackageLabel` against Paul's Anthropic quota. GitHub traffic re-checked post-push, no new activity yet (reporting lag). Next: Roadmap item 5 (`Default Unit` pre-fill). **2026-06-20 (Session 12):** designed the Weekly Compare Skill (Layer 3 batch) — GroceryList cols 11–13 (`Product URL(s)`, `Typical Interval (Days)`, `Weekly Compare (Y/N)`) and PriceHistory col 5 (`Regular Price`); built locally, pushed to GitHub, then synced live in the same session — `setupSmartCartSheet` re-run live (13 GroceryList / 7 PriceHistory columns verified, all existing data preserved) and `Backend.gs` (regularPrice capture + guard comment) synced live and redeployed as Web App **Version 4**. Also ran a 7-store flyer/price dry-run for the existing Layer 2 weekly report (Safeway + Save-On-Foods high-confidence, Walmart + Costco partial, Superstore + Independent Grocer blocked by image-only flyers, Co-op dropped — no Kamloops grocery location exists). Next: decide the Weekly Compare batch's trigger mechanism (Apps Script time trigger vs. Paul-initiated) and whether the fake-sale detector's two checks render as one flag or two; then begin populating `Product URL(s)` once `Weekly Compare (Y/N)` items are chosen. Roadmap item 5 (`Default Unit` pre-fill) still queued behind that. **2026-06-21:** Paul caught a tax-accounting discrepancy on a Safeway receipt (see Known Issues) — fixed across `Backend.gs` (prompt + return shape + `handleAddReceipt_` write), `SheetSetup.gs` (header array), and `index.html` (state capture + `addReceipt` payload), bumped to **v0.3.3**, built locally, **not yet pushed to GitHub, not yet redeployed (Apps Script still Version 5), and the live Sheet header still needs the new "Receipt Total" column added.** Three deploy steps remain, all Paul's: (1) paste updated `Backend.gs` into the Apps Script editor and create a new deployment version; (2) add "Receipt Total" as column 17's header on the live Sheet — either re-run `setupSmartCartSheet` (safe, additive-only) or type it in manually; (3) `git push` the three changed files. Resume Golf question from earlier this session was not answered — still open if Paul wants to return to it.

---

## Resolved Decisions

- **App name:** SmartCart (confirmed for now)
- **Email:** Weekly reports to kamloopspaul@live.ca
- **Grocery list:** Seeded organically from first receipt scan — no manual pre-population
- **Trip cost threshold:** Deferred indefinitely. Too many unpredictable factors (fuel state, budget, distance, urgency). Not a feature worth building at this stage.
- **File management:** Cowork
- **Technology stack:** Locked — see Technical Stack table above
- **Sheets schema + category taxonomy:** Locked 2026-06-17 — see Data Architecture above
- **Task tracking:** PROJECT.md/JOURNAL.md only — no Linear. Tried briefly 2026-06-17, then dropped: solo project, not worth the team/issue-tracker overhead.
- **PWA visual theme:** Distinct SmartCart-specific theme — NOT a reuse of Golf's green/cream shared.css. Teal/coral palette (see PWA Shell section below). Decided 2026-06-17.
- **Tab navigation position:** Top tab bar, below the fixed header (not bottom). Decided 2026-06-17.
- **Scanner confirm-screen autocomplete:** Native HTML `<datalist>` against GroceryList items (not a custom dropdown widget) — matches the locked "autocomplete + add new" requirement with zero layout-shift risk (no custom-positioned popup to manage). Decided 2026-06-17.
- **No standalone desktop app for querying/insights:** stays inside the existing PWA — Sheets + Apps Script is already the single source of truth, a second app would just duplicate auth/sync for no benefit. Decided 2026-06-17 (Session 7).

---

## Open Questions

- **Nav tab restructuring** — Search and Report (both still placeholder, not built) may not be worth building as originally scoped. Discussed 2026-06-20: Search could point at owned purchase history instead of live web search; Report could move to a background skill + email rather than a nav tab; freed slot could become an Insights/Trends tab (Layer 4). Not decided.
- **Trip-worthiness filter for occasional-trip stores** — reopens "Trip cost threshold: Deferred indefinitely" below. Proposed mechanism: Store Tier (Local vs. occasional-trip) + per-item consumption interval (Roadmap #10) + a flat total-savings threshold before a distant store (Costco) surfaces as worth a special trip. Threshold number not yet set. Discussed 2026-06-20.
- **Coupon/loyalty tracking** — Purchases captures sale discounts (Price Paid vs Regular Price) but not manufacturer/loyalty coupons (PC Optimum, Scene+) separately. Add a field only if Paul wants coupon savings isolated from sale savings. Raised 2026-06-20.
- **FSRI tie-in reframe** — Roadmap #9 currently produces a narrative verdict; discussed reframing as an actionable "stock up now" alert when FSRI forecasts a price rise on a shelf-stable category. Not yet written into Roadmap wording. Raised 2026-06-20.
- **Bulk-meat (brisket/loin) yield test** — methodology defined 2026-06-20 (trimmed weight + per-output-category weight, each compared to its own retail $/100g, summed vs. price paid) but no real numbers run yet. Brisket yields roasts/stew chunks; loin yields the steaks — keep categories attributed to the correct primal. Pending Paul's next cutting session.
