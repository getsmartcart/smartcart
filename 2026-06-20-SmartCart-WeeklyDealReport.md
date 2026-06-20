# SmartCart Weekly Deal Report — Week of June 18–24, 2026

Kamloops, BC — manual dry-run of Layer 2 (Weekly Deal Report), Claude API + web search, one sub-agent per store. Categories: fresh produce, fresh meat (not frozen), cream, eggs, yogurt, frozen fruits/vegetables, bagels.

**Coverage:** 2 of 7 stores returned solid, regionally-confirmed data (Safeway, Save-On-Foods). 2 returned partial/lower-confidence data (Walmart, Costco). 2 returned zero items because the only Kamloops-correct flyer source was a scanned image with no extractable text (Real Canadian Superstore, Your Independent Grocer). 1 store doesn't exist as a grocery option in Kamloops (Co-op) — see Findings below.

---

## Fresh Produce

| Item | Store | Price | Size/Unit |
|---|---|---|---|
| Broccoli Crowns | Safeway | $2.49/lb | per lb |
| Strawberries (clamshell) | Safeway | $3.44 | — |
| Romaine Hearts | Safeway | $4.99 | — |
| Jumbo Cherries | Safeway | $5.88/lb | per lb |
| Red Prince Apples | Safeway | $2.99/lb | per lb |
| Mini Seedless Cucumbers | Safeway | $2.99 | — |
| Avocados (organic, bulk) | Safeway | $2.99 | — |
| California Strawberries | Save-On-Foods | $4.99 | each |
| California Cauliflower | Save-On-Foods | $3.99 | each |
| Long English Cucumbers | Save-On-Foods | $3.99 | 3-pack |
| White Mushrooms | Save-On-Foods | $2.99 | 227g |
| Tomatoes on the Vine | Save-On-Foods | $1.49/lb | per lb |
| Corn on the Cob | Save-On-Foods | $0.99 | each |
| Bulk Cherries | Walmart* | $3.94/lb | per lb |
| Ataulfo Mangoes | Walmart* | $0.98 | each |
| Mini Cucumbers | Walmart* | $1.74 | 454g bag |
| Bitter Melon | Costco* | $4.99 | — |

*Walmart and Costco figures are lower-confidence — see Notes.

## Fresh Meat (not frozen)

| Item | Store | Price | Size/Unit |
|---|---|---|---|
| Boneless Skinless Chicken Thighs | Safeway | $5.99/lb | per lb |
| Sterling Silver Top Sirloin Grilling Steaks | Safeway | $11.88/lb | per lb |
| Wild Pacific Sockeye Salmon Fillets | Safeway | $4.49/100g | per 100g |
| Regular Ground Beef | Safeway | $6.99/lb | per lb |
| Pork Loin Back Ribs | Safeway | $6.99/lb | per lb |
| Strip Loin Steak/Roast, Grass Fed | Save-On-Foods | $16.99/lb | per lb |
| Chicken Thighs, Boneless Skinless (value pack) | Save-On-Foods | $8.99/lb | per lb |
| Pork Loin Chops, Boneless Centre Cut | Save-On-Foods | $6.99/lb | per lb |
| Pork Back Ribs | Save-On-Foods | $4.99/lb | per lb |
| Steelhead Fillet | Save-On-Foods | $3.99/100g | per 100g |
| Chicken Drumsticks/Thighs (value pack) | Walmart* | $3.97/lb | per lb |
| Pork Back Ribs | Walmart* | $3.98/lb | per lb |
| Pork Loin Centre & Rib, Boneless | Costco* | price not shown ($6 instant savings) | — |

Full Safeway list (25 fresh-meat lines, mostly beef/pork/poultry/fish cuts) is longer than shown here — see source.

## Eggs

| Item | Store | Price | Size/Unit |
|---|---|---|---|
| Compliments Large or Free Run Eggs | Safeway | $3.79 | — |
| Golden Valley Extra Large Eggs | Costco* | $8.29 | 30-pack |
| Conestoga Farms Free Run Omega-3 Large White | Walmart* | $6.47 | 12-pack |

Walmart's egg price is from a June 12 post, outside this week's cycle — treat as a recent reference, not a confirmed current price.

## Yogurt

| Item | Store | Price | Size/Unit |
|---|---|---|---|
| Danone Activia or Activia Expert | Safeway | $3.33 | — |
| Siggi's Icelandic Skyr | Safeway | $4.49 | — |
| Silk Plant-Based Yogurt | Safeway | $4.99 | — |

