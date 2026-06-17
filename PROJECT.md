# SmartCart — Personal Grocery Intelligence App

**Project Status:** Planning complete, ready to build  
**Last Updated:** June 3, 2026  
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
- Co-op

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

Single workbook, 7 tabs. Schema locked 2026-06-17. One-time setup script: `2026-06-17-SmartCart-SheetSetup.gs` (creates tabs/headers, seeds Categories + Preferences, applies dropdown validation). Live Sheet built and verified 2026-06-17: [SmartCart](https://docs.google.com/spreadsheets/d/13d7Ju9ZM8_BKBdo3w1NBGVRzQbO8v-B_aH3nzQs3Lq8/edit).

## Apps Script Backend (Web App)

Lives in the same Apps Script project as the setup script ("SmartCart Setup"), as a second file: `2026-06-17-SmartCart-Backend.gs`. Deployed and verified 2026-06-17.

- **Web App URL:** `https://script.google.com/macros/s/AKfycbyN69MiBxCf0KbSlJVbYFAqCdNSkIGfarEl_8DkyD_jjWa6Y1v7l6D6kFyMpBaDwSck/exec` — this is `SHEETS_URL` in the PWA front-end (URL stays identical across deployment versions).
- **Deployment:** Version 2, deployed 17 Jun 2026, Execute as Me, Access Anyone. (Version 1 added the original `addReceipt`/GET actions; Version 2 added `scanReceipt`.)
- **WEBHOOK_SECRET:** stored as a Script Property on the Apps Script project, also embedded client-side in `index.html` as a plain JS constant (anti-spam token, not cryptographic — same convention as Golf). Required in every POST payload; GET reads (`groceryList`, `categories`) are open, no secret required.
- **scanReceipt (POST):** `{action:'scanReceipt', secret, imageBase64, mediaType}` → calls Claude Vision (`claude-sonnet-4-6`) server-side using `ANTHROPIC_API_KEY` (Script Property, never sent to the client) → returns `{ok:true, store, date, items:[{itemRaw, qty, pricePaid, category}]}`. Does not write to the Sheet — the PWA confirm screen calls `addReceipt` separately once Paul approves.
- **Verified live:** `?action=categories` returns the 12-row taxonomy correctly; `?action=groceryList` returns `{ok:true, items:[]}` (correct — empty until first receipt scan). `scanReceipt` and `addReceipt` are wired end-to-end in the Scanner tab; not yet exercised with a real receipt photo by Paul.

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
| Purchases | Full receipt history | Date, Store, Item (raw), Item (canonical), Brand, Package Size, Qty, Price Paid, Regular Price, Unit Price, Category, Subcategory, FSRI_Category, Source, Receipt ID, Notes |
| GroceryList | Personal item list — auto-derived from Purchases, no manual pre-population | Item (canonical), Category, Subcategory, Default Unit, Preferred Store(s), Last Purchased, Last Price, Last Unit Price, Freezable, Active |
| Preferences | User settings (key-value) | Setting, Value |
| Reports | Log of weekly reports sent | Date Sent, Items Flagged, Best Deals Summary, Status |
| PriceHistory | Item × store × date price log for trend analysis | Item (canonical), Store, Date, Price, Unit Price, Source |
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
- **GroceryList:** auto-derived from Purchases via Apps Script upsert.
- **Preferences:** typed directly into the sheet for now — no Settings UI yet.
- **Reports / PriceHistory:** written automatically by Apps Script.
- **Item-name matching:** confirm screen (autocomplete existing GroceryList items + "add new"), not fuzzy auto-match.

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
| Hosting | GitHub Pages |
| Nutrition data (Phase 4) | Open Food Facts API (free, Canadian products) + USDA FoodData Central as fallback |

### Price Data Sources — Fluid

The list of sources Claude queries for flyer and price data is intentionally open-ended. Core Kamloops grocery chains are the baseline, but the source list will expand as needed. Candidates include:

- Local farmers markets (seasonal)
- Regional ranch/meat suppliers
- Food wholesalers with published price lists
- Aggregator APIs (e.g. Flipp, Instacart, or similar) — to be evaluated if they offer useful programmatic access
- Any other outlet Paul shops regularly

No source is hardcoded. Claude's web search prompt will be updated to include new sources as they're identified. If an aggregator API proves reliable and well-structured, it may replace direct site scraping for covered stores.

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

**Current status:** Phase 1 complete — Google Sheets schema, Apps Script backend (Web App Version 2, `scanReceipt` + `addReceipt`), and PWA shell with a fully built Receipt Scanner tab, all live — `index.html` v0.2.0. Verified visually via Finder→Safari; end-to-end scan→save with a real receipt photo not yet exercised by Paul. **Confirmed 2026-06-17: real-device testing needs GitHub Pages hosting first** — `file://` (e.g. AirDrop) blocks CORS to the backend and a real iOS "Add to Home Screen" install; `index.html` needs no code changes for this, just a host. Queued in `TODO_LIST.md`. Next: GitHub Pages setup → real-photo Scanner test → Phase 2 (Thursday flyer report).

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

---

## Open Questions

*(none currently)*
