# SmartCart — Weekly Price Source Feed

Canonical, skill-ready list of grocery price/flyer sources for Kamloops, BC. Built for the planned "Weekly Grocery Price Check" skill (queued in `TODO_LIST.md`) — query this list instead of re-discovering sources each run. Confirmed 2026-06-20, from Session 12's 7-store dry-run plus same-day follow-up verification.

| Store | URL | Format | Confidence | Notes |
|---|---|---|---|---|
| Safeway | https://www.flyers-on-line.com/safeway/british-columbia | Text | High | BC-wide circular, applies to all BC locations |
| Save-On-Foods | https://www.flyers-on-line.com/save-on-foods/british-columbia | Text | High | BC-wide circular; Kamloops' 5 locations confirmed carrying it |
| Costco | https://cocowest.ca/ | Text | Moderate | Crowdsourced blog, not Costco's own site; in-warehouse prices can differ |
| Walmart | https://www.walmart.ca/en/cp/grocery/10019 | Text | High | Direct retailer page — current price, Rollback Was/Now, per-unit pricing already inline. National online catalog; not confirmed Kamloops-store-specific |
| Real Canadian Superstore | https://www.weeklyflyer.com/superstore (West region: https://weekly-flyer.ca/realcanadiansuperstore-west) | Image (dead end) | None | Scanned/JS image, no extractable text — needs a Claude Vision step |
| Your Independent Grocer (Kamloops) | https://www.flyerbox.ca/deals/kamloops/independent-grocer/ | Image (dead end) | None | Correct Kamloops store/flyer confirmed to exist, but image-only — needs a Claude Vision step |

## For the skill builder

- Text-format sources can be queried directly via web fetch/search — no preprocessing needed.
- Image-format sources need a vision-read step (screenshot the flyer → Claude Vision reads it) before they're usable. See "Methodology Finding" in `2026-06-20-SmartCart-WeeklyDealReport.md`.
- This file is the single source of truth for sources — update here when a source changes or a better one is found; the skill (once built) should read from this file rather than hardcoding URLs elsewhere.
- Full background and confidence rationale: `PROJECT.md` → "Price Data Sources — Fluid" → "Confirmed Sources — Session 12 Dry-Run".