No yogurt confirmed for Save-On-Foods, Walmart, or Costco this cycle.

## Cream

| Item | Store | Price | Size/Unit |
|---|---|---|---|
| Gay Lea Aerosol Whipped Cream Topping | Safeway | $4.99 | — |
| Nestlé Coffee-Mate Creamer | Safeway | $5.49 | — |
| Compliments Sour Cream (buy 2) | Safeway | $3.99 each | 500 mL |

No true dairy cream (whipping/half-and-half) confirmed at any store this cycle — Safeway's closest matches are coffee creamer and sour cream.

## Frozen Fruits & Vegetables

| Item | Store | Price | Size/Unit |
|---|---|---|---|
| Green Giant Frozen Vegetables / Valley Selections | Safeway | $3.79 | — |
| McCain Superfries | Safeway | $2.77 | — |
| McCain Regular Fries or Diced Hashbrowns | Safeway | $3.99 | — |

Only Safeway returned frozen produce. None confirmed at Save-On-Foods, Walmart, or Costco.

## Bagels

| Item | Store | Price | Size/Unit |
|---|---|---|---|
| Western Family Bagels | Save-On-Foods | $2.99 | 6-pack |
| Dempster's Protein Bagels | Costco* | $5.99 | 2×5pk |
| Plain Bagels | Costco* | $3.99 | 8ct/1kg |
| Blueberry Bagels | Costco* | $3.99 | 8ct/1kg |
| Sesame Bagels | Costco* | $3.99 | 8ct/1kg |
| Everything Bagels | Costco* | $3.99 | 8ct/1kg |

Safeway only had gluten-free specialty bagels (Carbonaut, Little Northern Bakehouse, ~$6.49–$6.99) — not standard bagels.

---

## Per-Store Notes & Confidence

- **Safeway** — High confidence. Source: flyers-on-line.com republishing Safeway's BC circular, June 18–24, 2026. BC-wide flyer, not Kamloops-store-specific, but applies to all BC Safeway locations.
- **Save-On-Foods** — High confidence. Same source type, BC-wide flyer for the same dates; Kamloops' 5 locations explicitly confirmed as carrying it.
- **Walmart** — Low-moderate confidence. Only a generic Canada-wide aggregator summary was readable; the BC/West regional flyer renders as JS/images. Treat prices as indicative, not confirmed for Kamloops.
- **Costco** — Moderate confidence. Costco doesn't run a weekly flyer — sourced from the Costco West Fan Blog (BC/AB/SK/MB region), crowdsourced, not Costco's own site. In-warehouse prices can differ.
- **Real Canadian Superstore** — No data. The correct-region, correct-week flyer exists (weeklyflyer.com "Superstore West") but renders as scanned images with no extractable text. Postal-code lookup on the official site resolved to the wrong region.
- **Your Independent Grocer** — No data, for the same reason. Confirmed the correct Kamloops store (Sarah's YIG, 700 Tranquille Rd) and confirmed a Kamloops-dated flyer exists on flyerbox.ca — but it's image-only. The only text-extractable source found was Ontario-region pricing, which the agent correctly declined to report as Kamloops data.
- **Co-op** — No data, different reason: there is no full-line grocery Co-op serving Kamloops, BC. Only Co-op gas bar/convenience locations exist (Columbia St W, Valleyview, Dallas Drive) — none carry groceries. **Flag for Paul:** PROJECT.md's Target Stores list includes "Co-op" as a flyer-based Kamloops grocer — this research found no such store. Worth confirming and possibly removing from the list, or clarifying what was actually meant.

## Methodology Finding (relevant to SmartCart architecture)

The same structural problem we hit reading your Flipp shopping list shows up here too: most flyer sources — store sites, Flipp, and most aggregators — render flyers as scanned/JS images, not text. Web search + fetch can only read the few aggregators that republish flyers as plain text (flyers-on-line.com worked well for Safeway and Save-On-Foods; nothing equivalent was found for Superstore or Independent this cycle). This isn't a one-off gap — it'll recur every week for whichever stores lack a text-based aggregator. Two ways to close it when this gets built into Apps Script: (1) accept partial weekly coverage and report "no current data" honestly for affected stores, same as this run did, or (2) add a vision step (screenshot the flyer image, Claude Vision reads it) for stores stuck on image-only sources — closer to how the Flipp read worked.

---

*Manual run — not yet wired into the Thursday Apps Script trigger. Generated via 7 parallel research sub-agents, one per store, each required to cite a source URL and report nothing rather than fabricate a price.*
